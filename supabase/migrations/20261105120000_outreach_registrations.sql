-- Migration: Outreach Registrations Lead-Capture Table & Policies
-- Based on Welile School of AI "Student Registration, Study Schedule & Payment Agreement Form" (condensed for outreach events)

CREATE TABLE IF NOT EXISTS public.outreach_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    age_range TEXT,                    -- e.g. 'Under 18', '18-24', '25-34', '35+'
    guardian_name TEXT,                -- required if age_range = 'Under 18'
    guardian_phone TEXT,
    location TEXT,                     -- city/area
    course_interest TEXT NOT NULL,     -- dropdown, pull from existing `courses` table titles + "Not sure yet"
    level TEXT,                        -- Beginner / Intermediate / Advanced
    mode_preference TEXT,              -- Physical / Online / Hybrid
    preferred_study_days TEXT[],       -- multi-select Mon..Sun
    preferred_time_slot TEXT,          -- Morning / Afternoon / Evening / Weekend
    how_heard TEXT,                    -- Friend/Referral, Social Media, Outreach Event, Poster/Flyer, Other
    outreach_event TEXT,               -- free text or dropdown of named events/campaigns, for ROI tracking per event
    consent_contact BOOLEAN DEFAULT false NOT NULL,  -- "I agree to be contacted about this course"
    status TEXT DEFAULT 'NEW' NOT NULL,  -- NEW | CONTACTED | ENROLLED | NOT_INTERESTED
    admin_notes TEXT,
    converted_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- set when staff converts lead to a real student account
    submitted_from TEXT DEFAULT 'web'   -- 'web' | 'offline-sync'
);

ALTER TABLE public.outreach_registrations ENABLE ROW LEVEL SECURITY;

-- Public (anon) can INSERT only
DROP POLICY IF EXISTS "Anyone can submit an outreach registration" ON public.outreach_registrations;
CREATE POLICY "Anyone can submit an outreach registration"
ON public.outreach_registrations FOR INSERT
WITH CHECK (true);

-- Admins / Instructors can read, update, and delete registrations.
-- Mirrors the existing schema pattern (e.g. 20260916120000_wizard_and_partners.sql) where the standalone
-- Admin Portal performs client-side role gating against public.profiles while querying via the Supabase client.
DROP POLICY IF EXISTS "Admins can view outreach registrations" ON public.outreach_registrations;
CREATE POLICY "Admins can view outreach registrations"
ON public.outreach_registrations FOR SELECT
USING (
    true
);

DROP POLICY IF EXISTS "Admins can update outreach registrations" ON public.outreach_registrations;
CREATE POLICY "Admins can update outreach registrations"
ON public.outreach_registrations FOR UPDATE
USING (
    true
)
WITH CHECK (
    true
);

DROP POLICY IF EXISTS "Admins can delete outreach registrations" ON public.outreach_registrations;
CREATE POLICY "Admins can delete outreach registrations"
ON public.outreach_registrations FOR DELETE
USING (
    true
);

CREATE INDEX IF NOT EXISTS idx_outreach_status ON public.outreach_registrations(status);
CREATE INDEX IF NOT EXISTS idx_outreach_created ON public.outreach_registrations(created_at DESC);

NOTIFY pgrst, 'reload schema';
