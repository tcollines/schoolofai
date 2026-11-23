-- Today's live class (Wednesday 18 Nov 2026) is moved to Thursday 19 Nov, same time. Everyone who was reminded gets one apology email.
ALTER TABLE public.live_sessions ADD COLUMN IF NOT EXISTS rescheduled_from TIMESTAMPTZ;
ALTER TABLE public.live_reminder_log DROP CONSTRAINT IF EXISTS live_reminder_log_kind_check;
ALTER TABLE public.live_reminder_log ADD CONSTRAINT live_reminder_log_kind_check CHECK (kind IN ('24h', '1h', 'day_of', '15m', 'welcome', 'resched'));

-- A moved class keeps its lecture: Thursday counts as lecture 2 (the weekday decides the lecture)
CREATE OR REPLACE FUNCTION public.live_lecture_for(p_ts TIMESTAMPTZ)
RETURNS TEXT LANGUAGE sql IMMUTABLE AS $$
    SELECT CASE extract(isodow FROM p_ts AT TIME ZONE 'Africa/Kampala')::int
        WHEN 1 THEN 'lecture-1' WHEN 3 THEN 'lecture-2' WHEN 4 THEN 'lecture-2' WHEN 5 THEN 'lecture-3' END;
$$;

CREATE OR REPLACE FUNCTION public.reminders_mark_sent(p_secret TEXT, p_rows JSONB)
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n INT;
BEGIN
    IF NOT public._reminder_secret_ok(p_secret) THEN RAISE EXCEPTION 'not authorized'; END IF;
    IF p_rows IS NULL OR jsonb_typeof(p_rows) <> 'array' THEN RAISE EXCEPTION 'p_rows must be a JSON array'; END IF;
    IF jsonb_array_length(p_rows) > 1000 THEN RAISE EXCEPTION 'too many rows'; END IF;
    WITH incoming AS (
        SELECT DISTINCT ON (session_id, user_id, channel, kind) session_id, user_id, channel, kind, status
        FROM jsonb_to_recordset(p_rows) AS t(session_id UUID, user_id UUID, channel TEXT, kind TEXT, status TEXT)
        WHERE channel IN ('email', 'whatsapp') AND kind IN ('24h', '1h', 'day_of', '15m', 'welcome', 'resched') AND status IN ('sent', 'failed', 'skipped')
    ), ins AS (
        INSERT INTO public.live_reminder_log AS g (session_id, user_id, channel, kind, status)
        SELECT i.session_id, i.user_id, i.channel, i.kind, i.status FROM incoming i
        WHERE EXISTS (SELECT 1 FROM public.live_sessions s WHERE s.id = i.session_id)
          AND EXISTS (SELECT 1 FROM auth.users u WHERE u.id = i.user_id)
        ON CONFLICT (session_id, user_id, channel, kind) DO UPDATE
            SET status = EXCLUDED.status, sent_at = now(), attempts = g.attempts + 1
            WHERE g.status = 'failed'
        RETURNING 1
    )
    SELECT count(*) INTO n FROM ins;
    RETURN n;
END $$;

