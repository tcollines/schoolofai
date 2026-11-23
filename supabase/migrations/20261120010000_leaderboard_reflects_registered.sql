-- =============================================================================
-- 1. Remove the 4 legacy seed/test placeholder rows from staff_members
--    (all unlinked, 0 registrations, 0 profiles, 0 leads, 0 clicks).
-- 2. Update staff_scores, staff_leaderboard, staff_my_stats, and admin_learn_stats
--    so the Leaderboard accurately reflects every agent's total registered students
--    (e.g. 76 for Kasozi Elvis, 2 for Mugasha Isaac) and ranks by registered count.
-- =============================================================================

DELETE FROM public.staff_members s
WHERE s.staff_code IN ('WSI-STF-002', 'WSI-STF-003', 'WSI-STF-004', 'WSI-STF-005')
  AND s.user_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM public.staff_registrations r WHERE r.registered_by_staff_id = s.id)
  AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.registered_by_staff_id = s.id OR p.referred_by_staff_id = s.id);

-- Update staff_scores: registered = deduplicated total students brought in (field regs + link-only profiles)
CREATE OR REPLACE FUNCTION public.staff_scores(p_course TEXT DEFAULT 'ai-fundamentals')
RETURNS TABLE (staff_id UUID, display_name TEXT, staff_code TEXT, clicks BIGINT, registered BIGINT,
               signups BIGINT, started BIGINT, completed BIGINT, points BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT s.id, s.display_name, s.staff_code,
           (SELECT count(*) FROM public.referral_clicks c WHERE c.staff_id = s.id),
           (
               (SELECT count(*) FROM public.staff_registrations r WHERE r.registered_by_staff_id = s.id)
               +
               (SELECT count(*) FROM public.profiles p
                 WHERE coalesce(p.registered_by_staff_id, p.referred_by_staff_id) = s.id
                   AND NOT EXISTS (
                       SELECT 1 FROM public.staff_registrations r2
                       WHERE r2.profile_id = p.id
                          OR (r2.email IS NOT NULL AND p.email IS NOT NULL AND lower(r2.email) = lower(p.email))
                   ))
           ) AS registered,
           sig.signups, sig.started, sig.completed,
           (
               (SELECT count(*) FROM public.staff_registrations r WHERE r.registered_by_staff_id = s.id)
               + sig.signups + sig.started * 2 + sig.completed * 5
           ) AS points
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

-- Update staff_my_stats: rank ordered by registered DESC, points DESC
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
    SELECT count(*) + 1 INTO v_rank
      FROM public.staff_scores(p_course) x
     WHERE x.registered > me.registered
        OR (x.registered = me.registered AND x.points > me.points);
    SELECT count(*) INTO v_total FROM public.staff_scores(p_course);
    RETURN jsonb_build_object(
        'clicks', me.clicks, 'registered', me.registered, 'signups', me.signups,
        'started', me.started, 'completed', me.completed, 'points', me.points,
        'rank', v_rank, 'staff_total', v_total
    );
END $$;
GRANT EXECUTE ON FUNCTION public.staff_my_stats(TEXT) TO authenticated;

-- Update staff_leaderboard: return registered + started + signups + completed + points, ranked by registered DESC
CREATE OR REPLACE FUNCTION public.staff_leaderboard(p_course TEXT DEFAULT 'ai-fundamentals')
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    IF public.current_staff_id() IS NULL AND NOT (public.is_admin() OR public.is_agent_supervisor()) THEN
        RAISE EXCEPTION 'not a staff member';
    END IF;
    RETURN coalesce((
        SELECT jsonb_agg(jsonb_build_object(
                   'id', t.staff_id,
                   'display_name', t.display_name,
                   'registered', t.registered,
                   'signups', t.signups,
                   'started', t.started,
                   'completed', t.completed,
                   'points', t.points,
                   'is_me', t.staff_id = public.current_staff_id())
                   ORDER BY t.registered DESC, t.signups DESC, t.completed DESC, t.display_name ASC)
        FROM (
            SELECT * FROM public.staff_scores(p_course)
            ORDER BY registered DESC, signups DESC, completed DESC, display_name ASC
            LIMIT 20
        ) t
    ), '[]'::jsonb);
END $$;
GRANT EXECUTE ON FUNCTION public.staff_leaderboard(TEXT) TO authenticated;

-- Update admin_learn_stats leaderboard ordering to rank by registered DESC, points DESC
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
                       'started', t.started, 'completed', t.completed, 'points', t.points)
                       ORDER BY t.registered DESC, t.points DESC, t.display_name ASC)
            FROM public.staff_scores(p_course) t
            WHERE t.clicks > 0 OR t.signups > 0 OR t.registered > 0), '[]'::jsonb)
    ) INTO r;
    RETURN r;
END $$;
GRANT EXECUTE ON FUNCTION public.admin_learn_stats(TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';
