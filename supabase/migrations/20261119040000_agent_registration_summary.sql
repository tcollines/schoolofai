-- =============================================================================
-- Admin Agent Monitoring: Daily Registration Summary by Date & Field Officer
-- Groups field registrations and agent-link signups (deduplicated) per EAT date
-- and Field Officer, with account conversion, locations, and field hours.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.admin_agent_registration_summary(p_since TIMESTAMPTZ DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;

    RETURN coalesce((
        WITH entries AS (
            -- 1. Hand/field registrations entered by the field officer
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

            -- 2. Direct agent-link signups not already represented in staff_registrations
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
NOTIFY pgrst, 'reload schema';