CREATE OR REPLACE FUNCTION public.reminders_due(p_secret TEXT)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE r JSONB;
BEGIN
    IF NOT public._reminder_secret_ok(p_secret) THEN RAISE EXCEPTION 'not authorized'; END IF;
    WITH cand AS (
        -- a) timed reminders: only for the session's own group, never for people who already attended
        --    that lecture, finished the course, or opted out.
        SELECT s.id AS session_id, e.user_id, k.kind, s.starts_at, s.ends_at, s.title, s.description, s.host_name, s.meet_link,
               NULL::jsonb AS week_sessions, s.rescheduled_from
        FROM public.live_sessions s
        CROSS JOIN LATERAL (VALUES
            ('24h',    s.rescheduled_from IS NULL AND s.starts_at > now() + interval '12 hours' AND s.starts_at <= now() + interval '24 hours 10 minutes'),
            ('day_of', s.starts_at > now() AND now() >= coalesce(s.day_of_at, (date_trunc('day', s.starts_at AT TIME ZONE 'Africa/Kampala') + interval '8 hours') AT TIME ZONE 'Africa/Kampala')),
            ('15m',    s.starts_at > now() AND s.starts_at <= now() + interval '20 minutes'),
            ('resched', s.rescheduled_from IS NOT NULL AND s.starts_at > now())
        ) AS k(kind, in_window)
        JOIN public.learn_enrollments e ON e.course_slug = s.course_slug
        WHERE s.is_published AND k.in_window
          AND e.completed_at IS NULL
          AND public.live_group_for(s.course_slug, e.enrolled_at) = public.live_week_start(s.starts_at)
          AND NOT EXISTS (SELECT 1 FROM public.learn_events ev
                          WHERE ev.user_id = e.user_id AND ev.event_type = 'live_joined'
                            AND (ev.item_id = s.id::text OR ev.payload->>'lecture' = public.live_lecture_for(s.starts_at)))
          AND NOT EXISTS (SELECT 1 FROM public.learn_certificates c WHERE c.user_id = e.user_id AND c.course_slug = s.course_slug AND c.status = 'valid')
          -- the default 8am nudge is only for people who have not opened the course this week;
          -- a send time set by an admin (day_of_at) goes to the whole group
          AND (k.kind <> 'resched' OR EXISTS (SELECT 1 FROM public.live_reminder_log g0 WHERE g0.session_id = s.id AND g0.user_id = e.user_id AND g0.status = 'sent' AND g0.kind IN ('24h', 'day_of', '15m', 'welcome')))
          AND (k.kind <> 'day_of' OR s.day_of_at IS NOT NULL OR NOT EXISTS (
                SELECT 1 FROM public.learn_events ev2
                WHERE ev2.user_id = e.user_id AND ev2.course_slug = s.course_slug
                  AND ev2.created_at >= (public.live_week_start(s.starts_at)::timestamp AT TIME ZONE 'Africa/Kampala')))
        UNION ALL
        -- b) one welcome email for people who joined after a group's start: their timetable and next group
        SELECT fs.id, e.user_id, 'welcome', fs.starts_at, fs.ends_at, fs.title, fs.description, fs.host_name, fs.meet_link,
               (SELECT jsonb_agg(jsonb_build_object('title', x.title, 'starts_at', x.starts_at, 'meet_link', x.meet_link) ORDER BY x.starts_at)
                  FROM public.live_sessions x
                 WHERE x.course_slug = e.course_slug AND x.is_published AND public.live_week_start(x.starts_at) = public.live_week_start(fs.starts_at)),
               NULL::timestamptz
        FROM public.learn_enrollments e
        CROSS JOIN LATERAL (
            SELECT g.* FROM public.live_sessions g
            WHERE g.course_slug = e.course_slug AND g.is_published
              AND public.live_week_start(g.starts_at) = public.live_group_for(e.course_slug, e.enrolled_at)
            ORDER BY g.starts_at LIMIT 1
        ) fs
        WHERE e.enrolled_at > now() - interval '3 days' AND e.completed_at IS NULL AND fs.starts_at > now()
    )
    SELECT coalesce(jsonb_agg(x.row ORDER BY x.starts_at), '[]'::jsonb) INTO r
    FROM (
        SELECT c.starts_at,
               jsonb_build_object(
                   'session_id', c.session_id, 'user_id', l.user_id, 'channel', l.channel, 'kind', c.kind,
                   'title', c.title, 'description', c.description, 'host_name', c.host_name,
                   'starts_at', c.starts_at, 'ends_at', c.ends_at, 'join_link', c.meet_link,
                   'name', l.full_name, 'week_sessions', c.week_sessions, 'rescheduled_from', c.rescheduled_from,
                   'email', CASE WHEN l.channel = 'email' THEN l.email END,
                   'phone', CASE WHEN l.channel = 'whatsapp' THEN l.phone_e164 END,
                   'unsub_token', public._reminder_unsub_token(l.user_id)
               ) AS row
        FROM cand c
        LEFT JOIN public.live_reminder_prefs pr ON pr.user_id = c.user_id
        LEFT JOIN public.profiles p ON p.id = c.user_id
        LEFT JOIN auth.users u ON u.id = c.user_id
        CROSS JOIN LATERAL (
            SELECT c.user_id AS user_id, 'email'::text AS channel,
                   coalesce(nullif(pr.email, ''), nullif(p.email, ''), u.email::text) AS email,
                   NULL::text AS phone_e164, coalesce(p.full_name, '') AS full_name
            WHERE coalesce(pr.email_opt_in, true)
            UNION ALL
            SELECT c.user_id, 'whatsapp', NULL, pr.phone_e164, coalesce(p.full_name, '')
            WHERE pr.whatsapp_opt_in AND pr.phone_e164 IS NOT NULL AND c.kind NOT IN ('welcome', 'resched')
        ) l
        WHERE (l.channel <> 'email' OR l.email IS NOT NULL)
          AND NOT EXISTS (
              SELECT 1 FROM public.live_reminder_log g
              WHERE g.session_id = c.session_id AND g.user_id = c.user_id AND g.channel = l.channel AND g.kind = c.kind
                AND (g.status IN ('sent', 'skipped') OR g.attempts >= 3)
          )
        ORDER BY c.starts_at, c.user_id
        LIMIT 500
    ) x;
    RETURN r;
END $$;


REVOKE ALL ON FUNCTION public.reminders_mark_sent(TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reminders_due(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reminders_mark_sent(TEXT, JSONB) TO anon, authenticated;

UPDATE public.live_sessions
   SET rescheduled_from = starts_at, starts_at = starts_at + interval '1 day', ends_at = ends_at + interval '1 day',
       day_of_at = NULL, module_id = coalesce(nullif(module_id, ''), 'm3,m4')
 WHERE course_slug = 'ai-fundamentals' AND is_published AND rescheduled_from IS NULL
   AND (starts_at AT TIME ZONE 'Africa/Kampala')::date = date '2026-11-18'
   AND public.live_lecture_for(starts_at) = 'lecture-2';

NOTIFY pgrst, 'reload schema';
