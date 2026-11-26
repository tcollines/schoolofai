-- Paper-form registrations: agents registered people on physical forms before switching to digital.
-- An admin or supervisor can enter them in bulk, with the original registration date, the agent who took each form
-- and the location, so every student is credited to that agent in all stats (staff_registrations is what the agent stats read).
-- ADDITIVE: one new function. Also replaces admin_register_walk_in only to use the same course label as the agent portal
-- ('AI Fundamentals (free)').

CREATE OR REPLACE FUNCTION public.admin_import_paper_forms(p_rows JSONB)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_row JSONB;
    v_i INT := 0;
    v_name TEXT;
    v_digits TEXT;
    v_phone TEXT;
    v_email TEXT;
    v_loc TEXT;
    v_note TEXT;
    v_on DATE;
    v_agent UUID;
    v_agent_name TEXT;
    v_existing public.staff_registrations;
    v_who TEXT;
    v_inserted INT := 0;
    v_skipped JSONB := '[]'::jsonb;
    v_stamp TIMESTAMPTZ;
BEGIN
    IF NOT public._can_manage_physical_attendance() THEN RAISE EXCEPTION 'not authorized'; END IF;
    IF p_rows IS NULL OR jsonb_typeof(p_rows) <> 'array' THEN RAISE EXCEPTION 'rows must be a list'; END IF;
    IF jsonb_array_length(p_rows) > 300 THEN RAISE EXCEPTION 'send at most 300 forms at a time'; END IF;

    FOR v_row IN SELECT * FROM jsonb_array_elements(p_rows) LOOP
        v_i := v_i + 1;
        v_name := nullif(trim(coalesce(v_row->>'name', '')), '');
        v_digits := regexp_replace(coalesce(v_row->>'phone', ''), '\D', '', 'g');
        v_email := nullif(lower(trim(coalesce(v_row->>'email', ''))), '');
        v_loc := nullif(trim(coalesce(v_row->>'location', '')), '');
        v_note := nullif(trim(coalesce(v_row->>'note', '')), '');
        v_agent := nullif(v_row->>'agent_id', '')::uuid;
        BEGIN v_on := nullif(v_row->>'registered_on', '')::date; EXCEPTION WHEN OTHERS THEN v_on := NULL; END;

        IF v_name IS NULL OR length(v_name) < 2 THEN
            v_skipped := v_skipped || jsonb_build_object('row', v_i, 'name', v_name, 'reason', 'Name is missing.'); CONTINUE;
        END IF;
        IF v_digits LIKE '0%' AND length(v_digits) = 10 THEN v_phone := '256' || substr(v_digits, 2);
        ELSIF length(v_digits) = 9 THEN v_phone := '256' || v_digits;
        ELSE v_phone := v_digits; END IF;
        IF length(v_phone) < 10 OR length(v_phone) > 15 THEN
            v_skipped := v_skipped || jsonb_build_object('row', v_i, 'name', v_name, 'reason', 'Phone number does not look right.'); CONTINUE;
        END IF;
        IF v_email IS NOT NULL AND v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
            v_skipped := v_skipped || jsonb_build_object('row', v_i, 'name', v_name, 'reason', 'Email does not look right.'); CONTINUE;
        END IF;
        IF v_on IS NULL OR v_on > (now() AT TIME ZONE 'Africa/Kampala')::date OR v_on < date '2025-01-01' THEN
            v_skipped := v_skipped || jsonb_build_object('row', v_i, 'name', v_name, 'reason', 'Registration date is missing or not valid.'); CONTINUE;
        END IF;
        SELECT s.display_name INTO v_agent_name FROM public.staff_members s WHERE s.id = v_agent;
        IF v_agent IS NULL OR v_agent_name IS NULL THEN
            v_skipped := v_skipped || jsonb_build_object('row', v_i, 'name', v_name, 'reason', 'Agent was not chosen.'); CONTINUE;
        END IF;
        IF v_email IS NOT NULL AND EXISTS (SELECT 1 FROM public.profiles pr WHERE lower(pr.email) = v_email) THEN
            v_skipped := v_skipped || jsonb_build_object('row', v_i, 'name', v_name, 'reason', 'Already has an account with this email.'); CONTINUE;
        END IF;

        SELECT r.* INTO v_existing FROM public.staff_registrations r
         WHERE r.phone = v_phone OR (v_email IS NOT NULL AND lower(r.email) = v_email)
         ORDER BY (r.phone = v_phone) DESC LIMIT 1;
        IF FOUND THEN
            SELECT display_name INTO v_who FROM public.staff_members WHERE id = v_existing.registered_by_staff_id;
            v_skipped := v_skipped || jsonb_build_object('row', v_i, 'name', v_name,
                'reason', 'Already registered as ' || coalesce(v_existing.full_name, 'someone') || ' by ' || coalesce(v_who, 'an agent')
                          || ' on ' || to_char(v_existing.created_at AT TIME ZONE 'Africa/Kampala', 'DD Mon YYYY') || '.');
            CONTINUE;
        END IF;

        -- noon on the form date, Kampala time, so the day is right in every report
        v_stamp := ((v_on::timestamp + interval '12 hours') AT TIME ZONE 'Africa/Kampala');
        INSERT INTO public.staff_registrations (created_at, registered_by_staff_id, full_name, email, phone, course_slug, course_title, campaign, notes, consent_contact, location, status)
        VALUES (v_stamp, v_agent, left(v_name, 120), v_email, v_phone, 'ai-fundamentals', 'AI Fundamentals (free)', 'paper_form',
                left(coalesce(v_note, 'Paper form'), 500), true, v_loc, 'registered');
        v_inserted := v_inserted + 1;
    END LOOP;

    RETURN jsonb_build_object('ok', true, 'inserted', v_inserted, 'skipped', v_skipped, 'total', v_i);
