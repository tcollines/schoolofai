-- ============================================================================
-- Staff portal, learner reports, and SERVER-SIDE final exam marking
--
-- Run AFTER 20261111000000_free_course_foundation.sql.
--
-- SAFETY: additive only.
--   * New tables and functions.
--   * Re-creates (CREATE OR REPLACE) three functions and four row-level-security
--     policies that were introduced by the previous migration (not existing business tables).
--   * Does not modify, delete or rewrite any existing row in any pre-existing table.
-- Idempotent: safe to run more than once. Test on staging first.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Staff helpers
-- ---------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS uq_staff_members_user ON public.staff_members(user_id) WHERE user_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.current_staff_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT s.id FROM public.staff_members s WHERE s.user_id = auth.uid() AND s.active LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT public.current_staff_id() IS NOT NULL;
$$;

-- ---------------------------------------------------------------------------
-- 2. Students registered by staff (a lead / pre-registration; the student creates their own login)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.staff_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    registered_by_staff_id UUID NOT NULL REFERENCES public.staff_members(id) ON DELETE RESTRICT,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,                 -- digits only, international format (e.g. 2567XXXXXXXX)
    course_slug TEXT,                    -- set for the free course
    course_title TEXT NOT NULL,
    campaign TEXT,
    notes TEXT,
    consent_contact BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'account_created', 'lost')),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_staff_reg_email ON public.staff_registrations (lower(email)) WHERE email IS NOT NULL AND email <> '';
CREATE UNIQUE INDEX IF NOT EXISTS uq_staff_reg_phone ON public.staff_registrations (phone);
CREATE INDEX IF NOT EXISTS idx_staff_reg_staff ON public.staff_registrations (registered_by_staff_id, created_at DESC);

ALTER TABLE public.staff_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sreg_select ON public.staff_registrations;
CREATE POLICY sreg_select ON public.staff_registrations FOR SELECT
    USING (registered_by_staff_id = public.current_staff_id() OR public.is_admin());
DROP POLICY IF EXISTS sreg_admin ON public.staff_registrations;
CREATE POLICY sreg_admin ON public.staff_registrations FOR ALL
    USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- 3. Final exam: questions and answers live ONLY on the server
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.learn_final_questions (
    course_slug TEXT NOT NULL,
    id TEXT NOT NULL,
    position INT NOT NULL,
    text TEXT NOT NULL,
    options JSONB NOT NULL,
    correct INT NOT NULL,
    explanation TEXT NOT NULL,
    PRIMARY KEY (course_slug, id)
);

CREATE TABLE IF NOT EXISTS public.learn_final_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_slug TEXT NOT NULL,
    question_ids TEXT[] NOT NULL,
    option_orders JSONB NOT NULL,        -- per question: the order in which options were shown (original indexes)
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    submitted_at TIMESTAMPTZ,
    score INT,
    total INT,
    percentage INT,
    passed BOOLEAN
);
CREATE INDEX IF NOT EXISTS idx_final_attempts_user ON public.learn_final_attempts (user_id, course_slug, started_at DESC);

ALTER TABLE public.learn_final_questions ENABLE ROW LEVEL SECURITY;   -- no policies: nobody can read answers directly
ALTER TABLE public.learn_final_attempts  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lfa_select ON public.learn_final_attempts;
CREATE POLICY lfa_select ON public.learn_final_attempts FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

