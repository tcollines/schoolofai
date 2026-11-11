-- =============================================================================
-- Live-class reminders (email + WhatsApp)
--   * live_reminder_prefs : each learner's own reminder preferences
--   * live_reminder_log   : what was sent (admin read-only; written only via RPC)
--   * reminder_secret     : sha256 hash of the runner secret (no client access)
--   * reminders_due / reminders_mark_sent : called by the external sender
--     (GitHub Actions, anon key + secret). reminders_set_secret : admin only.
-- Idempotent and additive. Nothing here contains a real secret.
--
-- HOW TO SET THE RUNNER SECRET (once, and again to rotate):
--   1. Generate a long random value, e.g.  openssl rand -hex 32
--   2. As a signed-in ADMIN (SQL editor impersonating an admin, or the admin
--      portal console):  select public.reminders_set_secret('<that value>');
--   3. Store the same value as the REMINDER_SECRET GitHub Actions secret.
--   Only its sha256 hash is kept in the database. Until a secret is set,
--   reminders_due / reminders_mark_sent refuse every call.
-- =============================================================================

-- 1. Learner preferences ------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.live_reminder_prefs (
    user_id UUID PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    phone_e164 TEXT,
    whatsapp_opt_in BOOLEAN NOT NULL DEFAULT false,
    email_opt_in BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT lrp_phone_format CHECK (phone_e164 IS NULL OR phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
    CONSTRAINT lrp_whatsapp_needs_phone CHECK (NOT whatsapp_opt_in OR phone_e164 IS NOT NULL),
    CONSTRAINT lrp_email_format CHECK (email IS NULL OR (length(email) <= 254 AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'))
);

ALTER TABLE public.live_reminder_prefs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.live_reminder_prefs FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.live_reminder_prefs TO authenticated;

DROP POLICY IF EXISTS lrp_select_own ON public.live_reminder_prefs;
CREATE POLICY lrp_select_own ON public.live_reminder_prefs FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS lrp_insert_own ON public.live_reminder_prefs;
CREATE POLICY lrp_insert_own ON public.live_reminder_prefs FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS lrp_update_own ON public.live_reminder_prefs;
CREATE POLICY lrp_update_own ON public.live_reminder_prefs FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS lrp_admin ON public.live_reminder_prefs;
CREATE POLICY lrp_admin ON public.live_reminder_prefs FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.lrp_touch() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END $$;
DROP TRIGGER IF EXISTS lrp_touch ON public.live_reminder_prefs;
CREATE TRIGGER lrp_touch BEFORE UPDATE ON public.live_reminder_prefs FOR EACH ROW EXECUTE FUNCTION public.lrp_touch();

-- 2. Send log -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.live_reminder_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp')),
    kind TEXT NOT NULL CHECK (kind IN ('24h', '1h')),
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'skipped')),
    attempts INT NOT NULL DEFAULT 1,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT live_reminder_log_once UNIQUE (session_id, user_id, channel, kind)
);
CREATE INDEX IF NOT EXISTS live_reminder_log_session_idx ON public.live_reminder_log (session_id);

ALTER TABLE public.live_reminder_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.live_reminder_log FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.live_reminder_log TO authenticated;   -- rows still filtered by the admin-only policy
DROP POLICY IF EXISTS lrl_admin_select ON public.live_reminder_log;
CREATE POLICY lrl_admin_select ON public.live_reminder_log FOR SELECT USING (public.is_admin());

