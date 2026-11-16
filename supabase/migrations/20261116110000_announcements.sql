-- One-time announcement emails to everyone registered for the free course (additive).
--   announcement_log  : who has already received which announcement (so nobody gets it twice)
--   announcement_due / announcement_mark : used by the email sender (secret-gated, like the class reminders)
create table if not exists public.announcement_log (
    key text not null,
    user_id uuid not null references auth.users(id) on delete cascade,
    status text not null default 'sent' check (status in ('sent', 'failed')),
    attempts int not null default 1,
    sent_at timestamptz not null default now(),
    primary key (key, user_id)
);
alter table public.announcement_log enable row level security;
revoke all on public.announcement_log from public, anon, authenticated;
grant select on public.announcement_log to authenticated;
drop policy if exists announcement_log_admin on public.announcement_log;
create policy announcement_log_admin on public.announcement_log for select using (public.is_admin());

create or replace function public.announcement_due(p_secret text, p_key text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
    if not public._reminder_secret_ok(p_secret) then raise exception 'not authorized'; end if;
    return coalesce((
        select jsonb_agg(jsonb_build_object('user_id', e.user_id, 'email', coalesce(nullif(pr.email, ''), nullif(p.email, ''), u.email::text), 'name', coalesce(p.full_name, '')) order by e.enrolled_at)
        from public.learn_enrollments e
        join auth.users u on u.id = e.user_id
        left join public.profiles p on p.id = e.user_id
        left join public.live_reminder_prefs pr on pr.user_id = e.user_id
        where e.course_slug = 'ai-fundamentals'
          and coalesce(pr.email_opt_in, true)
          and coalesce(nullif(pr.email, ''), nullif(p.email, ''), u.email::text) is not null
          and not exists (select 1 from public.announcement_log l where l.key = p_key and l.user_id = e.user_id and (l.status = 'sent' or l.attempts >= 3))
    ), '[]'::jsonb);
end $$;

create or replace function public.announcement_mark(p_secret text, p_key text, p_rows jsonb) returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
    if not public._reminder_secret_ok(p_secret) then raise exception 'not authorized'; end if;
    insert into public.announcement_log as l (key, user_id, status)
    select p_key, t.user_id, t.status
    from jsonb_to_recordset(p_rows) as t(user_id uuid, status text)
    where t.status in ('sent', 'failed') and exists (select 1 from auth.users u where u.id = t.user_id)
    on conflict (key, user_id) do update set status = excluded.status, attempts = l.attempts + 1, sent_at = now() where l.status <> 'sent';
    get diagnostics n = row_count;
    return n;
end $$;

revoke all on function public.announcement_due(text, text) from public, anon, authenticated;
revoke all on function public.announcement_mark(text, text, jsonb) from public, anon, authenticated;
grant execute on function public.announcement_due(text, text) to anon, authenticated;
grant execute on function public.announcement_mark(text, text, jsonb) to anon, authenticated;
notify pgrst, 'reload schema';
select 'ok' as result;
