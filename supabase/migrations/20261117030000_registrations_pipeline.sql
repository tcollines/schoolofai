-- =============================================================================
-- Every registration counts, with or without an account; one pipeline for follow-up.
--   leads                  : captured the moment someone submits a sign-up form (before any email is confirmed)
--   register_lead          : public, validated, idempotent
--   registration_followups : Welile team's follow-up status + note per person
--   admin_registration_pipeline : everyone from leads, agent registrations, outreach and enrolments, merged by email/phone
-- Additive only.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    full_name TEXT,
    email TEXT NOT NULL,
    phone TEXT,
    location TEXT,
    course_slug TEXT,
    course_title TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'website',
    staff_id UUID REFERENCES public.staff_members(id) ON DELETE SET NULL,
    consent BOOLEAN NOT NULL DEFAULT true,
    email_opt_in BOOLEAN NOT NULL DEFAULT true
);
CREATE UNIQUE INDEX IF NOT EXISTS leads_email_course ON public.leads (email, course_title);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.leads FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.register_lead(
    p_name TEXT, p_email TEXT, p_phone TEXT DEFAULT NULL, p_location TEXT DEFAULT NULL,
    p_course_slug TEXT DEFAULT NULL, p_course_title TEXT DEFAULT NULL, p_source TEXT DEFAULT 'website',
    p_ref TEXT DEFAULT NULL, p_consent BOOLEAN DEFAULT true, p_email_opt_in BOOLEAN DEFAULT true
) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_email TEXT := lower(trim(coalesce(p_email, ''))); v_phone TEXT := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'); v_staff UUID;
BEGIN
    IF v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' OR length(v_email) > 254 THEN RETURN FALSE; END IF;
    IF v_phone LIKE '0%' AND length(v_phone) = 10 THEN v_phone := '256' || substr(v_phone, 2); END IF;
    IF length(v_phone) > 15 THEN v_phone := NULL; END IF;
    IF p_ref IS NOT NULL AND length(trim(p_ref)) > 0 THEN v_staff := public.resolve_staff_ref(p_ref); END IF;
    INSERT INTO public.leads (full_name, email, phone, location, course_slug, course_title, source, staff_id, consent, email_opt_in)
    VALUES (left(nullif(trim(coalesce(p_name, '')), ''), 120), v_email, nullif(v_phone, ''), left(nullif(trim(coalesce(p_location, '')), ''), 120),
            nullif(p_course_slug, ''), left(coalesce(nullif(trim(p_course_title), ''), 'General sign-up'), 120), left(coalesce(p_source, 'website'), 40), v_staff,
            coalesce(p_consent, true), coalesce(p_email_opt_in, true))
    ON CONFLICT (email, course_title) DO UPDATE SET
        full_name = coalesce(public.leads.full_name, EXCLUDED.full_name), phone = coalesce(public.leads.phone, EXCLUDED.phone),
        location = coalesce(public.leads.location, EXCLUDED.location), staff_id = coalesce(public.leads.staff_id, EXCLUDED.staff_id),
        email_opt_in = EXCLUDED.email_opt_in;
    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN RETURN FALSE;
END $$;
GRANT EXECUTE ON FUNCTION public.register_lead(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN) TO anon, authenticated;

CREATE TABLE IF NOT EXISTS public.registration_followups (
    key TEXT PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'interested', 'converted', 'not_interested')),
    note TEXT,
    updated_by UUID,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.registration_followups ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.registration_followups FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_followup(p_key TEXT, p_status TEXT, p_note TEXT DEFAULT NULL)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
    INSERT INTO public.registration_followups (key, status, note, updated_by, updated_at)
    VALUES (left(p_key, 300), p_status, left(p_note, 1000), auth.uid(), now())
    ON CONFLICT (key) DO UPDATE SET status = EXCLUDED.status, note = EXCLUDED.note, updated_by = auth.uid(), updated_at = now();
    RETURN TRUE;