-- 3. Runner secret (hash only) ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reminder_secret (
    id BOOLEAN PRIMARY KEY DEFAULT true CHECK (id),
    secret_hash TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reminder_secret ENABLE ROW LEVEL SECURITY;      -- deliberately no policies
REVOKE ALL ON public.reminder_secret FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public._reminder_secret_ok(p_secret TEXT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    -- Compares sha256 digests (not the raw secrets), so timing reveals nothing useful.
    SELECT p_secret IS NOT NULL AND length(p_secret) >= 16 AND EXISTS (
        SELECT 1 FROM public.reminder_secret r
        WHERE r.id AND r.secret_hash = encode(sha256(convert_to(p_secret, 'UTF8')), 'hex')
    );
$$;
REVOKE ALL ON FUNCTION public._reminder_secret_ok(TEXT) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.reminders_set_secret(p_new TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
    IF p_new IS NULL OR length(p_new) < 16 THEN RAISE EXCEPTION 'secret must be at least 16 characters'; END IF;
    INSERT INTO public.reminder_secret (id, secret_hash, updated_at)
    VALUES (true, encode(sha256(convert_to(p_new, 'UTF8')), 'hex'), now())
    ON CONFLICT (id) DO UPDATE SET secret_hash = EXCLUDED.secret_hash, updated_at = now();
    RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.reminders_set_secret(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reminders_set_secret(TEXT) TO authenticated;

-- 4. Due reminders (called by the external sender) ----------------------------
-- Windows are deliberately generous because cron runs can be late; the unique
-- log row is what guarantees each reminder is sent once.
--   24h : session starts between 12h and 24h10m from now
--   1h  : session starts between now and 1h10m from now
CREATE OR REPLACE FUNCTION public.reminders_due(p_secret TEXT)
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE r JSONB;
BEGIN
    IF NOT public._reminder_secret_ok(p_secret) THEN RAISE EXCEPTION 'not authorized'; END IF;
    SELECT coalesce(jsonb_agg(x.row ORDER BY x.starts_at), '[]'::jsonb) INTO r
    FROM (
        SELECT s.starts_at,
               jsonb_build_object(
                   'session_id', s.id, 'user_id', l.user_id, 'channel', l.channel, 'kind', l.kind,
                   'title', s.title, 'description', s.description, 'host_name', s.host_name,
                   'starts_at', s.starts_at, 'ends_at', s.ends_at, 'join_link', s.meet_link,
                   'name', l.full_name,
                   'email', CASE WHEN l.channel = 'email' THEN l.email END,
                   'phone', CASE WHEN l.channel = 'whatsapp' THEN l.phone_e164 END
               ) AS row
        FROM public.live_sessions s
        CROSS JOIN LATERAL (VALUES
            ('24h', s.starts_at > now() + interval '12 hours' AND s.starts_at <= now() + interval '24 hours 10 minutes'),
            ('1h',  s.starts_at > now()                       AND s.starts_at <= now() + interval '1 hour 10 minutes')
        ) AS k(kind, in_window)
        JOIN public.learn_enrollments e ON e.course_slug = s.course_slug
        LEFT JOIN public.live_reminder_prefs pr ON pr.user_id = e.user_id
        LEFT JOIN public.profiles p ON p.id = e.user_id
        LEFT JOIN auth.users u ON u.id = e.user_id
        CROSS JOIN LATERAL (
            SELECT e.user_id AS user_id, k.kind AS kind, 'email'::text AS channel,
                   coalesce(nullif(pr.email, ''), nullif(p.email, ''), u.email::text) AS email,
                   NULL::text AS phone_e164, coalesce(p.full_name, '') AS full_name
            WHERE coalesce(pr.email_opt_in, true)
            UNION ALL
            SELECT e.user_id, k.kind, 'whatsapp', NULL, pr.phone_e164, coalesce(p.full_name, '')
            WHERE pr.whatsapp_opt_in AND pr.phone_e164 IS NOT NULL
        ) l
        WHERE s.is_published
          AND k.in_window
          AND (l.channel <> 'email' OR l.email IS NOT NULL)
          AND NOT EXISTS (
              SELECT 1 FROM public.live_reminder_log g
              WHERE g.session_id = s.id AND g.user_id = e.user_id AND g.channel = l.channel AND g.kind = k.kind
                AND (g.status IN ('sent', 'skipped') OR g.attempts >= 3)
          )
        ORDER BY s.starts_at, e.user_id
        LIMIT 500
    ) x;
    RETURN r;
END $$;

-- 5. Record outcomes ----------------------------------------------------------
-- p_rows: [{"session_id": uuid, "user_id": uuid, "channel": "email"|"whatsapp",
--           "kind": "24h"|"1h", "status": "sent"|"failed"|"skipped"}, ...]
-- Returns the number of rows recorded. A 'failed' row is retried (up to 3 attempts).
CREATE OR REPLACE FUNCTION public.reminders_mark_sent(p_secret TEXT, p_rows JSONB)
RETURNS INT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE n INT;
BEGIN
    IF NOT public._reminder_secret_ok(p_secret) THEN RAISE EXCEPTION 'not authorized'; END IF;
    IF p_rows IS NULL OR jsonb_typeof(p_rows) <> 'array' THEN RAISE EXCEPTION 'p_rows must be a JSON array'; END IF;
    IF jsonb_array_length(p_rows) > 1000 THEN RAISE EXCEPTION 'too many rows'; END IF;

    WITH incoming AS (
        SELECT DISTINCT ON (session_id, user_id, channel, kind) session_id, user_id, channel, kind, status
        FROM jsonb_to_recordset(p_rows) AS t(session_id UUID, user_id UUID, channel TEXT, kind TEXT, status TEXT)
        WHERE channel IN ('email', 'whatsapp') AND kind IN ('24h', '1h') AND status IN ('sent', 'failed', 'skipped')
    ), ins AS (
        INSERT INTO public.live_reminder_log AS g (session_id, user_id, channel, kind, status)
        SELECT i.session_id, i.user_id, i.channel, i.kind, i.status
        FROM incoming i
        WHERE EXISTS (SELECT 1 FROM public.live_sessions s WHERE s.id = i.session_id)
          AND EXISTS (SELECT 1 FROM auth.users u WHERE u.id = i.user_id)
        ON CONFLICT (session_id, user_id, channel, kind) DO UPDATE
            SET status = EXCLUDED.status, sent_at = now(), attempts = g.attempts + 1
            WHERE g.status = 'failed'          -- never overwrite a sent/skipped row
        RETURNING 1
    )
    SELECT count(*) INTO n FROM ins;
    RETURN n;
END $$;

-- 6. Admin status counts (one row per session/channel/kind/status) ------------
CREATE OR REPLACE FUNCTION public.reminders_status(p_course TEXT DEFAULT 'ai-fundamentals')
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
    RETURN coalesce((
        SELECT jsonb_agg(jsonb_build_object('session_id', g.session_id, 'channel', g.channel, 'kind', g.kind, 'status', g.status, 'n', g.n))
        FROM (
            SELECT l.session_id, l.channel, l.kind, l.status, count(*) AS n
            FROM public.live_reminder_log l
            JOIN public.live_sessions s ON s.id = l.session_id
            WHERE s.course_slug = p_course
            GROUP BY l.session_id, l.channel, l.kind, l.status
        ) g
    ), '[]'::jsonb);
END $$;

-- 7. Execute grants -----------------------------------------------------------
REVOKE ALL ON FUNCTION public.reminders_due(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reminders_mark_sent(TEXT, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reminders_status(TEXT) FROM PUBLIC, anon, authenticated;
-- The runner is anonymous but secret-gated (the secret is checked inside).
GRANT EXECUTE ON FUNCTION public.reminders_due(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reminders_mark_sent(TEXT, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reminders_status(TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';
