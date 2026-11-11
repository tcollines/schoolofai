-- ============================================================================
-- Free "AI Fundamentals" course — foundation (learning data, referrals, certificates, live sessions)
--
-- SAFETY: This migration is ADDITIVE ONLY.
--   * Creates new tables / functions.
--   * Adds NULLABLE columns to public.profiles (existing rows are left untouched, values stay NULL).
--   * Copies (SELECT) from public.outreach_staff into the NEW public.staff_members table.
--   * Never UPDATEs, DELETEs or rewrites any existing row.
-- It is idempotent: safe to run more than once. Test on a staging project first.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0. Helper: role checks (reads profiles, changes nothing)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND upper(coalesce(p.role, '')) = 'ADMIN'
    );
$$;

-- ---------------------------------------------------------------------------
-- 1. Staff members (login-capable staff; seeded from the existing outreach roster)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.staff_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    staff_code TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,               -- used in /r/<slug>
    display_name TEXT NOT NULL,
    role TEXT DEFAULT 'Staff',
    phone TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
    IF to_regclass('public.outreach_staff') IS NOT NULL THEN
        INSERT INTO public.staff_members (staff_code, slug, display_name, role, phone, active)
        SELECT s.staff_code, lower(s.staff_code), s.name, s.role, s.phone, s.is_active
        FROM public.outreach_staff s
        WHERE s.staff_code IS NOT NULL AND s.staff_code NOT LIKE 'SELF%'
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Attribution columns on profiles (nullable, additive)
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by_staff_id UUID REFERENCES public.staff_members(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_source TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS registered_by_staff_id UUID REFERENCES public.staff_members(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS signup_source TEXT;

-- ---------------------------------------------------------------------------
-- 3. Learning data
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.learn_enrollments (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_slug TEXT NOT NULL,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    source TEXT,
    referral_code TEXT,
    completed_at TIMESTAMPTZ,
    PRIMARY KEY (user_id, course_slug)
);

CREATE TABLE IF NOT EXISTS public.learn_progress (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_slug TEXT NOT NULL,
    item_id TEXT NOT NULL,
    module_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
    seconds_watched INT NOT NULL DEFAULT 0,
    last_position INT NOT NULL DEFAULT 0,
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, course_slug, item_id)
);

CREATE TABLE IF NOT EXISTS public.learn_quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_slug TEXT NOT NULL,
    quiz_id TEXT NOT NULL,               -- 'm1-quiz' ... 'final'
    score INT NOT NULL,
    total INT NOT NULL,
    percentage INT NOT NULL,
    passed BOOLEAN NOT NULL,
    answers JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.learn_events (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_slug TEXT NOT NULL,
    event_type TEXT NOT NULL,            -- lesson_started | lesson_completed | quiz_submitted | live_joined | ...
    item_id TEXT,
    payload JSONB,
    device TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.learn_course_requirements (
    course_slug TEXT PRIMARY KEY,
    course_title TEXT NOT NULL,
    required_item_ids TEXT[] NOT NULL
);

CREATE TABLE IF NOT EXISTS public.learn_certificates (
    id TEXT PRIMARY KEY,                 -- e.g. WSAI-FUND-2026-9F3A12BC
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_slug TEXT NOT NULL,
    course_title TEXT NOT NULL,
    name_on_certificate TEXT NOT NULL,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'valid' CHECK (status IN ('valid', 'revoked')),
    UNIQUE (user_id, course_slug)
);

CREATE TABLE IF NOT EXISTS public.learn_ratings (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_slug TEXT NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, course_slug)
);

CREATE TABLE IF NOT EXISTS public.live_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_slug TEXT NOT NULL,
    module_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    host_name TEXT,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    meet_link TEXT,
    recording_url TEXT,
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.referral_clicks (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    staff_id UUID REFERENCES public.staff_members(id) ON DELETE SET NULL,
    ref_code TEXT NOT NULL,
    landing TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_learn_progress_user ON public.learn_progress(user_id, course_slug);
CREATE INDEX IF NOT EXISTS idx_learn_attempts_user ON public.learn_quiz_attempts(user_id, quiz_id);
CREATE INDEX IF NOT EXISTS idx_learn_events_course ON public.learn_events(course_slug, event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_referral_clicks_staff ON public.referral_clicks(staff_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON public.profiles(referred_by_staff_id);

-- ---------------------------------------------------------------------------
-- 4. Required items for the certificate (course "ai-fundamentals")
-- ---------------------------------------------------------------------------
INSERT INTO public.learn_course_requirements (course_slug, course_title, required_item_ids)
VALUES (
    'ai-fundamentals',
    'AI Fundamentals: Use AI with Confidence',
    ARRAY[
        'm0-l1','m0-guide',
        'm1-l1','m1-l2','m1-l3','m1-l4','m1-l5','m1-recap','m1-quiz',
        'm2-l1','m2-l2','m2-l3','m2-l4','m2-recap','m2-quiz',
        'm3-l1','m3-l2','m3-l3','m3-l4','m3-l5','m3-recap','m3-quiz',
        'm4-l1','m4-l2','m4-l3','m4-recap','m4-quiz',
        'm5-l1','m5-l2','m5-l3','m5-l4','m5-recap','m5-quiz',
        'm6-l1','m6-l2','m6-recap','m6-quiz',
        'final'
    ]
)
ON CONFLICT (course_slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 5. Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE public.staff_members            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learn_enrollments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learn_progress           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learn_quiz_attempts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learn_events             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learn_course_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learn_certificates       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learn_ratings            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_sessions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_clicks          ENABLE ROW LEVEL SECURITY;

-- staff_members: staff see their own row; admins see/manage all
DROP POLICY IF EXISTS staff_select_own ON public.staff_members;
CREATE POLICY staff_select_own ON public.staff_members FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS staff_admin_write ON public.staff_members;
CREATE POLICY staff_admin_write ON public.staff_members FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- learner-owned tables
DROP POLICY IF EXISTS le_select ON public.learn_enrollments;
CREATE POLICY le_select ON public.learn_enrollments FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS le_insert ON public.learn_enrollments;
CREATE POLICY le_insert ON public.learn_enrollments FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS le_update ON public.learn_enrollments;
CREATE POLICY le_update ON public.learn_enrollments FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS lp_select ON public.learn_progress;
CREATE POLICY lp_select ON public.learn_progress FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS lp_insert ON public.learn_progress;
CREATE POLICY lp_insert ON public.learn_progress FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS lp_update ON public.learn_progress;
CREATE POLICY lp_update ON public.learn_progress FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS lqa_select ON public.learn_quiz_attempts;
CREATE POLICY lqa_select ON public.learn_quiz_attempts FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS lqa_insert ON public.learn_quiz_attempts;
CREATE POLICY lqa_insert ON public.learn_quiz_attempts FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS lev_select ON public.learn_events;
CREATE POLICY lev_select ON public.learn_events FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS lev_insert ON public.learn_events;
CREATE POLICY lev_insert ON public.learn_events FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS lr_select ON public.learn_ratings;
CREATE POLICY lr_select ON public.learn_ratings FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS lr_upsert ON public.learn_ratings;
CREATE POLICY lr_upsert ON public.learn_ratings FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS lr_update ON public.learn_ratings;
CREATE POLICY lr_update ON public.learn_ratings FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- certificates: learner reads own; creation only through issue_certificate()
DROP POLICY IF EXISTS lc_select ON public.learn_certificates;
CREATE POLICY lc_select ON public.learn_certificates FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS lc_admin_write ON public.learn_certificates;
CREATE POLICY lc_admin_write ON public.learn_certificates FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

-- requirements: readable by everyone (no secrets), writable by admins
DROP POLICY IF EXISTS lcr_select ON public.learn_course_requirements;
CREATE POLICY lcr_select ON public.learn_course_requirements FOR SELECT USING (true);
DROP POLICY IF EXISTS lcr_admin ON public.learn_course_requirements;
CREATE POLICY lcr_admin ON public.learn_course_requirements FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- live sessions: published sessions are public; admins manage
DROP POLICY IF EXISTS ls_select ON public.live_sessions;
CREATE POLICY ls_select ON public.live_sessions FOR SELECT USING (is_published OR public.is_admin());
DROP POLICY IF EXISTS ls_admin ON public.live_sessions;
CREATE POLICY ls_admin ON public.live_sessions FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- referral clicks: no direct access (written via log_referral_click, read by admins)
DROP POLICY IF EXISTS rc_admin_select ON public.referral_clicks;
CREATE POLICY rc_admin_select ON public.referral_clicks FOR SELECT USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- 6. Functions
-- ---------------------------------------------------------------------------

-- Resolve a ref code (slug or staff code) to a staff id
CREATE OR REPLACE FUNCTION public.resolve_staff_ref(p_ref TEXT)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT s.id FROM public.staff_members s
    WHERE s.active AND (lower(s.slug) = lower(trim(p_ref)) OR lower(s.staff_code) = lower(trim(p_ref)))
    LIMIT 1;
$$;

-- Log a click on a staff link (anonymous allowed, best-effort)
CREATE OR REPLACE FUNCTION public.log_referral_click(p_ref TEXT, p_landing TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    IF p_ref IS NULL OR length(trim(p_ref)) = 0 OR length(p_ref) > 64 THEN RETURN; END IF;
    INSERT INTO public.referral_clicks (staff_id, ref_code, landing)
    VALUES (public.resolve_staff_ref(p_ref), left(trim(p_ref), 64), left(p_landing, 200));
END $$;

-- Attach attribution to the signed-in user's profile. First touch wins: never overwrites.
CREATE OR REPLACE FUNCTION public.claim_referral(p_ref TEXT, p_source TEXT DEFAULT 'staff_link')
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_staff UUID;
    v_rows INT;
BEGIN
    IF auth.uid() IS NULL OR p_ref IS NULL OR length(trim(p_ref)) = 0 THEN RETURN FALSE; END IF;
    v_staff := public.resolve_staff_ref(p_ref);
    IF v_staff IS NULL THEN RETURN FALSE; END IF;

    UPDATE public.profiles
       SET referred_by_staff_id = v_staff,
           referral_source = coalesce(p_source, 'staff_link'),
           referred_at = now()
     WHERE id = auth.uid() AND referred_by_staff_id IS NULL AND registered_by_staff_id IS NULL;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    RETURN v_rows > 0;
END $$;

-- Enrol the signed-in user in a learn course (idempotent) and record attribution
CREATE OR REPLACE FUNCTION public.learn_enroll(p_course TEXT, p_ref TEXT DEFAULT NULL, p_source TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
    INSERT INTO public.learn_enrollments (user_id, course_slug, source, referral_code)
    VALUES (auth.uid(), p_course, p_source, left(p_ref, 64))
    ON CONFLICT (user_id, course_slug) DO NOTHING;
    IF p_ref IS NOT NULL THEN PERFORM public.claim_referral(p_ref, coalesce(p_source, 'staff_link')); END IF;
END $$;

-- Issue a certificate. Verifies server-side that every required item is complete.
CREATE OR REPLACE FUNCTION public.issue_certificate(p_course TEXT, p_name TEXT)
RETURNS public.learn_certificates
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_req public.learn_course_requirements;
    v_missing INT;
    v_existing public.learn_certificates;
    v_new public.learn_certificates;
BEGIN
    IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
    IF p_name IS NULL OR length(trim(p_name)) < 2 THEN RAISE EXCEPTION 'name required'; END IF;

    SELECT * INTO v_existing FROM public.learn_certificates WHERE user_id = auth.uid() AND course_slug = p_course;
    IF FOUND THEN RETURN v_existing; END IF;

    SELECT * INTO v_req FROM public.learn_course_requirements WHERE course_slug = p_course;
    IF NOT FOUND THEN RAISE EXCEPTION 'unknown course'; END IF;

    SELECT count(*) INTO v_missing
    FROM unnest(v_req.required_item_ids) AS rid
    WHERE rid <> 'final'
      AND NOT EXISTS (
          SELECT 1 FROM public.learn_progress lp
          WHERE lp.user_id = auth.uid() AND lp.course_slug = p_course AND lp.item_id = rid AND lp.status = 'completed'
      );
    IF v_missing > 0 THEN RAISE EXCEPTION 'course not complete'; END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.learn_quiz_attempts a
        WHERE a.user_id = auth.uid() AND a.course_slug = p_course AND a.quiz_id = 'final' AND a.passed
    ) THEN RAISE EXCEPTION 'final assessment not passed'; END IF;

    INSERT INTO public.learn_certificates (id, user_id, course_slug, course_title, name_on_certificate)
    VALUES (
        'WSAI-FUND-' || to_char(now(), 'YYYY') || '-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8)),
        auth.uid(), p_course, v_req.course_title, trim(p_name)
    ) RETURNING * INTO v_new;

    UPDATE public.learn_enrollments SET completed_at = now() WHERE user_id = auth.uid() AND course_slug = p_course AND completed_at IS NULL;
    RETURN v_new;
END $$;

-- Public verification (returns only what the certificate itself shows)
CREATE OR REPLACE FUNCTION public.verify_certificate(p_id TEXT)
RETURNS TABLE (name_on_certificate TEXT, course_title TEXT, issued_at TIMESTAMPTZ, status TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT c.name_on_certificate, c.course_title, c.issued_at, c.status
    FROM public.learn_certificates c WHERE upper(c.id) = upper(trim(p_id)) LIMIT 1;
$$;

-- Admin statistics for the free course (admin only)
CREATE OR REPLACE FUNCTION public.admin_learn_stats(p_course TEXT DEFAULT 'ai-fundamentals')
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE r JSONB;
BEGIN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
    SELECT jsonb_build_object(
        'clicks', (SELECT count(*) FROM public.referral_clicks),
        'enrolled', (SELECT count(*) FROM public.learn_enrollments WHERE course_slug = p_course),
        'started', (SELECT count(DISTINCT user_id) FROM public.learn_progress WHERE course_slug = p_course),
        'completed', (SELECT count(*) FROM public.learn_certificates WHERE course_slug = p_course AND status = 'valid'),
        'active_7d', (SELECT count(DISTINCT user_id) FROM public.learn_events WHERE course_slug = p_course AND created_at > now() - interval '7 days'),
        'avg_rating', (SELECT round(avg(rating)::numeric, 2) FROM public.learn_ratings WHERE course_slug = p_course),
        'ratings', (SELECT count(*) FROM public.learn_ratings WHERE course_slug = p_course),
        'by_module', coalesce((
            SELECT jsonb_agg(jsonb_build_object('module', module_id, 'learners', learners) ORDER BY module_id)
            FROM (
                SELECT module_id, count(DISTINCT user_id) AS learners
                FROM public.learn_progress WHERE course_slug = p_course AND status = 'completed'
                GROUP BY module_id
            ) m), '[]'::jsonb),
        'by_item', coalesce((
            SELECT jsonb_agg(jsonb_build_object('item', item_id, 'learners', learners) ORDER BY item_id)
            FROM (
                SELECT item_id, count(DISTINCT user_id) AS learners
                FROM public.learn_progress WHERE course_slug = p_course AND status = 'completed'
                GROUP BY item_id
            ) i), '[]'::jsonb),
        'quizzes', coalesce((
            SELECT jsonb_agg(jsonb_build_object('quiz', quiz_id, 'attempts', attempts, 'learners', learners, 'pass_rate', pass_rate, 'avg_score', avg_score) ORDER BY quiz_id)
            FROM (
                SELECT quiz_id, count(*) AS attempts, count(DISTINCT user_id) AS learners,
                       round(100.0 * avg(CASE WHEN passed THEN 1 ELSE 0 END)::numeric, 1) AS pass_rate,
                       round(avg(percentage)::numeric, 1) AS avg_score
                FROM public.learn_quiz_attempts WHERE course_slug = p_course GROUP BY quiz_id
            ) q), '[]'::jsonb),
        'by_source', coalesce((
            SELECT jsonb_agg(jsonb_build_object('source', src, 'learners', n) ORDER BY n DESC)
            FROM (
                SELECT coalesce(source, 'direct') AS src, count(*) AS n
                FROM public.learn_enrollments WHERE course_slug = p_course GROUP BY 1
            ) s), '[]'::jsonb),
        'signups_by_day', coalesce((
            SELECT jsonb_agg(jsonb_build_object('day', d, 'enrolled', n) ORDER BY d)
            FROM (
                SELECT (enrolled_at AT TIME ZONE 'Africa/Kampala')::date AS d, count(*) AS n
                FROM public.learn_enrollments
                WHERE course_slug = p_course AND enrolled_at > now() - interval '30 days'
                GROUP BY 1
            ) x), '[]'::jsonb),
        'leaderboard', coalesce((
            SELECT jsonb_agg(row_to_json(l) ORDER BY l.points DESC)
            FROM (
                SELECT t.*, t.signups + t.started * 2 + t.completed * 5 AS points
                FROM (
                    SELECT s.id, s.display_name, s.staff_code,
                           (SELECT count(*) FROM public.referral_clicks c WHERE c.staff_id = s.id) AS clicks,
                           (SELECT count(*) FROM public.profiles p
                             WHERE (p.referred_by_staff_id = s.id OR p.registered_by_staff_id = s.id)
                               AND EXISTS (SELECT 1 FROM public.learn_enrollments e WHERE e.user_id = p.id AND e.course_slug = p_course)) AS signups,
                           (SELECT count(*) FROM public.profiles p
                             WHERE (p.referred_by_staff_id = s.id OR p.registered_by_staff_id = s.id)
                               AND EXISTS (SELECT 1 FROM public.learn_progress lp WHERE lp.user_id = p.id AND lp.course_slug = p_course)) AS started,
                           (SELECT count(*) FROM public.profiles p
                             WHERE (p.referred_by_staff_id = s.id OR p.registered_by_staff_id = s.id)
                               AND EXISTS (SELECT 1 FROM public.learn_certificates lc WHERE lc.user_id = p.id AND lc.course_slug = p_course AND lc.status = 'valid')) AS completed
                    FROM public.staff_members s
                ) t
                WHERE t.clicks > 0 OR t.signups > 0
            ) l), '[]'::jsonb)
    ) INTO r;
    RETURN r;
END $$;

-- ---------------------------------------------------------------------------
-- 7. Grants
-- ---------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.log_referral_click(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_certificate(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_referral(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.learn_enroll(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.issue_certificate(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_learn_stats(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

NOTIFY pgrst, 'reload schema';
