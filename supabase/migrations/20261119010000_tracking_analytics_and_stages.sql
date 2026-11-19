-- =============================================================================
-- Comprehensive Tracking, Live-Join Attribution, Course Stage Drill-Down & Site Analytics
-- Additive only: new site_events table + new RPCs; no existing tables or rows modified.
-- =============================================================================

-- 1. First-party Site, App & Outbound Link Events -----------------------------
CREATE TABLE IF NOT EXISTS public.site_events (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    visitor_id TEXT NOT NULL,
    session_id TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,          -- page_view | app_launch | outbound_click | cta_click | live_join_click
    path TEXT,
    target_url TEXT,
    label TEXT,
    category TEXT,                     -- navigation | welile_tech | whatsapp | live_class | calendar | cta | external | install
    source TEXT,                       -- website | app | email | whatsapp | calendar | direct | outreach | referral
    referrer TEXT,
    is_app BOOLEAN NOT NULL DEFAULT false,
    device_type TEXT,                  -- mobile | tablet | desktop
    meta JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_site_events_created ON public.site_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_events_type_created ON public.site_events (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_events_cat_created ON public.site_events (category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_events_visitor ON public.site_events (visitor_id);
CREATE INDEX IF NOT EXISTS idx_site_events_path ON public.site_events (path);

ALTER TABLE public.site_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.site_events FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS site_events_admin_select ON public.site_events;
CREATE POLICY site_events_admin_select ON public.site_events FOR SELECT USING (public.is_admin());

-- 2. Public Event Ingestion RPC (anon + authenticated, safely clamped) --------
CREATE OR REPLACE FUNCTION public.track_site_event(
    p_visitor_id TEXT,
    p_session_id TEXT DEFAULT NULL,
    p_event_type TEXT DEFAULT 'page_view',
    p_path TEXT DEFAULT NULL,
    p_target_url TEXT DEFAULT NULL,
    p_label TEXT DEFAULT NULL,
    p_category TEXT DEFAULT NULL,
    p_source TEXT DEFAULT NULL,
    p_referrer TEXT DEFAULT NULL,
    p_is_app BOOLEAN DEFAULT false,
    p_device_type TEXT DEFAULT NULL,
    p_meta JSONB DEFAULT '{}'::jsonb
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_vid TEXT := left(nullif(trim(coalesce(p_visitor_id, '')), ''), 80);
    v_type TEXT := left(nullif(trim(coalesce(p_event_type, '')), ''), 40);
BEGIN
    IF v_vid IS NULL OR v_type IS NULL THEN RETURN FALSE; END IF;
    IF v_type NOT IN ('page_view', 'app_launch', 'outbound_click', 'cta_click', 'live_join_click', 'install_prompt', 'install_accepted') THEN
        RETURN FALSE;
    END IF;

    INSERT INTO public.site_events (
        visitor_id, session_id, user_id, event_type, path, target_url, label,
        category, source, referrer, is_app, device_type, meta
    ) VALUES (
        v_vid,
        left(nullif(trim(coalesce(p_session_id, '')), ''), 80),
        auth.uid(),
        v_type,
        left(nullif(trim(coalesce(p_path, '')), ''), 240),
        left(nullif(trim(coalesce(p_target_url, '')), ''), 500),
        left(nullif(trim(coalesce(p_label, '')), ''), 160),
        left(nullif(trim(coalesce(p_category, '')), ''), 40),
        left(nullif(trim(coalesce(p_source, '')), ''), 60),
        left(nullif(trim(coalesce(p_referrer, '')), ''), 180),
        coalesce(p_is_app, false),
        left(nullif(trim(coalesce(p_device_type, '')), ''), 20),
        coalesce(p_meta, '{}'::jsonb)
    );
    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
END $$;
GRANT EXECUTE ON FUNCTION public.track_site_event(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT, JSONB) TO anon, authenticated;

-- 3. Tracked Live-Class Join Redirect RPC (tracks email, WhatsApp, calendar, app & guest joins)
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

    v_lecture := coalesce(
        CASE
            WHEN lower(coalesce(v_s.module_id, '')) ~ '(m0|m1|m2)' THEN 'lecture-1'
            WHEN lower(coalesce(v_s.module_id, '')) ~ '(m3|m4)' THEN 'lecture-2'
            WHEN lower(coalesce(v_s.module_id, '')) ~ '(m5|m6)' THEN 'lecture-3'
            ELSE NULL
        END,
        public.live_lecture_for(v_s.starts_at)
    );

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

-- 4. Admin Manual Live Attendance Check-In (credit Meet attendees by email) ---
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

    v_lecture := coalesce(
        CASE
            WHEN lower(coalesce(v_s.module_id, '')) ~ '(m0|m1|m2)' THEN 'lecture-1'
            WHEN lower(coalesce(v_s.module_id, '')) ~ '(m3|m4)' THEN 'lecture-2'
            WHEN lower(coalesce(v_s.module_id, '')) ~ '(m5|m6)' THEN 'lecture-3'
            ELSE NULL
        END,
        public.live_lecture_for(v_s.starts_at)
    );

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

-- 5. Admin Per-Session Live Attendance & Clicks Breakdown ---------------------
CREATE OR REPLACE FUNCTION public.admin_live_attendance(p_course TEXT DEFAULT 'ai-fundamentals')
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
    RETURN coalesce((
        SELECT jsonb_agg(row ORDER BY starts_at DESC) FROM (
            SELECT
                s.starts_at,
                jsonb_build_object(
                    'session_id', s.id,
                    'title', s.title,
                    'starts_at', s.starts_at,
                    'ends_at', s.ends_at,
                    'host_name', s.host_name,
                    'meet_link', s.meet_link,
                    'is_published', s.is_published,
                    'identified_count', (
                        SELECT count(DISTINCT ev.user_id)
                        FROM public.learn_events ev
                        WHERE ev.course_slug = p_course AND ev.event_type = 'live_joined' AND ev.item_id = s.id::text
                    ),
                    'guest_clicks', (
                        SELECT count(DISTINCT se.visitor_id)
                        FROM public.site_events se
                        WHERE se.event_type = 'live_join_click'
                          AND se.user_id IS NULL
                          AND se.meta->>'session_id' = s.id::text
                    ),
                    'total_clicks', (
                        SELECT count(*)
                        FROM public.site_events se
                        WHERE se.event_type = 'live_join_click'
                          AND se.meta->>'session_id' = s.id::text
                    ),
                    'by_source', coalesce((
                        SELECT jsonb_object_agg(src, cnt) FROM (
                            SELECT src, count(*) AS cnt FROM (
                                SELECT coalesce(ev.payload->>'source', ev.payload->>'method', 'app') AS src
                                FROM public.learn_events ev
                                WHERE ev.course_slug = p_course AND ev.event_type = 'live_joined' AND ev.item_id = s.id::text
                                UNION ALL
                                SELECT coalesce(se.source, 'direct') || ' (guest)' AS src
                                FROM public.site_events se
                                WHERE se.event_type = 'live_join_click' AND se.user_id IS NULL AND se.meta->>'session_id' = s.id::text
                            ) all_src
                            GROUP BY 1
                        ) grouped_src
                    ), '{}'::jsonb),
                    'attendees', coalesce((
                        SELECT jsonb_agg(att ORDER BY att->>'joined_at' DESC) FROM (
                            SELECT DISTINCT ON (ev.user_id)
                                jsonb_build_object(
                                    'user_id', ev.user_id,
                                    'name', coalesce(nullif(p.full_name, ''), split_part(coalesce(u.email, ''), '@', 1), 'Learner'),
                                    'email', coalesce(p.email, u.email),
                                    'phone', p.phone,
                                    'source', coalesce(ev.payload->>'source', ev.payload->>'method', 'app'),
                                    'method', coalesce(ev.payload->>'method', 'join_click'),
                                    'joined_at', ev.created_at
                                ) AS att
                            FROM public.learn_events ev
                            LEFT JOIN public.profiles p ON p.id = ev.user_id
                            LEFT JOIN auth.users u ON u.id = ev.user_id
                            WHERE ev.course_slug = p_course AND ev.event_type = 'live_joined' AND ev.item_id = s.id::text
                            ORDER BY ev.user_id, ev.created_at ASC
                        ) dedup_att
                    ), '[]'::jsonb)
                ) AS row
            FROM public.live_sessions s
            WHERE s.course_slug = p_course
        ) x
    ), '[]'::jsonb);
END $$;
GRANT EXECUTE ON FUNCTION public.admin_live_attendance(TEXT) TO authenticated;

-- 6. Detailed Course Stage Student Explorer RPC -------------------------------
CREATE OR REPLACE FUNCTION public.admin_course_stage_students(p_course TEXT DEFAULT 'ai-fundamentals')
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_total_items INT;
BEGIN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
    SELECT coalesce(array_length(required_item_ids, 1), 38) INTO v_total_items
    FROM public.learn_course_requirements WHERE course_slug = p_course;
    v_total_items := coalesce(v_total_items, 38);

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
            SELECT g.registered_at,
                jsonb_build_object(
                    'key', g.key,
                    'user_id', u.id,
                    'name', coalesce(nullif(g.name, ''), nullif(pr.full_name, ''), split_part(coalesce(g.email, ''), '@', 1), ''),
                    'email', g.email,
                    'phone', coalesce(g.phone, nullif(regexp_replace(coalesce(pr.phone, ''), '\D', '', 'g'), '')),
                    'location', coalesce(g.location, pr.location),
                    'sources', to_jsonb(g.sources),
                    'agent', g.agent,
                    'registered_at', g.registered_at,
                    'enrolled_at', en.enrolled_at,
                    'has_account', u.id IS NOT NULL,
                    'items_done', coalesce(prog.items_done, 0),
                    'total_items', v_total_items,
                    'progress_pct', least(100, round(100.0 * coalesce(prog.items_done, 0) / greatest(v_total_items, 1))::int),
                    'highest_module', prog.highest_module,
                    'modules_touched', coalesce(prog.modules_touched, '[]'::jsonb),
                    'quizzes_passed', coalesce(qz.quizzes_passed, 0),
                    'final_passed', coalesce(fin.passed, false),
                    'final_score', fin.best_score,
                    'certificate_id', cert.id,
                    'certificate_issued_at', cert.issued_at,
                    'live_count', coalesce(lv.live_count, 0),
                    'live_sources', coalesce(lv.live_sources, '[]'::jsonb),
                    'app_installed', coalesce(app_ev.installed, false),
                    'stage', CASE
                        WHEN cert.id IS NOT NULL THEN 'Completed'
                        WHEN coalesce(fin.passed, false) THEN 'Passed final'
                        WHEN coalesce(lv.live_count, 0) > 0 THEN 'Joined live'
                        WHEN coalesce(prog.items_done, 0) > 0 OR coalesce(prog.any_progress, false) THEN 'Studying'
                        WHEN en.user_id IS NOT NULL THEN 'In course'
                        WHEN u.id IS NOT NULL THEN 'Account opened'
                        ELSE 'Registered'
                    END,
                    'last_active', coalesce(last_ev.last_at, prog.last_at, en.enrolled_at),
                    'followup', coalesce(f.status, 'new'),
                    'note', f.note,
                    'followup_at', f.updated_at
                ) AS row
            FROM grouped g
            LEFT JOIN auth.users u ON lower(u.email) = g.email
            LEFT JOIN public.profiles pr ON pr.id = u.id
            LEFT JOIN public.learn_enrollments en ON en.user_id = u.id AND en.course_slug = p_course
            LEFT JOIN public.learn_certificates cert ON cert.user_id = u.id AND cert.course_slug = p_course AND cert.status = 'valid'
            LEFT JOIN LATERAL (
                SELECT
                    count(*) FILTER (WHERE lp.status = 'completed') AS items_done,
                    count(*) > 0 AS any_progress,
                    max(lp.module_id) FILTER (WHERE lp.module_id ~ '^m[0-6]$') AS highest_module,
                    jsonb_agg(DISTINCT lp.module_id) FILTER (WHERE lp.module_id ~ '^m[0-6]$') AS modules_touched,
                    max(lp.updated_at) AS last_at
                FROM public.learn_progress lp
                WHERE lp.user_id = u.id AND lp.course_slug = p_course
            ) prog ON u.id IS NOT NULL
            LEFT JOIN LATERAL (
                SELECT count(DISTINCT qa.quiz_id) FILTER (WHERE qa.passed AND qa.quiz_id <> 'final') AS quizzes_passed
                FROM public.learn_quiz_attempts qa
                WHERE qa.user_id = u.id AND qa.course_slug = p_course
            ) qz ON u.id IS NOT NULL
            LEFT JOIN LATERAL (
                SELECT bool_or(fa.passed) AS passed, max(fa.percentage) AS best_score
                FROM public.learn_final_attempts fa
                WHERE fa.user_id = u.id AND fa.course_slug = p_course AND fa.submitted_at IS NOT NULL
            ) fin ON u.id IS NOT NULL
            LEFT JOIN LATERAL (
                SELECT
                    count(DISTINCT coalesce(ev.item_id, ev.payload->>'lecture', ev.id::text)) AS live_count,
                    jsonb_agg(DISTINCT coalesce(ev.payload->>'source', ev.payload->>'method', 'app')) AS live_sources
                FROM public.learn_events ev
                WHERE ev.user_id = u.id AND ev.course_slug = p_course AND ev.event_type = 'live_joined'
            ) lv ON u.id IS NOT NULL
            LEFT JOIN LATERAL (
                SELECT EXISTS (
                    SELECT 1 FROM public.learn_events ev
                    WHERE ev.user_id = u.id AND ev.event_type IN ('app_installed', 'app_opened')
                ) AS installed
            ) app_ev ON u.id IS NOT NULL
            LEFT JOIN LATERAL (
                SELECT max(ev.created_at) AS last_at
                FROM public.learn_events ev
                WHERE ev.user_id = u.id AND ev.course_slug = p_course
            ) last_ev ON u.id IS NOT NULL
            LEFT JOIN public.registration_followups f ON f.key = g.key
            LIMIT 3000
        ) t
    ), '[]'::jsonb);
END $$;
GRANT EXECUTE ON FUNCTION public.admin_course_stage_students(TEXT) TO authenticated;

-- 7. Site, App & Outbound Links Analytics RPC ---------------------------------
CREATE OR REPLACE FUNCTION public.admin_site_analytics(p_days INT DEFAULT 30)
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_since TIMESTAMPTZ := CASE WHEN p_days IS NULL THEN NULL ELSE now() - (p_days || ' days')::interval END;
    v_trend_days INT := least(coalesce(p_days, 30), 30);
BEGIN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;

    RETURN (
        WITH ev AS (
            SELECT * FROM public.site_events
            WHERE v_since IS NULL OR created_at >= v_since
        ),
        daily_series AS (
            SELECT g.day::date AS day
            FROM generate_series(
                ((now() AT TIME ZONE 'Africa/Kampala')::date - (greatest(v_trend_days, 7) - 1)),
                (now() AT TIME ZONE 'Africa/Kampala')::date,
                interval '1 day'
            ) AS g(day)
        )
        SELECT jsonb_build_object(
            'overview', jsonb_build_object(
                'total_page_views',     (SELECT count(*) FROM ev WHERE event_type = 'page_view'),
                'unique_visitors',      (SELECT count(DISTINCT visitor_id) FROM ev),
                'signed_in_visitors',   (SELECT count(DISTINCT user_id) FROM ev WHERE user_id IS NOT NULL),
                'website_visitors',     (SELECT count(DISTINCT visitor_id) FROM ev WHERE NOT is_app),
                'app_visitors',         (SELECT count(DISTINCT visitor_id) FROM ev WHERE is_app),
                'app_launches',         (SELECT count(*) FROM ev WHERE event_type = 'app_launch'),
                'total_clicks',         (SELECT count(*) FROM ev WHERE event_type IN ('outbound_click', 'cta_click', 'live_join_click')),
                'welile_tech_clicks',   (SELECT count(*) FROM ev WHERE category = 'welile_tech' OR lower(coalesce(target_url, '')) LIKE '%welile.com%'),
                'welile_tech_unique',   (SELECT count(DISTINCT visitor_id) FROM ev WHERE category = 'welile_tech' OR lower(coalesce(target_url, '')) LIKE '%welile.com%'),
                'whatsapp_clicks',      (SELECT count(*) FROM ev WHERE category = 'whatsapp' OR lower(coalesce(target_url, '')) LIKE '%wa.me%' OR lower(coalesce(target_url, '')) LIKE '%whatsapp%'),
                'live_link_clicks',     (SELECT count(*) FROM ev WHERE event_type = 'live_join_click' OR category = 'live_class'),
                'live_link_unique',     (SELECT count(DISTINCT coalesce(user_id::text, visitor_id)) FROM ev WHERE event_type = 'live_join_click' OR category = 'live_class'),
                'cta_clicks',           (SELECT count(*) FROM ev WHERE event_type = 'cta_click'),
                'hist_app_installed',   (SELECT count(DISTINCT user_id) FROM public.learn_events WHERE event_type IN ('app_installed', 'app_opened') AND (v_since IS NULL OR created_at >= v_since)),
                'hist_app_opened',      (SELECT count(DISTINCT user_id) FROM public.learn_events WHERE event_type = 'app_opened' AND (v_since IS NULL OR created_at >= v_since)),
                'hist_referral_clicks', (SELECT count(*) FROM public.referral_clicks WHERE v_since IS NULL OR created_at >= v_since)
            ),
            'devices', coalesce((
                SELECT jsonb_object_agg(dev, cnt) FROM (
                    SELECT coalesce(nullif(device_type, ''), 'unknown') AS dev, count(DISTINCT visitor_id) AS cnt
                    FROM ev GROUP BY 1
                ) d
            ), '{}'::jsonb),
            'daily', coalesce((
                SELECT jsonb_agg(jsonb_build_object(
                    'day', to_char(ds.day, 'Mon DD'),
                    'iso', ds.day::text,
                    'views', coalesce(a.views, 0),
                    'visitors', coalesce(a.visitors, 0),
                    'app_views', coalesce(a.app_views, 0),
                    'clicks', coalesce(a.clicks, 0),
                    'welile_clicks', coalesce(a.welile_clicks, 0)
                ) ORDER BY ds.day)
                FROM daily_series ds
                LEFT JOIN (
                    SELECT
                        (created_at AT TIME ZONE 'Africa/Kampala')::date AS d,
                        count(*) FILTER (WHERE event_type = 'page_view') AS views,
                        count(DISTINCT visitor_id) AS visitors,
                        count(*) FILTER (WHERE is_app AND event_type IN ('page_view', 'app_launch')) AS app_views,
                        count(*) FILTER (WHERE event_type IN ('outbound_click', 'cta_click', 'live_join_click')) AS clicks,
                        count(*) FILTER (WHERE category = 'welile_tech' OR lower(coalesce(target_url, '')) LIKE '%welile.com%') AS welile_clicks
                    FROM ev GROUP BY 1
                ) a ON a.d = ds.day
            ), '[]'::jsonb),
            'top_pages', coalesce((
                SELECT jsonb_agg(jsonb_build_object(
                    'path', path, 'views', views, 'unique_visitors', uniq, 'app_views', app_v
                ) ORDER BY views DESC) FROM (
                    SELECT coalesce(nullif(path, ''), '/') AS path,
                           count(*) AS views,
                           count(DISTINCT visitor_id) AS uniq,
                           count(*) FILTER (WHERE is_app) AS app_v
                    FROM ev WHERE event_type = 'page_view'
                    GROUP BY 1 ORDER BY 2 DESC LIMIT 20
                ) p
            ), '[]'::jsonb),
            'outbound_links', coalesce((
                SELECT jsonb_agg(jsonb_build_object(
                    'label', label, 'target_url', target_url, 'category', category, 'clicks', clicks, 'unique_visitors', uniq
                ) ORDER BY clicks DESC) FROM (
                    SELECT coalesce(nullif(label, ''), target_url, 'External link') AS label,
                           coalesce(target_url, '') AS target_url,
                           coalesce(nullif(category, ''), 'external') AS category,
                           count(*) AS clicks,
                           count(DISTINCT visitor_id) AS uniq
                    FROM ev
                    WHERE event_type IN ('outbound_click', 'live_join_click')
                    GROUP BY 1, 2, 3 ORDER BY 4 DESC LIMIT 25
                ) o
            ), '[]'::jsonb),
            'top_ctas', coalesce((
                SELECT jsonb_agg(jsonb_build_object(
                    'label', label, 'category', category, 'path', path, 'clicks', clicks, 'unique_visitors', uniq
                ) ORDER BY clicks DESC) FROM (
                    SELECT coalesce(nullif(label, ''), 'Action') AS label,
                           coalesce(nullif(category, ''), 'cta') AS category,
                           coalesce(nullif(path, ''), '/') AS path,
                           count(*) AS clicks,
                           count(DISTINCT visitor_id) AS uniq
                    FROM ev
                    WHERE event_type = 'cta_click'
                    GROUP BY 1, 2, 3 ORDER BY 4 DESC LIMIT 20
                ) c
            ), '[]'::jsonb),
            'referrers', coalesce((
                SELECT jsonb_agg(jsonb_build_object(
                    'referrer', ref, 'visits', visits, 'unique_visitors', uniq
                ) ORDER BY visits DESC) FROM (
                    SELECT coalesce(nullif(referrer, ''), 'Direct / Bookmark') AS ref,
                           count(*) AS visits,
                           count(DISTINCT visitor_id) AS uniq
                    FROM ev WHERE event_type = 'page_view'
                    GROUP BY 1 ORDER BY 2 DESC LIMIT 15
                ) r
            ), '[]'::jsonb),
            'recent_clicks', coalesce((
                SELECT jsonb_agg(jsonb_build_object(
                    'id', e.id,
                    'created_at', e.created_at,
                    'event_type', e.event_type,
                    'label', e.label,
                    'category', e.category,
                    'target_url', e.target_url,
                    'path', e.path,
                    'source', e.source,
                    'is_app', e.is_app,
                    'device_type', e.device_type,
                    'user_name', coalesce(pr.full_name, split_part(coalesce(u.email, ''), '@', 1))
                ) ORDER BY e.created_at DESC) FROM (
                    SELECT * FROM ev
                    WHERE event_type IN ('outbound_click', 'cta_click', 'live_join_click', 'app_launch')
                    ORDER BY created_at DESC LIMIT 35
                ) e
                LEFT JOIN public.profiles pr ON pr.id = e.user_id
                LEFT JOIN auth.users u ON u.id = e.user_id
            ), '[]'::jsonb)
        )
    );
END $$;
GRANT EXECUTE ON FUNCTION public.admin_site_analytics(INT) TO authenticated;

NOTIFY pgrst, 'reload schema';
