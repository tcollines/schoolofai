-- =============================================================================
-- Agent Monitoring: richer per-agent summaries, locations from both accounts and
-- agent registrations, 14-day registration trend, today/7d counts, and deduplicated
-- client lists up to 1,000 rows per agent. Additive and backwards-compatible.
-- =============================================================================

CREATE OR REPLACE FUNCTION public._agent_funnel(p_staff UUID, p_since TIMESTAMPTZ DEFAULT NULL)
RETURNS JSONB LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    WITH mine AS (
        SELECT p.id, p.email, p.location, p.created_at
        FROM public.profiles p
        WHERE coalesce(p.registered_by_staff_id, p.referred_by_staff_id) = p_staff
          AND (p_since IS NULL OR p.created_at >= p_since)
    ),
    regs AS (
        SELECT r.id, r.email, r.location, r.course_title, r.profile_id, r.created_at
        FROM public.staff_registrations r
        WHERE r.registered_by_staff_id = p_staff
          AND (p_since IS NULL OR r.created_at >= p_since)
    ),
    waiting_regs AS (
        SELECT r.*
        FROM regs r
        WHERE r.profile_id IS NULL
          AND NOT EXISTS (
              SELECT 1 FROM mine m
              WHERE r.email IS NOT NULL AND lower(r.email) = lower(m.email)
          )
    ),
    all_locs AS (
        SELECT location FROM mine WHERE coalesce(trim(location), '') <> ''
        UNION ALL
        SELECT location FROM waiting_regs WHERE coalesce(trim(location), '') <> ''
    ),
    counts AS (
        SELECT
            (SELECT count(*) FROM public.referral_clicks c WHERE c.staff_id = p_staff AND (p_since IS NULL OR c.created_at >= p_since)) AS clicks,
            (SELECT count(*) FROM regs) AS registered,
            (SELECT count(*) FROM mine) AS accounts,
            (SELECT count(*) FROM waiting_regs) AS waiting,
            (SELECT count(DISTINCT e.user_id) FROM public.learn_enrollments e WHERE e.user_id IN (SELECT id FROM mine) AND e.course_slug = 'ai-fundamentals') AS enrolled,
            (SELECT count(DISTINCT g.user_id) FROM public.learn_progress g WHERE g.user_id IN (SELECT id FROM mine) AND g.course_slug = 'ai-fundamentals') AS recorded,
            (SELECT count(DISTINCT v.user_id) FROM public.learn_events v WHERE v.user_id IN (SELECT id FROM mine) AND v.event_type = 'live_joined') AS live,
            (SELECT count(*) FROM public.learn_certificates c WHERE c.user_id IN (SELECT id FROM mine) AND c.status = 'valid') AS completed,
            (SELECT count(DISTINCT v.user_id) FROM public.learn_events v WHERE v.user_id IN (SELECT id FROM mine) AND v.created_at > now() - interval '7 days') AS active_7d,
            (SELECT count(*) FROM public.staff_registrations r WHERE r.registered_by_staff_id = p_staff AND (r.created_at AT TIME ZONE 'Africa/Kampala')::date = (now() AT TIME ZONE 'Africa/Kampala')::date) AS registered_today,
            (SELECT count(*) FROM public.staff_registrations r WHERE r.registered_by_staff_id = p_staff AND r.created_at > now() - interval '7 days') AS registered_7d,
            greatest(
                (SELECT max(r.created_at) FROM public.staff_registrations r WHERE r.registered_by_staff_id = p_staff),
                (SELECT max(p.created_at) FROM public.profiles p WHERE coalesce(p.registered_by_staff_id, p.referred_by_staff_id) = p_staff)
            ) AS last_activity_at
    )
    SELECT jsonb_build_object(
        'clicks',           c.clicks,
        'registered',       c.registered,
        'accounts',         c.accounts,
        'waiting',          c.waiting,
        'total_students',   c.accounts + c.waiting,
        'enrolled',         c.enrolled,
        'recorded',         c.recorded,
        'live',             c.live,
        'completed',        c.completed,
        'active_7d',        c.active_7d,
        'registered_today', c.registered_today,
        'registered_7d',    c.registered_7d,
        'last_activity_at', c.last_activity_at,
        'points',           c.enrolled + c.recorded * 2 + c.completed * 5,
        'by_course',        coalesce((SELECT jsonb_object_agg(t.course_title, t.n) FROM (
                                SELECT r.course_title, count(*) AS n FROM regs r GROUP BY 1) t), '{}'::jsonb),
        'by_location',      coalesce((SELECT jsonb_object_agg(t.loc, t.n) FROM (
                                SELECT initcap(trim(location)) AS loc, count(*) AS n FROM all_locs GROUP BY 1 ORDER BY 2 DESC LIMIT 8) t), '{}'::jsonb),
        'daily',            (SELECT jsonb_agg(coalesce(d.n, 0) ORDER BY g.day)
                               FROM generate_series(((now() AT TIME ZONE 'Africa/Kampala')::date - 13), (now() AT TIME ZONE 'Africa/Kampala')::date, interval '1 day') AS g(day)
                               LEFT JOIN (SELECT (m.created_at AT TIME ZONE 'Africa/Kampala')::date AS day, count(*) AS n FROM mine m GROUP BY 1) d ON d.day = g.day::date),
        'daily_registered', (SELECT jsonb_agg(coalesce(d.n, 0) ORDER BY g.day)
                               FROM generate_series(((now() AT TIME ZONE 'Africa/Kampala')::date - 13), (now() AT TIME ZONE 'Africa/Kampala')::date, interval '1 day') AS g(day)
                               LEFT JOIN (SELECT (r.created_at AT TIME ZONE 'Africa/Kampala')::date AS day, count(*) AS n FROM regs r GROUP BY 1) d ON d.day = g.day::date)
    )
    FROM counts c;
