-- Expected: five rows across five metro areas, unknowns preserved,
-- and anonymous clients can only SELECT.
select metro_area, count(*) as rows,
       bool_and(coordinates is null and opening_hours is null
                    and ticket_price_idr is null) as unknowns_preserved
from public.tripin_demo_places group by metro_area order by metro_area;

select c.relrowsecurity as rls_enabled,
       has_table_privilege('anon', c.oid, 'select') as anon_select,
       has_table_privilege('anon', c.oid, 'insert') as anon_insert,
       has_table_privilege('anon', c.oid, 'update') as anon_update,
       has_table_privilege('anon', c.oid, 'delete') as anon_delete
from pg_class c where c.oid = 'public.tripin_demo_places'::regclass;
