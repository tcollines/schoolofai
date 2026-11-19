-- =============================================================================
-- Comprehensive Pitch-Ready Traffic & Traction Analytics:
-- Counts EVERY visit (including multiple repeat visits per person per day),
-- total page views & interactions, unique visitors, returning visitor rate,
-- avg visits/person, repeat-visit frequency buckets, geographic reach across
-- Uganda, mobile-first share, and full pitch traction KPIs.
-- =============================================================================

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
        WITH
        se AS (
            SELECT * FROM public.site_events
            WHERE v_since IS NULL OR created_at >= v_since
        ),
        sess AS (
            SELECT
                s.id,
                s.user_id,
                s.created_at,
                CASE
                    WHEN lower(coalesce(s.user_agent, '')) ~ '(ipad|tablet|playbook|silk)' THEN 'tablet'
                    WHEN lower(coalesce(s.user_agent, '')) ~ '(mobi|iphone|ipod|android|opera mini|iemobile)' THEN 'mobile'
                    WHEN coalesce(trim(s.user_agent), '') <> '' THEN 'desktop'
                    ELSE NULL
                END AS device_type
            FROM auth.sessions s
            WHERE v_since IS NULL OR s.created_at >= v_since
        ),
        le AS (
            SELECT
                e.id,
                e.user_id,
                e.course_slug,
                e.event_type,
                e.item_id,
                e.payload,
                CASE
                    WHEN lower(coalesce(e.device, '')) IN ('mobile', 'tablet', 'desktop') THEN lower(e.device)
                    ELSE NULL
                END AS device_type,
                e.created_at
            FROM public.learn_events e
            WHERE v_since IS NULL OR e.created_at >= v_since
        ),
        enr AS (
            SELECT user_id, course_slug, source, enrolled_at
            FROM public.learn_enrollments
            WHERE v_since IS NULL OR enrolled_at >= v_since
        ),
        ld AS (
            SELECT id, email, source, course_slug, location, created_at
            FROM public.leads
            WHERE v_since IS NULL OR created_at >= v_since
        ),
        rc AS (
            SELECT id, staff_id, ref_code, landing, created_at
            FROM public.referral_clicks
            WHERE v_since IS NULL OR created_at >= v_since
        ),
        -- Distinct visits (1 person visiting 100x in a day = 100 visits!)
        visit_sessions AS (
            -- Live site/app visits: each distinct session_id (new page load or return after >=60s away)
            SELECT
                coalesce('u:' || user_id::text, 'v:' || visitor_id) AS person_key,
                'se:' || coalesce(nullif(session_id, ''), id::text) AS visit_key,
                min(created_at) AS visited_at,
                bool_or(is_app) AS is_app
            FROM se
            GROUP BY 1, 2
            UNION ALL
            -- Historical auth login sessions
            SELECT
                'u:' || user_id::text,
                'as:' || id::text,
                created_at,
                false
            FROM sess
            UNION ALL
            -- Historical course/app visits grouped into 30-min active sessions per user
            SELECT
                'u:' || user_id::text,
                'le:' || user_id::text || ':' || floor(extract(epoch FROM created_at) / 1800)::bigint::text,
                min(created_at),
                bool_or(event_type IN ('app_installed', 'app_opened'))
            FROM le
            GROUP BY 1, 2
            UNION ALL
            -- Website sign-up lead form visits
            SELECT
                'l:' || lower(email),
                'ld:' || id::text,
                created_at,
                false
            FROM ld
            UNION ALL
            -- Referral link clicks
            SELECT
                'rc:' || id::text,
                'rc:' || id::text,
                created_at,
                false
            FROM rc
        ),
        per_person_visits AS (
            SELECT person_key, count(*) AS visit_count
            FROM visit_sessions
            GROUP BY 1
        ),
        -- Unified page views, interactions & clicks stream
        unified AS (
            SELECT
                coalesce('u:' || user_id::text, 'v:' || visitor_id) AS person_key,
                user_id,
                created_at,
                is_app,
                device_type,
                CASE WHEN event_type IN ('page_view', 'app_launch') THEN 1 ELSE 0 END AS is_view,
                CASE WHEN event_type IN ('outbound_click', 'cta_click', 'live_join_click') THEN 1 ELSE 0 END AS is_click,
                CASE WHEN category = 'welile_tech' OR lower(coalesce(target_url, '')) LIKE '%welile.com%' THEN 1 ELSE 0 END AS is_welile
            FROM se
            UNION ALL
            SELECT 'u:' || user_id::text, user_id, created_at, false, device_type, 1, 0, 0 FROM sess
            UNION ALL
            SELECT
                'u:' || user_id::text,
                user_id,
                created_at,
                (event_type IN ('app_installed', 'app_opened')),
                device_type,
                1,
                CASE WHEN event_type IN ('app_install_clicked', 'live_joined') THEN 1 ELSE 0 END,
                0
            FROM le
            UNION ALL
            SELECT 'u:' || user_id::text, user_id, enrolled_at, false, NULL, 1, 0, 0 FROM enr
            UNION ALL
            SELECT 'l:' || lower(email), NULL::uuid, created_at, false, NULL, 1, 0, 0 FROM ld
            UNION ALL
            SELECT 'rc:' || id::text, NULL::uuid, created_at, false, NULL, 1, 1, 0 FROM rc
        ),
        daily_series AS (
            SELECT g.day::date AS day
            FROM generate_series(
                ((now() AT TIME ZONE 'Africa/Kampala')::date - (greatest(v_trend_days, 7) - 1)),
                (now() AT TIME ZONE 'Africa/Kampala')::date,
                interval '1 day'
            ) AS g(day)
        ),
        page_hits AS (
            SELECT coalesce(nullif(path, ''), '/') AS path,
                   coalesce('u:' || user_id::text, 'v:' || visitor_id) AS person_key,
                   is_app
            FROM se WHERE event_type = 'page_view'
            UNION ALL
            SELECT
                CASE event_type
                    WHEN 'live_joined' THEN '/learn/' || course_slug || '/live'
                    WHEN 'certificate_issued' THEN '/learn/' || course_slug || '/certificate'
                    WHEN 'app_opened' THEN '/learn/' || course_slug || ' (App)'
                    ELSE '/learn/' || course_slug
                END AS path,
                'u:' || user_id::text AS person_key,
                (event_type IN ('app_installed', 'app_opened')) AS is_app
            FROM le
            WHERE event_type IN ('enrolled', 'lesson_started', 'lesson_completed', 'quiz_submitted', 'live_joined', 'certificate_issued', 'app_opened')
            UNION ALL
            SELECT '/free/' || coalesce(nullif(course_slug, ''), 'ai-fundamentals'), 'l:' || lower(email), false
            FROM ld
        ),
        source_hits AS (
            SELECT coalesce(nullif(referrer, ''), CASE WHEN is_app THEN 'Installed App' ELSE 'Direct / Website' END) AS ref,
                   coalesce('u:' || user_id::text, 'v:' || visitor_id) AS person_key
            FROM se WHERE event_type = 'page_view'
            UNION ALL
            SELECT
                CASE lower(coalesce(source, 'website'))
                    WHEN 'staff_link' THEN 'Agent / Staff Link'
                    WHEN 'agent_link' THEN 'Agent / Staff Link'
                    WHEN 'agent_created' THEN 'Agent Registered'
                    WHEN 'direct' THEN 'Direct / Website'
                    WHEN 'website' THEN 'Direct / Website'
                    ELSE initcap(replace(source, '_', ' '))
                END,
                'u:' || user_id::text
            FROM enr
            UNION ALL
            SELECT
                CASE lower(coalesce(source, 'website'))
                    WHEN 'agent_link' THEN 'Agent / Staff Link'
                    WHEN 'website' THEN 'Direct / Website'
                    ELSE initcap(replace(source, '_', ' '))
                END,
                'l:' || lower(email)
            FROM ld
        ),
        device_counts AS (
            SELECT device_type AS dev, count(DISTINCT person_key) AS cnt
            FROM unified
            WHERE device_type IS NOT NULL AND device_type <> ''
            GROUP BY 1
        ),
        all_locations AS (
            SELECT initcap(trim(location)) AS loc FROM public.profiles WHERE coalesce(trim(location), '') <> ''
            UNION ALL
            SELECT initcap(trim(location)) AS loc FROM public.staff_registrations WHERE coalesce(trim(location), '') <> ''
            UNION ALL
            SELECT initcap(trim(location)) AS loc FROM public.leads WHERE coalesce(trim(location), '') <> ''
        ),
        totals AS (
            SELECT
                (SELECT count(*) FROM visit_sessions) AS total_visits,
                (SELECT count(*) FROM visit_sessions WHERE is_app) AS app_visits,
                (SELECT count(*) FROM visit_sessions WHERE NOT is_app) AS web_visits,
                (SELECT coalesce(sum(is_view), 0) FROM unified) AS total_views,
                (SELECT count(DISTINCT person_key) FROM unified) AS unique_visitors,
                (SELECT count(*) FROM per_person_visits WHERE visit_count >= 2) AS returning_visitors
        )
        SELECT jsonb_build_object(
            'tracking_since', '2026-11-19',
            'history_since', (
                SELECT to_char(min(ts) AT TIME ZONE 'Africa/Kampala', 'DD Mon YYYY')
                FROM (
                    SELECT min(created_at) AS ts FROM auth.sessions
                    UNION ALL SELECT min(created_at) FROM public.learn_events
                    UNION ALL SELECT min(created_at) FROM public.site_events
                ) t WHERE ts IS NOT NULL
            ),
            'overview', jsonb_build_object(
                'total_visits',           t.total_visits,
                'web_visits',             t.web_visits,
                'app_visits',             t.app_visits,
                'total_page_views',       t.total_views,
                'live_page_views',        (SELECT count(*) FROM se WHERE event_type = 'page_view'),
                'unique_visitors',        t.unique_visitors,
                'returning_visitors',     t.returning_visitors,
                'returning_rate_pct',     CASE WHEN t.unique_visitors > 0 THEN round(100.0 * t.returning_visitors / t.unique_visitors, 1) ELSE 0 END,
                'avg_visits_per_visitor', CASE WHEN t.unique_visitors > 0 THEN round(t.total_visits::numeric / t.unique_visitors, 2) ELSE 0 END,
                'avg_views_per_visit',    CASE WHEN t.total_visits > 0 THEN round(t.total_views::numeric / t.total_visits, 2) ELSE 0 END,
                'signed_in_visitors',     (SELECT count(DISTINCT user_id) FROM unified WHERE user_id IS NOT NULL),
                'guest_visitors',         (SELECT count(DISTINCT person_key) FROM unified WHERE user_id IS NULL),
                'website_visitors',       (SELECT count(DISTINCT person_key) FROM unified WHERE NOT is_app),
                'app_visitors',           (SELECT count(DISTINCT person_key) FROM unified WHERE is_app),
                'app_launches',           (SELECT count(*) FROM se WHERE event_type = 'app_launch') + (SELECT count(*) FROM le WHERE event_type = 'app_opened'),
                'total_clicks',           (SELECT count(*) FROM se WHERE event_type IN ('outbound_click', 'cta_click', 'live_join_click'))
                                        + (SELECT count(*) FROM le WHERE event_type IN ('app_install_clicked', 'live_joined'))
                                        + (SELECT count(*) FROM rc),
                'welile_tech_clicks',     (SELECT count(*) FROM se WHERE category = 'welile_tech' OR lower(coalesce(target_url, '')) LIKE '%welile.com%'),
                'welile_tech_unique',     (SELECT count(DISTINCT coalesce('u:' || user_id::text, 'v:' || visitor_id)) FROM se WHERE category = 'welile_tech' OR lower(coalesce(target_url, '')) LIKE '%welile.com%'),
                'whatsapp_clicks',        (SELECT count(*) FROM se WHERE category = 'whatsapp' OR lower(coalesce(target_url, '')) LIKE '%wa.me%' OR lower(coalesce(target_url, '')) LIKE '%whatsapp%'),
                'live_link_clicks',       (SELECT count(*) FROM se WHERE event_type = 'live_join_click' OR category = 'live_class')
                                        + (SELECT count(*) FROM le WHERE event_type = 'live_joined' AND coalesce(payload->>'method', '') = 'join_click'),
                'live_link_unique',       (SELECT count(DISTINCT k) FROM (
                                              SELECT coalesce('u:' || user_id::text, 'v:' || visitor_id) AS k FROM se WHERE event_type = 'live_join_click' OR category = 'live_class'
                                              UNION
                                              SELECT 'u:' || user_id::text AS k FROM le WHERE event_type = 'live_joined'
                                          ) lk),
                'cta_clicks',             (SELECT count(*) FROM se WHERE event_type = 'cta_click')
                                        + (SELECT count(*) FROM le WHERE event_type = 'app_install_clicked'),
                'hist_app_installed',     (SELECT count(DISTINCT user_id) FROM public.learn_events WHERE event_type IN ('app_installed', 'app_opened') AND (v_since IS NULL OR created_at >= v_since)),
                'hist_app_opened',        (SELECT count(DISTINCT user_id) FROM public.learn_events WHERE event_type = 'app_opened' AND (v_since IS NULL OR created_at >= v_since)),
                'hist_referral_clicks',   (SELECT count(*) FROM rc),
                'total_sessions',         (SELECT count(*) FROM sess)
            ),
            'pitch', jsonb_build_object(
                'total_accounts',       (SELECT count(*) FROM public.profiles),
                'agent_registrations',  (SELECT count(*) FROM public.staff_registrations),
                'outreach_invites',     (SELECT count(*) FROM public.outreach_free_course_invites),
                'enrolled_learners',    (SELECT count(*) FROM public.learn_enrollments),
                'active_7d',            (SELECT count(DISTINCT user_id) FROM public.learn_events WHERE created_at > now() - interval '7 days'),
                'active_30d',           (SELECT count(DISTINCT user_id) FROM public.learn_events WHERE created_at > now() - interval '30 days'),
                'lessons_completed',    (SELECT count(*) FROM public.learn_progress WHERE status = 'completed'),
                'quiz_attempts',        (SELECT count(*) FROM public.learn_quiz_attempts),
                'certificates_issued',  (SELECT count(*) FROM public.learn_certificates WHERE status = 'valid'),
                'total_app_installs',   (SELECT count(DISTINCT user_id) FROM public.learn_events WHERE event_type IN ('app_installed', 'app_opened')),
                'locations_count',      (SELECT count(DISTINCT loc) FROM all_locations),
                'mobile_share_pct',     coalesce((
                                            SELECT round(100.0 * coalesce(sum(cnt) FILTER (WHERE dev = 'mobile'), 0) / greatest(sum(cnt), 1), 1)
                                            FROM device_counts
                                        ), 0)
            ),
            'repeat_frequency', jsonb_build_array(
                jsonb_build_object('bucket', '1 visit',      'people', (SELECT count(*) FROM per_person_visits WHERE visit_count = 1)),
                jsonb_build_object('bucket', '2–3 visits',   'people', (SELECT count(*) FROM per_person_visits WHERE visit_count BETWEEN 2 AND 3)),
                jsonb_build_object('bucket', '4–9 visits',   'people', (SELECT count(*) FROM per_person_visits WHERE visit_count BETWEEN 4 AND 9)),
                jsonb_build_object('bucket', '10+ visits',   'people', (SELECT count(*) FROM per_person_visits WHERE visit_count >= 10))
            ),
            'top_locations', coalesce((
                SELECT jsonb_agg(jsonb_build_object('location', loc, 'people', cnt) ORDER BY cnt DESC) FROM (
                    SELECT loc, count(*) AS cnt FROM all_locations GROUP BY 1 ORDER BY 2 DESC LIMIT 12
                ) tl
            ), '[]'::jsonb),
            'devices', coalesce((
                SELECT jsonb_object_agg(dev, cnt) FROM device_counts
            ), '{}'::jsonb),
            'daily', coalesce((
                SELECT jsonb_agg(jsonb_build_object(
                    'day', to_char(ds.day, 'Mon DD'),
                    'iso', ds.day::text,
                    'visits', coalesce(vs.visits, 0),
                    'views', coalesce(a.views, 0),
                    'visitors', coalesce(a.visitors, 0),
                    'app_views', coalesce(a.app_views, 0),
                    'clicks', coalesce(a.clicks, 0),
                    'welile_clicks', coalesce(a.welile_clicks, 0)
                ) ORDER BY ds.day)
                FROM daily_series ds
                LEFT JOIN (
                    SELECT (visited_at AT TIME ZONE 'Africa/Kampala')::date AS d, count(*) AS visits
                    FROM visit_sessions GROUP BY 1
                ) vs ON vs.d = ds.day
                LEFT JOIN (
                    SELECT
                        (created_at AT TIME ZONE 'Africa/Kampala')::date AS d,
                        sum(is_view) AS views,
                        count(DISTINCT person_key) AS visitors,
                        count(*) FILTER (WHERE is_app) AS app_views,
                        sum(is_click) AS clicks,
                        sum(is_welile) AS welile_clicks
                    FROM unified GROUP BY 1
                ) a ON a.d = ds.day
            ), '[]'::jsonb),
            'top_pages', coalesce((
                SELECT jsonb_agg(jsonb_build_object(
                    'path', path, 'views', views, 'unique_visitors', uniq, 'app_views', app_v
                ) ORDER BY views DESC) FROM (
                    SELECT path,
                           count(*) AS views,
                           count(DISTINCT person_key) AS uniq,
                           count(*) FILTER (WHERE is_app) AS app_v
                    FROM page_hits
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
                           count(DISTINCT coalesce('u:' || user_id::text, 'v:' || visitor_id)) AS uniq
                    FROM se
                    WHERE event_type IN ('outbound_click', 'live_join_click')
                    GROUP BY 1, 2, 3 ORDER BY 4 DESC LIMIT 25
                ) o
            ), '[]'::jsonb),
            'top_ctas', coalesce((
                SELECT jsonb_agg(jsonb_build_object(
                    'label', label, 'category', category, 'path', path, 'clicks', clicks, 'unique_visitors', uniq
                ) ORDER BY clicks DESC) FROM (
                    SELECT label, category, path, count(*) AS clicks, count(DISTINCT pk) AS uniq FROM (
                        SELECT coalesce(nullif(label, ''), 'Action') AS label,
                               coalesce(nullif(category, ''), 'cta') AS category,
                               coalesce(nullif(path, ''), '/') AS path,
                               coalesce('u:' || user_id::text, 'v:' || visitor_id) AS pk
                        FROM se WHERE event_type = 'cta_click'
                        UNION ALL
                        SELECT 'Install App Button', 'install', '/learn/' || course_slug, 'u:' || user_id::text
                        FROM le WHERE event_type = 'app_install_clicked'
                    ) all_ctas
                    GROUP BY 1, 2, 3 ORDER BY 4 DESC LIMIT 20
                ) c
            ), '[]'::jsonb),
            'referrers', coalesce((
                SELECT jsonb_agg(jsonb_build_object(
                    'referrer', ref, 'visits', visits, 'unique_visitors', uniq
                ) ORDER BY visits DESC) FROM (
                    SELECT ref, count(*) AS visits, count(DISTINCT person_key) AS uniq
                    FROM source_hits
                    GROUP BY 1 ORDER BY 2 DESC LIMIT 15
                ) r
            ), '[]'::jsonb),
            'recent_clicks', coalesce((
                SELECT jsonb_agg(row ORDER BY created_at DESC) FROM (
                    SELECT created_at, row FROM (
                        SELECT e.created_at, jsonb_build_object(
                            'id', 'se-' || e.id::text,
                            'created_at', e.created_at,
                            'event_type', e.event_type,
                            'label', coalesce(e.label, e.event_type),
                            'category', e.category,
                            'target_url', e.target_url,
                            'path', e.path,
                            'source', e.source,
                            'is_app', e.is_app,
                            'device_type', e.device_type,
                            'user_name', coalesce(pr.full_name, split_part(coalesce(u.email, ''), '@', 1))
                        ) AS row
                        FROM se e
                        LEFT JOIN public.profiles pr ON pr.id = e.user_id
                        LEFT JOIN auth.users u ON u.id = e.user_id
                        WHERE e.event_type IN ('outbound_click', 'cta_click', 'live_join_click', 'app_launch')
                        UNION ALL
                        SELECT e.created_at, jsonb_build_object(
                            'id', 'le-' || e.id::text,
                            'created_at', e.created_at,
                            'event_type', e.event_type,
                            'label', CASE e.event_type
                                WHEN 'live_joined' THEN 'Joined Live Class: ' || coalesce(e.payload->>'title', 'Live session')
                                WHEN 'app_installed' THEN 'Installed Welile App'
                                WHEN 'app_opened' THEN 'Opened Installed App'
                                WHEN 'app_install_clicked' THEN 'Tapped Install App'
                                WHEN 'certificate_issued' THEN 'Earned Certificate'
                                ELSE initcap(replace(e.event_type, '_', ' '))
                            END,
                            'category', CASE e.event_type
                                WHEN 'live_joined' THEN 'live_class'
                                WHEN 'certificate_issued' THEN 'cta'
                                ELSE 'install'
                            END,
                            'target_url', NULL,
                            'path', '/learn/' || e.course_slug,
                            'source', coalesce(e.payload->>'source', e.payload->>'method', 'app'),
                            'is_app', (e.event_type IN ('app_installed', 'app_opened')),
                            'device_type', coalesce(e.device_type, 'mobile'),
                            'user_name', coalesce(pr.full_name, split_part(coalesce(u.email, ''), '@', 1))
                        ) AS row
                        FROM le e
                        LEFT JOIN public.profiles pr ON pr.id = e.user_id
                        LEFT JOIN auth.users u ON u.id = e.user_id
                        WHERE e.event_type IN ('live_joined', 'app_installed', 'app_opened', 'app_install_clicked', 'certificate_issued')
                    ) combined_recent
                    ORDER BY created_at DESC LIMIT 40
                ) rc
            ), '[]'::jsonb)
        )
        FROM totals t
    );
END $$;
GRANT EXECUTE ON FUNCTION public.admin_site_analytics(INT) TO authenticated;

NOTIFY pgrst, 'reload schema';
