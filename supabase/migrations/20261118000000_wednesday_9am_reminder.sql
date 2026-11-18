-- Wednesday's class (18 Nov 2026) was published too late for the 24-hour reminder.
-- An admin-set day_of_at now sends the day-of reminder to the whole group (not just people who have not
-- opened the course), and Wednesday's lecture is set to go out at 9:00 am East Africa Time today.
-- Friday keeps 24 hours + 15 minutes; Wednesday keeps 15 minutes.
CREATE OR REPLACE FUNCTION public.reminders_due(p_secret TEXT)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE r JSONB;
BEGIN
    IF NOT public._reminder_secret_ok(p_secret) THEN RAISE EXCEPTION 'not authorized'; END IF;
    WITH cand AS (
        -- a) timed reminders: only for the session's own group, never for people who already attended
        --    that lecture, finished the course, or opted out.
        SELECT s.id AS session_id, e.user_id, k.kind, s.starts_at, s.ends_at, s.title, s.description, s.host_name, s.meet_link,
               NULL::jsonb AS week_sessions
        FROM public.live_sessions s
        CROSS JOIN LATERAL (VALUES
            ('24h',    s.starts_at > now() + interval '12 hours' AND s.starts_at <= now() + interval '24 hours 10 minutes'),
            ('day_of', s.starts_at > now() AND now() >= coalesce(s.day_of_at, (date_trunc('day', s.starts_at AT TIME ZONE 'Africa/Kampala') + interval '8 hours') AT TIME ZONE 'Africa/Kampala')),
            ('15m',    s.starts_at > now() AND s.starts_at <= now() + interval '20 minutes')
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
          AND (k.kind <> 'day_of' OR s.day_of_at IS NOT NULL OR NOT EXISTS (
                SELECT 1 FROM public.learn_events ev2
                WHERE ev2.user_id = e.user_id AND ev2.course_slug = s.course_slug
                  AND ev2.created_at >= (public.live_week_start(s.starts_at)::timestamp AT TIME ZONE 'Africa/Kampala')))
        UNION ALL
        -- b) one welcome email for people who joined after a group's start: their timetable and next group
        SELECT fs.id, e.user_id, 'welcome', fs.starts_at, fs.ends_at, fs.title, fs.description, fs.host_name, fs.meet_link,
               (SELECT jsonb_agg(jsonb_build_object('title', x.title, 'starts_at', x.starts_at, 'meet_link', x.meet_link) ORDER BY x.starts_at)
                  FROM public.live_sessions x
                 WHERE x.course_slug = e.course_slug AND x.is_published AND public.live_week_start(x.starts_at) = public.live_week_start(fs.starts_at))
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
                   'name', l.full_name, 'week_sessions', c.week_sessions,
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
            WHERE pr.whatsapp_opt_in AND pr.phone_e164 IS NOT NULL AND c.kind <> 'welcome'
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

UPDATE public.live_sessions
   SET day_of_at = (timestamp '2026-11-18 09:00') AT TIME ZONE 'Africa/Kampala'
 WHERE course_slug = 'ai-fundamentals' AND is_published
   AND public.live_lecture_for(starts_at) = 'lecture-2'
   AND (starts_at AT TIME ZONE 'Africa/Kampala')::date = date '2026-11-18';
