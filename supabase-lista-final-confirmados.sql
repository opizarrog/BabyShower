-- Lista final de personas que confirmaron asistencia.
-- Ejecuta esta consulta en el SQL Editor de Supabase.
-- Devuelve una fila por invitado y otra por cada acompañante confirmado.
with confirmados as (
  select
    r.id as rsvp_id,
    coalesce(g.name, r.guest_name) as invitacion,
    r.with_companion,
    nullif(btrim(r.companion_name), '') as companion_name
  from public.rsvp r
  left join public.guests g on g.id = r.guest_id
  where r.attendance = 'yes'
), asistentes as (
  select
    rsvp_id,
    invitacion,
    invitacion as asistente,
    'Invitado/a'::text as tipo
  from confirmados

  union all

  select
    rsvp_id,
    invitacion,
    companion_name as asistente,
    'Acompañante'::text as tipo
  from confirmados
  where with_companion = 'yes'
    and companion_name is not null
)
select
  invitacion,
  asistente,
  tipo,
  count(*) over () as total_personas_confirmadas
from asistentes
order by invitacion, tipo;

-- Resumen de invitaciones activas para comprobar quiénes faltan por responder.
select
  count(*) filter (
    where exists (
      select 1
      from public.rsvp r
      where r.attendance = 'yes'
        and (
          r.guest_id = g.id
          or (
            r.guest_id is null
            and lower(btrim(r.guest_name)) = lower(btrim(g.name))
          )
        )
    )
  ) as confirmaron_asistencia,
  count(*) filter (
    where exists (
      select 1
      from public.rsvp r
      where r.attendance = 'no'
        and (
          r.guest_id = g.id
          or (
            r.guest_id is null
            and lower(btrim(r.guest_name)) = lower(btrim(g.name))
          )
        )
    )
  ) as no_asistiran,
  count(*) filter (
    where not exists (
      select 1
      from public.rsvp r
      where r.guest_id = g.id
        or (
          r.guest_id is null
          and lower(btrim(r.guest_name)) = lower(btrim(g.name))
        )
    )
  ) as pendientes
from public.guests g
where g.active = true;
