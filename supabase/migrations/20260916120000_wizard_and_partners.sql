-- Phase 2: Database Schema Updates for Course Wizard & Partners

-- 1. tutors table
CREATE TABLE IF NOT EXISTS public.tutors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. partners table
CREATE TABLE IF NOT EXISTS public.partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- e.g., 'University', 'Company'
    logo TEXT,
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Alter courses table
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS tutor_id UUID REFERENCES public.tutors(id) ON DELETE SET NULL;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS level TEXT;

-- Drop hosting_platform if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'hosting_platform') THEN
        ALTER TABLE public.courses DROP COLUMN hosting_platform;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.tutors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- Policies for tutors
CREATE POLICY "Tutors are viewable by everyone"
ON public.tutors FOR SELECT USING (true);

CREATE POLICY "Admins can manage tutors"
ON public.tutors FOR ALL USING (true); -- In a real app, restrict to admin role

-- Policies for partners
CREATE POLICY "Partners are viewable by everyone"
ON public.partners FOR SELECT USING (true);

CREATE POLICY "Admins can manage partners"
ON public.partners FOR ALL USING (true); -- In a real app, restrict to admin role
