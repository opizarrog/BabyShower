create or replace function public.has_guest_responded(p_token text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.guests g
    join public.rsvp r
      on r.guest_id = g.id
      or (
        r.guest_id is null
        and lower(btrim(r.guest_name)) = lower(btrim(g.name))
      )
    where g.token = p_token
      and g.active = true
  );
$$;

revoke all on function public.has_guest_responded(text) from public;
grant execute on function public.has_guest_responded(text) to anon;

create or replace function public.register_guest_rsvp(
  p_token text,
  p_attendance text,
  p_with_companion text,
  p_companion_name text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  invited_guest public.guests%rowtype;
  saved_companion text := 'no';
  saved_companion_name text := '';
begin
  select *
  into invited_guest
  from public.guests
  where token = p_token
    and active = true
  for update;

  if not found then
    return 'invalid_invitation';
  end if;

  if exists (
    select 1
    from public.rsvp r
    where r.guest_id = invited_guest.id
      or (
        r.guest_id is null
        and lower(btrim(r.guest_name)) = lower(btrim(invited_guest.name))
      )
  ) then
    return 'already_responded';
  end if;

  if p_attendance not in ('yes', 'no') then
    return 'invalid_response';
  end if;

  if p_attendance = 'yes' and invited_guest.max_guests > 1 then
    if p_with_companion not in ('yes', 'no') then
      return 'invalid_response';
    end if;

    if p_with_companion = 'yes' then
      if invited_guest.max_guests < 2
        or nullif(btrim(p_companion_name), '') is null
      then
        return 'invalid_response';
      end if;

      saved_companion := 'yes';
      saved_companion_name := btrim(p_companion_name);
    end if;
  end if;

  insert into public.rsvp (
    guest_id,
    guest_name,
    attendance,
    with_companion,
    companion_name
  ) values (
    invited_guest.id,
    invited_guest.name,
    p_attendance,
    saved_companion,
    saved_companion_name
  );

  return 'registered';
end;
$$;

revoke all on function public.register_guest_rsvp(text, text, text, text) from public;
grant execute on function public.register_guest_rsvp(text, text, text, text) to anon;
