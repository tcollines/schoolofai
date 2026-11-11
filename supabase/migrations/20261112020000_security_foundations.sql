-- Security foundations (additive, safe to run before any code deploy).
-- 1. Safety copies of the core tables (created once, never overwritten).
-- 2. Role helpers.
-- 3. submit_outreach_registration(): the only way the public registration form writes a registration.
-- 4. Guards that stop anyone promoting themselves to ADMIN / INSTRUCTOR.
-- 5. Seeds the rest of the outreach roster into staff_members (logins are linked later in Admin > Staff & Links).

-- 1. Backups -----------------------------------------------------------------
create table if not exists public.backup_20261112_courses     as select * from public.courses;
create table if not exists public.backup_20261112_enrollments as select * from public.enrollments;
create table if not exists public.backup_20261112_profiles    as select * from public.profiles;
alter table public.backup_20261112_courses     enable row level security;
alter table public.backup_20261112_enrollments enable row level security;
alter table public.backup_20261112_profiles    enable row level security;

-- 2. Helpers -----------------------------------------------------------------
create or replace function public.is_instructor()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and upper(coalesce(p.role, '')) = 'INSTRUCTOR');
$$;

create or replace function public.is_admin_or_instructor()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and upper(coalesce(p.role, '')) in ('ADMIN', 'INSTRUCTOR'));
$$;

-- 3. Public registration entry point -----------------------------------------
-- Anonymous visitors (and offline-synced booth devices) may only ADD a registration row.
-- They can no longer read, change or delete any registration directly.
create or replace function public.submit_outreach_registration(p_row jsonb)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  r public.courses;
begin
  if p_row is null or jsonb_typeof(p_row) <> 'object' then
    raise exception 'Invalid registration';
  end if;
  if length(p_row::text) > 200000 then
    raise exception 'Registration too large';
  end if;
  r := jsonb_populate_record(null::public.courses, p_row);
  if r.id is null then
    raise exception 'Registration id is required';
  end if;
  if coalesce(p_row #>> '{sections,outreach_record,full_name}', '') = '' then
    raise exception 'Name is required';
  end if;

  insert into public.courses (id, title, category, instructor, instructor_email, duration, description, price,
                              status, is_draft, is_verified, platform, "accessTier", sections)
  values (r.id, r.title, '__OUTREACH_REGISTRATION__', r.instructor, coalesce(r.instructor_email, ''), r.duration,
          r.description, r.price, coalesce(r.status, 'NEW'), true, false, coalesce(r.platform, 'Welile'),
          coalesce(r."accessTier", 'PAID'), r.sections)
  on conflict (id) do nothing;
  return true;
end;
$$;
revoke all on function public.submit_outreach_registration(jsonb) from public;
grant execute on function public.submit_outreach_registration(jsonb) to anon, authenticated;

-- 4. Nobody can give themselves a privileged role ----------------------------
create or replace function public.profiles_guard_role()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  privileged boolean := (session_user in ('postgres', 'supabase_admin')
                         or coalesce(auth.role(), '') = 'service_role'
                         or public.is_admin());
begin
  if privileged then
    return new;
  end if;
  if tg_op = 'INSERT' then
    if upper(coalesce(new.role, '')) in ('ADMIN', 'INSTRUCTOR') then
      new.role := 'student';
    end if;
    return new;
  end if;
  if new.role is distinct from old.role
     and (upper(coalesce(new.role, '')) in ('ADMIN', 'INSTRUCTOR') or upper(coalesce(old.role, '')) in ('ADMIN', 'INSTRUCTOR')) then
    raise exception 'You are not allowed to change this role' using errcode = '42501';
  end if;
  return new;
end;
$$;
drop trigger if exists profiles_guard_role_trg on public.profiles;
create trigger profiles_guard_role_trg before insert or update on public.profiles
  for each row execute function public.profiles_guard_role();

-- 5. Seed the rest of the roster (no logins yet; link them from Admin > Staff & Links) ---------------
insert into public.staff_members (staff_code, slug, display_name, role, phone, active)
select v.staff_code, lower(v.staff_code), v.display_name, v.role, v.phone, true
from (values
  ('WSI-STF-001', 'Collines T.',                         'Outreach Team Lead', '0772000001'),
  ('WSI-STF-002', 'Nkumba Mobilizer 1 (Booth Desk A)',   'Outreach Mobilizer', '0772000002'),
  ('WSI-STF-003', 'Nkumba Mobilizer 2 (Booth Desk B)',   'Outreach Mobilizer', '0772000003'),
  ('WSI-STF-004', 'Katabi Admissions Office',            'Admissions Officer', '0700000004'),
  ('WSI-STF-005', 'Welile Campus Ambassador',            'Campus Mobilizer',   '0750000005')
) as v(staff_code, display_name, role, phone)
where not exists (select 1 from public.staff_members s where s.staff_code = v.staff_code or s.slug = lower(v.staff_code));

notify pgrst, 'reload schema';