INSERT INTO public.learn_final_questions (course_slug, id, position, text, options, correct, explanation)
VALUES
    ('ai-fundamentals', 'f01', 1, $fq$Which of these is an example of generative AI?$fq$, $fq$["A spam filter","A chatbot drafting a message","Face unlock","A bank fraud alert"]$fq$::jsonb, 1, $fq$Generative AI creates new content such as text, pictures and code.$fq$),
    ('ai-fundamentals', 'f02', 2, $fq$Which of these is traditional AI?$fq$, $fq$["Writing a poem","Predicting your arrival time on a map","Making a poster from a description","Summarising an email"]$fq$::jsonb, 1, $fq$Traditional AI sorts, scores and predicts.$fq$),
    ('ai-fundamentals', 'f03', 3, $fq$Which shows the correct AI family order, from widest to narrowest?$fq$, $fq$["Generative AI, deep learning, machine learning, AI","AI, machine learning, deep learning, generative AI","Machine learning, AI, deep learning, generative AI","Deep learning, AI, generative AI, machine learning"]$fq$::jsonb, 1, $fq$Circles inside circles: AI contains machine learning, which contains deep learning, which contains generative AI.$fq$),
    ('ai-fundamentals', 'f04', 4, $fq$In the mango example, what does the child learn from?$fq$, $fq$["A list of rules","Examples","A dictionary","A teacher's answer key"]$fq$::jsonb, 1, $fq$Machine learning is learning from examples instead of written rules.$fq$),
    ('ai-fundamentals', 'f05', 5, $fq$What is deep learning especially good at?$fq$, $fq$["Counting small numbers","Messy data such as photos, voices and video","Checking facts","Typing quickly"]$fq$::jsonb, 1, $fq$Deep learning uses layers and handles unstructured data well.$fq$),
    ('ai-fundamentals', 'f06', 6, $fq$Which is true about AI?$fq$, $fq$["It is a robot with a body","It is brand new","It finds patterns in data and can look like thinking, but is not a human mind","It always tells the truth"]$fq$::jsonb, 2, $fq$AI is advanced pattern recognition.$fq$),
    ('ai-fundamentals', 'f07', 7, $fq$A chatbot is asked the same question twice and gives different words each time. Why?$fq$, $fq$["It is broken","It generates a fresh answer from patterns instead of looking one up","It is hiding something","The internet is slow"]$fq$::jsonb, 1, $fq$Generative AI creates; it does not paste a stored answer.$fq$),
    ('ai-fundamentals', 'f08', 8, $fq$What is the first step of a strong prompt?$fq$, $fq$["Say who you are and the situation (context)","Say please","Write in capital letters","Ask for a very long answer"]$fq$::jsonb, 0, $fq$Context, then task, then format.$fq$),
    ('ai-fundamentals', 'f09', 9, $fq$You want a short, friendly message under 100 words. Which part of a prompt does that describe?$fq$, $fq$["Context","Task","Format","Source"]$fq$::jsonb, 2, $fq$Length and tone are the format.$fq$),
    ('ai-fundamentals', 'f10', 10, $fq$An answer is too formal. What is the best follow-up?$fq$, $fq$["Start a new chat","\"Use a warmer, more casual tone.\"","Give up","Paste it into another tool"]$fq$::jsonb, 1, $fq$Refine instead of restarting.$fq$),
    ('ai-fundamentals', 'f11', 11, $fq$"Turn these notes into a table of task, owner and due date" is which job?$fq$, $fq$["Brainstorm","Draft","Summarise","Automate"]$fq$::jsonb, 2, $fq$Turning long and messy notes into short and clear is summarising.$fq$),
    ('ai-fundamentals', 'f12', 12, $fq$Why tell the AI to write "not stated" when information is missing?$fq$, $fq$["It looks neater","So it does not guess or invent","It saves time","It is a tool requirement"]$fq$::jsonb, 1, $fq$It reduces made-up details.$fq$),
    ('ai-fundamentals', 'f13', 13, $fq$Which is the best use of AI for an email to a client?$fq$, $fq$["Send the first draft unread","Let AI draft, then you edit facts, tone and voice before sending","Ask AI to guess the client's needs","Skip the email"]$fq$::jsonb, 1, $fq$AI drafts, you edit, you send.$fq$),
    ('ai-fundamentals', 'f14', 14, $fq$Which is the most useful way to treat AI answers?$fq$, $fq$["As final truth","As options and drafts to react to and check","As legal advice","As private"]$fq$::jsonb, 1, $fq$The real value is options to react to.$fq$),
    ('ai-fundamentals', 'f15', 15, $fq$What causes a hallucination?$fq$, $fq$["AI predicts what sounds likely and does not check what is true","A weak battery","A virus","A slow phone"]$fq$::jsonb, 0, $fq$It is built to produce what fits, not to verify.$fq$),
    ('ai-fundamentals', 'f16', 16, $fq$You ask a chatbot for sources and it gives links. What must you do?$fq$, $fq$["Use them immediately","Open them and check they exist and say that","Ask the chatbot if they are real","Ignore them"]$fq$::jsonb, 1, $fq$If the link does not exist or does not say that, do not use the claim.$fq$),
    ('ai-fundamentals', 'f17', 17, $fq$In the Air Canada case, who did the tribunal hold responsible?$fq$, $fq$["The customer","The chatbot","The airline","Nobody"]$fq$::jsonb, 2, $fq$A company answers for what its chatbot tells customers.$fq$),
    ('ai-fundamentals', 'f18', 18, $fq$Which claims should you check first when reviewing an AI answer?$fq$, $fq$["Names, numbers, dates, quotes, sources and laws","Spelling only","The first sentence only","Headings"]$fq$::jsonb, 0, $fq$Mark the claims that matter, then check them outside the chatbot.$fq$),
    ('ai-fundamentals', 'f19', 19, $fq$How can you reduce, but not remove, hallucinations?$fq$, $fq$["Give it the text to work from, ask it to say when it does not know, ask for sources","Type in capital letters","Ask the same question ten times","Use a faster phone"]$fq$::jsonb, 0, $fq$You can reduce hallucinations, but you cannot remove them.$fq$),
    ('ai-fundamentals', 'f20', 20, $fq$Why might AI know less about some languages, such as Luganda?$fq$, $fq$["It dislikes them","There is less data in those languages","They are harder to type","It is not allowed"]$fq$::jsonb, 1, $fq$Quality is uneven when there is less data, so have a fluent speaker check important text.$fq$),
    ('ai-fundamentals', 'f21', 21, $fq$A story written by AI makes the doctor a man and the nurse a woman every time. What is this?$fq$, $fq$["Good grammar","A possible sign of inherited bias","A privacy leak","A hallucination about dates"]$fq$::jsonb, 1, $fq$Read for assumptions and ask it to rewrite without them.$fq$),
    ('ai-fundamentals', 'f22', 22, $fq$Which decision should never be left to AI alone?$fq$, $fq$["Choosing a song","Whether to hire or reject a person","Picking a font","Naming a file"]$fq$::jsonb, 1, $fq$Decisions about people, such as hiring, marks, loans and discipline, need a human.$fq$),
    ('ai-fundamentals', 'f23', 23, $fq$Which of these is PII?$fq$, $fq$["A recipe","A name together with a phone number","The weather","A public holiday date"]$fq$::jsonb, 1, $fq$PII identifies a person.$fq$),
    ('ai-fundamentals', 'f24', 24, $fq$Which should NEVER be typed into a public AI tool?$fq$, $fq$["A question about how photosynthesis works","Your mobile money PIN","A request for taglines for your shop","A general question about spreadsheets"]$fq$::jsonb, 1, $fq$Passwords and PINs never go into a chatbot.$fq$),
    ('ai-fundamentals', 'f25', 25, $fq$A setting says your chats will not be used for training. Is it now safe to paste a customer list?$fq$, $fq$["Yes","No: a setting is not permission to paste secrets","Yes, if the list is short","Yes, on weekends"]$fq$::jsonb, 1, $fq$Not sure? Do not paste it.$fq$),
    ('ai-fundamentals', 'f26', 26, $fq$Summarising a public news article is...$fq$, $fq$["Green","Amber","Red","Forbidden"]$fq$::jsonb, 0, $fq$Low risk, go.$fq$),
    ('ai-fundamentals', 'f27', 27, $fq$Submitting AI work you cannot explain, or that your school does not allow, is...$fq$, $fq$["Green","Amber","Red","Fine if you edit one word"]$fq$::jsonb, 2, $fq$Red means stop.$fq$),
    ('ai-fundamentals', 'f28', 28, $fq$Which statement matches Google's original AI principles as taught in this course?$fq$, $fq$["AI should be socially beneficial and built and tested for safety","AI should be as cheap as possible","AI should never be used at work","AI should replace teachers"]$fq$::jsonb, 0, $fq$Beneficial, safe, accountable and avoiding unfair bias.$fq$),
    ('ai-fundamentals', 'f29', 29, $fq$What is the best one-line summary of this course?$fq$, $fq$["Use it, check it, protect people","Trust it, share it, forget it","Ask it, copy it, send it","Fear it, avoid it, ignore it"]$fq$::jsonb, 0, $fq$Use AI as a co-pilot, verify its work, and keep private information out.$fq$),
    ('ai-fundamentals', 'f30', 30, $fq$Who is accountable for what you send out under your name?$fq$, $fq$["The AI company","The AI","You","Nobody"]$fq$::jsonb, 2, $fq$AI drafts. You decide.$fq$)
ON CONFLICT (course_slug, id) DO NOTHING;

-- The browser may no longer write a "final" attempt or a "final" progress row: only submit_final_exam() can.
DROP POLICY IF EXISTS lqa_insert ON public.learn_quiz_attempts;
CREATE POLICY lqa_insert ON public.learn_quiz_attempts FOR INSERT
    WITH CHECK (user_id = auth.uid() AND quiz_id <> 'final');

DROP POLICY IF EXISTS lp_insert ON public.learn_progress;
CREATE POLICY lp_insert ON public.learn_progress FOR INSERT
    WITH CHECK (user_id = auth.uid() AND item_id <> 'final');

DROP POLICY IF EXISTS lp_update ON public.learn_progress;
CREATE POLICY lp_update ON public.learn_progress FOR UPDATE
    USING (user_id = auth.uid() AND item_id <> 'final')
    WITH CHECK (user_id = auth.uid() AND item_id <> 'final');

-- Start (or resume) a final assessment: returns 20 random questions WITHOUT answers, options shuffled server-side
CREATE OR REPLACE FUNCTION public.get_final_exam(p_course TEXT DEFAULT 'ai-fundamentals')
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_req public.learn_course_requirements;
    v_missing INT;
    v_att public.learn_final_attempts;
    v_used INT;
    v_ids TEXT[];
    v_orders JSONB;
    v_questions JSONB;
    c_limit CONSTANT INT := 3;
    c_count CONSTANT INT := 20;
BEGIN
    IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

    IF EXISTS (SELECT 1 FROM public.learn_final_attempts a WHERE a.user_id = v_uid AND a.course_slug = p_course AND a.passed) THEN
        RETURN jsonb_build_object('passed', true);
    END IF;

    SELECT * INTO v_req FROM public.learn_course_requirements WHERE course_slug = p_course;
    IF NOT FOUND THEN RAISE EXCEPTION 'unknown course'; END IF;

    SELECT count(*) INTO v_missing
    FROM unnest(v_req.required_item_ids) AS rid
    WHERE rid <> 'final'
      AND NOT EXISTS (
          SELECT 1 FROM public.learn_progress lp
          WHERE lp.user_id = v_uid AND lp.course_slug = p_course AND lp.item_id = rid AND lp.status = 'completed'
      );
    IF v_missing > 0 THEN RAISE EXCEPTION 'complete every lesson and quiz first'; END IF;

    -- resume an unfinished attempt so refreshing the page never burns an attempt
    SELECT * INTO v_att FROM public.learn_final_attempts a
     WHERE a.user_id = v_uid AND a.course_slug = p_course AND a.submitted_at IS NULL AND a.started_at > now() - interval '3 hours'
     ORDER BY a.started_at DESC LIMIT 1;

    IF NOT FOUND THEN
        SELECT count(*) INTO v_used FROM public.learn_final_attempts a
         WHERE a.user_id = v_uid AND a.course_slug = p_course AND a.started_at > now() - interval '24 hours';
        IF v_used >= c_limit THEN RAISE EXCEPTION 'attempt limit reached, try again in 24 hours'; END IF;

        SELECT array_agg(s.id) INTO v_ids FROM (
            SELECT fq.id FROM public.learn_final_questions fq WHERE fq.course_slug = p_course ORDER BY random() LIMIT c_count
        ) s;
        IF v_ids IS NULL OR array_length(v_ids, 1) < 1 THEN RAISE EXCEPTION 'no questions configured'; END IF;

        SELECT jsonb_object_agg(fq.id, (
                   SELECT jsonb_agg(i - 1 ORDER BY random()) FROM generate_series(1, jsonb_array_length(fq.options)) AS i
               ))
          INTO v_orders
          FROM public.learn_final_questions fq WHERE fq.course_slug = p_course AND fq.id = ANY (v_ids);

        INSERT INTO public.learn_final_attempts (user_id, course_slug, question_ids, option_orders)
        VALUES (v_uid, p_course, v_ids, v_orders) RETURNING * INTO v_att;
    END IF;

    SELECT count(*) INTO v_used FROM public.learn_final_attempts a
     WHERE a.user_id = v_uid AND a.course_slug = p_course AND a.started_at > now() - interval '24 hours';

    SELECT jsonb_agg(
               jsonb_build_object(
                   'id', fq.id,
                   'text', fq.text,
                   'options', (
                       SELECT jsonb_agg(fq.options -> (o.idx)::int ORDER BY o.n)
                       FROM jsonb_array_elements_text(v_att.option_orders -> fq.id) WITH ORDINALITY AS o(idx, n)
                   )
               ) ORDER BY array_position(v_att.question_ids, fq.id))
      INTO v_questions
      FROM public.learn_final_questions fq
     WHERE fq.course_slug = p_course AND fq.id = ANY (v_att.question_ids);

    RETURN jsonb_build_object(
        'passed', false,
        'attempt_id', v_att.id,
        'questions', coalesce(v_questions, '[]'::jsonb),
        'attempts_used', v_used,
        'attempts_allowed', c_limit,
        'pass_mark', 80
    );
END $$;

-- Mark an attempt on the server. Reveals answers/explanations only after a pass.
CREATE OR REPLACE FUNCTION public.submit_final_exam(p_attempt UUID, p_answers JSONB)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_att public.learn_final_attempts;
    qr RECORD;
    v_order JSONB;
    v_chosen INT;
    v_orig INT;
    v_pos INT;
    v_score INT := 0;
    v_total INT;
    v_pct INT;
    v_passed BOOLEAN;
    v_wrong TEXT[] := '{}';
    v_review JSONB := '[]'::jsonb;
    c_pass CONSTANT INT := 80;
BEGIN
    IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

    SELECT * INTO v_att FROM public.learn_final_attempts WHERE id = p_attempt AND user_id = v_uid FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'attempt not found'; END IF;
    IF v_att.submitted_at IS NOT NULL THEN RAISE EXCEPTION 'attempt already submitted'; END IF;

    v_total := array_length(v_att.question_ids, 1);

    FOR qr IN
        SELECT * FROM public.learn_final_questions fq
         WHERE fq.course_slug = v_att.course_slug AND fq.id = ANY (v_att.question_ids)
         ORDER BY array_position(v_att.question_ids, fq.id)
    LOOP
        v_order := v_att.option_orders -> qr.id;
        v_chosen := CASE WHEN (p_answers ->> qr.id) ~ '^[0-9]+$' THEN (p_answers ->> qr.id)::int ELSE NULL END;
        v_orig := CASE WHEN v_chosen IS NULL THEN NULL ELSE (v_order ->> v_chosen)::int END;

        SELECT (o.n - 1)::int INTO v_pos
        FROM jsonb_array_elements_text(v_order) WITH ORDINALITY AS o(idx, n)
        WHERE o.idx::int = qr.correct;

        IF v_orig IS NOT NULL AND v_orig = qr.correct THEN
            v_score := v_score + 1;
        ELSE
            v_wrong := v_wrong || qr.id;
        END IF;
        v_review := v_review || jsonb_build_array(jsonb_build_object('id', qr.id, 'correct', v_pos, 'explanation', qr.explanation));
    END LOOP;

    v_pct := round(100.0 * v_score / greatest(v_total, 1));
    v_passed := v_pct >= c_pass;

    UPDATE public.learn_final_attempts
       SET submitted_at = now(), score = v_score, total = v_total, percentage = v_pct, passed = v_passed
     WHERE id = p_attempt;

    INSERT INTO public.learn_quiz_attempts (user_id, course_slug, quiz_id, score, total, percentage, passed, answers)
    VALUES (v_uid, v_att.course_slug, 'final', v_score, v_total, v_pct, v_passed, p_answers);

    INSERT INTO public.learn_events (user_id, course_slug, event_type, item_id, payload)
    VALUES (v_uid, v_att.course_slug, 'quiz_submitted', 'final', jsonb_build_object('percentage', v_pct, 'passed', v_passed));

    IF v_passed THEN
        INSERT INTO public.learn_progress (user_id, course_slug, item_id, module_id, status, completed_at)
        VALUES (v_uid, v_att.course_slug, 'final', 'final', 'completed', now())
        ON CONFLICT (user_id, course_slug, item_id)
        DO UPDATE SET status = 'completed', completed_at = coalesce(public.learn_progress.completed_at, now()), updated_at = now();
    END IF;

    RETURN jsonb_build_object(
        'score', v_score, 'total', v_total, 'percentage', v_pct, 'passed', v_passed,
        'wrong', to_jsonb(v_wrong),
        'review', CASE WHEN v_passed THEN v_review ELSE NULL END
    );
END $$;

-- ---------------------------------------------------------------------------
-- 4. Staff scoring (internal), used by admin and staff views
--    Attribution: a staff-registered student counts for the registrar; otherwise for the referring staff.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.staff_scores(p_course TEXT DEFAULT 'ai-fundamentals')
RETURNS TABLE (staff_id UUID, display_name TEXT, staff_code TEXT, clicks BIGINT, registered BIGINT,
               signups BIGINT, started BIGINT, completed BIGINT, points BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT s.id, s.display_name, s.staff_code,
           (SELECT count(*) FROM public.referral_clicks c WHERE c.staff_id = s.id),
           (SELECT count(*) FROM public.staff_registrations r WHERE r.registered_by_staff_id = s.id),
           sig.signups, sig.started, sig.completed,
           sig.signups + sig.started * 2 + sig.completed * 5
    FROM public.staff_members s
    CROSS JOIN LATERAL (
        SELECT
            count(*) FILTER (WHERE EXISTS (SELECT 1 FROM public.learn_enrollments e WHERE e.user_id = p.id AND e.course_slug = p_course)) AS signups,
            count(*) FILTER (WHERE EXISTS (SELECT 1 FROM public.learn_progress lp WHERE lp.user_id = p.id AND lp.course_slug = p_course)) AS started,
            count(*) FILTER (WHERE EXISTS (SELECT 1 FROM public.learn_certificates lc WHERE lc.user_id = p.id AND lc.course_slug = p_course AND lc.status = 'valid')) AS completed
        FROM public.profiles p
        WHERE coalesce(p.registered_by_staff_id, p.referred_by_staff_id) = s.id
    ) sig
    WHERE s.active;
$$;

REVOKE ALL ON FUNCTION public.staff_scores(TEXT) FROM PUBLIC, anon, authenticated;

-- Admin dashboard statistics (same output as before; leaderboard now uses staff_scores)
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
            FROM (SELECT module_id, count(DISTINCT user_id) AS learners FROM public.learn_progress
                  WHERE course_slug = p_course AND status = 'completed' GROUP BY module_id) m), '[]'::jsonb),
        'by_item', coalesce((
            SELECT jsonb_agg(jsonb_build_object('item', item_id, 'learners', learners) ORDER BY item_id)
            FROM (SELECT item_id, count(DISTINCT user_id) AS learners FROM public.learn_progress
                  WHERE course_slug = p_course AND status = 'completed' GROUP BY item_id) i), '[]'::jsonb),
        'quizzes', coalesce((
            SELECT jsonb_agg(jsonb_build_object('quiz', quiz_id, 'attempts', attempts, 'learners', learners, 'pass_rate', pass_rate, 'avg_score', avg_score) ORDER BY quiz_id)
            FROM (SELECT quiz_id, count(*) AS attempts, count(DISTINCT user_id) AS learners,
                         round(100.0 * avg(CASE WHEN passed THEN 1 ELSE 0 END)::numeric, 1) AS pass_rate,
                         round(avg(percentage)::numeric, 1) AS avg_score
                  FROM public.learn_quiz_attempts WHERE course_slug = p_course GROUP BY quiz_id) q), '[]'::jsonb),
        'by_source', coalesce((
            SELECT jsonb_agg(jsonb_build_object('source', src, 'learners', n) ORDER BY n DESC)
            FROM (SELECT coalesce(source, 'direct') AS src, count(*) AS n
                  FROM public.learn_enrollments WHERE course_slug = p_course GROUP BY 1) s), '[]'::jsonb),
        'signups_by_day', coalesce((
            SELECT jsonb_agg(jsonb_build_object('day', d, 'enrolled', n) ORDER BY d)
            FROM (SELECT (enrolled_at AT TIME ZONE 'Africa/Kampala')::date AS d, count(*) AS n
                  FROM public.learn_enrollments
                  WHERE course_slug = p_course AND enrolled_at > now() - interval '30 days' GROUP BY 1) x), '[]'::jsonb),
        'leaderboard', coalesce((
            SELECT jsonb_agg(jsonb_build_object(
                       'id', t.staff_id, 'display_name', t.display_name, 'staff_code', t.staff_code,
                       'clicks', t.clicks, 'registered', t.registered, 'signups', t.signups,
                       'started', t.started, 'completed', t.completed, 'points', t.points) ORDER BY t.points DESC)
            FROM public.staff_scores(p_course) t
            WHERE t.clicks > 0 OR t.signups > 0 OR t.registered > 0), '[]'::jsonb)
    ) INTO r;
    RETURN r;