END $$;
GRANT EXECUTE ON FUNCTION public.admin_set_followup(TEXT, TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_registration_pipeline(p_course TEXT DEFAULT 'ai-fundamentals')
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
    RETURN coalesce((
        WITH raw AS (
            SELECT l.email, l.phone, l.full_name AS name, l.location,
                   CASE l.source WHEN 'agent_link' THEN 'Agent link' WHEN 'website' THEN 'Website' ELSE initcap(replace(l.source, '_', ' ')) END AS source,
                   s.display_name AS agent, l.created_at AS at
              FROM public.leads l LEFT JOIN public.staff_members s ON s.id = l.staff_id WHERE l.course_slug = p_course
            UNION ALL
            SELECT lower(r.email), r.phone, r.full_name, r.location, 'Agent registered', s.display_name, r.created_at
              FROM public.staff_registrations r JOIN public.staff_members s ON s.id = r.registered_by_staff_id WHERE r.course_slug = p_course
            UNION ALL
            SELECT i.email, nullif(regexp_replace(coalesce(i.phone, ''), '\D', '', 'g'), ''), i.full_name, NULL, 'Outreach', NULL, i.created_at
              FROM public.outreach_free_course_invites i WHERE p_course = 'ai-fundamentals'
            UNION ALL
            SELECT lower(u.email), nullif(regexp_replace(coalesce(pr.phone, ''), '\D', '', 'g'), ''), pr.full_name, pr.location,
                   CASE WHEN st.id IS NOT NULL THEN 'Agent link' ELSE coalesce(initcap(replace(e.source, '_', ' ')), 'Website') END,
                   st.display_name, e.enrolled_at
              FROM public.learn_enrollments e JOIN auth.users u ON u.id = e.user_id
              LEFT JOIN public.profiles pr ON pr.id = e.user_id
              LEFT JOIN public.staff_members st ON st.id = coalesce(pr.registered_by_staff_id, pr.referred_by_staff_id)
             WHERE e.course_slug = p_course
        ), grouped AS (
            SELECT coalesce(email, 'tel:' || phone) AS key, max(email) AS email,
                   (array_agg(phone) FILTER (WHERE phone IS NOT NULL))[1] AS phone,
                   (array_agg(name ORDER BY at) FILTER (WHERE coalesce(name, '') <> ''))[1] AS name,
                   (array_agg(location) FILTER (WHERE coalesce(location, '') <> ''))[1] AS location,
                   array_agg(DISTINCT source) AS sources,
                   (array_agg(agent) FILTER (WHERE agent IS NOT NULL))[1] AS agent,
                   min(at) AS registered_at
              FROM raw WHERE coalesce(email, phone) IS NOT NULL GROUP BY 1
        )
        SELECT jsonb_agg(row ORDER BY registered_at DESC) FROM (
            SELECT g.registered_at, jsonb_build_object(
                'key', g.key, 'name', coalesce(g.name, ''), 'email', g.email, 'phone', g.phone, 'location', g.location,
                'sources', to_jsonb(g.sources), 'agent', g.agent, 'registered_at', g.registered_at,
                'has_account', u.id IS NOT NULL,
                'stage', CASE
                    WHEN u.id IS NULL THEN 'Registered'
                    WHEN EXISTS (SELECT 1 FROM public.learn_certificates c WHERE c.user_id = u.id AND c.course_slug = p_course AND c.status = 'valid') THEN 'Completed'
                    WHEN EXISTS (SELECT 1 FROM public.learn_events v WHERE v.user_id = u.id AND v.event_type = 'live_joined') THEN 'Joined live'
                    WHEN EXISTS (SELECT 1 FROM public.learn_progress gp WHERE gp.user_id = u.id AND gp.course_slug = p_course) THEN 'Studying'
                    WHEN EXISTS (SELECT 1 FROM public.learn_enrollments en WHERE en.user_id = u.id AND en.course_slug = p_course) THEN 'In course'
                    ELSE 'Account opened' END,
                'last_active', (SELECT max(ev.created_at) FROM public.learn_events ev WHERE ev.user_id = u.id AND ev.course_slug = p_course),
                'followup', coalesce(f.status, 'new'), 'note', f.note, 'followup_at', f.updated_at
            ) AS row
              FROM grouped g
              LEFT JOIN auth.users u ON lower(u.email) = g.email
              LEFT JOIN public.registration_followups f ON f.key = g.key
             LIMIT 3000
        ) t
    ), '[]'::jsonb);
END $$;
GRANT EXECUTE ON FUNCTION public.admin_registration_pipeline(TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';
