-- get_schema_overview: vraća JSON metapodataka šeme (tabele, kolone, FK, CHECK, row_counts)
-- za public šemu. Koristi je /api/schema (Operational Flow Explorer) za DB delta provere.
--
-- Cursor-ov /admin/system + /api/schema pozivaju ovu rpc, ali funkcija nije bila u repu
-- (samo u bazi). Ovo je čini reproduktivnom.
--
-- SECURITY: SECURITY DEFINER + execute SAMO service_role (ne PUBLIC/anon/authenticated).
-- anon nasleđuje PUBLIC, zato MORA revoke from PUBLIC (samo revoke from anon ne pomaže).

create or replace function public.get_schema_overview()
returns json
language sql
security definer
set search_path = pg_catalog, public
as $$
  with cols as (
    select
      c.relname as table_name,
      a.attname as column_name,
      pg_catalog.format_type(a.atttypid, a.atttypmod) as data_type,
      not a.attnotnull as nullable,
      pg_catalog.pg_get_expr(ad.adbin, ad.adrelid) as default_val,
      a.attnum as ordinal
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    join pg_catalog.pg_attribute a on a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
    left join pg_catalog.pg_attrdef ad on ad.adrelid = c.oid and ad.adnum = a.attnum
    where n.nspname = 'public' and c.relkind = 'r'
  ),
  cons as (
    select
      cl.relname as table_name,
      con.conname as constraint_name,
      con.contype,
      pg_catalog.pg_get_constraintdef(con.oid) as def,
      con.confrelid,
      (
        select array_agg(a.attname)
        from pg_catalog.pg_attribute a
        join unnest(con.conkey) as k on a.attnum = k and a.attrelid = con.conrelid
      ) as columns
    from pg_catalog.pg_constraint con
    join pg_catalog.pg_class cl on cl.oid = con.conrelid
    join pg_catalog.pg_namespace n on n.oid = cl.relnamespace
    where n.nspname = 'public'
  )
  select json_build_object(
    'tables', coalesce((
      select json_agg(json_build_object(
        'name', tx.table_name,
        'columns', coalesce((
          select json_agg(json_build_object(
            'name', c.column_name,
            'type', c.data_type,
            'nullable', c.nullable,
            'default', c.default_val,
            'is_pk', exists (select 1 from cons cs where cs.table_name = c.table_name and cs.contype = 'p' and c.column_name = any(cs.columns)),
            'is_fk', exists (select 1 from cons cs where cs.table_name = c.table_name and cs.contype = 'f' and c.column_name = any(cs.columns)),
            'is_unique', exists (select 1 from cons cs where cs.table_name = c.table_name and cs.contype = 'u' and c.column_name = any(cs.columns))
          ) order by c.ordinal)
          from cols c where c.table_name = tx.table_name
        ), '[]'::json)
      ) order by tx.table_name)
      from (select distinct table_name from cols) tx
    ), '[]'::json),
    'foreign_keys', coalesce((
      select json_agg(json_build_object('table', cs.table_name, 'columns', cs.columns, 'references_table', fc.relname, 'definition', cs.def))
      from cons cs
      left join pg_catalog.pg_class fc on fc.oid = cs.confrelid
      where cs.contype = 'f'
    ), '[]'::json),
    'checks', coalesce((
      select json_agg(json_build_object('table', cs.table_name, 'name', cs.constraint_name, 'condition', cs.def))
      from cons cs where cs.contype = 'c'
    ), '[]'::json),
    'row_counts', coalesce((
      select json_agg(json_build_object('table', t, 'count', c))
      from (
        select 'landing_pages'::text as t, count(*)::bigint as c from landing_pages
        union all select 'profiles', count(*)::bigint from profiles
        union all select 'visits', count(*)::bigint from visits
        union all select 'visit_events', count(*)::bigint from visit_events
        union all select 'leads', count(*)::bigint from leads
      ) rc
    ), '[]'::json)
  );
$$;

-- Zaključavanje: samo service_role (koju koristi supabaseAdminClient u /api/schema).
-- anon/authenticated/Public NE smeju — funkcija izlaže šemu + row counts.
revoke execute on function public.get_schema_overview() from public, anon, authenticated;
grant execute on function public.get_schema_overview() to service_role;
