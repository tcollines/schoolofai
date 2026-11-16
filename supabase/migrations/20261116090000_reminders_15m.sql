-- =============================================================================
-- Live-class reminders v3 (additive; replaces two functions)
--   24h : about 24 hours before | day_of : 08:00 EAT on the day | 15m : about 15 minutes before the class
-- =============================================================================
ALTER TABLE public.live_reminder_log DROP CONSTRAINT IF EXISTS live_reminder_log_kind_check;
ALTER TABLE public.live_reminder_log ADD CONSTRAINT live_reminder_log_kind_check CHECK (kind IN ('24h', '1h', 'day_of', '15m'));

CREATE OR REPLACE FUNCTION public.reminders_due(p_secret TEXT)
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE r JSONB;
BEGIN
    IF NOT public._reminder_secret_ok(p_secret) THEN RAISE EXCEPTION 'not authorized'; END IF;
    SELECT coalesce(jsonb_agg(x.row ORDER BY x.starts_at), '[]'::jsonb) INTO r
    FROM (
        SELECT s.starts_at,
               jsonb_build_object(
                   'session_id', s.id, 'user_id', l.user_id, 'channel', l.channel, 'kind', l.kind,
                   'title', s.title, 'description', s.description, 'host_name', s.host_name,
                   'starts_at', s.starts_at, 'ends_at', s.ends_at, 'join_link', s.meet_link,
                   'name', l.full_name,
                   'email', CASE WHEN l.channel = 'email' THEN l.email END,
                   'phone', CASE WHEN l.channel = 'whatsapp' THEN l.phone_e164 END
               ) AS row
        FROM public.live_sessions s
        CROSS JOIN LATERAL (VALUES
            ('24h', s.starts_at > now() + interval '12 hours' AND s.starts_at <= now() + interval '24 hours 10 minutes'),
            ('day_of', s.starts_at > now() AND now() >= coalesce(s.day_of_at, (date_trunc('day', s.starts_at AT TIME ZONE 'Africa/Kampala') + interval '8 hours') AT TIME ZONE 'Africa/Kampala')),
            ('15m', s.starts_at > now() AND s.starts_at <= now() + interval '20 minutes')
        ) AS k(kind, in_window)
        JOIN public.learn_enrollments e ON e.course_slug = s.course_slug
        LEFT JOIN public.live_reminder_prefs pr ON pr.user_id = e.user_id
        LEFT JOIN public.profiles p ON p.id = e.user_id
        LEFT JOIN auth.users u ON u.id = e.user_id
        CROSS JOIN LATERAL (
            SELECT e.user_id AS user_id, k.kind AS kind, 'email'::text AS channel,
                   coalesce(nullif(pr.email, ''), nullif(p.email, ''), u.email::text) AS email,
                   NULL::text AS phone_e164, coalesce(p.full_name, '') AS full_name
            WHERE coalesce(pr.email_opt_in, true)
            UNION ALL
            SELECT e.user_id, k.kind, 'whatsapp', NULL, pr.phone_e164, coalesce(p.full_name, '')
            WHERE pr.whatsapp_opt_in AND pr.phone_e164 IS NOT NULL
        ) l
        WHERE s.is_published
          AND k.in_window
          AND (l.channel <> 'email' OR l.email IS NOT NULL)
          AND NOT EXISTS (
              SELECT 1 FROM public.live_reminder_log g
              WHERE g.session_id = s.id AND g.user_id = e.user_id AND g.channel = l.channel AND g.kind = k.kind
                AND (g.status IN ('sent', 'skipped') OR g.attempts >= 3)
          )
        ORDER BY s.starts_at, e.user_id
        LIMIT 500
    ) x;
    RETURN r;
END $$;

-- 5. Record outcomes ----------------------------------------------------------
-- p_rows: [{"session_id": uuid, "user_id": uuid, "channel": "email"|"whatsapp",
--           "kind": "24h"|"1h", "status": "sent"|"failed"|"skipped"}, ...]
-- Returns the number of rows recorded. A 'failed' row is retried (up to 3 attempts).
CREATE OR REPLACE FUNCTION public.reminders_mark_sent(p_secret TEXT, p_rows JSONB)
RETURNS INT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE n INT;
BEGIN
    IF NOT public._reminder_secret_ok(p_secret) THEN RAISE EXCEPTION 'not authorized'; END IF;
    IF p_rows IS NULL OR jsonb_typeof(p_rows) <> 'array' THEN RAISE EXCEPTION 'p_rows must be a JSON array'; END IF;
    IF jsonb_array_length(p_rows) > 1000 THEN RAISE EXCEPTION 'too many rows'; END IF;

    WITH incoming AS (
        SELECT DISTINCT ON (session_id, user_id, channel, kind) session_id, user_id, channel, kind, status
        FROM jsonb_to_recordset(p_rows) AS t(session_id UUID, user_id UUID, channel TEXT, kind TEXT, status TEXT)
        WHERE channel IN ('email', 'whatsapp') AND kind IN ('24h', '1h', 'day_of', '15m') AND status IN ('sent', 'failed', 'skipped')
    ), ins AS (
        INSERT INTO public.live_reminder_log AS g (session_id, user_id, channel, kind, status)
        SELECT i.session_id, i.user_id, i.channel, i.kind, i.status
        FROM incoming i
        WHERE EXISTS (SELECT 1 FROM public.live_sessions s WHERE s.id = i.session_id)
          AND EXISTS (SELECT 1 FROM auth.users u WHERE u.id = i.user_id)
        ON CONFLICT (session_id, user_id, channel, kind) DO UPDATE
            SET status = EXCLUDED.status, sent_at = now(), attempts = g.attempts + 1
            WHERE g.status = 'failed'          -- never overwrite a sent/skipped row
        RETURNING 1
    )
    SELECT count(*) INTO n FROM ins;
    RETURN n;
END $$;


REVOKE ALL ON FUNCTION public.reminders_due(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reminders_mark_sent(TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reminders_due(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reminders_mark_sent(TEXT, JSONB) TO anon, authenticated;
NOTIFY pgrst, 'reload schema';
