-- Read-only permission inspection; no test rows written to production.
select count(*) as catalog_count from public.tripin_places_api;
select relrowsecurity from pg_class where oid = 'public.tripin_place_catalog'::regclass;
select reloptions from pg_class where oid = 'public.tripin_places_api'::regclass;
select role_name,
  has_table_privilege(role_name, 'public.tripin_place_catalog', 'SELECT') as can_read,
  has_table_privilege(role_name, 'public.tripin_place_catalog', 'INSERT') as can_insert,
  has_table_privilege(role_name, 'public.tripin_place_catalog', 'UPDATE') as can_update,
  has_table_privilege(role_name, 'public.tripin_place_catalog', 'DELETE') as can_delete,
  has_table_privilege(role_name, 'public.tripin_places_api', 'INSERT') as can_insert_view
from (values ('anon'), ('authenticated')) as roles(role_name);
