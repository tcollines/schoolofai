-- Agent link names can change without breaking links already shared.
-- Old names are kept as aliases that still resolve to the same agent, so attribution for old links never breaks.
-- First use: Kasozi Elvis (AGT-38EA47) asked for his link to end with "elvis" instead of "kasozi".
-- ADDITIVE: one new table; resolve_staff_ref and agent_public_name now also check aliases (real names win over aliases).

CREATE TABLE IF NOT EXISTS public.staff_slug_aliases (
    alias TEXT PRIMARY KEY CHECK (alias = lower(alias) AND length(alias) BETWEEN 2 AND 64),
    staff_id UUID NOT NULL REFERENCES public.staff_members(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.staff_slug_aliases ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.staff_slug_aliases FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.resolve_staff_ref(p_ref TEXT)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT id FROM (
        SELECT s.id, 0 AS pri
          FROM public.staff_members s
         WHERE s.active AND (lower(s.slug) = lower(trim(p_ref)) OR lower(s.staff_code) = lower(trim(p_ref)))
        UNION ALL
        SELECT s.id, 1 AS pri
          FROM public.staff_slug_aliases a
          JOIN public.staff_members s ON s.id = a.staff_id
         WHERE s.active AND a.alias = lower(trim(p_ref))
    ) x
    ORDER BY pri
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.agent_public_name(p_slug TEXT)
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT split_part(display_name, ' ', 1) FROM (
        SELECT s.display_name, 0 AS pri FROM public.staff_members s WHERE s.slug = lower(trim(p_slug)) AND s.active
        UNION ALL
        SELECT s.display_name, 1 AS pri
          FROM public.staff_slug_aliases a JOIN public.staff_members s ON s.id = a.staff_id
         WHERE a.alias = lower(trim(p_slug)) AND s.active
    ) x
    ORDER BY pri
    LIMIT 1;
$$;

-- Kasozi Elvis: new link name "elvis"; "kasozi" stays as an alias (only if "elvis" is not already someone's link).
DO $$
DECLARE v_id UUID;
BEGIN
    SELECT id INTO v_id FROM public.staff_members WHERE staff_code = 'AGT-38EA47' AND slug = 'kasozi';
    IF v_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.staff_members WHERE slug = 'elvis')
       AND NOT EXISTS (SELECT 1 FROM public.staff_slug_aliases WHERE alias = 'elvis') THEN
        INSERT INTO public.staff_slug_aliases (alias, staff_id) VALUES ('kasozi', v_id) ON CONFLICT (alias) DO NOTHING;
        UPDATE public.staff_members SET slug = 'elvis' WHERE id = v_id;
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';
