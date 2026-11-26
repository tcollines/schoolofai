-- Physical (HQ) attendance for Fundamentals of AI.
-- The programme has 3 physical lessons; together they cover the same 6 modules taught online
-- (Lesson 1 = Modules 1-2, Lesson 2 = Modules 3-4, Lesson 3 = Modules 5-6).
-- Marks are per person and per lesson, and work for people with no email or account:
-- a mark stores the roster key plus the email and phone known at that moment, and screens match on any of the three.
-- ADDITIVE: one new table and three functions. Nothing existing is changed.

CREATE TABLE IF NOT EXISTS public.physical_lesson_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_slug TEXT NOT NULL DEFAULT 'ai-fundamentals',
    lesson_no SMALLINT NOT NULL CHECK (lesson_no BETWEEN 1 AND 3),
    person_key TEXT NOT NULL,
    person_name TEXT,
    email TEXT,
    phone TEXT,
    attended_on DATE NOT NULL DEFAULT ((now() AT TIME ZONE 'Africa/Kampala')::date),
    marked_by UUID DEFAULT auth.uid(),
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT physical_attendance_unique UNIQUE (course_slug, person_key, lesson_no)
);

CREATE INDEX IF NOT EXISTS idx_physical_att_course ON public.physical_lesson_attendance (course_slug, lesson_no);

ALTER TABLE public.physical_lesson_attendance ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.physical_lesson_attendance FROM PUBLIC, anon, authenticated;

-- Admins and supervisors may mark and read attendance (through these functions only).
CREATE OR REPLACE FUNCTION public._can_manage_physical_attendance() RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT public.is_admin() OR EXISTS (
        SELECT 1 FROM public.staff_members s
         WHERE s.user_id = auth.uid() AND s.active = true AND coalesce(s.can_supervise_agents, false) = true
    );
$$;

CREATE OR REPLACE FUNCTION public.admin_physical_attendance(p_course TEXT DEFAULT 'ai-fundamentals')
RETURNS TABLE (person_key TEXT, person_name TEXT, email TEXT, phone TEXT, lesson_no SMALLINT, attended_on DATE)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NOT public._can_manage_physical_attendance() THEN RAISE EXCEPTION 'not authorized'; END IF;
    RETURN QUERY
        SELECT a.person_key, a.person_name, a.email, a.phone, a.lesson_no, a.attended_on
          FROM public.physical_lesson_attendance a
         WHERE a.course_slug = p_course;
END $$;

-- Mark (or un-mark) one person for one lesson.
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
    ELSE
        DELETE FROM public.physical_lesson_attendance
         WHERE course_slug = p_course AND lesson_no = p_lesson
           AND (person_key = trim(p_person_key)
                OR (nullif(lower(trim(coalesce(p_email, ''))), '') IS NOT NULL AND email = lower(trim(p_email)))
                OR (nullif(trim(coalesce(p_phone, '')), '') IS NOT NULL AND phone = trim(p_phone)));
    END IF;
    RETURN jsonb_build_object('ok', true);
END $$;

REVOKE ALL ON FUNCTION public._can_manage_physical_attendance() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_physical_attendance(TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_physical_lesson(TEXT, TEXT, TEXT, TEXT, INT, BOOLEAN, DATE, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public._can_manage_physical_attendance() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_physical_attendance(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_physical_lesson(TEXT, TEXT, TEXT, TEXT, INT, BOOLEAN, DATE, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';
