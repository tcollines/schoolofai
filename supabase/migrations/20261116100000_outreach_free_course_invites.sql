-- =============================================================================
-- Outreach registrants -> free AI Fundamentals course (additive)
--   * outreach_free_course_invites : one row per outreach registration that has a valid email and contact consent
--   * existing account holders are enrolled straight away (source = 'outreach')
--   * people without an account are enrolled automatically the moment they sign up with the same email
--   * outreach_invites_due / outreach_invites_mark : used by the email sender (secret-gated, like the class reminders)
-- Nothing existing is changed or deleted.
-- =============================================================================
create table if not exists public.outreach_free_course_invites (
    reg_no text primary key,
    email text not null,
    full_name text,
    phone text,
    status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
    attempts int not null default 0,
    sent_at timestamptz,
    enrolled_at timestamptz,
    created_at timestamptz not null default now()
);
alter table public.outreach_free_course_invites enable row level security;
revoke all on public.outreach_free_course_invites from public, anon, authenticated;
grant select on public.outreach_free_course_invites to authenticated;
drop policy if exists ofci_admin_select on public.outreach_free_course_invites;
create policy ofci_admin_select on public.outreach_free_course_invites for select using (public.is_admin());

insert into public.outreach_free_course_invites (reg_no, email, full_name, phone)
select o->>'student_reg_no', lower(trim(o->>'email')), o->>'full_name', o->>'phone'
from (select sections->'outreach_record' o from public.courses where category = '__OUTREACH_REGISTRATION__') r
where coalesce(o->>'email', '') ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  and coalesce(o->>'consent_contact', 'true') <> 'false'
  and coalesce(o->>'student_reg_no', '') <> ''
on conflict (reg_no) do nothing;

insert into public.learn_enrollments (user_id, course_slug, source)
select u.id, 'ai-fundamentals', 'outreach'
from public.outreach_free_course_invites i join auth.users u on lower(u.email) = i.email
on conflict (user_id, course_slug) do nothing;

update public.outreach_free_course_invites i set enrolled_at = now()
where i.enrolled_at is null and exists (
    select 1 from auth.users u join public.learn_enrollments e on e.user_id = u.id and e.course_slug = 'ai-fundamentals'
    where lower(u.email) = i.email);

create or replace function public.outreach_enrol_on_signup() returns trigger
language plpgsql security definer set search_path = public as $$
begin
    begin
        if new.email is not null and exists (select 1 from public.outreach_free_course_invites i where i.email = lower(new.email)) then
            insert into public.learn_enrollments (user_id, course_slug, source) values (new.id, 'ai-fundamentals', 'outreach')
            on conflict (user_id, course_slug) do nothing;
            update public.outreach_free_course_invites set enrolled_at = now() where email = lower(new.email) and enrolled_at is null;
        end if;
    exception when others then null;   -- never block a sign-up
    end;
    return new;
end $$;
drop trigger if exists outreach_enrol_on_signup on auth.users;
create trigger outreach_enrol_on_signup after insert on auth.users for each row execute function public.outreach_enrol_on_signup();

create or replace function public.outreach_invites_due(p_secret text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
    if not public._reminder_secret_ok(p_secret) then raise exception 'not authorized'; end if;
    return coalesce((
        select jsonb_agg(jsonb_build_object(
            'reg_no', i.reg_no, 'email', i.email, 'name', i.full_name,
            'has_account', exists (select 1 from auth.users u where lower(u.email) = i.email),
            'session', (select jsonb_build_object('id', s.id, 'title', s.title, 'description', s.description, 'host_name', s.host_name, 'starts_at', s.starts_at, 'ends_at', s.ends_at, 'join_link', s.meet_link)
                        from public.live_sessions s where s.is_published and s.ends_at > now() order by s.starts_at limit 1)
        ) order by i.created_at)
        from public.outreach_free_course_invites i where i.status in ('pending', 'failed') and i.attempts < 3
    ), '[]'::jsonb);
end $$;

create or replace function public.outreach_invites_mark(p_secret text, p_rows jsonb) returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
    if not public._reminder_secret_ok(p_secret) then raise exception 'not authorized'; end if;
    update public.outreach_free_course_invites i
       set status = t.status, attempts = i.attempts + 1, sent_at = case when t.status = 'sent' then now() else i.sent_at end
      from jsonb_to_recordset(p_rows) as t(reg_no text, status text)
     where i.reg_no = t.reg_no and t.status in ('sent', 'failed');
    get diagnostics n = row_count;
    return n;
end $$;

revoke all on function public.outreach_invites_due(text) from public, anon, authenticated;
revoke all on function public.outreach_invites_mark(text, jsonb) from public, anon, authenticated;
grant execute on function public.outreach_invites_due(text) to anon, authenticated;
grant execute on function public.outreach_invites_mark(text, jsonb) to anon, authenticated;
notify pgrst, 'reload schema';
select 'ok' as result;
