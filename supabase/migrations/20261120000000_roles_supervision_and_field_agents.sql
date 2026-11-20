-- =============================================================================
-- Multi-Role Portal Launcher, Agent Supervision (Mugasha Isaac & tkwaniaye17),
-- and Non-Student Field-Only Agents (3-field quick registration workflow).
-- Additive & backwards-compatible.
-- =============================================================================

-- 1. Extend staff_members with agent_type and supervisor permission -----------
ALTER TABLE public.staff_members
    ADD COLUMN IF NOT EXISTS agent_type TEXT NOT NULL DEFAULT 'student_agent';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'staff_members_agent_type_check'
    ) THEN
        ALTER TABLE public.staff_members
            ADD CONSTRAINT staff_members_agent_type_check
            CHECK (agent_type IN ('student_agent', 'field_only'));
    END IF;
END $$;

ALTER TABLE public.staff_members
    ADD COLUMN IF NOT EXISTS can_supervise_agents BOOLEAN NOT NULL DEFAULT false;

-- Grant Agent Supervision specifically to Mugasha Isaac and tkwaniaye17@gmail.com
UPDATE public.staff_members
SET can_supervise_agents = true
WHERE user_id IN (
    SELECT id FROM auth.users
    WHERE lower(email) IN ('isaacmugasha@gmail.com', 'tkwaniaye17@gmail.com')
);

-- 2. Helper: is_agent_supervisor() --------------------------------------------
CREATE OR REPLACE FUNCTION public.is_agent_supervisor()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.staff_members s
        WHERE s.user_id = auth.uid()
          AND s.active = true
          AND s.can_supervise_agents = true
    );
$$;
GRANT EXECUTE ON FUNCTION public.is_agent_supervisor() TO authenticated;

-- 3. Unified Role Discovery RPC: my_portal_roles() ----------------------------
-- Returns the signed-in user's exact roles so login routes cleanly:
--   * Single-role student       -> /dashboard
--   * Field-only agent          -> /staff
--   * Multi-role user           -> /portal (Role Launcher cards)
CREATE OR REPLACE FUNCTION public.my_portal_roles()
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_email TEXT;
    v_name TEXT;
    v_profile_role TEXT;
    v_is_corporate BOOLEAN := false;
    v_staff public.staff_members;
    v_has_staff BOOLEAN := false;
    v_is_admin BOOLEAN := false;
    v_is_supervisor BOOLEAN := false;
    v_is_student BOOLEAN := true;
    v_role_count INT := 0;
    v_default_path TEXT := '/dashboard';
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('authenticated', false);
    END IF;

    SELECT lower(u.email) INTO v_email FROM auth.users u WHERE u.id = v_uid;
    SELECT p.full_name, p.role
      INTO v_name, v_profile_role
      FROM public.profiles p
     WHERE p.id = v_uid;

    v_is_admin := upper(coalesce(v_profile_role, '')) = 'ADMIN';
    v_is_corporate := upper(coalesce(v_profile_role, '')) = 'SPONSORED';

    SELECT * INTO v_staff
      FROM public.staff_members s
     WHERE s.user_id = v_uid AND s.active = true
     LIMIT 1;
    v_has_staff := FOUND;

    IF v_has_staff THEN
        v_is_supervisor := coalesce(v_staff.can_supervise_agents, false);
    END IF;

    -- Non-student field-only agents do NOT have a Student role
    IF (v_has_staff AND v_staff.agent_type = 'field_only') OR upper(coalesce(v_profile_role, '')) = 'FIELD_AGENT' THEN
        v_is_student := false;
    ELSE
        v_is_student := true;
    END IF;

    v_role_count :=
        (CASE WHEN v_is_student THEN 1 ELSE 0 END) +
        (CASE WHEN v_has_staff THEN 1 ELSE 0 END) +
        (CASE WHEN v_is_supervisor THEN 1 ELSE 0 END) +
        (CASE WHEN v_is_admin THEN 1 ELSE 0 END) +
        (CASE WHEN v_is_corporate THEN 1 ELSE 0 END);

    IF v_role_count >= 2 THEN
        v_default_path := '/portal';
    ELSIF NOT v_is_student AND v_has_staff THEN
        v_default_path := '/staff';
    ELSIF v_is_supervisor THEN
        v_default_path := '/supervision';
    ELSIF v_is_admin THEN
        v_default_path := '/admin/';
    ELSE
        v_default_path := '/dashboard';
    END IF;

    RETURN jsonb_build_object(
        'authenticated', true,
        'user_id', v_uid,
        'email', v_email,
        'name', coalesce(nullif(trim(v_name), ''), nullif(trim(v_staff.display_name), ''), split_part(coalesce(v_email, ''), '@', 1)),
        'is_student', v_is_student,
        'is_agent', v_has_staff,
        'agent_type', CASE WHEN v_has_staff THEN v_staff.agent_type ELSE NULL END,
        'is_supervisor', v_is_supervisor,
        'is_admin', v_is_admin,
        'is_corporate', v_is_corporate,
        'staff_slug', CASE WHEN v_has_staff THEN v_staff.slug ELSE NULL END,
        'staff_code', CASE WHEN v_has_staff THEN v_staff.staff_code ELSE NULL END,
        'staff_role', CASE WHEN v_has_staff THEN v_staff.role ELSE NULL END,
        'role_count', v_role_count,
        'default_path', v_default_path
    );
