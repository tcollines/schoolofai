-- HQ (physical) learning: courses, enrolments with exam and graduation, a proper attendance register, and a consult log.
-- Builds on 20261126000000 (attendance), 20261126010000 (calls, walk-ins) and 20261126020000 (paper forms).
--   hq_courses      : which courses are taught at HQ, how many lessons, whether there is an exam, the fee
--   hq_enrolments   : one row per person per course: status, payment, exam result, graduation
--   attendance      : lessons 1..N per course (was 1..3), status present / absent / excused
--   hq_enquiries    : people who come (or call) just to consult, with outcome and next follow-up date
-- Walk-in registration now takes the course, fee and payment. ADDITIVE except admin_register_walk_in, which is replaced
-- (same behaviour by default). Admins and active supervisors only, same rule as the rest of the front desk.

-- ---------------------------------------------------------------------------
-- 1. Courses taught at HQ
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hq_courses (
    slug TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    lessons_count SMALLINT NOT NULL DEFAULT 3 CHECK (lessons_count BETWEEN 1 AND 60),
    has_exam BOOLEAN NOT NULL DEFAULT true,
    fee_ugx INT NOT NULL DEFAULT 0 CHECK (fee_ugx >= 0),
    active BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 100,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.hq_courses ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.hq_courses FROM PUBLIC, anon, authenticated;
INSERT INTO public.hq_courses (slug, title, lessons_count, has_exam, fee_ugx, sort_order)
VALUES ('ai-fundamentals', 'Fundamentals of AI', 3, true, 0, 10)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. Enrolments, with payment, exam and graduation
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hq_enrolments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_slug TEXT NOT NULL REFERENCES public.hq_courses(slug),
    person_key TEXT NOT NULL,
    person_name TEXT,
    email TEXT,
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'withdrawn', 'graduated')),
    start_on DATE,
    intake TEXT,
    fee_ugx INT NOT NULL DEFAULT 0 CHECK (fee_ugx >= 0),
    paid_ugx INT NOT NULL DEFAULT 0 CHECK (paid_ugx >= 0),
    exam_result TEXT CHECK (exam_result IN ('passed', 'failed', 'absent')),
    exam_score SMALLINT CHECK (exam_score BETWEEN 0 AND 100),
    exam_on DATE,
    exam_attempts SMALLINT NOT NULL DEFAULT 0,
    graduated_on DATE,
    source TEXT NOT NULL DEFAULT 'walk_in',
    notes TEXT,
    enrolled_by UUID DEFAULT auth.uid(),
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT hq_enrolment_unique UNIQUE (course_slug, person_key)
);
CREATE INDEX IF NOT EXISTS idx_hq_enrol_course ON public.hq_enrolments (course_slug, status);
ALTER TABLE public.hq_enrolments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.hq_enrolments FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Attendance register: lessons 1..N and a status per lesson
-- ---------------------------------------------------------------------------
DO $$
DECLARE c TEXT;
BEGIN
    FOR c IN SELECT conname FROM pg_constraint
              WHERE conrelid = 'public.physical_lesson_attendance'::regclass AND contype = 'c'
                AND pg_get_constraintdef(oid) ILIKE '%lesson_no%'
    LOOP
        EXECUTE format('ALTER TABLE public.physical_lesson_attendance DROP CONSTRAINT %I', c);
    END LOOP;
END $$;
ALTER TABLE public.physical_lesson_attendance
    ADD CONSTRAINT physical_att_lesson_range CHECK (lesson_no BETWEEN 1 AND 60);
ALTER TABLE public.physical_lesson_attendance
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'excused'));

