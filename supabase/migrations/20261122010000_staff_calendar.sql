-- Personal weekly calendar for staff: each person sees and edits only their own blocks.
CREATE TABLE IF NOT EXISTS public.staff_calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL CHECK (length(trim(title)) > 0),
    category TEXT NOT NULL DEFAULT 'other'
        CHECK (category IN ('meeting', 'live_class', 'teaching', 'strategy', 'networking', 'ops', 'travel', 'personal', 'other')),
    weekday SMALLINT CHECK (weekday BETWEEN 1 AND 7),   -- 1 = Monday ... 7 = Sunday, repeats every week
    event_date DATE,                                    -- one-off event on this date (East Africa Time)
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    notes TEXT,
    is_assumed BOOLEAN NOT NULL DEFAULT false,          -- tentative: still to be confirmed
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT staff_cal_one_kind CHECK ((weekday IS NOT NULL AND event_date IS NULL) OR (weekday IS NULL AND event_date IS NOT NULL)),
    CONSTRAINT staff_cal_time_order CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_staff_cal_user_weekday ON public.staff_calendar_events (user_id, weekday);
CREATE INDEX IF NOT EXISTS idx_staff_cal_user_date ON public.staff_calendar_events (user_id, event_date);

CREATE OR REPLACE FUNCTION public._staff_cal_touch() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END $$;
DROP TRIGGER IF EXISTS trg_staff_cal_touch ON public.staff_calendar_events;
CREATE TRIGGER trg_staff_cal_touch BEFORE UPDATE ON public.staff_calendar_events FOR EACH ROW EXECUTE FUNCTION public._staff_cal_touch();

ALTER TABLE public.staff_calendar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS scal_select ON public.staff_calendar_events;
CREATE POLICY scal_select ON public.staff_calendar_events FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS scal_insert ON public.staff_calendar_events;
CREATE POLICY scal_insert ON public.staff_calendar_events FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS scal_update ON public.staff_calendar_events;
CREATE POLICY scal_update ON public.staff_calendar_events FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS scal_delete ON public.staff_calendar_events;
CREATE POLICY scal_delete ON public.staff_calendar_events FOR DELETE TO authenticated USING (user_id = auth.uid());

REVOKE ALL ON public.staff_calendar_events FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_calendar_events TO authenticated;

NOTIFY pgrst, 'reload schema';
