-- =============================================================================
-- Agent registrations record a location; outreach invites respect the email opt-out;
-- admin can search the student database to hand out personal agent links.
-- Additive (one new nullable column; two functions replaced; one added).
-- =============================================================================
ALTER TABLE public.staff_registrations ADD COLUMN IF NOT EXISTS location TEXT;

DROP FUNCTION IF EXISTS public.staff_register_student(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN);
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
    SELECT * INTO v_existing FROM public.staff_registrations r
     WHERE r.phone = v_phone OR (v_email IS NOT NULL AND lower(r.email) = v_email) LIMIT 1;
    IF FOUND THEN
        RETURN jsonb_build_object('ok', false, 'code', 'duplicate',
            'mine', v_existing.registered_by_staff_id = v_staff,
            'message', CASE WHEN v_existing.registered_by_staff_id = v_staff
                            THEN 'You have already registered this student.'
                            ELSE 'This student has already been registered by another staff member.' END);
    END IF;
    INSERT INTO public.staff_registrations (registered_by_staff_id, full_name, email, phone, course_slug, course_title, campaign, notes, consent_contact, location)
    VALUES (v_staff, trim(p_name), v_email, v_phone, nullif(p_course_slug, ''), coalesce(nullif(trim(p_course_title), ''), 'AI Fundamentals (free)'),
            nullif(trim(coalesce(p_campaign, '')), ''), nullif(trim(coalesce(p_notes, '')), ''), true, nullif(trim(coalesce(p_location, '')), ''))
    RETURNING id INTO v_new;
    SELECT slug INTO v_slug FROM public.staff_members WHERE id = v_staff;
    RETURN jsonb_build_object('ok', true, 'id', v_new, 'slug', v_slug, 'phone', v_phone);
END $$;
GRANT EXECUTE ON FUNCTION public.staff_register_student(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT) TO authenticated;

-- Outreach invites: never email someone who has opted out
CREATE OR REPLACE FUNCTION public.outreach_invites_due(p_secret TEXT) RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NOT public._reminder_secret_ok(p_secret) THEN RAISE EXCEPTION 'not authorized'; END IF;
    RETURN coalesce((
        SELECT jsonb_agg(jsonb_build_object(
            'reg_no', i.reg_no, 'email', i.email, 'name', i.full_name,
            'has_account', EXISTS (SELECT 1 FROM auth.users u WHERE lower(u.email) = i.email),
            'session', (SELECT jsonb_build_object('id', s.id, 'title', s.title, 'description', s.description, 'host_name', s.host_name, 'starts_at', s.starts_at, 'ends_at', s.ends_at, 'join_link', s.meet_link)
                        FROM public.live_sessions s WHERE s.is_published AND s.ends_at > now() ORDER BY s.starts_at LIMIT 1)
        ) ORDER BY i.created_at)
        FROM public.outreach_free_course_invites i
        WHERE i.status IN ('pending', 'failed') AND i.attempts < 3
          AND NOT EXISTS (SELECT 1 FROM auth.users u JOIN public.live_reminder_prefs pr ON pr.user_id = u.id
                           WHERE lower(u.email) = i.email AND pr.email_opt_in = false)
    ), '[]'::jsonb);
END $$;

-- Admin: find students to hand a personal agent link
CREATE OR REPLACE FUNCTION public.admin_student_search(p_q TEXT)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE q TEXT := '%' || lower(trim(coalesce(p_q, ''))) || '%';
BEGIN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
    IF length(trim(coalesce(p_q, ''))) < 2 THEN RETURN '[]'::jsonb; END IF;
    RETURN coalesce((SELECT jsonb_agg(x ORDER BY x->>'name') FROM (
        SELECT jsonb_build_object('id', p.id, 'name', coalesce(p.full_name, ''), 'email', p.email, 'agent_slug', s.slug) AS x
        FROM public.profiles p LEFT JOIN public.staff_members s ON s.user_id = p.id
        WHERE lower(coalesce(p.full_name, '')) LIKE q OR lower(coalesce(p.email, '')) LIKE q
        LIMIT 30) t), '[]'::jsonb);
END $$;
GRANT EXECUTE ON FUNCTION public.admin_student_search(TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';
