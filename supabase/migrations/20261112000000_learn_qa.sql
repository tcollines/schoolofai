-- Free course: per-lesson Q&A. Additive and idempotent. Depends on public.is_admin().
-- Learners ask questions on a lesson; admins answer. A question is visible to its asker, and to
-- every learner only after an admin sets is_public = true. Answers follow the question's visibility.
-- (Per-lesson ratings need no schema change: they reuse learn_ratings with course_slug = '<course>#<item_id>'.)

CREATE TABLE IF NOT EXISTS public.learn_questions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_slug TEXT NOT NULL,
    item_id     TEXT NOT NULL,
    asker_name  TEXT,
    body        TEXT NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 2000),
    is_public   BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.learn_answers (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES public.learn_questions(id) ON DELETE CASCADE,
    answered_by UUID DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
    author_name TEXT,
    body        TEXT NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 4000),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS learn_questions_item_idx ON public.learn_questions (course_slug, item_id, created_at DESC);
CREATE INDEX IF NOT EXISTS learn_questions_user_idx ON public.learn_questions (user_id);
CREATE INDEX IF NOT EXISTS learn_answers_question_idx ON public.learn_answers (question_id, created_at);

ALTER TABLE public.learn_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learn_answers   ENABLE ROW LEVEL SECURITY;

-- questions
DROP POLICY IF EXISTS lq_select ON public.learn_questions;
CREATE POLICY lq_select ON public.learn_questions FOR SELECT
    USING (user_id = auth.uid() OR is_public = true OR public.is_admin());

DROP POLICY IF EXISTS lq_insert ON public.learn_questions;
CREATE POLICY lq_insert ON public.learn_questions FOR INSERT
    WITH CHECK (user_id = auth.uid() AND is_public = false);

DROP POLICY IF EXISTS lq_admin ON public.learn_questions;
CREATE POLICY lq_admin ON public.learn_questions FOR ALL
    USING (public.is_admin()) WITH CHECK (public.is_admin());

-- answers: readable by an admin, or by anyone who can see the parent question
DROP POLICY IF EXISTS la_select ON public.learn_answers;
CREATE POLICY la_select ON public.learn_answers FOR SELECT
    USING (
        public.is_admin()
        OR EXISTS (
            SELECT 1 FROM public.learn_questions q
            WHERE q.id = learn_answers.question_id
              AND (q.user_id = auth.uid() OR q.is_public = true)
        )
    );

DROP POLICY IF EXISTS la_admin ON public.learn_answers;
CREATE POLICY la_admin ON public.learn_answers FOR ALL
    USING (public.is_admin()) WITH CHECK (public.is_admin());
