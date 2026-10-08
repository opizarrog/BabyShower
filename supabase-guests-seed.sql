-- =============================================================
-- Datos de prueba para public.guests
-- Ejecuta este archivo en el SQL Editor de Supabase.
-- Son invitados ficticios: reemplázalos por la lista oficial
-- de invitados antes de producción.
-- =============================================================

-- 1) Invitados ficticios.
--    max_guests: 1 = solo el invitado, 2 = invitado + 1 acompañante.
--    (on conflict asume que public.guests.token tiene restricción UNIQUE;
--     si tu tabla no la tiene, elimina esa línea.)
insert into public.guests (name, token, max_guests, active)
values
  ('María López',    'TEST-MARIA-2026',  2, true),
  ('Carlos Ramírez', 'TEST-CARLOS-2026', 1, true)
on conflict (token) do nothing
returning id, name, token, max_guests, active;

-- 2) URLs personalizadas de prueba (localhost).
select
  name,
  token,
  max_guests,
  'http://localhost:8000/?i=' || token as url
from public.guests
where token like 'TEST-%'
order by id;

-- 3) Reiniciar el RSVP de un invitado de prueba para volver a probar el formulario.
--    (Descomenta y ajusta el token si quieres volver a responder.)
-- delete from public.rsvp
-- where guest_id = (select id from public.guests where token = 'TEST-JUAN-2026')
--    or lower(btrim(guest_name)) = lower(btrim((select name from public.guests where token = 'TEST-JUAN-2026')));

-- 4) Eliminar todos los datos de prueba cuando termines.
-- delete from public.rsvp
-- where guest_id in (select id from public.guests where token like 'TEST-%')
--    or lower(btrim(guest_name)) in (
--      select lower(btrim(name)) from public.guests where token like 'TEST-%'
--    );
-- delete from public.guests where token like 'TEST-%';

-- 5) Para PRODUCCIÓN usa tokens largos y aleatorios (requiere la extensión pgcrypto):
-- insert into public.guests (name, token, max_guests, active)
-- values ('Nombre Oficial', encode(gen_random_bytes(8), 'hex'), 1, true);
