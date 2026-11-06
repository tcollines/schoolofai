-- Migration: Official Welile School of AI Student Registration, Study Schedule & Payment Agreement Form
-- Location: Katabi, Entebbe, Uganda

CREATE TABLE IF NOT EXISTS public.outreach_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
    name TEXT NOT NULL UNIQUE,
    event_date DATE,
    location TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    is_default BOOLEAN DEFAULT false NOT NULL
);

INSERT INTO public.outreach_campaigns (name, event_date, location, is_active, is_default)
VALUES
    ('Nkumba University Outreach (Fri, 6th Nov 2026)', '2026-11-06', 'Nkumba University, Entebbe', true, true),
    ('General / Website Registration', NULL, 'Online / Direct', true, false),
    ('Katabi Campus Walk-in (Entebbe)', NULL, 'Katabi, Entebbe', true, false)
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.outreach_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
    registration_date DATE DEFAULT CURRENT_DATE,
    student_reg_no TEXT,               -- e.g. 'WSI/11/26/001'

    -- 1. STUDENT INFORMATION
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    class_level_year TEXT,             -- e.g. 'University - Year 2', 'Working Professional', 'High School'
    age_range TEXT,                    -- 'Under 18', '18-24', '25-34', '35+'
    guardian_name TEXT,                -- Parent / Guardian Name (if applicable)
    guardian_phone TEXT,               -- Parent / Guardian Contact
    location TEXT,                     -- City / Area / Campus

    -- 2. COURSE & PROGRAMME INFORMATION
    course_interest TEXT NOT NULL,     -- Course / Programme
    level TEXT,                        -- Beginner / Intermediate / Advanced
    mode_preference TEXT,              -- Physical / Online / Hybrid
    expected_start_date DATE,
    expected_completion_date DATE,

    -- 3. STUDY SCHEDULE
    preferred_study_days TEXT[],       -- Mon..Sun
    preferred_time_slot TEXT,          -- Chosen Study Time (From - To)
    study_hours_per_session TEXT,      -- e.g. '2 Hours'
    sessions_per_week TEXT,            -- e.g. '3 Sessions / Week'
    alternative_study_time TEXT,

    -- 4. FEES & PAYMENT AGREEMENT
    total_course_fee NUMERIC DEFAULT 600000,
    registration_fee TEXT DEFAULT 'Not Applicable',
    amount_paid NUMERIC DEFAULT 0,
    outstanding_balance NUMERIC DEFAULT 600000,
    payment_plan TEXT DEFAULT 'Monthly', -- Full / Weekly / Monthly / Other
    agreed_payment_amount NUMERIC DEFAULT 200000,
    next_payment_date DATE,
    payment_due_date DATE,
    payment_method TEXT DEFAULT 'Mobile Money', -- Cash / Mobile Money / Bank / Other
    payment_reference TEXT,

    -- 5, 6, 7. COMMITMENT, DECLARATION & SIGNATURES
    commitments_accepted BOOLEAN DEFAULT true NOT NULL,
    student_signature TEXT,
    student_declaration_date DATE DEFAULT CURRENT_DATE,
    guardian_signature TEXT,
    guardian_consent_date DATE,
    consent_contact BOOLEAN DEFAULT true NOT NULL,

    -- OUTREACH ATTRIBUTION & STAFF AUDIT
    how_heard TEXT DEFAULT 'Outreach Event',
    outreach_event TEXT DEFAULT 'Nkumba University Outreach (Fri, 6th Nov 2026)',
    registered_by_staff TEXT DEFAULT 'Self-Registered (Student)',
    registered_by_staff_id TEXT DEFAULT 'self',
    registered_by_role TEXT DEFAULT 'Student',
    registration_mode TEXT DEFAULT 'Staff Assisted (Booth/Field)',
    device_audit_id TEXT,
    device_info TEXT,
    audit_trail JSONB DEFAULT '[]'::jsonb,

    -- 8. SCHOOL / ADMINISTRATION USE ONLY
    status TEXT DEFAULT 'NEW' NOT NULL,  -- NEW | CONTACTED | ENROLLED | NOT_INTERESTED
    approved_by TEXT,
    approver_position TEXT,
    assigned_instructor TEXT,
    confirmed_schedule TEXT,
    admin_payment_status TEXT DEFAULT 'Pending', -- Fully Paid | Partially Paid | Payment Plan | Pending
    admin_signature_date TEXT,
    admin_notes TEXT,
    converted_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    submitted_from TEXT DEFAULT 'web',
    form_metadata JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE public.outreach_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view outreach campaigns" ON public.outreach_campaigns;
CREATE POLICY "Anyone can view outreach campaigns"
ON public.outreach_campaigns FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage outreach campaigns" ON public.outreach_campaigns;
CREATE POLICY "Admins can manage outreach campaigns"
ON public.outreach_campaigns FOR ALL USING (true) WITH CHECK (true);

-- Public (anon) can INSERT only
DROP POLICY IF EXISTS "Anyone can submit an outreach registration" ON public.outreach_registrations;
CREATE POLICY "Anyone can submit an outreach registration"
ON public.outreach_registrations FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view outreach registrations" ON public.outreach_registrations;
CREATE POLICY "Admins can view outreach registrations"
ON public.outreach_registrations FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admins can update outreach registrations" ON public.outreach_registrations;
CREATE POLICY "Admins can update outreach registrations"
ON public.outreach_registrations FOR UPDATE
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can delete outreach registrations" ON public.outreach_registrations;
CREATE POLICY "Admins can delete outreach registrations"
ON public.outreach_registrations FOR DELETE
USING (true);

CREATE INDEX IF NOT EXISTS idx_outreach_status ON public.outreach_registrations(status);
CREATE INDEX IF NOT EXISTS idx_outreach_created ON public.outreach_registrations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_outreach_event ON public.outreach_registrations(outreach_event);

NOTIFY pgrst, 'reload schema';
