-- Phase 1: Database Schema Updates for Cohort-Based Architecture

-- 1. courses: Store overarching curriculum (id, title, description)
-- Assuming 'courses' table already exists with 'id', 'title', 'description'
-- We'll add any missing columns or just assume they exist.

-- 2. course_notes: Link directly to course_id for global access
CREATE TABLE IF NOT EXISTS public.course_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. modules: Add intro_video_url, course_outline (JSON list of topics), and quiz_id
-- Assuming 'modules' table exists (or was called 'course_modules' previously).
-- Let's alter the table. If 'modules' doesn't exist, this will need adjusting, but we'll use 'modules' based on the prompt.
ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS intro_video_url TEXT;
ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS course_outline JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS quiz_id UUID; -- Assuming a 'quizzes' table exists

-- 4. cohorts: Map to course_id. Includes id, name, start_date, and orientation_end_date
CREATE TABLE IF NOT EXISTS public.cohorts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    orientation_end_date DATE NOT NULL, -- typically start_date + 3 days
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. cohort_sessions: Link module_id to cohort_id. Includes session_date, location_link, attendance_code
CREATE TABLE IF NOT EXISTS public.cohort_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort_id UUID NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    session_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location_link TEXT,
    attendance_code VARCHAR(6) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(cohort_id, module_id)
);

-- 6. module_completions: Track student progress.
CREATE TABLE IF NOT EXISTS public.module_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    cohort_id UUID NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    attendance_code_submitted BOOLEAN DEFAULT false,
    quiz_passed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, module_id)
);

-- 7. enrollments: Bind user_id strictly to a cohort_id
-- Assuming 'enrollments' table exists, we add cohort_id.
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS cohort_id UUID REFERENCES public.cohorts(id) ON DELETE CASCADE;
-- (Note: You may want to drop the old course_id column eventually, or keep it for backward compatibility)

-- Enable RLS on new tables
ALTER TABLE public.course_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohort_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- course_notes: Enrolled students can read
CREATE POLICY "Enrolled students can view course notes"
ON public.course_notes FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.enrollments e
        JOIN public.cohorts c ON e.cohort_id = c.id
        WHERE e.user_id = auth.uid() AND c.course_id = course_notes.course_id
    )
);

-- cohorts: Anyone can view cohorts (for discovery/plans)
CREATE POLICY "Cohorts are viewable by everyone"
ON public.cohorts FOR SELECT USING (true);

-- cohort_sessions: Enrolled students can view their cohort's sessions
CREATE POLICY "Students can view their cohort sessions"
ON public.cohort_sessions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.enrollments e
        WHERE e.user_id = auth.uid() AND e.cohort_id = cohort_sessions.cohort_id
    )
);

-- module_completions: Students can view and update their own completions
CREATE POLICY "Students can view their own module completions"
ON public.module_completions FOR SELECT
USING (user_id = auth.uid());

-- RLS Update for community discussions (assuming table is 'discussions')
-- Add cohort_id if it doesn't exist
ALTER TABLE public.discussions ADD COLUMN IF NOT EXISTS cohort_id UUID REFERENCES public.cohorts(id) ON DELETE CASCADE;

-- Update discussion read/write policies to filter by cohort_id
-- (You may need to drop existing policies first, e.g., DROP POLICY IF EXISTS "..." ON discussions)
CREATE POLICY "Students can read discussions for their cohort"
ON public.discussions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.enrollments e
        WHERE e.user_id = auth.uid() AND e.cohort_id = discussions.cohort_id
    )
);

CREATE POLICY "Students can insert discussions for their cohort"
ON public.discussions FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.enrollments e
        WHERE e.user_id = auth.uid() AND e.cohort_id = discussions.cohort_id
    )
);

-- 8. Supabase RPC: Validate LIVELESSON attendance
CREATE OR REPLACE FUNCTION validate_livelesson_attendance(p_user_id UUID, p_module_id UUID, p_cohort_id UUID, p_code VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    v_actual_code VARCHAR;
    v_completion_id UUID;
BEGIN
    -- Get the actual code for the session
    SELECT attendance_code INTO v_actual_code
    FROM public.cohort_sessions
    WHERE cohort_id = p_cohort_id AND module_id = p_module_id;

    -- Compare codes (case-insensitive usually preferred, but strict here)
    IF v_actual_code = p_code THEN
        -- Check if completion record exists
        SELECT id INTO v_completion_id
        FROM public.module_completions
        WHERE user_id = p_user_id AND module_id = p_module_id;

        IF v_completion_id IS NULL THEN
            -- Insert new completion record
            INSERT INTO public.module_completions (user_id, cohort_id, module_id, attendance_code_submitted)
            VALUES (p_user_id, p_cohort_id, p_module_id, true);
        ELSE
            -- Update existing record
            UPDATE public.module_completions
            SET attendance_code_submitted = true
            WHERE id = v_completion_id;
        END IF;
        
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