END $$;

-- Admin: one row per learner
CREATE OR REPLACE FUNCTION public.admin_learners(p_course TEXT DEFAULT 'ai-fundamentals')
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE r JSONB;
BEGIN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
    SELECT coalesce(jsonb_agg(row ORDER BY (row ->> 'enrolled_at') DESC), '[]'::jsonb) INTO r
    FROM (
        SELECT jsonb_build_object(
            'user_id', e.user_id,
            'name', coalesce(p.full_name, ''),
            'email', coalesce(p.email, ''),
            'enrolled_at', e.enrolled_at,
            'source', coalesce(e.source, 'direct'),
            'staff', st.display_name,
            'items_done', coalesce(pr.n, 0),
            'last_active', pr.last,
            'final_passed', EXISTS (SELECT 1 FROM public.learn_final_attempts fa WHERE fa.user_id = e.user_id AND fa.course_slug = p_course AND fa.passed),
            'certificate_id', c.id
        ) AS row
        FROM public.learn_enrollments e
        LEFT JOIN public.profiles p ON p.id = e.user_id
        LEFT JOIN public.staff_members st ON st.id = coalesce(p.registered_by_staff_id, p.referred_by_staff_id)
        LEFT JOIN LATERAL (
            SELECT count(*) FILTER (WHERE lp.status = 'completed') AS n, max(lp.updated_at) AS last
            FROM public.learn_progress lp WHERE lp.user_id = e.user_id AND lp.course_slug = p_course
        ) pr ON true
        LEFT JOIN public.learn_certificates c ON c.user_id = e.user_id AND c.course_slug = p_course
        WHERE e.course_slug = p_course
        LIMIT 5000
    ) t;
    RETURN r;
