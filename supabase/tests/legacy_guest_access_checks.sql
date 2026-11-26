-- Read-only verification after secure_legacy_guest_tables migration.
-- All four prototype tables must remain inaccessible to public client roles.
select c.relname as table_name,
       c.relrowsecurity as rls_enabled,
       has_table_privilege('anon', c.oid, 'select') as anon_select,
       has_table_privilege('anon', c.oid, 'insert') as anon_insert,
       has_table_privilege('authenticated', c.oid, 'select') as authenticated_select,
       (select count(*) from pg_policies p
         where p.schemaname = 'public' and p.tablename = c.relname)
         as policy_count
from pg_class c
where c.oid in (
  'public.itineraries'::regclass,
  'public.itinerary_items'::regclass,
  'public.saved_places'::regclass,
  'public.app_settings'::regclass
)
order by c.relname;
