-- Supervisors (and admins) can search the students and turn one into a sales agent in one step.
-- The agent is linked to the SAME account (staff_members.user_id), so the person keeps one login, one profile and all their
-- course progress, and gets the agent dashboard as a second dashboard next to the student one. Nothing is copied or duplicated.

CREATE OR REPLACE FUNCTION public.supervisor_student_search(p_q TEXT)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
    q TEXT := '%' || lower(trim(coalesce(p_q, ''))) || '%';
    digits TEXT := regexp_replace(coalesce(p_q, ''), '\D', '', 'g');
BEGIN
    IF NOT (public.is_admin() OR public.is_agent_supervisor()) THEN RAISE EXCEPTION 'not authorized'; END IF;
    IF length(trim(coalesce(p_q, ''))) < 2 THEN RETURN '[]'::jsonb; END IF;
    RETURN coalesce((SELECT jsonb_agg(x ORDER BY x->>'name') FROM (
        SELECT jsonb_build_object(
                   'id', p.id, 'name', coalesce(p.full_name, ''), 'email', p.email, 'phone', p.phone, 'location', p.location,
                   'joined', p.created_at, 'is_agent', s.id IS NOT NULL, 'agent_slug', s.slug, 'agent_code', s.staff_code,
                   'agent_type', s.agent_type, 'agent_active', s.active) AS x
          FROM public.profiles p LEFT JOIN public.staff_members s ON s.user_id = p.id
         WHERE lower(coalesce(p.full_name, '')) LIKE q OR lower(coalesce(p.email, '')) LIKE q
            OR lower(coalesce(p.location, '')) LIKE q
            OR (digits <> '' AND regexp_replace(coalesce(p.phone, ''), '\D', '', 'g') LIKE '%' || digits || '%')
         LIMIT 30) t), '[]'::jsonb);
END $$;
GRANT EXECUTE ON FUNCTION public.supervisor_student_search(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.supervisor_make_student_agent(p_user_id UUID, p_role TEXT DEFAULT 'Sales agent')
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_email TEXT; v_name TEXT; v_phone TEXT; v_existing public.staff_members;
    v_base TEXT; v_slug TEXT; v_code TEXT; v_id UUID; n INT := 0;
    v_role TEXT := coalesce(nullif(trim(coalesce(p_role, '')), ''), 'Sales agent');
BEGIN
    IF NOT (public.is_admin() OR public.is_agent_supervisor()) THEN RAISE EXCEPTION 'not authorized'; END IF;
    SELECT lower(u.email) INTO v_email FROM auth.users u WHERE u.id = p_user_id;
    IF v_email IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'message', 'That student account was not found.');
    END IF;

    SELECT * INTO v_existing FROM public.staff_members WHERE user_id = p_user_id LIMIT 1;
    IF FOUND THEN
        -- already an agent: make sure they are switched on, and change nothing else
        UPDATE public.staff_members SET active = true WHERE id = v_existing.id;
        RETURN jsonb_build_object('ok', true, 'existing', true, 'id', v_existing.id, 'slug', v_existing.slug, 'staff_code', v_existing.staff_code,
                                  'name', v_existing.display_name, 'email', v_email, 'agent_type', v_existing.agent_type);
    END IF;

    SELECT coalesce(nullif(trim(p.full_name), ''), split_part(v_email, '@', 1)), nullif(trim(coalesce(p.phone, '')), '')
      INTO v_name, v_phone FROM public.profiles p WHERE p.id = p_user_id;
    v_name := coalesce(v_name, split_part(v_email, '@', 1));

    v_base := left(regexp_replace(lower(split_part(v_name, ' ', 1)), '[^a-z0-9]', '', 'g'), 20);
    IF v_base = '' THEN v_base := 'agent'; END IF;
    v_slug := v_base;
    WHILE EXISTS (SELECT 1 FROM public.staff_members WHERE slug = v_slug) LOOP
        n := n + 1; v_slug := v_base || (n + 1)::text;
    END LOOP;
    v_code := 'AGT-' || upper(substr(md5(p_user_id::text), 1, 6));

    -- the student profile is left exactly as it is: they stay a student and gain the agent dashboard
    INSERT INTO public.staff_members (user_id, staff_code, slug, display_name, role, phone, active, agent_type, can_supervise_agents)
    VALUES (p_user_id, v_code, v_slug, v_name, v_role, v_phone, true, 'student_agent', false)
    RETURNING id INTO v_id;

    RETURN jsonb_build_object('ok', true, 'existing', false, 'id', v_id, 'slug', v_slug, 'staff_code', v_code,
                              'name', v_name, 'email', v_email, 'agent_type', 'student_agent');
END $$;
GRANT EXECUTE ON FUNCTION public.supervisor_make_student_agent(UUID, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';
