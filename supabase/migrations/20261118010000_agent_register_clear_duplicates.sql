-- Agent registration: say exactly what matched on a duplicate, and treat the same agent re-sending the same student as success.
CREATE OR REPLACE FUNCTION public.staff_register_student(
    p_name TEXT, p_email TEXT, p_phone TEXT, p_course_title TEXT,
    p_course_slug TEXT DEFAULT NULL, p_campaign TEXT DEFAULT NULL, p_notes TEXT DEFAULT NULL,
    p_consent BOOLEAN DEFAULT false, p_location TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_staff UUID := public.current_staff_id();
    v_phone TEXT;
    v_email TEXT := nullif(lower(trim(coalesce(p_email, ''))), '');
    v_existing public.staff_registrations;
    v_new UUID;
    v_slug TEXT;
    v_who TEXT;
BEGIN
    IF v_staff IS NULL THEN RAISE EXCEPTION 'not a staff member'; END IF;
    IF p_name IS NULL OR length(trim(p_name)) < 2 THEN
        RETURN jsonb_build_object('ok', false, 'code', 'invalid', 'message', 'Please enter the student''s full name.');
    END IF;
    IF NOT coalesce(p_consent, false) THEN
        RETURN jsonb_build_object('ok', false, 'code', 'invalid', 'message', 'The student must agree to be contacted.');
    END IF;
    v_phone := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
    IF v_phone LIKE '0%' AND length(v_phone) = 10 THEN v_phone := '256' || substr(v_phone, 2); END IF;
    IF length(v_phone) < 9 OR length(v_phone) > 15 THEN
        RETURN jsonb_build_object('ok', false, 'code', 'invalid', 'message', 'Please enter a valid phone number.');
    END IF;
    IF v_email IS NOT NULL AND v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
        RETURN jsonb_build_object('ok', false, 'code', 'invalid', 'message', 'That email address does not look right.');
    END IF;
    IF v_email IS NOT NULL AND EXISTS (SELECT 1 FROM public.profiles pr WHERE lower(pr.email) = v_email) THEN
        RETURN jsonb_build_object('ok', false, 'code', 'has_account', 'message', 'This person already has an account, so they cannot be registered again.');
    END IF;
    SELECT r.* INTO v_existing FROM public.staff_registrations r
     WHERE r.phone = v_phone OR (v_email IS NOT NULL AND lower(r.email) = v_email)
     ORDER BY (r.phone = v_phone) DESC LIMIT 1;
    IF FOUND THEN
        -- the same agent sending the same student again (double tap, retry after a bad connection): treat as done
        IF v_existing.registered_by_staff_id = v_staff AND v_existing.phone = v_phone
           AND lower(trim(v_existing.full_name)) = lower(trim(p_name)) THEN
            SELECT slug INTO v_slug FROM public.staff_members WHERE id = v_staff;
            RETURN jsonb_build_object('ok', true, 'id', v_existing.id, 'slug', v_slug, 'phone', v_phone, 'already', true);
        END IF;
        SELECT display_name INTO v_who FROM public.staff_members WHERE id = v_existing.registered_by_staff_id;
        RETURN jsonb_build_object('ok', false, 'code', 'duplicate',
            'mine', v_existing.registered_by_staff_id = v_staff,
            'message', CASE WHEN v_existing.phone = v_phone THEN 'The phone number ' || p_phone || ' is already registered to ' ELSE 'The email ' || v_email || ' is already registered to ' END
                       || coalesce(v_existing.full_name, 'another student') || ' (registered by '
                       || CASE WHEN v_existing.registered_by_staff_id = v_staff THEN 'you' ELSE coalesce(v_who, 'another agent') END
                       || ' on ' || to_char(v_existing.created_at AT TIME ZONE 'Africa/Kampala', 'DD Mon') || '). Use a different '
                       || CASE WHEN v_existing.phone = v_phone THEN 'phone number' ELSE 'email' END || ' if this is a different person.');
    END IF;
    INSERT INTO public.staff_registrations (registered_by_staff_id, full_name, email, phone, course_slug, course_title, campaign, notes, consent_contact, location)
    VALUES (v_staff, trim(p_name), v_email, v_phone, nullif(p_course_slug, ''), coalesce(nullif(trim(p_course_title), ''), 'AI Fundamentals (free)'),
            nullif(trim(coalesce(p_campaign, '')), ''), nullif(trim(coalesce(p_notes, '')), ''), true, nullif(trim(coalesce(p_location, '')), ''))
    RETURNING id INTO v_new;
    SELECT slug INTO v_slug FROM public.staff_members WHERE id = v_staff;
    RETURN jsonb_build_object('ok', true, 'id', v_new, 'slug', v_slug, 'phone', v_phone);
END $$;
GRANT EXECUTE ON FUNCTION public.staff_register_student(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT) TO authenticated;
NOTIFY pgrst, 'reload schema';
