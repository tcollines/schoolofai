-- Everyone who is NOT in the free AI Fundamentals pipeline: general sign-ups, other-course interest and paid-course enrolments.
-- The All People page merges these with the free-course learners (same key: email, or phone when there is no email).
CREATE OR REPLACE FUNCTION public.admin_other_people()
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
    RETURN coalesce((
        WITH raw AS (
            SELECT lower(l.email) AS email, nullif(regexp_replace(coalesce(l.phone, ''), '\D', '', 'g'), '') AS phone, l.full_name AS name, l.location,
                   CASE l.source WHEN 'agent_link' THEN 'Agent link' WHEN 'website' THEN 'Website' ELSE initcap(replace(l.source, '_', ' ')) END AS source,
                   s.display_name AS agent, l.created_at AS at, l.course_title AS course, false AS paid
              FROM public.leads l LEFT JOIN public.staff_members s ON s.id = l.staff_id
             WHERE coalesce(l.course_slug, '') <> 'ai-fundamentals' AND coalesce(l.course_title, '') NOT ILIKE 'AI Fundamentals%'
            UNION ALL
            SELECT lower(r.email), nullif(regexp_replace(coalesce(r.phone, ''), '\D', '', 'g'), ''), r.full_name, r.location, 'Agent registered',
                   s.display_name, r.created_at, r.course_title, false
              FROM public.staff_registrations r JOIN public.staff_members s ON s.id = r.registered_by_staff_id
             WHERE coalesce(r.course_slug, '') <> 'ai-fundamentals' AND coalesce(r.course_title, '') NOT ILIKE 'AI Fundamentals%'
            UNION ALL
            SELECT lower(u.email), nullif(regexp_replace(coalesce(pr.phone, ''), '\D', '', 'g'), ''), pr.full_name, pr.location,
                   CASE WHEN st.id IS NOT NULL THEN 'Agent link' ELSE 'Website' END, st.display_name, e.enrolled_at, coalesce(c.title, 'Paid course'), true
              FROM public.enrollments e JOIN auth.users u ON u.id = e.user_id
              LEFT JOIN public.profiles pr ON pr.id = e.user_id
              LEFT JOIN public.staff_members st ON st.id = coalesce(pr.registered_by_staff_id, pr.referred_by_staff_id)
              LEFT JOIN public.courses c ON c.id::text = e.course_id::text
        ), grouped AS (
            SELECT coalesce(email, 'tel:' || phone) AS key, max(email) AS email,
                   (array_agg(phone) FILTER (WHERE phone IS NOT NULL))[1] AS phone,
                   (array_agg(name ORDER BY at) FILTER (WHERE coalesce(name, '') <> ''))[1] AS name,
                   (array_agg(location) FILTER (WHERE coalesce(location, '') <> ''))[1] AS location,
                   array_agg(DISTINCT source) AS sources,
                   (array_agg(agent) FILTER (WHERE agent IS NOT NULL))[1] AS agent,
                   array_agg(DISTINCT course) FILTER (WHERE course IS NOT NULL) AS courses,
                   bool_or(paid) AS paid_enrolled,
                   min(at) AS registered_at
              FROM raw WHERE coalesce(email, phone) IS NOT NULL GROUP BY 1
        )
        SELECT jsonb_agg(row ORDER BY registered_at DESC) FROM (
            SELECT g.registered_at, jsonb_build_object(
                'key', g.key, 'name', coalesce(g.name, ''), 'email', g.email, 'phone', g.phone, 'location', g.location,
                'sources', to_jsonb(g.sources), 'agent', g.agent, 'registered_at', g.registered_at,
                'has_account', u.id IS NOT NULL, 'stage', CASE WHEN u.id IS NULL THEN 'Registered' ELSE 'Account opened' END,
                'courses', to_jsonb(coalesce(g.courses, ARRAY[]::text[])), 'paid_enrolled', g.paid_enrolled,
                'last_active', NULL, 'followup', coalesce(f.status, 'new'), 'note', f.note, 'followup_at', f.updated_at
            ) AS row
              FROM grouped g
              LEFT JOIN auth.users u ON lower(u.email) = g.email
              LEFT JOIN public.registration_followups f ON f.key = g.key
             LIMIT 3000
        ) t
    ), '[]'::jsonb);
END $$;
GRANT EXECUTE ON FUNCTION public.admin_other_people() TO authenticated;
NOTIFY pgrst, 'reload schema';
