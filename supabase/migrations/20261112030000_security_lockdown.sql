-- Security lockdown. Run AFTER the code that no longer relies on open tables is live
-- (public registration form uses submit_outreach_registration; admin/instructor consoles sign in with real accounts).
-- Nothing is deleted. Backups: backup_20261112_courses / _enrollments / _profiles, outreach_ledger_backup.

-- activity_logs / schedule_items: own rows only (administrators can see all) -------------------------------
drop policy if exists "Users can insert own activity logs." on public.activity_logs;
drop policy if exists "Users can view own activity logs."   on public.activity_logs;
drop policy if exists al_select on public.activity_logs;
create policy al_select on public.activity_logs for select using (auth.uid() = user_id or public.is_admin());
drop policy if exists al_insert on public.activity_logs;
create policy al_insert on public.activity_logs for insert with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can insert own schedule." on public.schedule_items;
drop policy if exists "Users can view own schedule."   on public.schedule_items;
drop policy if exists si_select on public.schedule_items;
create policy si_select on public.schedule_items for select using (auth.uid() = user_id or public.is_admin());
drop policy if exists si_insert on public.schedule_items;
create policy si_insert on public.schedule_items for insert with check (auth.uid() = user_id or public.is_admin());

-- enrollments ------------------------------------------------------------------------------------------
drop policy if exists "Admin can delete enrollments."              on public.enrollments;
drop policy if exists "Users can insert their own enrollments."    on public.enrollments;
drop policy if exists "Users can update their own enrollments."    on public.enrollments;
drop policy if exists "Users can view their own enrollments."      on public.enrollments;
drop policy if exists en_select on public.enrollments;
create policy en_select on public.enrollments for select using (auth.uid() = user_id or public.is_admin_or_instructor());
drop policy if exists en_insert on public.enrollments;
create policy en_insert on public.enrollments for insert with check (auth.uid() = user_id or public.is_admin());
drop policy if exists en_update on public.enrollments;
create policy en_update on public.enrollments for update
  using (auth.uid() = user_id or public.is_admin_or_instructor())
  with check (auth.uid() = user_id or public.is_admin_or_instructor());
drop policy if exists en_delete on public.enrollments;
create policy en_delete on public.enrollments for delete using (public.is_admin());

-- courses: registrations are private; only admins/instructors manage courses ---------------------------
drop policy if exists "Admin can delete courses."          on public.courses;
drop policy if exists "Admin can insert courses."          on public.courses;
drop policy if exists "Admin can update courses."          on public.courses;
drop policy if exists "Courses are viewable by everyone."  on public.courses;
drop policy if exists courses_select on public.courses;
create policy courses_select on public.courses for select
  using (category is distinct from '__OUTREACH_REGISTRATION__' or public.is_admin());
drop policy if exists courses_insert on public.courses;
create policy courses_insert on public.courses for insert with check (public.is_admin_or_instructor());
drop policy if exists courses_delete on public.courses;
create policy courses_delete on public.courses for delete using (public.is_admin_or_instructor());
-- Students submit exam results by updating the course's `quiz` column; the trigger below allows exactly that.
drop policy if exists courses_update on public.courses;
create policy courses_update on public.courses for update
  using (
    public.is_admin_or_instructor()
    or exists (select 1 from public.enrollments e where e.user_id = auth.uid() and e.course_id::text = courses.id::text)
  )
  with check (
    public.is_admin_or_instructor()
    or exists (select 1 from public.enrollments e where e.user_id = auth.uid() and e.course_id::text = courses.id::text)
  );

create or replace function public.courses_guard_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if session_user in ('postgres', 'supabase_admin')
     or coalesce(auth.role(), '') = 'service_role'
     or public.is_admin_or_instructor() then
    return new;
  end if;
  if (to_jsonb(new) - 'quiz') is distinct from (to_jsonb(old) - 'quiz') then
    raise exception 'Only the quiz result can be updated here' using errcode = '42501';
  end if;
  return new;
end;
$$;
drop trigger if exists courses_guard_update_trg on public.courses;
create trigger courses_guard_update_trg before update on public.courses
  for each row execute function public.courses_guard_update();

-- profiles: private to the owner; administrators/instructors can read all; only admins edit others ----------
drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select
  using (auth.uid() = id or public.is_admin_or_instructor());
drop policy if exists profiles_admin_update on public.profiles;
create policy profiles_admin_update on public.profiles for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists profiles_admin_delete on public.profiles;
create policy profiles_admin_delete on public.profiles for delete using (public.is_admin());

notify pgrst, 'reload schema';
