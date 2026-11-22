-- Live classes go from three a week to two, for groups starting Monday 23 Nov 2026 (EAT):
--   Part 1 = Wednesday 2:00 pm, intro + Modules 1 to 3  ('part-1')
--   Part 2 = Friday 2:00 pm,    Modules 4 to 6          ('part-2')
-- Dates before 23 Nov 2026 keep the old mapping (Mon lecture-1, Wed/Thu lecture-2, Fri lecture-3),
-- so attendance already recorded under the old ids is untouched.

CREATE OR REPLACE FUNCTION public.live_lecture_for(p_ts TIMESTAMPTZ)
RETURNS TEXT LANGUAGE sql IMMUTABLE AS $$
    SELECT CASE
        WHEN (p_ts AT TIME ZONE 'Africa/Kampala')::date >= date '2026-11-23' THEN
            CASE extract(isodow FROM p_ts AT TIME ZONE 'Africa/Kampala')::int WHEN 3 THEN 'part-1' WHEN 5 THEN 'part-2' END
        ELSE
            CASE extract(isodow FROM p_ts AT TIME ZONE 'Africa/Kampala')::int
                WHEN 1 THEN 'lecture-1' WHEN 3 THEN 'lecture-2' WHEN 4 THEN 'lecture-2' WHEN 5 THEN 'lecture-3' END
    END;
$$;

-- Lecture for a session: the module list wins when it names modules, otherwise the weekday decides.
CREATE OR REPLACE FUNCTION public.live_lecture_of(p_module TEXT, p_ts TIMESTAMPTZ)
RETURNS TEXT LANGUAGE sql IMMUTABLE AS $$
    SELECT coalesce(
        CASE
            WHEN (p_ts AT TIME ZONE 'Africa/Kampala')::date >= date '2026-11-23' THEN
                CASE
                    WHEN lower(coalesce(p_module, '')) ~ '(m4|m5|m6)' THEN 'part-2'
                    WHEN lower(coalesce(p_module, '')) ~ '(m0|m1|m2|m3)' THEN 'part-1'
                END
            ELSE
                CASE
                    WHEN lower(coalesce(p_module, '')) ~ '(m0|m1|m2)' THEN 'lecture-1'
                    WHEN lower(coalesce(p_module, '')) ~ '(m3|m4)' THEN 'lecture-2'
                    WHEN lower(coalesce(p_module, '')) ~ '(m5|m6)' THEN 'lecture-3'
                END
        END,
        public.live_lecture_for(p_ts)
    );
$$;