-- ---------------------------------------------------------------------------
-- 4. Consult log: people who come, call or message just to ask
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hq_enquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    visitor_name TEXT,
    phone TEXT,
    email TEXT,
    channel TEXT NOT NULL DEFAULT 'walk_in' CHECK (channel IN ('walk_in', 'phone', 'whatsapp', 'other')),
    topic TEXT NOT NULL DEFAULT 'course_info' CHECK (topic IN
        ('course_info', 'fees', 'schedule', 'for_someone_else', 'corporate', 'partnership', 'job_internship', 'certificate', 'complaint', 'other')),
    course_slug TEXT,
    course_text TEXT,
    outcome TEXT NOT NULL DEFAULT 'answered' CHECK (outcome IN ('answered', 'thinking', 'follow_up', 'registered', 'not_interested')),
    follow_up_on DATE,
    notes TEXT,
    converted_key TEXT,
    handled_by UUID DEFAULT auth.uid(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_hq_enq_time ON public.hq_enquiries (visited_at DESC);
ALTER TABLE public.hq_enquiries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.hq_enquiries FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. Helpers (not callable from the app)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._hq_find_enrolment(p_course TEXT, p_key TEXT, p_email TEXT, p_phone TEXT)
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT e.id FROM public.hq_enrolments e
     WHERE e.course_slug = p_course
       AND (e.person_key = trim(p_key)
            OR (nullif(lower(trim(coalesce(p_email, ''))), '') IS NOT NULL AND e.email = lower(trim(p_email)))
            OR (length(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')) >= 9
                AND right(regexp_replace(coalesce(e.phone, ''), '\D', '', 'g'), 9) = right(regexp_replace(p_phone, '\D', '', 'g'), 9)))
     ORDER BY e.enrolled_at LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public._hq_ensure_enrolment(p_course TEXT, p_key TEXT, p_name TEXT, p_email TEXT, p_phone TEXT, p_source TEXT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_id UUID := public._hq_find_enrolment(p_course, p_key, p_email, p_phone);
    v_fee INT;
BEGIN
    IF v_id IS NOT NULL THEN RETURN v_id; END IF;
    SELECT fee_ugx INTO v_fee FROM public.hq_courses WHERE slug = p_course;
    IF NOT FOUND THEN RETURN NULL; END IF;       -- not an HQ course: nothing to enrol in
    INSERT INTO public.hq_enrolments (course_slug, person_key, person_name, email, phone, fee_ugx, source)
    VALUES (p_course, trim(p_key), nullif(trim(coalesce(p_name, '')), ''), nullif(lower(trim(coalesce(p_email, ''))), ''),
            nullif(trim(coalesce(p_phone, '')), ''), coalesce(v_fee, 0), coalesce(p_source, 'walk_in'))
    RETURNING id INTO v_id;
    RETURN v_id;
END $$;

REVOKE ALL ON FUNCTION public._hq_find_enrolment(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._hq_ensure_enrolment(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 6. Attendance functions
-- ---------------------------------------------------------------------------
-- The existing reader keeps meaning "who attended": only present rows, so every current screen and number is unchanged.
CREATE OR REPLACE FUNCTION public.admin_physical_attendance(p_course TEXT DEFAULT 'ai-fundamentals')
RETURNS TABLE (person_key TEXT, person_name TEXT, email TEXT, phone TEXT, lesson_no SMALLINT, attended_on DATE)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NOT public._can_manage_physical_attendance() THEN RAISE EXCEPTION 'not authorized'; END IF;
    RETURN QUERY
        SELECT a.person_key, a.person_name, a.email, a.phone, a.lesson_no, a.attended_on
          FROM public.physical_lesson_attendance a
         WHERE a.course_slug = p_course AND a.status = 'present';
END $$;

-- Every status, for the class sheet (shows who was marked absent or excused as well).
CREATE OR REPLACE FUNCTION public.admin_hq_attendance_sheet(p_course TEXT DEFAULT 'ai-fundamentals')
RETURNS TABLE (person_key TEXT, person_name TEXT, email TEXT, phone TEXT, lesson_no SMALLINT, status TEXT, attended_on DATE, note TEXT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NOT public._can_manage_physical_attendance() THEN RAISE EXCEPTION 'not authorized'; END IF;
    RETURN QUERY
        SELECT a.person_key, a.person_name, a.email, a.phone, a.lesson_no, a.status, a.attended_on, a.note
          FROM public.physical_lesson_attendance a
         WHERE a.course_slug = p_course;
END $$;

-- Mark one person for one lesson: 'present', 'absent', 'excused', or 'clear' to remove the mark.
-- 'present' also enrols them in the course if they were not enrolled, and sets their follow-up to 'converted'.
CREATE OR REPLACE FUNCTION public.admin_set_hq_attendance(
    p_key TEXT, p_name TEXT, p_email TEXT, p_phone TEXT, p_lesson INT, p_status TEXT,
    p_date DATE DEFAULT NULL, p_course TEXT DEFAULT 'ai-fundamentals', p_note TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_max INT;
BEGIN
    IF NOT public._can_manage_physical_attendance() THEN RAISE EXCEPTION 'not authorized'; END IF;
    IF coalesce(trim(p_key), '') = '' THEN RAISE EXCEPTION 'person key required'; END IF;
    SELECT lessons_count INTO v_max FROM public.hq_courses WHERE slug = p_course;
    v_max := coalesce(v_max, 3);
    IF p_lesson NOT BETWEEN 1 AND v_max THEN RAISE EXCEPTION 'this course has lessons 1 to %', v_max; END IF;
    IF p_status NOT IN ('present', 'absent', 'excused', 'clear') THEN RAISE EXCEPTION 'status must be present, absent, excused or clear'; END IF;

    IF p_status = 'clear' THEN
        DELETE FROM public.physical_lesson_attendance
         WHERE course_slug = p_course AND lesson_no = p_lesson
           AND (person_key = trim(p_key)
                OR (nullif(lower(trim(coalesce(p_email, ''))), '') IS NOT NULL AND email = lower(trim(p_email)))
                OR (nullif(trim(coalesce(p_phone, '')), '') IS NOT NULL AND phone = trim(p_phone)));
        RETURN jsonb_build_object('ok', true);
    END IF;

    INSERT INTO public.physical_lesson_attendance (course_slug, lesson_no, person_key, person_name, email, phone, attended_on, status, note)
    VALUES (p_course, p_lesson, trim(p_key), nullif(trim(coalesce(p_name, '')), ''),
            nullif(lower(trim(coalesce(p_email, ''))), ''), nullif(trim(coalesce(p_phone, '')), ''),
            coalesce(p_date, (now() AT TIME ZONE 'Africa/Kampala')::date), p_status, nullif(trim(coalesce(p_note, '')), ''))
    ON CONFLICT (course_slug, person_key, lesson_no)
    DO UPDATE SET status = excluded.status,
                  attended_on = coalesce(p_date, public.physical_lesson_attendance.attended_on),
                  person_name = coalesce(excluded.person_name, public.physical_lesson_attendance.person_name),
                  email = coalesce(excluded.email, public.physical_lesson_attendance.email),
                  phone = coalesce(excluded.phone, public.physical_lesson_attendance.phone),
                  note = coalesce(excluded.note, public.physical_lesson_attendance.note);

    IF p_status = 'present' THEN
        PERFORM public._hq_ensure_enrolment(p_course, p_key, p_name, p_email, p_phone, 'attendance');
        INSERT INTO public.registration_followups (key, status, updated_by, updated_at)
        VALUES (left(trim(p_key), 300), 'converted', auth.uid(), now())
        ON CONFLICT (key) DO UPDATE SET status = 'converted', updated_by = auth.uid(), updated_at = now();
    END IF;
    RETURN jsonb_build_object('ok', true);
END $$;

-- The earlier tick/untick function keeps working for existing screens: it now means present / clear.
CREATE OR REPLACE FUNCTION public.admin_set_physical_lesson(
    p_person_key TEXT, p_name TEXT, p_email TEXT, p_phone TEXT,
    p_lesson INT, p_attended BOOLEAN, p_date DATE DEFAULT NULL, p_course TEXT DEFAULT 'ai-fundamentals'
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN public.admin_set_hq_attendance(p_person_key, p_name, p_email, p_phone, p_lesson,
                                          CASE WHEN p_attended THEN 'present' ELSE 'clear' END, p_date, p_course, NULL);
END $$;

-- ---------------------------------------------------------------------------
-- 7. Course and enrolment functions
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_hq_courses()
RETURNS TABLE (slug TEXT, title TEXT, lessons_count SMALLINT, has_exam BOOLEAN, fee_ugx INT, active BOOLEAN, sort_order INT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NOT public._can_manage_physical_attendance() THEN RAISE EXCEPTION 'not authorized'; END IF;
    RETURN QUERY SELECT c.slug, c.title, c.lessons_count, c.has_exam, c.fee_ugx, c.active, c.sort_order FROM public.hq_courses c ORDER BY c.sort_order, c.title;
END $$;

-- Add or change a course taught at HQ (admins only).
CREATE OR REPLACE FUNCTION public.admin_hq_save_course(
    p_slug TEXT, p_title TEXT, p_lessons INT, p_has_exam BOOLEAN, p_fee INT, p_active BOOLEAN DEFAULT true
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_slug TEXT := lower(regexp_replace(trim(coalesce(nullif(p_slug, ''), p_title)), '[^a-zA-Z0-9]+', '-', 'g'));
BEGIN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
    IF coalesce(trim(p_title), '') = '' THEN RAISE EXCEPTION 'course name required'; END IF;
    v_slug := trim(both '-' from v_slug);
    IF v_slug = '' THEN RAISE EXCEPTION 'course name required'; END IF;
    INSERT INTO public.hq_courses (slug, title, lessons_count, has_exam, fee_ugx, active)
    VALUES (v_slug, left(trim(p_title), 120), greatest(1, least(coalesce(p_lessons, 3), 60)), coalesce(p_has_exam, true), greatest(0, coalesce(p_fee, 0)), coalesce(p_active, true))
    ON CONFLICT (slug) DO UPDATE SET title = excluded.title, lessons_count = excluded.lessons_count, has_exam = excluded.has_exam,
                                     fee_ugx = excluded.fee_ugx, active = excluded.active;
    RETURN jsonb_build_object('ok', true, 'slug', v_slug);
END $$;

CREATE OR REPLACE FUNCTION public.admin_hq_enrolments(p_course TEXT DEFAULT NULL)
RETURNS TABLE (id UUID, course_slug TEXT, person_key TEXT, person_name TEXT, email TEXT, phone TEXT, status TEXT, start_on DATE, intake TEXT,
               fee_ugx INT, paid_ugx INT, exam_result TEXT, exam_score SMALLINT, exam_on DATE, exam_attempts SMALLINT, graduated_on DATE,
               source TEXT, notes TEXT, enrolled_at TIMESTAMPTZ)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NOT public._can_manage_physical_attendance() THEN RAISE EXCEPTION 'not authorized'; END IF;
    RETURN QUERY
        SELECT e.id, e.course_slug, e.person_key, e.person_name, e.email, e.phone, e.status, e.start_on, e.intake, e.fee_ugx, e.paid_ugx,
               e.exam_result, e.exam_score, e.exam_on, e.exam_attempts, e.graduated_on, e.source, e.notes, e.enrolled_at
          FROM public.hq_enrolments e
         WHERE p_course IS NULL OR e.course_slug = p_course
         ORDER BY e.enrolled_at DESC;
END $$;

-- Enrol (or update the enrolment of) one person in an HQ course.
CREATE OR REPLACE FUNCTION public.admin_hq_enrol(
    p_key TEXT, p_name TEXT, p_email TEXT, p_phone TEXT, p_course TEXT,
    p_fee INT DEFAULT NULL, p_paid INT DEFAULT NULL, p_start DATE DEFAULT NULL, p_intake TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL, p_source TEXT DEFAULT 'walk_in'
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_id UUID;
BEGIN
    IF NOT public._can_manage_physical_attendance() THEN RAISE EXCEPTION 'not authorized'; END IF;
    IF NOT EXISTS (SELECT 1 FROM public.hq_courses WHERE slug = p_course AND active) THEN RAISE EXCEPTION 'that course is not open for enrolment at HQ'; END IF;
    v_id := public._hq_ensure_enrolment(p_course, p_key, p_name, p_email, p_phone, p_source);
    UPDATE public.hq_enrolments SET
        status = CASE WHEN status IN ('withdrawn', 'paused') THEN 'active' ELSE status END,
        fee_ugx = coalesce(p_fee, fee_ugx), paid_ugx = coalesce(p_paid, paid_ugx),
        start_on = coalesce(p_start, start_on), intake = coalesce(nullif(trim(coalesce(p_intake, '')), ''), intake),
        notes = coalesce(nullif(trim(coalesce(p_notes, '')), ''), notes),
        person_name = coalesce(nullif(trim(coalesce(p_name, '')), ''), person_name),
        email = coalesce(nullif(lower(trim(coalesce(p_email, ''))), ''), email), phone = coalesce(nullif(trim(coalesce(p_phone, '')), ''), phone),
        updated_at = now()
     WHERE id = v_id;
    INSERT INTO public.registration_followups (key, status, updated_by, updated_at)
    VALUES (left(trim(p_key), 300), 'converted', auth.uid(), now())
    ON CONFLICT (key) DO UPDATE SET status = 'converted', updated_by = auth.uid(), updated_at = now();
    RETURN jsonb_build_object('ok', true, 'id', v_id);
END $$;

-- Change status, money, notes, intake or start date of an enrolment. Only the fields you send are changed.
CREATE OR REPLACE FUNCTION public.admin_hq_update_enrolment(p_course TEXT, p_key TEXT, p_email TEXT, p_phone TEXT, p_patch JSONB)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_id UUID := public._hq_find_enrolment(p_course, p_key, p_email, p_phone);
BEGIN
    IF NOT public._can_manage_physical_attendance() THEN RAISE EXCEPTION 'not authorized'; END IF;
    IF v_id IS NULL THEN RAISE EXCEPTION 'this person is not enrolled in that course'; END IF;
    IF p_patch ? 'status' AND (p_patch->>'status') NOT IN ('active', 'paused', 'withdrawn', 'graduated') THEN RAISE EXCEPTION 'unknown status'; END IF;
    UPDATE public.hq_enrolments SET
        status = coalesce(p_patch->>'status', status),
        fee_ugx = CASE WHEN p_patch ? 'fee_ugx' THEN greatest(0, (p_patch->>'fee_ugx')::int) ELSE fee_ugx END,
        paid_ugx = CASE WHEN p_patch ? 'paid_ugx' THEN greatest(0, (p_patch->>'paid_ugx')::int) ELSE paid_ugx END,
        notes = CASE WHEN p_patch ? 'notes' THEN nullif(trim(p_patch->>'notes'), '') ELSE notes END,
        intake = CASE WHEN p_patch ? 'intake' THEN nullif(trim(p_patch->>'intake'), '') ELSE intake END,
        start_on = CASE WHEN p_patch ? 'start_on' THEN nullif(p_patch->>'start_on', '')::date ELSE start_on END,
        updated_at = now()
     WHERE id = v_id;
    RETURN jsonb_build_object('ok', true);
END $$;

-- Record an exam: result 'passed', 'failed', 'absent', or 'clear' to remove it. Each recorded result counts as an attempt.
CREATE OR REPLACE FUNCTION public.admin_hq_set_exam(
    p_course TEXT, p_key TEXT, p_name TEXT, p_email TEXT, p_phone TEXT, p_result TEXT, p_score INT DEFAULT NULL, p_date DATE DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_id UUID;
BEGIN
    IF NOT public._can_manage_physical_attendance() THEN RAISE EXCEPTION 'not authorized'; END IF;
    IF p_result NOT IN ('passed', 'failed', 'absent', 'clear') THEN RAISE EXCEPTION 'result must be passed, failed, absent or clear'; END IF;
    v_id := public._hq_ensure_enrolment(p_course, p_key, p_name, p_email, p_phone, 'exam');
    IF v_id IS NULL THEN RAISE EXCEPTION 'that course is not taught at HQ'; END IF;
    IF p_result = 'clear' THEN
        UPDATE public.hq_enrolments SET exam_result = NULL, exam_score = NULL, exam_on = NULL, updated_at = now() WHERE id = v_id;
    ELSE
        UPDATE public.hq_enrolments SET exam_result = p_result,
            exam_score = CASE WHEN p_score IS NULL THEN NULL ELSE greatest(0, least(100, p_score)) END,
            exam_on = coalesce(p_date, (now() AT TIME ZONE 'Africa/Kampala')::date),
            exam_attempts = exam_attempts + 1,
            -- a pass undone by a later fail or absence also takes back graduation
            status = CASE WHEN p_result <> 'passed' AND status = 'graduated' THEN 'active' ELSE status END,
            graduated_on = CASE WHEN p_result <> 'passed' THEN NULL ELSE graduated_on END,
            updated_at = now()
         WHERE id = v_id;
    END IF;
    RETURN jsonb_build_object('ok', true);
END $$;

-- Graduate someone (or undo it). Normally needs the exam passed (if the course has one) and every lesson attended;
-- p_force = true lets the manager graduate anyway, for example when a lesson was taught online.
CREATE OR REPLACE FUNCTION public.admin_hq_graduate(
    p_course TEXT, p_key TEXT, p_name TEXT, p_email TEXT, p_phone TEXT,
    p_graduated BOOLEAN DEFAULT true, p_date DATE DEFAULT NULL, p_force BOOLEAN DEFAULT false
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_id UUID;
    v_course public.hq_courses;
    v_enrol public.hq_enrolments;
    v_missing INT[];
BEGIN
    IF NOT public._can_manage_physical_attendance() THEN RAISE EXCEPTION 'not authorized'; END IF;
    SELECT * INTO v_course FROM public.hq_courses WHERE slug = p_course;
    IF NOT FOUND THEN RAISE EXCEPTION 'that course is not taught at HQ'; END IF;
    v_id := public._hq_ensure_enrolment(p_course, p_key, p_name, p_email, p_phone, 'graduation');
    SELECT * INTO v_enrol FROM public.hq_enrolments WHERE id = v_id;

    IF NOT p_graduated THEN
        UPDATE public.hq_enrolments SET status = 'active', graduated_on = NULL, updated_at = now() WHERE id = v_id;
        RETURN jsonb_build_object('ok', true);
    END IF;

    SELECT coalesce(array_agg(n ORDER BY n), '{}') INTO v_missing
      FROM generate_series(1, v_course.lessons_count) AS n
     WHERE NOT EXISTS (
        SELECT 1 FROM public.physical_lesson_attendance a
         WHERE a.course_slug = p_course AND a.lesson_no = n AND a.status = 'present'
           AND (a.person_key = v_enrol.person_key
                OR (v_enrol.email IS NOT NULL AND a.email = v_enrol.email)
                OR (v_enrol.phone IS NOT NULL AND a.phone = v_enrol.phone)));

    IF NOT p_force THEN
        IF v_course.has_exam AND coalesce(v_enrol.exam_result, '') <> 'passed' THEN
            RETURN jsonb_build_object('ok', false, 'reason', 'The exam has not been passed yet.', 'missing_lessons', to_jsonb(v_missing));
        END IF;
        IF array_length(v_missing, 1) IS NOT NULL THEN
            RETURN jsonb_build_object('ok', false, 'reason', 'Lessons not attended: ' || array_to_string(v_missing, ', ') || '.', 'missing_lessons', to_jsonb(v_missing));
        END IF;
    END IF;
    UPDATE public.hq_enrolments SET status = 'graduated', graduated_on = coalesce(p_date, (now() AT TIME ZONE 'Africa/Kampala')::date), updated_at = now() WHERE id = v_id;
    RETURN jsonb_build_object('ok', true);
END $$;

-- ---------------------------------------------------------------------------
-- 8. Walk-in registration now takes the course, fee and payment
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.admin_register_walk_in(TEXT, TEXT, TEXT, TEXT, INT[], DATE, TEXT);

CREATE OR REPLACE FUNCTION public.admin_register_walk_in(
    p_name TEXT, p_phone TEXT, p_email TEXT DEFAULT NULL, p_location TEXT DEFAULT NULL,
    p_lessons INT[] DEFAULT '{}', p_date DATE DEFAULT NULL, p_note TEXT DEFAULT NULL,
    p_course TEXT DEFAULT 'ai-fundamentals', p_fee INT DEFAULT NULL, p_paid INT DEFAULT NULL,
    p_start DATE DEFAULT NULL, p_intake TEXT DEFAULT NULL, p_enquiry_id UUID DEFAULT NULL
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
    v_course public.hq_courses;
    v_title TEXT;
BEGIN
    IF NOT public._can_manage_physical_attendance() THEN RAISE EXCEPTION 'not authorized'; END IF;
    IF v_staff IS NULL THEN RAISE EXCEPTION 'You need an active agent profile to register people. Ask an admin to add you as an agent.'; END IF;
    IF coalesce(trim(p_name), '') = '' THEN RAISE EXCEPTION 'name required'; END IF;
    SELECT * INTO v_course FROM public.hq_courses WHERE slug = coalesce(nullif(p_course, ''), 'ai-fundamentals') AND active;
    IF NOT FOUND THEN RAISE EXCEPTION 'that course is not open for enrolment at HQ'; END IF;
    v_title := CASE WHEN v_course.slug = 'ai-fundamentals' THEN 'AI Fundamentals (free)' ELSE v_course.title END;

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
        VALUES (v_staff, left(trim(p_name), 120), v_email, v_phone, v_course.slug, v_title, 'hq_walk_in', left(p_note, 500), true,
                nullif(trim(coalesce(p_location, '')), ''), 'registered');
        v_created := true;
    ELSE
        IF v_email IS NULL THEN
            SELECT coalesce(nullif(lower(r.email), ''), 'tel:' || r.phone) INTO v_key
              FROM public.staff_registrations r WHERE r.phone = v_phone LIMIT 1;
            v_key := coalesce(v_key, 'tel:' || v_phone);
        END IF;
    END IF;

    PERFORM public.admin_hq_enrol(v_key, trim(p_name), v_email, v_phone, v_course.slug, p_fee, p_paid, p_start, p_intake, p_note, 'walk_in');

    FOREACH v_lesson IN ARRAY coalesce(p_lessons, '{}'::int[]) LOOP
        IF v_lesson BETWEEN 1 AND v_course.lessons_count THEN
            PERFORM public.admin_set_hq_attendance(v_key, trim(p_name), v_email, v_phone, v_lesson, 'present', p_date, v_course.slug, NULL);
        END IF;
    END LOOP;

    IF p_enquiry_id IS NOT NULL THEN
        UPDATE public.hq_enquiries SET outcome = 'registered', converted_key = v_key, updated_at = now() WHERE id = p_enquiry_id;
    END IF;

    RETURN jsonb_build_object('ok', true, 'key', v_key, 'created', v_created, 'already_registered', v_exists, 'course', v_course.slug);
END $$;

-- ---------------------------------------------------------------------------
-- 9. Consult log functions
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_log_enquiry(
    p_name TEXT, p_phone TEXT, p_email TEXT, p_channel TEXT, p_topic TEXT, p_course_slug TEXT, p_course_text TEXT,
    p_outcome TEXT, p_follow_up_on DATE, p_notes TEXT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_id UUID;
BEGIN
    IF NOT public._can_manage_physical_attendance() THEN RAISE EXCEPTION 'not authorized'; END IF;
    INSERT INTO public.hq_enquiries (visitor_name, phone, email, channel, topic, course_slug, course_text, outcome, follow_up_on, notes)
    VALUES (nullif(left(trim(coalesce(p_name, '')), 120), ''), nullif(trim(coalesce(p_phone, '')), ''), nullif(lower(trim(coalesce(p_email, ''))), ''),
            coalesce(nullif(p_channel, ''), 'walk_in'), coalesce(nullif(p_topic, ''), 'course_info'),
            nullif(p_course_slug, ''), nullif(left(trim(coalesce(p_course_text, '')), 120), ''),
            coalesce(nullif(p_outcome, ''), 'answered'), p_follow_up_on, nullif(left(trim(coalesce(p_notes, '')), 1000), ''))
    RETURNING id INTO v_id;
    RETURN jsonb_build_object('ok', true, 'id', v_id);
END $$;

CREATE OR REPLACE FUNCTION public.admin_hq_enquiries(p_limit INT DEFAULT 500)
RETURNS TABLE (id UUID, visited_at TIMESTAMPTZ, visitor_name TEXT, phone TEXT, email TEXT, channel TEXT, topic TEXT, course_slug TEXT, course_text TEXT,
               outcome TEXT, follow_up_on DATE, notes TEXT, converted_key TEXT, handler_name TEXT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NOT public._can_manage_physical_attendance() THEN RAISE EXCEPTION 'not authorized'; END IF;
    RETURN QUERY
        SELECT q.id, q.visited_at, q.visitor_name, q.phone, q.email, q.channel, q.topic, q.course_slug, q.course_text, q.outcome, q.follow_up_on, q.notes,
               q.converted_key, coalesce(nullif(trim(p.full_name), ''), split_part(coalesce(u.email, ''), '@', 1))
          FROM public.hq_enquiries q
          LEFT JOIN public.profiles p ON p.id = q.handled_by
          LEFT JOIN auth.users u ON u.id = q.handled_by
         ORDER BY q.visited_at DESC
         LIMIT greatest(1, least(coalesce(p_limit, 500), 3000));
END $$;

CREATE OR REPLACE FUNCTION public.admin_update_enquiry(p_id UUID, p_patch JSONB)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NOT public._can_manage_physical_attendance() THEN RAISE EXCEPTION 'not authorized'; END IF;
    IF p_patch ? 'outcome' AND (p_patch->>'outcome') NOT IN ('answered', 'thinking', 'follow_up', 'registered', 'not_interested') THEN RAISE EXCEPTION 'unknown outcome'; END IF;
    UPDATE public.hq_enquiries SET
        outcome = coalesce(p_patch->>'outcome', outcome),
        follow_up_on = CASE WHEN p_patch ? 'follow_up_on' THEN nullif(p_patch->>'follow_up_on', '')::date ELSE follow_up_on END,
        notes = CASE WHEN p_patch ? 'notes' THEN nullif(left(trim(p_patch->>'notes'), 1000), '') ELSE notes END,
        converted_key = CASE WHEN p_patch ? 'converted_key' THEN nullif(p_patch->>'converted_key', '') ELSE converted_key END,
        updated_at = now()
     WHERE id = p_id;
    RETURN jsonb_build_object('ok', true);
END $$;

-- ---------------------------------------------------------------------------
-- 10. Permissions
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.admin_hq_attendance_sheet(TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_hq_attendance(TEXT, TEXT, TEXT, TEXT, INT, TEXT, DATE, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_hq_courses() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_hq_save_course(TEXT, TEXT, INT, BOOLEAN, INT, BOOLEAN) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_hq_enrolments(TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_hq_enrol(TEXT, TEXT, TEXT, TEXT, TEXT, INT, INT, DATE, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_hq_update_enrolment(TEXT, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_hq_set_exam(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INT, DATE) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_hq_graduate(TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, DATE, BOOLEAN) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_register_walk_in(TEXT, TEXT, TEXT, TEXT, INT[], DATE, TEXT, TEXT, INT, INT, DATE, TEXT, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_log_enquiry(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, DATE, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_hq_enquiries(INT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_update_enquiry(UUID, JSONB) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.admin_hq_attendance_sheet(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_hq_attendance(TEXT, TEXT, TEXT, TEXT, INT, TEXT, DATE, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_hq_courses() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_hq_save_course(TEXT, TEXT, INT, BOOLEAN, INT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_hq_enrolments(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_hq_enrol(TEXT, TEXT, TEXT, TEXT, TEXT, INT, INT, DATE, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_hq_update_enrolment(TEXT, TEXT, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_hq_set_exam(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INT, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_hq_graduate(TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, DATE, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_register_walk_in(TEXT, TEXT, TEXT, TEXT, INT[], DATE, TEXT, TEXT, INT, INT, DATE, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_log_enquiry(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, DATE, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_hq_enquiries(INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_enquiry(UUID, JSONB) TO authenticated;

NOTIFY pgrst, 'reload schema';
