-- Keep reminding chosen people to install the Welile app until they have installed it.
-- A person is "installed" once the app has been opened from their home screen (or the browser reported an install):
-- both are already written to learn_events as app_opened / app_installed.
CREATE TABLE IF NOT EXISTS public.install_nudges (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    note TEXT
);
ALTER TABLE public.install_nudges ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.install_nudges FROM PUBLIC, anon, authenticated;

-- The app asks this on every visit: true means "show the install reminder to this person".
CREATE OR REPLACE FUNCTION public.my_install_nudge()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (SELECT 1 FROM public.install_nudges n WHERE n.user_id = auth.uid())
       AND NOT EXISTS (SELECT 1 FROM public.learn_events e WHERE e.user_id = auth.uid() AND e.event_type IN ('app_installed', 'app_opened'));
$$;
GRANT EXECUTE ON FUNCTION public.my_install_nudge() TO authenticated;

-- Turn the reminder on or off for one person (admins and agent supervisors).
CREATE OR REPLACE FUNCTION public.set_install_nudge(p_email TEXT, p_on BOOLEAN DEFAULT true, p_note TEXT DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user UUID; v_name TEXT;
BEGIN
    IF NOT (public.is_admin() OR public.is_agent_supervisor()) THEN RAISE EXCEPTION 'not authorized'; END IF;
    SELECT u.id INTO v_user FROM auth.users u WHERE lower(u.email) = lower(trim(p_email)) LIMIT 1;
    IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'No account uses that email.'); END IF;
    SELECT p.full_name INTO v_name FROM public.profiles p WHERE p.id = v_user;
    IF coalesce(p_on, true) THEN
        INSERT INTO public.install_nudges (user_id, note) VALUES (v_user, left(p_note, 300))
        ON CONFLICT (user_id) DO UPDATE SET note = coalesce(EXCLUDED.note, public.install_nudges.note);
    ELSE
        DELETE FROM public.install_nudges WHERE user_id = v_user;
    END IF;
    RETURN jsonb_build_object('ok', true, 'name', v_name, 'on', coalesce(p_on, true));
END $$;
GRANT EXECUTE ON FUNCTION public.set_install_nudge(TEXT, BOOLEAN, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';
