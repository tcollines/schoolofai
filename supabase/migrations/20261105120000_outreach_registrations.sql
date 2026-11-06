-- Migration: Official Welile School of AI Student Registration, Study Schedule & Payment Agreement Form
-- Location: Katabi, Entebbe, Uganda

-- 1. OUTREACH CAMPAIGNS TABLE
CREATE TABLE IF NOT EXISTS public.outreach_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
    name TEXT NOT NULL UNIQUE,
    event_date DATE,
    location TEXT,
    category TEXT DEFAULT 'OUTREACH' NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    is_default BOOLEAN DEFAULT false NOT NULL
);

ALTER TABLE public.outreach_campaigns ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'OUTREACH';
ALTER TABLE public.outreach_campaigns ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.outreach_campaigns ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;

INSERT INTO public.outreach_campaigns (name, event_date, location, category, is_active, is_default)
VALUES
    ('Nkumba University Outreach (Fri, 6th Nov 2026)', '2026-11-06', 'Nkumba University, Entebbe', 'OUTREACH', true, true),
    ('General / Website Registration', '2026-11-05', 'Online / Direct Portal', 'GENERAL', true, false),
    ('Katabi Campus Walk-in (Entebbe)', '2026-11-05', 'Katabi, Entebbe Campus', 'GENERAL', true, false),
    ('Makerere Career Fair Nov 2026', '2026-11-14', 'Makerere University, Kampala', 'OUTREACH', true, false)
ON CONFLICT (name) DO UPDATE SET
    event_date = EXCLUDED.event_date,
    location = EXCLUDED.location,
    category = EXCLUDED.category;

-- 2. OUTREACH STAFF & MOBILIZERS ROSTER TABLE
CREATE TABLE IF NOT EXISTS public.outreach_staff (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
    name TEXT NOT NULL UNIQUE,
    staff_code TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Outreach Mobilizer',
    phone TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL
);

INSERT INTO public.outreach_staff (id, name, staff_code, role, phone, is_active)
VALUES
    ('stf-coo-timothy', 'Timothy Christian Waniaye', 'WSI-COO-001', 'COO', '0772000000', true),
    ('stf-001', 'Collines T.', 'WSI-STF-001', 'Outreach Team Lead', '0772000001', true),
    ('stf-002', 'Nkumba Mobilizer 1 (Booth Desk A)', 'WSI-STF-002', 'Outreach Mobilizer', '0772000002', true),
    ('stf-003', 'Nkumba Mobilizer 2 (Booth Desk B)', 'WSI-STF-003', 'Outreach Mobilizer', '0772000003', true),
    ('stf-004', 'Katabi Admissions Office', 'WSI-STF-004', 'Admissions Officer', '0700000004', true),
    ('stf-005', 'Welile Campus Ambassador', 'WSI-STF-005', 'Campus Mobilizer', '0750000005', true),
    ('stf-self', 'Self-Registered (Student Direct)', 'SELF-WEB', 'Student Self-Service', NULL, true)
ON CONFLICT (name) DO UPDATE SET
    role = EXCLUDED.role,
    staff_code = EXCLUDED.staff_code,
    is_active = EXCLUDED.is_active;