END $$;

REVOKE ALL ON FUNCTION public.admin_import_paper_forms(JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_import_paper_forms(JSONB) TO authenticated;

-- Same course label as the agent portal so People shows one course chip.
CREATE OR REPLACE FUNCTION public.admin_register_walk_in(
    p_name TEXT, p_phone TEXT, p_email TEXT DEFAULT NULL, p_location TEXT DEFAULT NULL,
    p_lessons INT[] DEFAULT '{}', p_date DATE DEFAULT NULL, p_note TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_staff UUID := public.current_staff_id();
    v_digits TEXT := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
    v_phone TEXT;
    v_email TEXT := nullif(lower(trim(coalesce(p_email, ''))), '');
    v_key TEXT;
    v_exists BOOLEAN := false;
    v_created BOOLEAN := false;
    v_lesson INT;
BEGIN
    IF NOT public._can_manage_physical_attendance() THEN RAISE EXCEPTION 'not authorized'; END IF;
    IF v_staff IS NULL THEN RAISE EXCEPTION 'You need an active agent profile to register people. Ask an admin to add you as an agent.'; END IF;
    IF coalesce(trim(p_name), '') = '' THEN RAISE EXCEPTION 'name required'; END IF;
    IF v_digits LIKE '0%' THEN v_phone := '256' || substr(v_digits, 2);
    ELSIF length(v_digits) = 9 THEN v_phone := '256' || v_digits;
    ELSE v_phone := v_digits; END IF;
    IF length(v_phone) < 10 THEN RAISE EXCEPTION 'a valid phone number is required'; END IF;
    v_key := coalesce(v_email, 'tel:' || v_phone);
    SELECT EXISTS (
        SELECT 1 FROM public.staff_registrations r WHERE r.phone = v_phone OR (v_email IS NOT NULL AND lower(r.email) = v_email)
    ) OR (v_email IS NOT NULL AND (
        EXISTS (SELECT 1 FROM public.leads l WHERE lower(l.email) = v_email)
        OR EXISTS (SELECT 1 FROM auth.users u WHERE lower(u.email) = v_email)))
    INTO v_exists;
    IF NOT v_exists THEN
        INSERT INTO public.staff_registrations (registered_by_staff_id, full_name, email, phone, course_slug, course_title, campaign, notes, consent_contact, location, status)
        VALUES (v_staff, left(trim(p_name), 120), v_email, v_phone, 'ai-fundamentals', 'AI Fundamentals (free)', 'hq_walk_in', left(p_note, 500), true,
                nullif(trim(coalesce(p_location, '')), ''), 'registered');
        v_created := true;
    ELSE
        IF v_email IS NULL THEN
            SELECT coalesce(nullif(lower(r.email), ''), 'tel:' || r.phone) INTO v_key
              FROM public.staff_registrations r WHERE r.phone = v_phone LIMIT 1;
            v_key := coalesce(v_key, 'tel:' || v_phone);
        END IF;
    END IF;
    FOREACH v_lesson IN ARRAY coalesce(p_lessons, '{}'::int[]) LOOP
        IF v_lesson BETWEEN 1 AND 3 THEN
            PERFORM public.admin_set_physical_lesson(v_key, trim(p_name), v_email, v_phone, v_lesson, true, p_date, 'ai-fundamentals');
        END IF;
    END LOOP;
    INSERT INTO public.registration_followups (key, status, note, updated_by, updated_at)
    VALUES (left(v_key, 300), 'converted', left(p_note, 1000), auth.uid(), now())
    ON CONFLICT (key) DO UPDATE SET status = 'converted', updated_by = auth.uid(), updated_at = now();
    RETURN jsonb_build_object('ok', true, 'key', v_key, 'created', v_created, 'already_registered', v_exists);
END $$;

NOTIFY pgrst, 'reload schema';