END $$;

-- Admin: connect a staff profile to a login (the person signs up normally first)
CREATE OR REPLACE FUNCTION public.admin_link_staff(p_staff_id UUID, p_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_user UUID;
BEGIN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
    SELECT u.id INTO v_user FROM auth.users u WHERE lower(u.email) = lower(trim(p_email)) LIMIT 1;
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'message', 'No account uses that email yet. Ask the staff member to register on the website first.');
    END IF;
    BEGIN
        UPDATE public.staff_members SET user_id = v_user WHERE id = p_staff_id;
    EXCEPTION WHEN unique_violation THEN
        RETURN jsonb_build_object('ok', false, 'message', 'That login is already linked to another staff profile.');
    END;
    RETURN jsonb_build_object('ok', true);
END $$;

-- ---------------------------------------------------------------------------
-- 5. Staff-facing functions (each returns only that staff member's own data)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.staff_my_profile()
RETURNS JSONB
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT jsonb_build_object('id', s.id, 'display_name', s.display_name, 'staff_code', s.staff_code, 'slug', s.slug, 'role', s.role)
    FROM public.staff_members s WHERE s.id = public.current_staff_id();
$$;

CREATE OR REPLACE FUNCTION public.staff_my_stats(p_course TEXT DEFAULT 'ai-fundamentals')
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_id UUID := public.current_staff_id();
    me RECORD;
    v_rank INT;
    v_total INT;
BEGIN
    IF v_id IS NULL THEN RAISE EXCEPTION 'not a staff member'; END IF;
    SELECT * INTO me FROM public.staff_scores(p_course) WHERE staff_id = v_id;
    SELECT count(*) + 1 INTO v_rank FROM public.staff_scores(p_course) x WHERE x.points > me.points;
    SELECT count(*) INTO v_total FROM public.staff_scores(p_course);
    RETURN jsonb_build_object(
        'clicks', me.clicks, 'registered', me.registered, 'signups', me.signups,
        'started', me.started, 'completed', me.completed, 'points', me.points,
        'rank', v_rank, 'staff_total', v_total
    );
END $$;

CREATE OR REPLACE FUNCTION public.staff_leaderboard(p_course TEXT DEFAULT 'ai-fundamentals')
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    IF public.current_staff_id() IS NULL AND NOT public.is_admin() THEN RAISE EXCEPTION 'not a staff member'; END IF;
    RETURN coalesce((
        SELECT jsonb_agg(jsonb_build_object(
                   'id', t.staff_id, 'display_name', t.display_name, 'signups', t.signups,
                   'completed', t.completed, 'points', t.points,
                   'is_me', t.staff_id = public.current_staff_id()) ORDER BY t.points DESC)
        FROM (SELECT * FROM public.staff_scores(p_course) ORDER BY points DESC LIMIT 10) t
    ), '[]'::jsonb);
END $$;

CREATE OR REPLACE FUNCTION public.staff_my_students(p_course TEXT DEFAULT 'ai-fundamentals')
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_id UUID := public.current_staff_id();
BEGIN
    IF v_id IS NULL THEN RAISE EXCEPTION 'not a staff member'; END IF;
    RETURN coalesce((
        SELECT jsonb_agg(t.row ORDER BY t.sort DESC)
        FROM (
            -- students the staff member registered by hand
            SELECT r.created_at AS sort,
                   jsonb_build_object(
                       'kind', 'assisted', 'id', r.id, 'name', r.full_name, 'email', r.email, 'phone', r.phone,
                       'course', r.course_title, 'registered_at', r.created_at,
                       'account_linked', r.profile_id IS NOT NULL,
                       'items_done', coalesce(pr.n, 0), 'last_active', pr.last,
                       'completed', c.id IS NOT NULL) AS row
            FROM public.staff_registrations r
            LEFT JOIN LATERAL (
                SELECT count(*) FILTER (WHERE lp.status = 'completed') AS n, max(lp.updated_at) AS last
                FROM public.learn_progress lp WHERE lp.user_id = r.profile_id AND lp.course_slug = p_course
            ) pr ON true
            LEFT JOIN public.learn_certificates c ON c.user_id = r.profile_id AND c.course_slug = p_course
            WHERE r.registered_by_staff_id = v_id

            UNION ALL

            -- students who arrived through the staff member's link and are not already listed above
            SELECT e.enrolled_at AS sort,
                   jsonb_build_object(
                       'kind', 'link', 'id', p.id, 'name', coalesce(p.full_name, ''), 'email', p.email, 'phone', NULL,
                       'course', 'AI Fundamentals (free)', 'registered_at', e.enrolled_at,
                       'account_linked', true,
                       'items_done', coalesce(pr.n, 0), 'last_active', pr.last,
                       'completed', c.id IS NOT NULL) AS row
            FROM public.profiles p
            JOIN public.learn_enrollments e ON e.user_id = p.id AND e.course_slug = p_course
            LEFT JOIN LATERAL (
                SELECT count(*) FILTER (WHERE lp.status = 'completed') AS n, max(lp.updated_at) AS last
                FROM public.learn_progress lp WHERE lp.user_id = p.id AND lp.course_slug = p_course
            ) pr ON true
            LEFT JOIN public.learn_certificates c ON c.user_id = p.id AND c.course_slug = p_course
            WHERE coalesce(p.registered_by_staff_id, p.referred_by_staff_id) = v_id
              AND NOT EXISTS (SELECT 1 FROM public.staff_registrations r2 WHERE r2.profile_id = p.id)
        ) t
    ), '[]'::jsonb);
END $$;

-- Register a student by hand. The logged-in staff member is recorded automatically.
CREATE OR REPLACE FUNCTION public.staff_register_student(
    p_name TEXT, p_email TEXT, p_phone TEXT, p_course_title TEXT,
    p_course_slug TEXT DEFAULT NULL, p_campaign TEXT DEFAULT NULL, p_notes TEXT DEFAULT NULL,
    p_consent BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_staff UUID := public.current_staff_id();
    v_phone TEXT;
    v_email TEXT := nullif(lower(trim(coalesce(p_email, ''))), '');
    v_existing public.staff_registrations;
    v_new UUID;
    v_slug TEXT;
BEGIN
    IF v_staff IS NULL THEN RAISE EXCEPTION 'not a staff member'; END IF;
    IF p_name IS NULL OR length(trim(p_name)) < 2 THEN
        RETURN jsonb_build_object('ok', false, 'code', 'invalid', 'message', 'Please enter the student''s full name.');
    END IF;
    IF NOT coalesce(p_consent, false) THEN
        RETURN jsonb_build_object('ok', false, 'code', 'invalid', 'message', 'The student must agree to be contacted.');
    END IF;

    v_phone := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
    IF v_phone LIKE '0%' AND length(v_phone) = 10 THEN v_phone := '256' || substr(v_phone, 2); END IF;
    IF length(v_phone) < 9 OR length(v_phone) > 15 THEN
        RETURN jsonb_build_object('ok', false, 'code', 'invalid', 'message', 'Please enter a valid phone number.');
    END IF;
    IF v_email IS NOT NULL AND v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
        RETURN jsonb_build_object('ok', false, 'code', 'invalid', 'message', 'That email address does not look right.');
    END IF;

    IF v_email IS NOT NULL AND EXISTS (SELECT 1 FROM public.profiles pr WHERE lower(pr.email) = v_email) THEN
        RETURN jsonb_build_object('ok', false, 'code', 'has_account', 'message', 'This person already has an account, so they cannot be registered again.');
    END IF;

    SELECT * INTO v_existing FROM public.staff_registrations r
     WHERE r.phone = v_phone OR (v_email IS NOT NULL AND lower(r.email) = v_email) LIMIT 1;
    IF FOUND THEN
        RETURN jsonb_build_object('ok', false, 'code', 'duplicate',
            'mine', v_existing.registered_by_staff_id = v_staff,
            'message', CASE WHEN v_existing.registered_by_staff_id = v_staff
                            THEN 'You have already registered this student.'
                            ELSE 'This student has already been registered by another staff member.' END);
    END IF;

    INSERT INTO public.staff_registrations (registered_by_staff_id, full_name, email, phone, course_slug, course_title, campaign, notes, consent_contact)
    VALUES (v_staff, trim(p_name), v_email, v_phone, nullif(p_course_slug, ''), coalesce(nullif(trim(p_course_title), ''), 'AI Fundamentals (free)'),
            nullif(trim(coalesce(p_campaign, '')), ''), nullif(trim(coalesce(p_notes, '')), ''), true)
    RETURNING id INTO v_new;

    SELECT slug INTO v_slug FROM public.staff_members WHERE id = v_staff;
    RETURN jsonb_build_object('ok', true, 'id', v_new, 'slug', v_slug, 'phone', v_phone);
END $$;

-- ---------------------------------------------------------------------------
-- 6. Enrolment: also connect a staff-registered student's account to the registration
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.link_staff_registration()
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_email TEXT;
    v_staff UUID;
BEGIN
    IF auth.uid() IS NULL THEN RETURN; END IF;
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()) THEN RETURN; END IF;
    SELECT lower(u.email) INTO v_email FROM auth.users u WHERE u.id = auth.uid();
    IF v_email IS NULL THEN RETURN; END IF;

    UPDATE public.staff_registrations
       SET profile_id = auth.uid(), status = 'account_created'
     WHERE profile_id IS NULL AND lower(email) = v_email
    RETURNING registered_by_staff_id INTO v_staff;

    IF v_staff IS NOT NULL THEN
        UPDATE public.profiles SET registered_by_staff_id = v_staff
         WHERE id = auth.uid() AND registered_by_staff_id IS NULL;
    END IF;
END $$;

REVOKE ALL ON FUNCTION public.link_staff_registration() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.learn_enroll(p_course TEXT, p_ref TEXT DEFAULT NULL, p_source TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
    PERFORM public.link_staff_registration();
    INSERT INTO public.learn_enrollments (user_id, course_slug, source, referral_code)
    VALUES (auth.uid(), p_course, p_source, left(p_ref, 64))
    ON CONFLICT (user_id, course_slug) DO NOTHING;
    IF p_ref IS NOT NULL THEN PERFORM public.claim_referral(p_ref, coalesce(p_source, 'staff_link')); END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 7. Grants
-- ---------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.current_staff_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_final_exam(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_final_exam(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_my_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_my_stats(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_leaderboard(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_my_students(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_register_student(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_learners(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_link_staff(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_learn_stats(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.learn_enroll(TEXT, TEXT, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';