-- 3. OUTREACH REGISTRATIONS TABLE (ALL 8 SECTIONS + STAFF & DEVICE AUDIT)
CREATE TABLE IF NOT EXISTS public.outreach_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
    registration_date DATE DEFAULT CURRENT_DATE,
    student_reg_no TEXT,

    -- 1. STUDENT INFORMATION
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    class_level_year TEXT,
    age_range TEXT,
    guardian_name TEXT,
    guardian_phone TEXT,
    location TEXT,

    -- 2. COURSE & PROGRAMME INFORMATION
    course_interest TEXT NOT NULL,
    course_fee_usd NUMERIC DEFAULT 25,
    course_fee_display TEXT DEFAULT '$25 | 100,000 UGX per month',
    level TEXT DEFAULT 'Intermediate',
    mode_of_study_text TEXT,
    mode_preference TEXT DEFAULT 'Hybrid',
    expected_start_date DATE,
    expected_completion_date DATE,

    -- 3. STUDY SCHEDULE
    preferred_study_days TEXT[],
    preferred_time_slot TEXT,
    study_hours_per_session TEXT DEFAULT '2 Hours',
    sessions_per_week TEXT DEFAULT '3 Sessions / Week',
    alternative_study_time TEXT,

    -- 4. FEES & PAYMENT AGREEMENT
    total_course_fee NUMERIC DEFAULT 100000,
    registration_fee TEXT DEFAULT 'Not Applicable (Outreach Waiver)',
    amount_paid NUMERIC DEFAULT 0,
    outstanding_balance NUMERIC DEFAULT 100000,
    payment_plan TEXT DEFAULT 'Monthly',
    agreed_payment_amount NUMERIC DEFAULT 100000,
    next_payment_date DATE,
    payment_due_date DATE,
    payment_method TEXT DEFAULT 'Mobile Money',
    payment_reference TEXT,

    -- 5, 6, 7. COMMITMENT, DECLARATION & SIGNATURES
    commitments_accepted BOOLEAN DEFAULT true NOT NULL,
    commitments_list TEXT[],
    student_signature TEXT,
    student_declaration_date DATE DEFAULT CURRENT_DATE,
    guardian_signature TEXT,
    guardian_consent_date DATE,
    consent_contact BOOLEAN DEFAULT true NOT NULL,

    -- OUTREACH ATTRIBUTION & STAFF AUDIT
    how_heard TEXT DEFAULT 'Outreach Event',
    outreach_event TEXT DEFAULT 'Nkumba University Outreach (Fri, 6th Nov 2026)',
    registered_by_staff TEXT DEFAULT 'Timothy Christian Waniaye',
    registered_by_staff_id TEXT DEFAULT 'stf-coo-timothy',
    registered_by_role TEXT DEFAULT 'COO',
    registration_mode TEXT DEFAULT 'Staff Assisted (Booth/Field)',
    device_audit_id TEXT,
    device_info TEXT,
    audit_trail JSONB DEFAULT '[]'::jsonb,

    -- 8. SCHOOL / ADMINISTRATION USE ONLY
    status TEXT DEFAULT 'NEW' NOT NULL,
    approved_by TEXT,
    approver_position TEXT,
    assigned_instructor TEXT,
    confirmed_schedule TEXT,
    admin_payment_status TEXT DEFAULT 'Pending',
    admin_signature_date TEXT,
    admin_remarks TEXT,
    admin_notes TEXT,
    converted_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    submitted_from TEXT DEFAULT 'web',
    form_metadata JSONB DEFAULT '{}'::jsonb
);