$$;
REVOKE ALL ON FUNCTION public._agent_funnel(UUID, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_agent_funnel(p_since TIMESTAMPTZ DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
    RETURN coalesce((
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', s.id,
                'name', s.display_name,
                'slug', s.slug,
                'staff_code', s.staff_code,
                'role', s.role,
                'email', u.email,
                'phone', s.phone,
                'active', s.active,
                'linked', s.user_id IS NOT NULL,
                'created_at', s.created_at
            ) || public._agent_funnel(s.id, p_since)
            ORDER BY s.display_name
        )
        FROM public.staff_members s
        LEFT JOIN auth.users u ON u.id = s.user_id
    ), '[]'::jsonb);
END $$;
GRANT EXECUTE ON FUNCTION public.admin_agent_funnel(TIMESTAMPTZ) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_agent_clients(p_staff UUID, p_since TIMESTAMPTZ DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_agent_name TEXT;
BEGIN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
    SELECT display_name INTO v_agent_name FROM public.staff_members WHERE id = p_staff;
    RETURN coalesce((
        WITH mine AS (
            SELECT p.id, p.full_name, p.email, p.phone, p.location, p.created_at, p.registered_by_staff_id
            FROM public.profiles p
            WHERE coalesce(p.registered_by_staff_id, p.referred_by_staff_id) = p_staff
              AND (p_since IS NULL OR p.created_at >= p_since)
        )
        SELECT jsonb_agg(c ORDER BY c->>'joined' DESC) FROM (
            SELECT jsonb_build_object(
                'name', coalesce(m.full_name, ''),
                'email', m.email,
                'phone', m.phone,
                'location', m.location,
                'joined', m.created_at,
                'course', coalesce(
                    (SELECT r2.course_title FROM public.staff_registrations r2 WHERE r2.profile_id = m.id OR (r2.email IS NOT NULL AND lower(r2.email) = lower(m.email)) LIMIT 1),
                    'AI Fundamentals (free)'
                ),
                'source', CASE WHEN m.registered_by_staff_id = p_staff THEN 'Registered by agent' ELSE 'Joined via link' END,
                'registered_by', v_agent_name,
                'stage', CASE
                    WHEN EXISTS (SELECT 1 FROM public.learn_certificates lc WHERE lc.user_id = m.id AND lc.status = 'valid') THEN 'Completed'
                    WHEN EXISTS (SELECT 1 FROM public.learn_events v WHERE v.user_id = m.id AND v.event_type = 'live_joined') THEN 'Joined live'
                    WHEN EXISTS (SELECT 1 FROM public.learn_progress g WHERE g.user_id = m.id) THEN 'Studying'
                    WHEN EXISTS (SELECT 1 FROM public.learn_enrollments e WHERE e.user_id = m.id) THEN 'In course'
                    ELSE 'Account opened' END
            ) AS c
            FROM mine m
            UNION ALL
            SELECT jsonb_build_object(
                'name', r.full_name,
                'email', r.email,
                'phone', CASE WHEN r.phone LIKE '+%' THEN r.phone ELSE '+' || r.phone END,
                'location', r.location,
                'joined', r.created_at,
                'course', r.course_title,
                'source', 'Registered by agent',
                'registered_by', v_agent_name,
                'stage', 'Waiting to sign up'
            ) AS c
            FROM public.staff_registrations r
            WHERE r.registered_by_staff_id = p_staff
              AND r.profile_id IS NULL
              AND (p_since IS NULL OR r.created_at >= p_since)
              AND NOT EXISTS (SELECT 1 FROM mine m WHERE r.email IS NOT NULL AND lower(r.email) = lower(m.email))
            LIMIT 1000
        ) t
    ), '[]'::jsonb);
END $$;
GRANT EXECUTE ON FUNCTION public.admin_agent_clients(UUID, TIMESTAMPTZ) TO authenticated;

NOTIFY pgrst, 'reload schema';
