begin;
alter table public.tripin_demo_places
  add column kind text not null default 'attraction'
  check (kind in ('attraction', 'food', 'lodging'));
notify pgrst, 'reload schema';
commit;
