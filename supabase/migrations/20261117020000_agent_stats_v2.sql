-- Agent stats v2: period filter, locations, 14-day trend, client lists; broader student search. Additive/replacing functions only.
DROP FUNCTION IF EXISTS public.staff_my_funnel();
DROP FUNCTION IF EXISTS public.admin_agent_funnel();
DROP FUNCTION IF EXISTS public._agent_funnel(UUID);

CREATE OR REPLACE FUNCTION public._agent_funnel(p_staff UUID, p_since TIMESTAMPTZ DEFAULT NULL)
RETURNS JSONB LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    WITH mine AS (
        SELECT p.id, p.location, p.created_at FROM public.profiles p
        WHERE coalesce(p.registered_by_staff_id, p.referred_by_staff_id) = p_staff
          AND (p_since IS NULL OR p.created_at >= p_since)
    )
    SELECT jsonb_build_object(
        'clicks',      (SELECT count(*) FROM public.referral_clicks c WHERE c.staff_id = p_staff AND (p_since IS NULL OR c.created_at >= p_since)),
        'registered',  (SELECT count(*) FROM public.staff_registrations r WHERE r.registered_by_staff_id = p_staff AND (p_since IS NULL OR r.created_at >= p_since)),
        'accounts',    (SELECT count(*) FROM mine),
        'enrolled',    (SELECT count(DISTINCT e.user_id) FROM public.learn_enrollments e WHERE e.user_id IN (SELECT id FROM mine) AND e.course_slug = 'ai-fundamentals'),
        'recorded',    (SELECT count(DISTINCT g.user_id) FROM public.learn_progress g WHERE g.user_id IN (SELECT id FROM mine) AND g.course_slug = 'ai-fundamentals'),
        'live',        (SELECT count(DISTINCT v.user_id) FROM public.learn_events v WHERE v.user_id IN (SELECT id FROM mine) AND v.event_type = 'live_joined'),
        'completed',   (SELECT count(*) FROM public.learn_certificates c WHERE c.user_id IN (SELECT id FROM mine) AND c.status = 'valid'),
        'active_7d',   (SELECT count(DISTINCT v.user_id) FROM public.learn_events v WHERE v.user_id IN (SELECT id FROM mine) AND v.created_at > now() - interval '7 days'),
        'by_course',   coalesce((SELECT jsonb_object_agg(t.course_title, t.n) FROM (
                            SELECT r.course_title, count(*) AS n FROM public.staff_registrations r
                             WHERE r.registered_by_staff_id = p_staff AND (p_since IS NULL OR r.created_at >= p_since) GROUP BY 1) t), '{}'::jsonb),
        'by_location', coalesce((SELECT jsonb_object_agg(t.loc, t.n) FROM (
                            SELECT initcap(trim(location)) AS loc, count(*) AS n FROM mine WHERE coalesce(trim(location), '') <> '' GROUP BY 1 ORDER BY 2 DESC LIMIT 8) t), '{}'::jsonb),
        'daily',       (SELECT jsonb_agg(coalesce(d.n, 0) ORDER BY g.day) FROM generate_series((current_date - 13), current_date, interval '1 day') AS g(day)
                          LEFT JOIN (SELECT m.created_at::date AS day, count(*) AS n FROM mine m GROUP BY 1) d ON d.day = g.day::date)
    );
$$;
REVOKE ALL ON FUNCTION public._agent_funnel(UUID, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.staff_my_funnel(p_since TIMESTAMPTZ DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v UUID := public.current_staff_id();
BEGIN
    IF v IS NULL THEN RAISE EXCEPTION 'not a staff member'; END IF;
    RETURN public._agent_funnel(v, p_since);
END $$;
GRANT EXECUTE ON FUNCTION public.staff_my_funnel(TIMESTAMPTZ) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_agent_funnel(p_since TIMESTAMPTZ DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
    RETURN coalesce((SELECT jsonb_agg(jsonb_build_object('id', s.id, 'name', s.display_name, 'slug', s.slug, 'role', s.role,
                                                       'active', s.active, 'linked', s.user_id IS NOT NULL) || public._agent_funnel(s.id, p_since)
                                      ORDER BY s.display_name)
                       FROM public.staff_members s), '[]'::jsonb);
END $$;
GRANT EXECUTE ON FUNCTION public.admin_agent_funnel(TIMESTAMPTZ) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_agent_clients(p_staff UUID, p_since TIMESTAMPTZ DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
    RETURN coalesce((SELECT jsonb_agg(c ORDER BY c->>'joined' DESC) FROM (
        SELECT jsonb_build_object('name', coalesce(p.full_name, ''), 'email', p.email, 'phone', p.phone, 'location', p.location, 'joined', p.created_at,
            'stage', CASE
                WHEN EXISTS (SELECT 1 FROM public.learn_certificates c WHERE c.user_id = p.id AND c.status = 'valid') THEN 'Completed'
                WHEN EXISTS (SELECT 1 FROM public.learn_events v WHERE v.user_id = p.id AND v.event_type = 'live_joined') THEN 'Joined live'
                WHEN EXISTS (SELECT 1 FROM public.learn_progress g WHERE g.user_id = p.id) THEN 'Studying'
                WHEN EXISTS (SELECT 1 FROM public.learn_enrollments e WHERE e.user_id = p.id) THEN 'In course'
                ELSE 'Account opened' END) AS c
        FROM public.profiles p
        WHERE coalesce(p.registered_by_staff_id, p.referred_by_staff_id) = p_staff AND (p_since IS NULL OR p.created_at >= p_since)
        UNION ALL
        SELECT jsonb_build_object('name', r.full_name, 'email', r.email, 'phone', '+' || r.phone, 'location', r.location, 'joined', r.created_at, 'stage', 'Waiting to sign up')
        FROM public.staff_registrations r
        WHERE r.registered_by_staff_id = p_staff AND r.profile_id IS NULL AND (p_since IS NULL OR r.created_at >= p_since)
        LIMIT 300) t), '[]'::jsonb);
END $$;
GRANT EXECUTE ON FUNCTION public.admin_agent_clients(UUID, TIMESTAMPTZ) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_student_search(p_q TEXT)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE q TEXT := '%' || lower(trim(coalesce(p_q, ''))) || '%';
BEGIN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
    IF length(trim(coalesce(p_q, ''))) < 2 THEN RETURN '[]'::jsonb; END IF;
    RETURN coalesce((SELECT jsonb_agg(x ORDER BY x->>'name') FROM (
        SELECT jsonb_build_object('id', p.id, 'name', coalesce(p.full_name, ''), 'email', p.email, 'phone', p.phone, 'location', p.location,
                                  'role', p.role, 'joined', p.created_at, 'agent_slug', s.slug) AS x
        FROM public.profiles p LEFT JOIN public.staff_members s ON s.user_id = p.id
        WHERE lower(coalesce(p.full_name, '')) LIKE q OR lower(coalesce(p.email, '')) LIKE q
           OR lower(coalesce(p.location, '')) LIKE q OR regexp_replace(coalesce(p.phone, ''), '\D', '', 'g') LIKE '%' || regexp_replace(q, '\D', '', 'g') || '%' AND regexp_replace(q, '\D', '', 'g') <> ''
        LIMIT 40) t), '[]'::jsonb);
END $$;
GRANT EXECUTE ON FUNCTION public.admin_student_search(TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';
