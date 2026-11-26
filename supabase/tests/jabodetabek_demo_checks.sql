-- Expected: 15 rows, one in each of five metro areas x three categories;
-- this is sample coverage, not geographic or business completeness.
-- Unknowns preserved,
-- and anonymous clients can only SELECT.
select metro_area, count(*) as rows,
       bool_and(coordinates is null and opening_hours is null
                    and ticket_price_idr is null) as unknowns_preserved
from public.tripin_demo_places group by metro_area order by metro_area;

-- Coverage matrix: every demo category cell should now contain one sample.
select areas.metro_area, kinds.kind, count(p.id) as rows
from (values ('Jakarta'),('Bogor'),('Depok'),('Tangerang'),('Bekasi'))
     as areas(metro_area)
cross join (values ('attraction'),('food'),('lodging')) as kinds(kind)
left join public.tripin_demo_places p
  on p.metro_area = areas.metro_area and p.kind = kinds.kind
group by areas.metro_area, kinds.kind
order by areas.metro_area, kinds.kind;

select c.relrowsecurity as rls_enabled,
       has_table_privilege('anon', c.oid, 'select') as anon_select,
       has_table_privilege('anon', c.oid, 'insert') as anon_insert,
       has_table_privilege('anon', c.oid, 'update') as anon_update,
       has_table_privilege('anon', c.oid, 'delete') as anon_delete
from pg_class c where c.oid = 'public.tripin_demo_places'::regclass;
