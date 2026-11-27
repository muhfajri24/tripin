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

-- Administrative coverage: every empty cell is an explicit gap, not a
-- missing row accidentally hidden by the five metro labels.
with areas(administrative_area) as (
  values ('Jakarta Pusat'), ('Jakarta Utara'), ('Jakarta Barat'),
         ('Jakarta Selatan'), ('Jakarta Timur'), ('Kepulauan Seribu'),
         ('Kota Bogor'), ('Kabupaten Bogor'), ('Kota Depok'),
         ('Kota Tangerang'), ('Kabupaten Tangerang'), ('Tangerang Selatan'),
         ('Kota Bekasi'), ('Kabupaten Bekasi')
), kinds(kind) as (values ('attraction'), ('food'), ('lodging'))
select areas.administrative_area, kinds.kind, count(p.id) as sample_count,
       min(p.checked_on) as oldest_check,
       count(distinct p.source_url) as distinct_sources,
       (count(p.id) = 0) as gap
from areas cross join kinds
left join public.tripin_demo_places p
  on p.administrative_area = areas.administrative_area
 and p.kind = kinds.kind
group by areas.administrative_area, kinds.kind
order by areas.administrative_area, kinds.kind;

select count(*) as total_rows,
       count(*) filter (where administrative_area is null) as unclassified,
       count(distinct id) as unique_ids,
       count(*) filter (where coordinates is not null or opening_hours is not null
                        or ticket_price_idr is not null) as operational_claims
from public.tripin_demo_places;
