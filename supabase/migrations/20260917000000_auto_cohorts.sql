-- Function to automatically assign a cohort and generate sessions upon enrollment
CREATE OR REPLACE FUNCTION handle_new_enrollment_cohort()
RETURNS TRIGGER AS $$
DECLARE
    v_cohort_id UUID;
    v_course_id UUID;
    v_cohort_count INT;
    v_module RECORD;
    v_module_index INT := 0;
    v_session_date TIMESTAMP WITH TIME ZONE;
BEGIN
    v_course_id := NEW.course_id;

    -- Look for a cohort for this course that started in the last 7 days
    SELECT id INTO v_cohort_id
    FROM public.cohorts
    WHERE course_id = v_course_id
      AND start_date >= CURRENT_DATE - INTERVAL '7 days'
      AND start_date <= CURRENT_DATE
    ORDER BY start_date DESC
    LIMIT 1;

    -- If no recent cohort exists, create a new one
    IF v_cohort_id IS NULL THEN
        -- Generate a name like "Cohort <Month> <Year>" or just "Cohort <Count>"
        SELECT COUNT(*) INTO v_cohort_count FROM public.cohorts WHERE course_id = v_course_id;
        
        INSERT INTO public.cohorts (course_id, name, start_date, orientation_end_date)
        VALUES (
            v_course_id,
            'Cohort ' || (v_cohort_count + 1),
            CURRENT_DATE,
            CURRENT_DATE + 3
        ) RETURNING id INTO v_cohort_id;

        -- Generate sessions for this new cohort (one session every 7 days per module)
        FOR v_module IN (SELECT id FROM public.modules WHERE course_id = v_course_id ORDER BY created_at ASC) LOOP
            v_session_date := CURRENT_DATE + (v_module_index * 7 + 7) * INTERVAL '1 day';
            -- Set default time to 9 AM UTC
            v_session_date := date_trunc('day', v_session_date) + INTERVAL '9 hours';

            INSERT INTO public.cohort_sessions (cohort_id, module_id, session_date, attendance_code)
            VALUES (
                v_cohort_id,
                v_module.id,
                v_session_date,
                UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6))
            );

            v_module_index := v_module_index + 1;
        END LOOP;
    END IF;

    -- Update the enrollment with the cohort_id
    UPDATE public.enrollments
    SET cohort_id = v_cohort_id
    WHERE id = NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_enrollment_create_cohort ON public.enrollments;
CREATE TRIGGER on_enrollment_create_cohort
AFTER INSERT ON public.enrollments
FOR EACH ROW
EXECUTE FUNCTION handle_new_enrollment_cohort();
