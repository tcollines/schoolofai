-- Front desk: call log + walk-in registration for the HQ team (admins and supervisors).
-- ADDITIVE. One new table, three new functions, and one replaced function (admin_set_physical_lesson, created in
-- 20261126000000) which now also marks the person 'converted' when they attend a lesson at HQ.
-- Everything writes through the existing registration_followups status, so every admin page keeps showing the same numbers.

CREATE TABLE IF NOT EXISTS public.call_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_key TEXT NOT NULL,
    person_name TEXT,
    email TEXT,
    phone TEXT,
    outcome TEXT NOT NULL CHECK (outcome IN ('reached', 'no_answer', 'call_back', 'wrong_number')),
    next_step TEXT CHECK (next_step IN ('online', 'recorded', 'hq', 'paid', 'undecided', 'not_interested')),
    note TEXT,
    follow_up_on DATE,
    called_by UUID DEFAULT auth.uid(),
    called_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_call_log_person ON public.call_log (person_key, called_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_log_time ON public.call_log (called_at DESC);
ALTER TABLE public.call_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.call_log FROM PUBLIC, anon, authenticated;

-- Log one call. Updates the person's follow-up status (never downgrades interested/converted).
CREATE OR REPLACE FUNCTION public.admin_log_call(
    p_key TEXT, p_name TEXT, p_email TEXT, p_phone TEXT,
    p_outcome TEXT, p_next_step TEXT DEFAULT NULL, p_note TEXT DEFAULT NULL, p_follow_up_on DATE DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_status TEXT;
    v_current TEXT;
BEGIN
    IF NOT public._can_manage_physical_attendance() THEN RAISE EXCEPTION 'not authorized'; END IF;
    IF coalesce(trim(p_key), '') = '' THEN RAISE EXCEPTION 'person key required'; END IF;

    INSERT INTO public.call_log (person_key, person_name, email, phone, outcome, next_step, note, follow_up_on)
    VALUES (left(trim(p_key), 300), nullif(trim(coalesce(p_name, '')), ''), nullif(lower(trim(coalesce(p_email, ''))), ''),
            nullif(trim(coalesce(p_phone, '')), ''), p_outcome, p_next_step, left(p_note, 1000), p_follow_up_on);

    v_status := CASE
        WHEN p_outcome = 'reached' AND p_next_step = 'not_interested' THEN 'not_interested'
        WHEN p_outcome = 'reached' AND p_next_step IN ('online', 'recorded', 'hq', 'paid') THEN 'interested'
        ELSE 'contacted'
    END;
    SELECT status INTO v_current FROM public.registration_followups WHERE key = left(trim(p_key), 300);

    IF v_current IS NULL THEN
        INSERT INTO public.registration_followups (key, status, note, updated_by, updated_at)
        VALUES (left(trim(p_key), 300), v_status, left(p_note, 1000), auth.uid(), now());
    ELSIF v_current IN ('new', 'contacted', 'not_interested') OR v_status = 'not_interested' THEN
        UPDATE public.registration_followups
           SET status = v_status, note = coalesce(left(p_note, 1000), note), updated_by = auth.uid(), updated_at = now()
         WHERE key = left(trim(p_key), 300) AND status <> 'converted';
    ELSE
        UPDATE public.registration_followups
           SET note = coalesce(left(p_note, 1000), note), updated_by = auth.uid(), updated_at = now()
         WHERE key = left(trim(p_key), 300);
    END IF;
    RETURN jsonb_build_object('ok', true, 'status', v_status);
END $$;

-- Recent calls for the stats and call lists.
CREATE OR REPLACE FUNCTION public.admin_call_log(p_limit INT DEFAULT 3000)
RETURNS TABLE (person_key TEXT, person_name TEXT, email TEXT, phone TEXT, outcome TEXT, next_step TEXT, note TEXT,
               follow_up_on DATE, called_by UUID, caller_name TEXT, called_at TIMESTAMPTZ)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NOT public._can_manage_physical_attendance() THEN RAISE EXCEPTION 'not authorized'; END IF;
    RETURN QUERY
        SELECT c.person_key, c.person_name, c.email, c.phone, c.outcome, c.next_step, c.note, c.follow_up_on, c.called_by,
               coalesce(nullif(trim(p.full_name), ''), split_part(coalesce(u.email, ''), '@', 1)) AS caller_name, c.called_at
          FROM public.call_log c
          LEFT JOIN public.profiles p ON p.id = c.called_by
          LEFT JOIN auth.users u ON u.id = c.called_by
         ORDER BY c.called_at DESC
         LIMIT greatest(1, least(coalesce(p_limit, 3000), 10000));
END $$;

-- Attending a lesson at HQ means the person has converted: replace the earlier version to also set that status.
CREATE OR REPLACE FUNCTION public.admin_set_physical_lesson(
    p_person_key TEXT, p_name TEXT, p_email TEXT, p_phone TEXT,
    p_lesson INT, p_attended BOOLEAN, p_date DATE DEFAULT NULL, p_course TEXT DEFAULT 'ai-fundamentals'
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NOT public._can_manage_physical_attendance() THEN RAISE EXCEPTION 'not authorized'; END IF;
    IF coalesce(trim(p_person_key), '') = '' THEN RAISE EXCEPTION 'person key required'; END IF;
    IF p_lesson NOT BETWEEN 1 AND 3 THEN RAISE EXCEPTION 'lesson must be 1, 2 or 3'; END IF;

    IF p_attended THEN
        INSERT INTO public.physical_lesson_attendance (course_slug, lesson_no, person_key, person_name, email, phone, attended_on)
        VALUES (p_course, p_lesson, trim(p_person_key), nullif(trim(coalesce(p_name, '')), ''),
                nullif(lower(trim(coalesce(p_email, ''))), ''), nullif(trim(coalesce(p_phone, '')), ''),
                coalesce(p_date, (now() AT TIME ZONE 'Africa/Kampala')::date))
        ON CONFLICT (course_slug, person_key, lesson_no)
        DO UPDATE SET attended_on = coalesce(p_date, public.physical_lesson_attendance.attended_on),
                      person_name = coalesce(excluded.person_name, public.physical_lesson_attendance.person_name),
                      email = coalesce(excluded.email, public.physical_lesson_attendance.email),
                      phone = coalesce(excluded.phone, public.physical_lesson_attendance.phone);
        INSERT INTO public.registration_followups (key, status, updated_by, updated_at)
        VALUES (left(trim(p_person_key), 300), 'converted', auth.uid(), now())
        ON CONFLICT (key) DO UPDATE SET status = 'converted', updated_by = auth.uid(), updated_at = now();
    ELSE
        DELETE FROM public.physical_lesson_attendance
         WHERE course_slug = p_course AND lesson_no = p_lesson
           AND (person_key = trim(p_person_key)
                OR (nullif(lower(trim(coalesce(p_email, ''))), '') IS NOT NULL AND email = lower(trim(p_email)))
                OR (nullif(trim(coalesce(p_phone, '')), '') IS NOT NULL AND phone = trim(p_phone)));
    END IF;
    RETURN jsonb_build_object('ok', true);
END $$;

-- Register someone who walked in to study. Saved under the person using this (their agent profile), so it counts in
-- their agent stats and in every admin number; optionally marks the lessons they attended today.
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

    -- Uganda numbers: 07XXXXXXXX or 7XXXXXXXX become 2567XXXXXXXX
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
        INSERT INTO public.staff_registrations (registered_by_staff_id, full_name, email, phone, course_slug, course_title, campaign, notes, consent_contact, status)
        VALUES (v_staff, left(trim(p_name), 120), v_email, v_phone, 'ai-fundamentals', 'AI Fundamentals', 'hq_walk_in', left(p_note, 500), true, 'registered');
        v_created := true;
    ELSE
        -- already known: prefer the key the roster already uses (email if it has one on file, else the phone key)
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

    -- someone who walked in has converted
    INSERT INTO public.registration_followups (key, status, note, updated_by, updated_at)
    VALUES (left(v_key, 300), 'converted', left(p_note, 1000), auth.uid(), now())
    ON CONFLICT (key) DO UPDATE SET status = 'converted', updated_by = auth.uid(), updated_at = now();

    RETURN jsonb_build_object('ok', true, 'key', v_key, 'created', v_created, 'already_registered', v_exists);
END $$;

REVOKE ALL ON FUNCTION public.admin_log_call(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, DATE) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_call_log(INT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_physical_lesson(TEXT, TEXT, TEXT, TEXT, INT, BOOLEAN, DATE, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_register_walk_in(TEXT, TEXT, TEXT, TEXT, INT[], DATE, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_log_call(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_call_log(INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_physical_lesson(TEXT, TEXT, TEXT, TEXT, INT, BOOLEAN, DATE, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_register_walk_in(TEXT, TEXT, TEXT, TEXT, INT[], DATE, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';