-- The two functions below were defined in 20261119010000; only the lecture lookup changed.
CREATE OR REPLACE FUNCTION public.resolve_and_track_live_join(
    p_session_id UUID,
    p_user_id UUID DEFAULT NULL,
    p_source TEXT DEFAULT 'direct',
    p_visitor_id TEXT DEFAULT NULL,
    p_device TEXT DEFAULT NULL,
    p_is_app BOOLEAN DEFAULT false
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_s public.live_sessions;
    v_uid UUID;
    v_src TEXT := left(coalesce(nullif(lower(trim(p_source)), ''), 'direct'), 40);
    v_vid TEXT := left(coalesce(nullif(trim(p_visitor_id), ''), 'live-' || gen_random_uuid()::text), 80);
    v_lecture TEXT;
BEGIN
    SELECT * INTO v_s FROM public.live_sessions WHERE id = p_session_id LIMIT 1;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', false, 'message', 'Live session not found.');
    END IF;

    -- Resolve user from active session or email link ?u= parameter (validated against auth.users)
    IF auth.uid() IS NOT NULL THEN
        v_uid := auth.uid();
    ELSIF p_user_id IS NOT NULL AND EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p_user_id) THEN
        v_uid := p_user_id;
    END IF;

    v_lecture := public.live_lecture_of(v_s.module_id, v_s.starts_at);

    -- Always record a site_events click (captures both identified AND anonymous/guest joins!)
    INSERT INTO public.site_events (
        visitor_id, user_id, event_type, path, target_url, label, category, source, is_app, device_type, meta
    ) VALUES (
        v_vid,
        v_uid,
        'live_join_click',
        '/live/join/' || v_s.id::text,
        v_s.meet_link,
        v_s.title,
        'live_class',
        v_src,
        coalesce(p_is_app, false),
        left(coalesce(nullif(trim(p_device), ''), 'unknown'), 20),
        jsonb_build_object('session_id', v_s.id, 'lecture', v_lecture, 'identified', v_uid IS NOT NULL)
    );

    -- If we know the learner (signed-in or personalized email link), record attendance in learn_events
    IF v_uid IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.learn_events ev
            WHERE ev.user_id = v_uid
              AND ev.event_type = 'live_joined'
              AND ev.item_id = v_s.id::text
              AND coalesce(ev.payload->>'source', '') = v_src
        ) THEN
            INSERT INTO public.learn_events (user_id, course_slug, event_type, item_id, payload, device)
            VALUES (
                v_uid,
                v_s.course_slug,
                'live_joined',
                v_s.id::text,
                jsonb_build_object(
                    'lecture', v_lecture,
                    'method', CASE WHEN v_src = 'app' THEN 'join_click' ELSE 'tracked_link' END,
                    'source', v_src,
                    'title', v_s.title,
                    'starts_at', v_s.starts_at
                ),
                left(coalesce(nullif(trim(p_device), ''), 'web'), 40)
            );
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'ok', true,
        'id', v_s.id,
        'title', v_s.title,
        'host_name', v_s.host_name,
        'starts_at', v_s.starts_at,
        'ends_at', v_s.ends_at,
        'meet_link', v_s.meet_link,
        'recording_url', v_s.recording_url,
        'tracked_as_user', v_uid IS NOT NULL
    );
END $$;
GRANT EXECUTE ON FUNCTION public.resolve_and_track_live_join(UUID, UUID, TEXT, TEXT, TEXT, BOOLEAN) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_mark_live_attendance(p_session_id UUID, p_emails TEXT[])
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_s public.live_sessions;
    v_lecture TEXT;
    v_email TEXT;
    v_uid UUID;
    v_matched INT := 0;
    v_added INT := 0;
    v_unmatched TEXT[] := '{}';
BEGIN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
    SELECT * INTO v_s FROM public.live_sessions WHERE id = p_session_id LIMIT 1;
    IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'message', 'Session not found.'); END IF;

    v_lecture := public.live_lecture_of(v_s.module_id, v_s.starts_at);

    FOREACH v_email IN ARRAY coalesce(p_emails, '{}'::text[]) LOOP
        v_email := lower(trim(coalesce(v_email, '')));
        IF v_email = '' THEN CONTINUE; END IF;

        SELECT u.id INTO v_uid FROM auth.users u WHERE lower(u.email) = v_email LIMIT 1;
        IF v_uid IS NULL THEN
            SELECT p.id INTO v_uid FROM public.profiles p WHERE lower(p.email) = v_email LIMIT 1;
        END IF;

        IF v_uid IS NULL THEN
            v_unmatched := array_append(v_unmatched, v_email);
        ELSE
            v_matched := v_matched + 1;
            IF NOT EXISTS (
                SELECT 1 FROM public.learn_events ev
                WHERE ev.user_id = v_uid AND ev.event_type = 'live_joined' AND ev.item_id = v_s.id::text
            ) THEN
                INSERT INTO public.learn_events (user_id, course_slug, event_type, item_id, payload, device)
                VALUES (
                    v_uid, v_s.course_slug, 'live_joined', v_s.id::text,
                    jsonb_build_object('lecture', v_lecture, 'method', 'admin_marked', 'source', 'admin_marked', 'title', v_s.title, 'starts_at', v_s.starts_at),
                    'admin'
                );
                v_added := v_added + 1;
            END IF;
        END IF;
    END LOOP;

    RETURN jsonb_build_object('ok', true, 'matched', v_matched, 'added', v_added, 'unmatched', to_jsonb(v_unmatched));
END $$;
GRANT EXECUTE ON FUNCTION public.admin_mark_live_attendance(UUID, TEXT[]) TO authenticated;

NOTIFY pgrst, 'reload schema';
