-- =============================================================================
-- Cohorts (month) with weekly live groups, smarter reminders, sales-agent tools.
-- ADDITIVE ONLY: new functions, one widened CHECK, no data is changed or deleted.
--
--   Cohort  = the month of a live week           (e.g. "November 2026")
--   Group   = one run of Mon/Wed/Fri live classes (identified by that week's Monday, EAT)
--   A learner's group = the first group whose opening class had not started when they enrolled.
--   Nothing is stored: it is computed from enrolled_at, so it can never drift and needs no backfill.
--   Everyone gets the recorded course at once and may join any live class; the group only decides who is REMINDED.
-- =============================================================================

-- 1. Helpers ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.live_week_start(p_ts TIMESTAMPTZ)
RETURNS DATE LANGUAGE sql IMMUTABLE AS $$
    SELECT date_trunc('week', p_ts AT TIME ZONE 'Africa/Kampala')::date;
$$;

-- Monday = lecture-1, Wednesday = lecture-2, Friday = lecture-3 (same rule as the app)
CREATE OR REPLACE FUNCTION public.live_lecture_for(p_ts TIMESTAMPTZ)
RETURNS TEXT LANGUAGE sql IMMUTABLE AS $$
    SELECT CASE extract(isodow FROM p_ts AT TIME ZONE 'Africa/Kampala')::int
        WHEN 1 THEN 'lecture-1' WHEN 3 THEN 'lecture-2' WHEN 5 THEN 'lecture-3' END;
$$;

CREATE OR REPLACE FUNCTION public.live_group_for(p_course TEXT, p_at TIMESTAMPTZ)
RETURNS DATE LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT min(w.wk) FROM (
        SELECT public.live_week_start(s.starts_at) AS wk, min(s.starts_at) AS first_start
        FROM public.live_sessions s
        WHERE s.course_slug = p_course AND s.is_published
        GROUP BY 1
    ) w
    WHERE w.first_start > p_at;
$$;
REVOKE ALL ON FUNCTION public.live_group_for(TEXT, TIMESTAMPTZ) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.live_group_for(TEXT, TIMESTAMPTZ) TO authenticated;

-- 2. Timetable for the signed-in learner ----------------------------------------
CREATE OR REPLACE FUNCTION public.live_timetable(p_course TEXT DEFAULT 'ai-fundamentals')
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_enrolled TIMESTAMPTZ; v_group DATE; r JSONB;
BEGIN
    IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
    SELECT e.enrolled_at INTO v_enrolled FROM public.learn_enrollments e WHERE e.user_id = auth.uid() AND e.course_slug = p_course;
    IF v_enrolled IS NOT NULL THEN v_group := public.live_group_for(p_course, v_enrolled); END IF;
    SELECT coalesce(jsonb_agg(jsonb_build_object(
               'id', s.id, 'title', s.title, 'description', s.description, 'host_name', s.host_name,
               'starts_at', s.starts_at, 'ends_at', s.ends_at, 'meet_link', s.meet_link, 'module_id', s.module_id,
               'lecture', public.live_lecture_for(s.starts_at),
               'week', public.live_week_start(s.starts_at),
               'cohort', to_char(public.live_week_start(s.starts_at), 'FMMonth YYYY'),
               'mine', public.live_week_start(s.starts_at) = v_group,
               'attended', EXISTS (SELECT 1 FROM public.learn_events ev WHERE ev.user_id = auth.uid() AND ev.event_type = 'live_joined'
                                   AND (ev.item_id = s.id::text OR ev.payload->>'lecture' = public.live_lecture_for(s.starts_at)))
           ) ORDER BY s.starts_at), '[]'::jsonb)
      INTO r
      FROM public.live_sessions s
     WHERE s.course_slug = p_course AND s.is_published AND s.ends_at > now() - interval '14 days';
    RETURN jsonb_build_object('enrolled', v_enrolled IS NOT NULL, 'my_group', v_group,
                              'my_cohort', CASE WHEN v_group IS NULL THEN NULL ELSE to_char(v_group, 'FMMonth YYYY') END,
                              'sessions', r);
END $$;
REVOKE ALL ON FUNCTION public.live_timetable(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.live_timetable(TEXT) TO authenticated;

-- 3. Unsubscribe link (no login needed; the token is derived from the runner secret) -
CREATE OR REPLACE FUNCTION public._reminder_unsub_token(p_user UUID)
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT left(encode(sha256(convert_to(p_user::text || ':' || coalesce((SELECT secret_hash FROM public.reminder_secret WHERE id), 'none'), 'UTF8')), 'hex'), 32);
$$;
REVOKE ALL ON FUNCTION public._reminder_unsub_token(UUID) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.reminder_unsubscribe(p_user UUID, p_token TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF p_user IS NULL OR p_token IS NULL OR p_token <> public._reminder_unsub_token(p_user) THEN RETURN FALSE; END IF;
    INSERT INTO public.live_reminder_prefs (user_id, email_opt_in) VALUES (p_user, false)
    ON CONFLICT (user_id) DO UPDATE SET email_opt_in = false;
    RETURN TRUE;
END $$;
GRANT EXECUTE ON FUNCTION public.reminder_unsubscribe(UUID, TEXT) TO anon, authenticated;

-- 4. Reminder rules v4 ----------------------------------------------------------
ALTER TABLE public.live_reminder_log DROP CONSTRAINT IF EXISTS live_reminder_log_kind_check;
ALTER TABLE public.live_reminder_log ADD CONSTRAINT live_reminder_log_kind_check CHECK (kind IN ('24h', '1h', 'day_of', '15m', 'welcome'));

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
          -- the 8am nudge is only for people who have not opened the course this week
          AND (k.kind <> 'day_of' OR NOT EXISTS (
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
        WHERE channel IN ('email', 'whatsapp') AND kind IN ('24h', '1h', 'day_of', '15m', 'welcome') AND status IN ('sent', 'failed', 'skipped')
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

REVOKE ALL ON FUNCTION public.reminders_due(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reminders_mark_sent(TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reminders_due(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reminders_mark_sent(TEXT, JSONB) TO anon, authenticated;

-- 5. Agents: any student can be made a sales agent -------------------------------
CREATE OR REPLACE FUNCTION public.admin_make_agent(p_email TEXT, p_role TEXT DEFAULT 'Sales agent')
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user UUID; v_name TEXT; v_slug TEXT; v_base TEXT; v_code TEXT; v_existing public.staff_members; n INT := 0;
BEGIN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
    SELECT u.id INTO v_user FROM auth.users u WHERE lower(u.email) = lower(trim(p_email)) LIMIT 1;
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'message', 'No account uses that email. They need to register on the website first.');
    END IF;
    SELECT * INTO v_existing FROM public.staff_members WHERE user_id = v_user;
    IF FOUND THEN
        UPDATE public.staff_members SET active = true WHERE id = v_existing.id;
        RETURN jsonb_build_object('ok', true, 'existing', true, 'slug', v_existing.slug, 'name', v_existing.display_name);
    END IF;
    SELECT coalesce(nullif(trim(p.full_name), ''), split_part(lower(trim(p_email)), '@', 1)) INTO v_name FROM public.profiles p WHERE p.id = v_user;
    v_name := coalesce(v_name, split_part(lower(trim(p_email)), '@', 1));
    v_base := left(regexp_replace(lower(split_part(v_name, ' ', 1)), '[^a-z0-9]', '', 'g'), 20);
    IF v_base = '' THEN v_base := 'agent'; END IF;
    v_slug := v_base;
    WHILE EXISTS (SELECT 1 FROM public.staff_members WHERE slug = v_slug) LOOP
        n := n + 1; v_slug := v_base || (n + 1)::text;
    END LOOP;
    v_code := 'AGT-' || upper(substr(md5(v_user::text), 1, 6));
    INSERT INTO public.staff_members (user_id, staff_code, slug, display_name, role, active)
    VALUES (v_user, v_code, v_slug, v_name, coalesce(nullif(trim(p_role), ''), 'Sales agent'), true);
    RETURN jsonb_build_object('ok', true, 'existing', false, 'slug', v_slug, 'name', v_name);
END $$;
GRANT EXECUTE ON FUNCTION public.admin_make_agent(TEXT, TEXT) TO authenticated;

-- 6. Agent funnel -------------------------------------------------------------------
-- One row per agent: link clicks, registrations they entered, accounts opened, recorded-course starters,
-- live attendees, completers, active in the last 7 days; plus a per-course breakdown of what they registered.
CREATE OR REPLACE FUNCTION public._agent_funnel(p_staff UUID)
RETURNS JSONB LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    WITH mine AS (
        SELECT p.id FROM public.profiles p WHERE coalesce(p.registered_by_staff_id, p.referred_by_staff_id) = p_staff
    )
    SELECT jsonb_build_object(
        'clicks',      (SELECT count(*) FROM public.referral_clicks c WHERE c.staff_id = p_staff),
        'registered',  (SELECT count(*) FROM public.staff_registrations r WHERE r.registered_by_staff_id = p_staff),
        'accounts',    (SELECT count(*) FROM mine),
        'enrolled',    (SELECT count(DISTINCT e.user_id) FROM public.learn_enrollments e WHERE e.user_id IN (SELECT id FROM mine) AND e.course_slug = 'ai-fundamentals'),
        'recorded',    (SELECT count(DISTINCT g.user_id) FROM public.learn_progress g WHERE g.user_id IN (SELECT id FROM mine) AND g.course_slug = 'ai-fundamentals'),
        'live',        (SELECT count(DISTINCT v.user_id) FROM public.learn_events v WHERE v.user_id IN (SELECT id FROM mine) AND v.event_type = 'live_joined'),
        'completed',   (SELECT count(*) FROM public.learn_certificates c WHERE c.user_id IN (SELECT id FROM mine) AND c.status = 'valid'),
        'active_7d',   (SELECT count(DISTINCT v.user_id) FROM public.learn_events v WHERE v.user_id IN (SELECT id FROM mine) AND v.created_at > now() - interval '7 days'),
        'by_course',   coalesce((SELECT jsonb_object_agg(t.course_title, t.n) FROM (
                            SELECT r.course_title, count(*) AS n FROM public.staff_registrations r WHERE r.registered_by_staff_id = p_staff GROUP BY 1) t), '{}'::jsonb)
    );
$$;
REVOKE ALL ON FUNCTION public._agent_funnel(UUID) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.staff_my_funnel()
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v UUID := public.current_staff_id();
BEGIN
    IF v IS NULL THEN RAISE EXCEPTION 'not a staff member'; END IF;
    RETURN public._agent_funnel(v);
END $$;
GRANT EXECUTE ON FUNCTION public.staff_my_funnel() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_agent_funnel()
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
    RETURN coalesce((SELECT jsonb_agg(jsonb_build_object('id', s.id, 'name', s.display_name, 'slug', s.slug, 'role', s.role,
                                                       'active', s.active, 'linked', s.user_id IS NOT NULL) || public._agent_funnel(s.id)
                                      ORDER BY s.display_name)
                       FROM public.staff_members s), '[]'::jsonb);
END $$;
GRANT EXECUTE ON FUNCTION public.admin_agent_funnel() TO authenticated;

-- 7. Group sizes for admin (who is in which weekly group) ----------------------------
CREATE OR REPLACE FUNCTION public.admin_group_sizes(p_course TEXT DEFAULT 'ai-fundamentals')
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
    RETURN coalesce((SELECT jsonb_agg(jsonb_build_object('week', t.wk, 'cohort', to_char(t.wk, 'FMMonth YYYY'), 'learners', t.n) ORDER BY t.wk NULLS LAST)
                     FROM (SELECT public.live_group_for(e.course_slug, e.enrolled_at) AS wk, count(*) AS n
                             FROM public.learn_enrollments e WHERE e.course_slug = p_course GROUP BY 1) t), '[]'::jsonb);
END $$;
GRANT EXECUTE ON FUNCTION public.admin_group_sizes(TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';

-- 8. Public first name of an agent (shown on their /join/<slug> page) ---------------
CREATE OR REPLACE FUNCTION public.agent_public_name(p_slug TEXT)
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT split_part(s.display_name, ' ', 1) FROM public.staff_members s WHERE s.slug = lower(trim(p_slug)) AND s.active LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.agent_public_name(TEXT) TO anon, authenticated;
NOTIFY pgrst, 'reload schema';
