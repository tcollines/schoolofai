-- Automatic account invitations for people an agent registered with an email.
-- Until now, registering someone with an email created no account and sent nothing, so the student never heard from us.
-- A scheduled job (GitHub Actions, every 30 minutes) asks registration_invites_due() who has no account and has not been
-- invited yet, emails them a link to open their account (credited to the agent), then records the result with
-- registration_invites_mark(). Nobody is emailed twice, failures retry up to 3 times, and a daily cap protects the sender.
-- Same secret check as the reminders and outreach invites (_reminder_secret_ok). ADDITIVE: one table and two functions.

CREATE TABLE IF NOT EXISTS public.registration_invites (
    email TEXT PRIMARY KEY CHECK (email = lower(email)),
    full_name TEXT,
    agent_staff_id UUID REFERENCES public.staff_members(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed')),
    attempts INT NOT NULL DEFAULT 0,
    source TEXT NOT NULL DEFAULT 'auto',
    first_sent_at TIMESTAMPTZ,
    last_attempt_at TIMESTAMPTZ,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.registration_invites ENABLE ROW LEVEL SECURITY;   -- deliberately no policies
REVOKE ALL ON public.registration_invites FROM PUBLIC, anon, authenticated;

-- People emailed by hand before this job existed were recorded directly in the database (source = 'manual') so the job
-- never repeats those emails. Their addresses are deliberately not listed here: this repository is public.

-- Who needs an invitation now: registered by an agent with an email and consent, no account, not yet invited.
CREATE OR REPLACE FUNCTION public.registration_invites_due(p_secret TEXT, p_limit INT DEFAULT 30)
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_cap INT := 150;                         -- most automatic invitations in any 24 hours (the sender account is shared)
    v_sent_24h INT;
    v_limit INT;
BEGIN
    IF NOT public._reminder_secret_ok(p_secret) THEN RAISE EXCEPTION 'not authorized'; END IF;
    SELECT count(*) INTO v_sent_24h FROM public.registration_invites WHERE first_sent_at > now() - interval '24 hours';
    v_limit := greatest(0, least(coalesce(p_limit, 30), 50, v_cap - v_sent_24h));
    IF v_limit = 0 THEN RETURN '[]'::jsonb; END IF;

    RETURN coalesce((
        SELECT jsonb_agg(x.j ORDER BY x.created_at) FROM (
            SELECT r.created_at, jsonb_build_object(
                'email', lower(trim(r.email)), 'name', r.full_name,
                'agent', s.display_name, 'slug', s.slug, 'staff_id', s.id) AS j
            FROM public.staff_registrations r
            JOIN public.staff_members s ON s.id = r.registered_by_staff_id
            WHERE r.email IS NOT NULL AND trim(r.email) ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
              AND r.consent_contact = true
              AND r.status <> 'lost'
              AND r.created_at < now() - interval '2 minutes'
              AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE lower(u.email) = lower(trim(r.email)))
              AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE lower(p.email) = lower(trim(r.email)))
              AND NOT EXISTS (
                  SELECT 1 FROM public.registration_invites i
                   WHERE i.email = lower(trim(r.email))
                     AND (i.status = 'sent' OR i.attempts >= 3 OR i.last_attempt_at > now() - interval '30 minutes'))
            ORDER BY r.created_at
            LIMIT v_limit
        ) x
    ), '[]'::jsonb);
END $$;

-- Record the outcome of each send. rows: [{"email":"..","name":"..","staff_id":"..","ok":true|false,"error":".."}]
CREATE OR REPLACE FUNCTION public.registration_invites_mark(p_secret TEXT, p_rows JSONB)
RETURNS INT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_row JSONB;
    v_n INT := 0;
BEGIN
    IF NOT public._reminder_secret_ok(p_secret) THEN RAISE EXCEPTION 'not authorized'; END IF;
    IF p_rows IS NULL OR jsonb_typeof(p_rows) <> 'array' THEN RETURN 0; END IF;
    FOR v_row IN SELECT * FROM jsonb_array_elements(p_rows) LOOP
        INSERT INTO public.registration_invites AS i (email, full_name, agent_staff_id, status, attempts, first_sent_at, last_attempt_at, last_error)
        VALUES (
            lower(trim(v_row->>'email')), left(v_row->>'name', 120), nullif(v_row->>'staff_id', '')::uuid,
            CASE WHEN (v_row->>'ok')::boolean THEN 'sent' ELSE 'failed' END, 1,
            CASE WHEN (v_row->>'ok')::boolean THEN now() ELSE NULL END, now(), left(v_row->>'error', 300))
        ON CONFLICT (email) DO UPDATE SET
            status = CASE WHEN (v_row->>'ok')::boolean THEN 'sent' ELSE i.status END,
            attempts = i.attempts + 1,
            first_sent_at = CASE WHEN (v_row->>'ok')::boolean THEN coalesce(i.first_sent_at, now()) ELSE i.first_sent_at END,
            last_attempt_at = now(),
            last_error = CASE WHEN (v_row->>'ok')::boolean THEN NULL ELSE left(v_row->>'error', 300) END;
        v_n := v_n + 1;
    END LOOP;
    RETURN v_n;
END $$;

REVOKE ALL ON FUNCTION public.registration_invites_due(TEXT, INT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.registration_invites_mark(TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.registration_invites_due(TEXT, INT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registration_invites_mark(TEXT, JSONB) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
