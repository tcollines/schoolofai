-- Admin dashboard summary: one cheap call for the landing page cards. Read-only.
CREATE OR REPLACE FUNCTION public.admin_dashboard()
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
    RETURN jsonb_build_object(
        'students',      (SELECT count(*) FROM public.profiles),
        'new_today',     (SELECT count(*) FROM public.profiles WHERE created_at >= date_trunc('day', now())),
        'new_7d',        (SELECT count(*) FROM public.profiles WHERE created_at > now() - interval '7 days'),
        'active_7d',     (SELECT count(DISTINCT user_id) FROM public.learn_events WHERE created_at > now() - interval '7 days'),
        'enrolled',      (SELECT count(*) FROM public.learn_enrollments WHERE course_slug = 'ai-fundamentals'),
        'certificates',  (SELECT count(*) FROM public.learn_certificates WHERE status = 'valid'),
        'installs',      (SELECT count(DISTINCT user_id) FROM public.learn_events WHERE event_type = 'app_installed'),
        'live_joined',   (SELECT count(DISTINCT user_id) FROM public.learn_events WHERE event_type = 'live_joined'),
        'next_session',  (SELECT jsonb_build_object('title', title, 'starts_at', starts_at, 'meet_link', meet_link)
                            FROM public.live_sessions WHERE is_published AND ends_at > now() ORDER BY starts_at LIMIT 1),
        'sessions_ahead',(SELECT count(*) FROM public.live_sessions WHERE is_published AND ends_at > now()),
        'reminders_7d',  (SELECT count(*) FROM public.live_reminder_log WHERE status = 'sent' AND sent_at > now() - interval '7 days'),
        'opted_out',     (SELECT count(*) FROM public.live_reminder_prefs WHERE email_opt_in = false),
        'agents',        (SELECT count(*) FROM public.staff_members WHERE active AND user_id IS NOT NULL),
        'agent_regs_7d', (SELECT count(*) FROM public.staff_registrations WHERE created_at > now() - interval '7 days'),
        'leads_7d',      (SELECT count(*) FROM public.leads WHERE created_at > now() - interval '7 days'),
        'signups_daily', (SELECT jsonb_agg(coalesce(d.n, 0) ORDER BY g.day) FROM generate_series(current_date - 13, current_date, interval '1 day') AS g(day)
                           LEFT JOIN (SELECT created_at::date AS day, count(*) AS n FROM public.profiles GROUP BY 1) d ON d.day = g.day::date)
    );
END $$;
GRANT EXECUTE ON FUNCTION public.admin_dashboard() TO authenticated;
NOTIFY pgrst, 'reload schema';
