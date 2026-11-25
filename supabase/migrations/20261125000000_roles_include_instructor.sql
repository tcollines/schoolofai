-- ADDITIVE change to public.my_portal_roles(): instructors now count as a role, so they get a card on the dashboard chooser
-- (/portal) and a way into the instructor console.
-- This is the exact definition from 20261120000000_roles_supervision_and_field_agents.sql with only these additions:
--   1. v_is_instructor, true when the profile role is 'INSTRUCTOR';
--   2. it is counted in role_count (so an instructor who is also a student has 2 roles and sees the chooser);
--   3. 'is_instructor' is returned in the JSON.
-- Everything else (default_path logic, other roles, grants) is unchanged. No tables or rows are touched.

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
    v_is_instructor BOOLEAN := false;
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
    v_is_instructor := upper(coalesce(v_profile_role, '')) = 'INSTRUCTOR';

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
        (CASE WHEN v_is_corporate THEN 1 ELSE 0 END) +
        (CASE WHEN v_is_instructor THEN 1 ELSE 0 END);

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
        'is_instructor', v_is_instructor,
        'staff_slug', CASE WHEN v_has_staff THEN v_staff.slug ELSE NULL END,
        'staff_code', CASE WHEN v_has_staff THEN v_staff.staff_code ELSE NULL END,
        'staff_role', CASE WHEN v_has_staff THEN v_staff.role ELSE NULL END,
        'role_count', v_role_count,
        'default_path', v_default_path
    );
END $$;
GRANT EXECUTE ON FUNCTION public.my_portal_roles() TO authenticated;

NOTIFY pgrst, 'reload schema';