-- Ensure all columns exist if table was created earlier with fewer columns
ALTER TABLE public.outreach_registrations ADD COLUMN IF NOT EXISTS registration_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.outreach_registrations ADD COLUMN IF NOT EXISTS student_reg_no TEXT;
ALTER TABLE public.outreach_registrations ADD COLUMN IF NOT EXISTS class_level_year TEXT;
ALTER TABLE public.outreach_registrations ADD COLUMN IF NOT EXISTS course_fee_usd NUMERIC DEFAULT 25;
ALTER TABLE public.outreach_registrations ADD COLUMN IF NOT EXISTS course_fee_display TEXT DEFAULT '$25 | 100,000 UGX per month';
ALTER TABLE public.outreach_registrations ADD COLUMN IF NOT EXISTS mode_of_study_text TEXT;
ALTER TABLE public.outreach_registrations ADD COLUMN IF NOT EXISTS expected_start_date DATE;
ALTER TABLE public.outreach_registrations ADD COLUMN IF NOT EXISTS expected_completion_date DATE;
ALTER TABLE public.outreach_registrations ADD COLUMN IF NOT EXISTS study_hours_per_session TEXT DEFAULT '2 Hours';
ALTER TABLE public.outreach_registrations ADD COLUMN IF NOT EXISTS sessions_per_week TEXT DEFAULT '3 Sessions / Week';
ALTER TABLE public.outreach_registrations ADD COLUMN IF NOT EXISTS alternative_study_time TEXT;
ALTER TABLE public.outreach_registrations ADD COLUMN IF NOT EXISTS total_course_fee NUMERIC DEFAULT 100000;
ALTER TABLE public.outreach_registrations ADD COLUMN IF NOT EXISTS registration_fee TEXT DEFAULT 'Not Applicable (Outreach Waiver)';
ALTER TABLE public.outreach_registrations ADD COLUMN IF NOT EXISTS amount_paid NUMERIC DEFAULT 0;
ALTER TABLE public.outreach_registrations ADD COLUMN IF NOT EXISTS outstanding_balance NUMERIC DEFAULT 100000;
ALTER TABLE public.outreach_registrations ADD COLUMN IF NOT EXISTS payment_plan TEXT DEFAULT 'Monthly';
ALTER TABLE public.outreach_registrations ADD COLUMN IF NOT EXISTS agreed_payment_amount NUMERIC DEFAULT 100000;
ALTER TABLE public.outreach_registrations ADD COLUMN IF NOT EXISTS next_payment_date DATE;
ALTER TABLE public.outreach_registrations ADD COLUMN IF NOT EXISTS payment_due_date DATE;
ALTER TABLE public.outreach_registrations ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'Mobile Money';
ALTER TABLE public.outreach_registrations ADD COLUMN IF NOT EXISTS payment_reference TEXT;
ALTER TABLE public.outreach_registrations ADD COLUMN IF NOT EXISTS commitments_accepted BOOLEAN DEFAULT true;
ALTER TABLE public.outreach_registrations ADD COLUMN IF NOT EXISTS commitments_list TEXT[];
ALTER TABLE public.outreach_registrations ADD COLUMN IF NOT EXISTS student_signature TEXT;
ALTER TABLE public.outreach_registrations ADD COLUMN IF NOT EXISTS student_declaration_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.outreach_registrations ADD COLUMN IF NOT EXISTS guardian_signature TEXT;
ALTER TABLE public.outreach_registrations ADD COLUMN IF NOT EXISTS guardian_consent_date DATE;
ALTER TABLE public.outreach_registrations ADD COLUMN IF NOT EXISTS registered_by_staff TEXT DEFAULT 'Timothy Christian Waniaye';
ALTER TABLE public.outreach_registrations ADD COLUMN IF NOT EXISTS registered_by_staff_id TEXT DEFAULT 'stf-coo-timothy';
ALTER TABLE public.outreach_registrations ADD COLUMN IF NOT EXISTS registered_by_role TEXT DEFAULT 'COO';
ALTER TABLE public.outreach_registrations ADD COLUMN IF NOT EXISTS registration_mode TEXT DEFAULT 'Staff Assisted (Booth/Field)';
ALTER TABLE public.outreach_registrations ADD COLUMN IF NOT EXISTS device_audit_id TEXT;
ALTER TABLE public.outreach_registrations ADD COLUMN IF NOT EXISTS device_info TEXT;
ALTER TABLE public.outreach_registrations ADD COLUMN IF NOT EXISTS audit_trail JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.outreach_registrations ADD COLUMN IF NOT EXISTS approved_by TEXT;
ALTER TABLE public.outreach_registrations ADD COLUMN IF NOT EXISTS approver_position TEXT;
ALTER TABLE public.outreach_registrations ADD COLUMN IF NOT EXISTS assigned_instructor TEXT;
ALTER TABLE public.outreach_registrations ADD COLUMN IF NOT EXISTS confirmed_schedule TEXT;
ALTER TABLE public.outreach_registrations ADD COLUMN IF NOT EXISTS admin_payment_status TEXT DEFAULT 'Pending';
ALTER TABLE public.outreach_registrations ADD COLUMN IF NOT EXISTS admin_signature_date TEXT;
ALTER TABLE public.outreach_registrations ADD COLUMN IF NOT EXISTS admin_remarks TEXT;
ALTER TABLE public.outreach_registrations ADD COLUMN IF NOT EXISTS form_metadata JSONB DEFAULT '{}'::jsonb;

-- Enable RLS & Policies
ALTER TABLE public.outreach_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view outreach campaigns" ON public.outreach_campaigns;
CREATE POLICY "Anyone can view outreach campaigns"
ON public.outreach_campaigns FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage outreach campaigns" ON public.outreach_campaigns;
CREATE POLICY "Admins can manage outreach campaigns"
ON public.outreach_campaigns FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view outreach staff" ON public.outreach_staff;
CREATE POLICY "Anyone can view outreach staff"
ON public.outreach_staff FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage outreach staff" ON public.outreach_staff;
CREATE POLICY "Admins can manage outreach staff"
ON public.outreach_staff FOR ALL USING (true) WITH CHECK (true);

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
CREATE INDEX IF NOT EXISTS idx_outreach_staff_name ON public.outreach_registrations(registered_by_staff);

NOTIFY pgrst, 'reload schema';