END $$;
GRANT EXECUTE ON FUNCTION public.my_portal_roles() TO authenticated;

-- 4. Update staff_my_profile() to include agent_type & can_supervise_agents ---
CREATE OR REPLACE FUNCTION public.staff_my_profile()
RETURNS JSONB
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT jsonb_build_object(
        'id', s.id,
        'display_name', s.display_name,
        'staff_code', s.staff_code,
        'slug', s.slug,
        'role', s.role,
        'agent_type', s.agent_type,
        'can_supervise_agents', s.can_supervise_agents
    )
    FROM public.staff_members s
    WHERE s.id = public.current_staff_id();
$$;
GRANT EXECUTE ON FUNCTION public.staff_my_profile() TO authenticated;

-- 5. Ensure staff_register_student always defaults course_slug cleanly --------
CREATE OR REPLACE FUNCTION public.staff_register_student(
    p_name TEXT, p_email TEXT, p_phone TEXT, p_course_title TEXT,
    p_course_slug TEXT DEFAULT NULL, p_campaign TEXT DEFAULT NULL, p_notes TEXT DEFAULT NULL,
    p_consent BOOLEAN DEFAULT false, p_location TEXT DEFAULT NULL
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
    v_who TEXT;
    v_course_title TEXT := coalesce(nullif(trim(coalesce(p_course_title, '')), ''), 'AI Fundamentals (free)');
    v_course_slug TEXT := coalesce(nullif(trim(coalesce(p_course_slug, '')), ''), CASE WHEN lower(v_course_title) LIKE '%ai fundamentals%' THEN 'ai-fundamentals' ELSE NULL END);
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
    SELECT r.* INTO v_existing FROM public.staff_registrations r
     WHERE r.phone = v_phone OR (v_email IS NOT NULL AND lower(r.email) = v_email)
     ORDER BY (r.phone = v_phone) DESC LIMIT 1;
    IF FOUND THEN
        IF v_existing.registered_by_staff_id = v_staff AND v_existing.phone = v_phone
           AND lower(trim(v_existing.full_name)) = lower(trim(p_name)) THEN
            SELECT slug INTO v_slug FROM public.staff_members WHERE id = v_staff;
            RETURN jsonb_build_object('ok', true, 'id', v_existing.id, 'slug', v_slug, 'phone', v_phone, 'already', true);
        END IF;
        SELECT display_name INTO v_who FROM public.staff_members WHERE id = v_existing.registered_by_staff_id;
        RETURN jsonb_build_object('ok', false, 'code', 'duplicate',
            'mine', v_existing.registered_by_staff_id = v_staff,
            'message', CASE WHEN v_existing.phone = v_phone THEN 'The phone number ' || p_phone || ' is already registered to ' ELSE 'The email ' || v_email || ' is already registered to ' END
                       || coalesce(v_existing.full_name, 'another student') || ' (registered by '
                       || CASE WHEN v_existing.registered_by_staff_id = v_staff THEN 'you' ELSE coalesce(v_who, 'another agent') END
                       || ' on ' || to_char(v_existing.created_at AT TIME ZONE 'Africa/Kampala', 'DD Mon') || '). Use a different '
                       || CASE WHEN v_existing.phone = v_phone THEN 'phone number' ELSE 'email' END || ' if this is a different person.');
    END IF;
    INSERT INTO public.staff_registrations (registered_by_staff_id, full_name, email, phone, course_slug, course_title, campaign, notes, consent_contact, location)
    VALUES (v_staff, trim(p_name), v_email, v_phone, v_course_slug, v_course_title,
            nullif(trim(coalesce(p_campaign, '')), ''), nullif(trim(coalesce(p_notes, '')), ''), true, nullif(trim(coalesce(p_location, '')), ''))
    RETURNING id INTO v_new;
    SELECT slug INTO v_slug FROM public.staff_members WHERE id = v_staff;
    RETURN jsonb_build_object('ok', true, 'id', v_new, 'slug', v_slug, 'phone', v_phone);
END $$;
GRANT EXECUTE ON FUNCTION public.staff_register_student(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT) TO authenticated;

-- 6. Supervisor RPC: Finalize a newly created Non-Student Field Agent ---------
CREATE OR REPLACE FUNCTION public.supervisor_finalize_field_agent(
    p_email TEXT,
    p_name TEXT,
    p_phone TEXT DEFAULT NULL,
    p_role TEXT DEFAULT 'Field Agent'
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_email TEXT := lower(trim(coalesce(p_email, '')));
    v_name TEXT := trim(coalesce(p_name, ''));
    v_phone TEXT := nullif(trim(coalesce(p_phone, '')), '');
    v_role TEXT := coalesce(nullif(trim(coalesce(p_role, '')), ''), 'Field Agent');
    v_user UUID;
    v_existing public.staff_members;
    v_base TEXT;
    v_slug TEXT;
    v_code TEXT;
    v_new_id UUID;
    n INT := 0;
BEGIN
    IF NOT (public.is_admin() OR public.is_agent_supervisor()) THEN
        RAISE EXCEPTION 'not authorized';
    END IF;
    IF v_email = '' OR v_name = '' THEN
        RETURN jsonb_build_object('ok', false, 'message', 'Name and email are required.');
    END IF;

    SELECT u.id INTO v_user FROM auth.users u WHERE lower(u.email) = v_email LIMIT 1;
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'message', 'Auth account not found for that email.');
    END IF;

    -- Confirm email immediately so the field agent can sign in right away
    UPDATE auth.users
       SET email_confirmed_at = coalesce(email_confirmed_at, now())
     WHERE id = v_user;

    -- Mark profile as FIELD_AGENT (not a student)
    INSERT INTO public.profiles (id, email, full_name, phone, role, onboarding_complete)
    VALUES (v_user, v_email, v_name, v_phone, 'FIELD_AGENT', true)
    ON CONFLICT (id) DO UPDATE
        SET full_name = EXCLUDED.full_name,
            phone = coalesce(EXCLUDED.phone, public.profiles.phone),
            role = CASE WHEN upper(coalesce(public.profiles.role, '')) = 'ADMIN' THEN public.profiles.role ELSE 'FIELD_AGENT' END,
            onboarding_complete = true;

    SELECT * INTO v_existing FROM public.staff_members WHERE user_id = v_user LIMIT 1;
    IF FOUND THEN
        UPDATE public.staff_members
           SET display_name = v_name,
               role = v_role,
               phone = coalesce(v_phone, phone),
               agent_type = 'field_only',
               active = true
         WHERE id = v_existing.id;
        RETURN jsonb_build_object(
            'ok', true, 'existing', true, 'id', v_existing.id,
            'slug', v_existing.slug, 'staff_code', v_existing.staff_code,
            'name', v_name, 'email', v_email, 'agent_type', 'field_only'
        );
    END IF;

    v_base := left(regexp_replace(lower(split_part(v_name, ' ', 1)), '[^a-z0-9]', '', 'g'), 18);
    IF v_base = '' THEN v_base := 'agent'; END IF;
    v_slug := v_base;
    WHILE EXISTS (SELECT 1 FROM public.staff_members WHERE slug = v_slug) LOOP
        n := n + 1;
        v_slug := v_base || (n + 1)::text;
    END LOOP;
    v_code := 'FLD-' || upper(substr(md5(v_user::text), 1, 6));

    INSERT INTO public.staff_members (user_id, staff_code, slug, display_name, role, phone, active, agent_type, can_supervise_agents)
    VALUES (v_user, v_code, v_slug, v_name, v_role, v_phone, true, 'field_only', false)
    RETURNING id INTO v_new_id;

    RETURN jsonb_build_object(
        'ok', true, 'existing', false, 'id', v_new_id,
        'slug', v_slug, 'staff_code', v_code,
        'name', v_name, 'email', v_email, 'agent_type', 'field_only'
    );
END $$;
GRANT EXECUTE ON FUNCTION public.supervisor_finalize_field_agent(TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- 7. Supervisor RPC: Activate/Deactivate any agent ----------------------------
CREATE OR REPLACE FUNCTION public.supervisor_toggle_agent(p_staff_id UUID, p_active BOOLEAN)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    IF NOT (public.is_admin() OR public.is_agent_supervisor()) THEN
        RAISE EXCEPTION 'not authorized';
    END IF;
    UPDATE public.staff_members SET active = coalesce(p_active, true) WHERE id = p_staff_id;
    RETURN FOUND;
END $$;
GRANT EXECUTE ON FUNCTION public.supervisor_toggle_agent(UUID, BOOLEAN) TO authenticated;

-- 8. Supervisor RPC: All recent field registrations feed ----------------------
CREATE OR REPLACE FUNCTION public.supervisor_recent_registrations(p_limit INT DEFAULT 500)
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    IF NOT (public.is_admin() OR public.is_agent_supervisor()) THEN
        RAISE EXCEPTION 'not authorized';
    END IF;
    RETURN coalesce((
        SELECT jsonb_agg(row ORDER BY created_at DESC) FROM (
            SELECT
                r.created_at,
                jsonb_build_object(
                    'id', r.id,
                    'created_at', r.created_at,
                    'full_name', r.full_name,
                    'phone', CASE WHEN r.phone LIKE '+%' THEN r.phone ELSE '+' || r.phone END,
                    'email', r.email,
                    'location', r.location,
                    'course_title', r.course_title,
                    'status', CASE WHEN r.profile_id IS NOT NULL THEN 'account_created' ELSE r.status END,
                    'staff_id', r.registered_by_staff_id,
                    'field_officer', coalesce(s.display_name, 'Unknown'),
                    'agent_type', coalesce(s.agent_type, 'student_agent')
                ) AS row
            FROM public.staff_registrations r
            LEFT JOIN public.staff_members s ON s.id = r.registered_by_staff_id
            ORDER BY r.created_at DESC
            LIMIT least(greatest(coalesce(p_limit, 500), 1), 2000)
        ) t
    ), '[]'::jsonb);
END $$;
GRANT EXECUTE ON FUNCTION public.supervisor_recent_registrations(INT) TO authenticated;

-- 9. Allow Agent Supervisors (Mugasha Isaac & tkwaniaye17) + Admins to read
--    agent monitoring RPCs, and include agent_type in admin_agent_funnel -------
CREATE OR REPLACE FUNCTION public.admin_agent_funnel(p_since TIMESTAMPTZ DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NOT (public.is_admin() OR public.is_agent_supervisor()) THEN RAISE EXCEPTION 'not authorized'; END IF;
    RETURN coalesce((
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', s.id,
                'name', s.display_name,
                'slug', s.slug,
                'staff_code', s.staff_code,
                'role', s.role,
                'agent_type', s.agent_type,
                'can_supervise_agents', s.can_supervise_agents,
                'email', u.email,
                'phone', s.phone,
                'active', s.active,
                'linked', s.user_id IS NOT NULL,
                'created_at', s.created_at
            ) || public._agent_funnel(s.id, p_since)
            ORDER BY s.display_name
        )
        FROM public.staff_members s
        LEFT JOIN auth.users u ON u.id = s.user_id
    ), '[]'::jsonb);
END $$;
GRANT EXECUTE ON FUNCTION public.admin_agent_funnel(TIMESTAMPTZ) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_agent_clients(p_staff UUID, p_since TIMESTAMPTZ DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_agent_name TEXT;
BEGIN
    IF NOT (public.is_admin() OR public.is_agent_supervisor()) THEN RAISE EXCEPTION 'not authorized'; END IF;
    SELECT display_name INTO v_agent_name FROM public.staff_members WHERE id = p_staff;
    RETURN coalesce((
        WITH mine AS (
            SELECT p.id, p.full_name, p.email, p.phone, p.location, p.created_at, p.registered_by_staff_id
            FROM public.profiles p
            WHERE coalesce(p.registered_by_staff_id, p.referred_by_staff_id) = p_staff
              AND (p_since IS NULL OR p.created_at >= p_since)
        )
        SELECT jsonb_agg(c ORDER BY c->>'joined' DESC) FROM (
            SELECT jsonb_build_object(
                'name', coalesce(m.full_name, ''),
                'email', m.email,
                'phone', m.phone,
                'location', m.location,
                'joined', m.created_at,
                'course', coalesce(
                    (SELECT r2.course_title FROM public.staff_registrations r2 WHERE r2.profile_id = m.id OR (r2.email IS NOT NULL AND lower(r2.email) = lower(m.email)) LIMIT 1),
                    'AI Fundamentals (free)'
                ),
                'source', CASE WHEN m.registered_by_staff_id = p_staff THEN 'Registered by agent' ELSE 'Joined via link' END,
                'registered_by', v_agent_name,
                'stage', CASE
                    WHEN EXISTS (SELECT 1 FROM public.learn_certificates lc WHERE lc.user_id = m.id AND lc.status = 'valid') THEN 'Completed'
                    WHEN EXISTS (SELECT 1 FROM public.learn_events v WHERE v.user_id = m.id AND v.event_type = 'live_joined') THEN 'Joined live'
                    WHEN EXISTS (SELECT 1 FROM public.learn_progress g WHERE g.user_id = m.id) THEN 'Studying'
                    WHEN EXISTS (SELECT 1 FROM public.learn_enrollments e WHERE e.user_id = m.id) THEN 'In course'
                    ELSE 'Account opened' END
            ) AS c
            FROM mine m
            UNION ALL
            SELECT jsonb_build_object(
                'name', r.full_name,
                'email', r.email,
                'phone', CASE WHEN r.phone LIKE '+%' THEN r.phone ELSE '+' || r.phone END,
                'location', r.location,
                'joined', r.created_at,
                'course', r.course_title,
                'source', 'Registered by agent',
                'registered_by', v_agent_name,
                'stage', 'Waiting to sign up'
            ) AS c
            FROM public.staff_registrations r
            WHERE r.registered_by_staff_id = p_staff
              AND r.profile_id IS NULL
              AND (p_since IS NULL OR r.created_at >= p_since)
              AND NOT EXISTS (SELECT 1 FROM mine m WHERE r.email IS NOT NULL AND lower(r.email) = lower(m.email))
            LIMIT 1000
        ) t
    ), '[]'::jsonb);
END $$;
GRANT EXECUTE ON FUNCTION public.admin_agent_clients(UUID, TIMESTAMPTZ) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_agent_registration_summary(p_since TIMESTAMPTZ DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    IF NOT (public.is_admin() OR public.is_agent_supervisor()) THEN RAISE EXCEPTION 'not authorized'; END IF;

    RETURN coalesce((
        WITH entries AS (
            SELECT
                (r.created_at AT TIME ZONE 'Africa/Kampala')::date AS reg_date,
                r.registered_by_staff_id AS staff_id,
                r.created_at,
                initcap(nullif(trim(coalesce(r.location, '')), '')) AS location,
                coalesce(nullif(trim(r.course_title), ''), 'AI Fundamentals (free)') AS programme,
                'field'::text AS channel,
                (
                    r.profile_id IS NOT NULL
                    OR (
                        r.email IS NOT NULL
                        AND EXISTS (SELECT 1 FROM public.profiles p WHERE lower(p.email) = lower(r.email))
                    )
                ) AS has_account
            FROM public.staff_registrations r
            WHERE p_since IS NULL OR r.created_at >= p_since

            UNION ALL

            SELECT
                (p.created_at AT TIME ZONE 'Africa/Kampala')::date AS reg_date,
                coalesce(p.registered_by_staff_id, p.referred_by_staff_id) AS staff_id,
                p.created_at,
                initcap(nullif(trim(coalesce(p.location, '')), '')) AS location,
                'AI Fundamentals (free)'::text AS programme,
                'link'::text AS channel,
                true AS has_account
            FROM public.profiles p
            WHERE coalesce(p.registered_by_staff_id, p.referred_by_staff_id) IS NOT NULL
              AND (p_since IS NULL OR p.created_at >= p_since)
              AND NOT EXISTS (
                  SELECT 1 FROM public.staff_registrations r2
                  WHERE r2.profile_id = p.id
                     OR (r2.email IS NOT NULL AND p.email IS NOT NULL AND lower(r2.email) = lower(p.email))
              )
        ),
        grouped AS (
            SELECT
                e.reg_date,
                e.staff_id,
                count(*) AS total_registered,
                count(*) FILTER (WHERE e.channel = 'field') AS field_registered,
                count(*) FILTER (WHERE e.channel = 'link') AS link_signups,
                count(*) FILTER (WHERE e.has_account) AS accounts_opened,
                count(*) FILTER (WHERE NOT e.has_account) AS waiting_signup,
                min(e.created_at) AS first_reg_at,
                max(e.created_at) AS last_reg_at,
                array_agg(DISTINCT e.programme) AS programmes
            FROM entries e
            GROUP BY e.reg_date, e.staff_id
        ),
        locs AS (
            SELECT
                reg_date,
                staff_id,
                jsonb_agg(jsonb_build_object('location', location, 'count', n) ORDER BY n DESC, location ASC) AS top_locations
            FROM (
                SELECT
                    reg_date,
                    staff_id,
                    location,
                    count(*) AS n,
                    row_number() OVER (PARTITION BY reg_date, staff_id ORDER BY count(*) DESC, location ASC) AS rn
                FROM entries
                WHERE location IS NOT NULL
                GROUP BY reg_date, staff_id, location
            ) ranked
            WHERE rn <= 4
            GROUP BY reg_date, staff_id
        )
        SELECT jsonb_agg(
            jsonb_build_object(
                'reg_date',         g.reg_date::text,
                'staff_id',         g.staff_id,
                'field_officer',    coalesce(s.display_name, 'Unknown Officer'),
                'staff_code',       s.staff_code,
                'role',             s.role,
                'agent_type',       coalesce(s.agent_type, 'student_agent'),
                'email',            u.email,
                'active',           coalesce(s.active, true),
                'total_registered', g.total_registered,
                'field_registered', g.field_registered,
                'link_signups',     g.link_signups,
                'accounts_opened',  g.accounts_opened,
                'waiting_signup',   g.waiting_signup,
                'conversion_pct',   round(100.0 * g.accounts_opened / greatest(g.total_registered, 1), 1),
                'first_reg_at',     g.first_reg_at,
                'last_reg_at',      g.last_reg_at,
                'programmes',       to_jsonb(g.programmes),
                'top_locations',    coalesce(l.top_locations, '[]'::jsonb)
            )
            ORDER BY g.reg_date DESC, g.total_registered DESC, s.display_name ASC
        )
        FROM grouped g
        LEFT JOIN public.staff_members s ON s.id = g.staff_id
        LEFT JOIN auth.users u ON u.id = s.user_id
        LEFT JOIN locs l ON l.reg_date = g.reg_date AND l.staff_id = g.staff_id
    ), '[]'::jsonb);
END $$;
GRANT EXECUTE ON FUNCTION public.admin_agent_registration_summary(TIMESTAMPTZ) TO authenticated;

-- 10. Keep admin_dashboard() accurate: exclude FIELD_AGENT from student count,
--     and capture ALL agent registrations (both field-only and student agents)
CREATE OR REPLACE FUNCTION public.admin_dashboard()
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
    RETURN jsonb_build_object(
        'students',         (SELECT count(*) FROM public.profiles WHERE upper(coalesce(role, '')) <> 'FIELD_AGENT'),
        'new_today',        (SELECT count(*) FROM public.profiles WHERE upper(coalesce(role, '')) <> 'FIELD_AGENT' AND created_at >= date_trunc('day', now())),
        'new_7d',           (SELECT count(*) FROM public.profiles WHERE upper(coalesce(role, '')) <> 'FIELD_AGENT' AND created_at > now() - interval '7 days'),
        'active_7d',        (SELECT count(DISTINCT user_id) FROM public.learn_events WHERE created_at > now() - interval '7 days'),
        'enrolled',         (SELECT count(*) FROM public.learn_enrollments WHERE course_slug = 'ai-fundamentals'),
        'certificates',     (SELECT count(*) FROM public.learn_certificates WHERE status = 'valid'),
        'installs',         (SELECT count(DISTINCT user_id) FROM public.learn_events WHERE event_type = 'app_installed'),
        'live_joined',      (SELECT count(DISTINCT user_id) FROM public.learn_events WHERE event_type = 'live_joined'),
        'next_session',     (SELECT jsonb_build_object('title', title, 'starts_at', starts_at, 'meet_link', meet_link)
                               FROM public.live_sessions WHERE is_published AND ends_at > now() ORDER BY starts_at LIMIT 1),
        'sessions_ahead',   (SELECT count(*) FROM public.live_sessions WHERE is_published AND ends_at > now()),
        'reminders_7d',     (SELECT count(*) FROM public.live_reminder_log WHERE status = 'sent' AND sent_at > now() - interval '7 days'),
        'opted_out',        (SELECT count(*) FROM public.live_reminder_prefs WHERE email_opt_in = false),
        'agents',           (SELECT count(*) FROM public.staff_members WHERE active AND user_id IS NOT NULL),
        'agent_regs_7d',    (SELECT count(*) FROM public.staff_registrations WHERE created_at > now() - interval '7 days'),
        'agent_regs_total', (SELECT count(*) FROM public.staff_registrations),
        'leads_7d',         (SELECT count(*) FROM public.leads WHERE created_at > now() - interval '7 days'),
        'signups_daily',    (SELECT jsonb_agg(coalesce(d.n, 0) ORDER BY g.day) FROM generate_series(current_date - 13, current_date, interval '1 day') AS g(day)
                              LEFT JOIN (SELECT created_at::date AS day, count(*) AS n FROM public.profiles WHERE upper(coalesce(role, '')) <> 'FIELD_AGENT' GROUP BY 1) d ON d.day = g.day::date)
    );
END $$;
GRANT EXECUTE ON FUNCTION public.admin_dashboard() TO authenticated;

NOTIFY pgrst, 'reload schema';
