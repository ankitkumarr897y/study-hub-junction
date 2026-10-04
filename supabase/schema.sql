-- Run this in the Supabase SQL Editor. Only the publishable anon key belongs in
-- config.js. All write access is protected by RLS and the admin app_metadata claim.

create extension if not exists pgcrypto;

create table if not exists public.categories (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  kind text not null check (kind in ('Class', 'Entrance exam', 'Competitive exam')),
  description text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.subjects (
  category_slug text not null references public.categories(slug) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  created_at timestamptz not null default now(),
  primary key (category_slug, slug)
);

create table if not exists public.chapters (
  category_slug text not null,
  subject_slug text not null,
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (category_slug, subject_slug, slug),
  foreign key (category_slug, subject_slug)
    references public.subjects(category_slug, slug) on delete cascade
);

create table if not exists public.boards (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null unique,
  description text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  category_slug text not null references public.categories(slug) on delete restrict,
  board_slug text references public.boards(slug) on delete restrict,
  subject_slug text not null,
  subject_name text not null,
  chapter_slug text,
  type text not null check (type in ('notes', 'pyqs', 'chapter')),
  year integer check (year is null or year between 1900 and 2200),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*(/[a-z0-9]+(-[a-z0-9]+)*)*$'),
  title text not null check (length(trim(title)) between 1 and 180),
  description text not null check (length(trim(description)) between 1 and 2000),
  file_url text check (file_url is null or file_url ~ '^https://'),
  thumbnail_url text check (thumbnail_url is null or thumbnail_url ~ '^https://'),
  tags text[] not null default '{}',
  seo_title text check (seo_title is null or length(seo_title) <= 180),
  seo_description text check (seo_description is null or length(seo_description) <= 300),
  license_status text not null default 'not_verified'
    check (license_status in ('not_verified', 'original', 'licensed', 'public_domain')),
  license_note text,
  search_document tsvector,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (category_slug, subject_slug)
    references public.subjects(category_slug, slug) on delete restrict,
  foreign key (category_slug, subject_slug, chapter_slug)
    references public.chapters(category_slug, subject_slug, slug) on delete restrict,
  check (
    not is_published
    or (license_status in ('original', 'licensed', 'public_domain')
      and nullif(trim(license_note), '') is not null)
  )
);

create table if not exists public.material_feedback (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials(id) on delete cascade,
  display_name text check (display_name is null or length(trim(display_name)) between 1 and 60),
  comment text check (comment is null or length(trim(comment)) between 1 and 1000),
  rating smallint check (rating is null or rating between 1 and 5),
  created_at timestamptz not null default now(),
  check (
    (rating is not null and comment is null and display_name is null)
    or (rating is null and nullif(trim(comment), '') is not null)
  )
);

create index if not exists material_feedback_material_created_idx
  on public.material_feedback (material_id, created_at desc);
create index if not exists material_feedback_ratings_idx
  on public.material_feedback (material_id, rating)
  where rating is not null;

create or replace function public.material_rating_summary(target_material_id uuid)
returns table (rating_count bigint, average_rating numeric)
language sql
stable
security invoker
set search_path = pg_catalog, public
as $$
  select count(*)::bigint,
    coalesce(round(avg(feedback.rating)::numeric, 1), 0::numeric)
  from public.material_feedback as feedback
  where feedback.material_id = target_material_id
    and feedback.rating is not null;
$$;

-- Migrate an earlier generated-column version, if one was partially applied.
do $$
begin
  if exists (
    select 1
    from pg_attribute
    where attrelid = 'public.materials'::regclass
      and attname = 'search_document'
      and attgenerated <> ''
      and not attisdropped
  ) then
    alter table public.materials drop column search_document;
  end if;
end;
$$;

alter table public.materials
  add column if not exists search_document tsvector;
alter table public.materials
  add column if not exists board_slug text references public.boards(slug) on delete restrict;

create or replace function public.set_material_search_document()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.search_document := to_tsvector(
    'english',
    coalesce(new.title, '') || ' ' ||
    coalesce(new.description, '') || ' ' ||
    coalesce(new.subject_name, '') || ' ' ||
    coalesce(new.category_slug, '') || ' ' ||
    coalesce(new.board_slug, '') || ' ' ||
    coalesce(array_to_string(new.tags, ' '), '')
  );
  return new;
end;
$$;

drop trigger if exists materials_search_document on public.materials;
create trigger materials_search_document
before insert or update of title, description, subject_name, category_slug, board_slug, tags
on public.materials
for each row execute function public.set_material_search_document();

update public.materials
set search_document = to_tsvector(
  'english',
  coalesce(title, '') || ' ' ||
  coalesce(description, '') || ' ' ||
  coalesce(subject_name, '') || ' ' ||
  coalesce(category_slug, '') || ' ' ||
  coalesce(board_slug, '') || ' ' ||
  coalesce(array_to_string(tags, ' '), '')
)
where search_document is null;

create index if not exists materials_published_category_idx
  on public.materials (category_slug, is_published, updated_at desc);
create index if not exists materials_published_board_category_idx
  on public.materials (board_slug, category_slug, is_published, updated_at desc);
create index if not exists materials_subject_year_idx
  on public.materials (category_slug, subject_slug, year);
create index if not exists materials_published_search_idx
  on public.materials using gin (search_document);
create index if not exists materials_tags_idx on public.materials using gin (tags);

create or replace function public.search_materials(
  search_query text,
  result_limit integer default 30,
  result_offset integer default 0
)
returns setof public.materials
language sql
stable
security invoker
set search_path = pg_catalog, public
as $$
  select material.*
  from public.materials as material
  where material.is_published
    and length(trim(coalesce(search_query, ''))) > 0
    and (
      material.search_document @@ plainto_tsquery('english', search_query)
      or lower(concat_ws(' ', material.title, material.description, material.subject_name,
        material.category_slug, material.board_slug, array_to_string(material.tags, ' ')))
        like '%' || lower(trim(search_query)) || '%'
    )
  order by ts_rank(material.search_document, plainto_tsquery('english', search_query)) desc,
    material.updated_at desc
  limit greatest(1, least(coalesce(result_limit, 30), 100))
  offset greatest(coalesce(result_offset, 0), 0);
$$;

create or replace function public.set_material_updated_at()
returns trigger language plpgsql set search_path = pg_catalog, public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists materials_updated_at on public.materials;
create trigger materials_updated_at before update on public.materials
for each row execute function public.set_material_updated_at();

create or replace function public.is_site_admin()
returns boolean language sql stable security invoker set search_path = pg_catalog, public, auth as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

alter table public.categories enable row level security;
alter table public.subjects enable row level security;
alter table public.chapters enable row level security;
alter table public.boards enable row level security;
alter table public.materials enable row level security;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('study-materials', 'study-materials', true, 26214400, array['application/pdf'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anyone can read study material PDFs" on storage.objects;
create policy "Anyone can read study material PDFs" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'study-materials');

drop policy if exists "Admins upload study material PDFs" on storage.objects;
create policy "Admins upload study material PDFs" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'study-materials'
    and public.is_site_admin()
    and lower(storage.extension(name)) = 'pdf'
  );

drop policy if exists "Admins update study material PDFs" on storage.objects;
create policy "Admins update study material PDFs" on storage.objects
  for update to authenticated
  using (bucket_id = 'study-materials' and public.is_site_admin())
  with check (
    bucket_id = 'study-materials'
    and public.is_site_admin()
    and lower(storage.extension(name)) = 'pdf'
  );

drop policy if exists "Admins delete study material PDFs" on storage.objects;
create policy "Admins delete study material PDFs" on storage.objects
  for delete to authenticated
  using (bucket_id = 'study-materials' and public.is_site_admin());

grant usage on schema public to anon, authenticated;
grant select on public.categories, public.subjects, public.chapters, public.boards to anon, authenticated;
grant insert, update, delete on public.categories, public.subjects, public.chapters to authenticated;
grant insert, update, delete on public.boards to authenticated;
grant select on public.materials to anon, authenticated;
grant insert, update, delete on public.materials to authenticated;
grant execute on function public.search_materials(text, integer, integer) to anon, authenticated;
grant select, insert on public.material_feedback to anon, authenticated;
grant delete on public.material_feedback to authenticated;
grant execute on function public.material_rating_summary(uuid) to anon, authenticated;

drop policy if exists "Anyone can read categories" on public.categories;
create policy "Anyone can read categories" on public.categories for select to anon, authenticated using (true);
drop policy if exists "Admins manage categories" on public.categories;
create policy "Admins manage categories" on public.categories for all to authenticated
  using (public.is_site_admin()) with check (public.is_site_admin());

drop policy if exists "Anyone can read subjects" on public.subjects;
create policy "Anyone can read subjects" on public.subjects for select to anon, authenticated using (true);
drop policy if exists "Admins manage subjects" on public.subjects;
create policy "Admins manage subjects" on public.subjects for all to authenticated
  using (public.is_site_admin()) with check (public.is_site_admin());

drop policy if exists "Anyone can read chapters" on public.chapters;
create policy "Anyone can read chapters" on public.chapters for select to anon, authenticated using (true);
drop policy if exists "Admins manage chapters" on public.chapters;
create policy "Admins manage chapters" on public.chapters for all to authenticated
  using (public.is_site_admin()) with check (public.is_site_admin());

drop policy if exists "Anyone can read boards" on public.boards;
create policy "Anyone can read boards" on public.boards for select to anon, authenticated using (true);
drop policy if exists "Admins manage boards" on public.boards;
create policy "Admins manage boards" on public.boards for all to authenticated
  using (public.is_site_admin()) with check (public.is_site_admin());

drop policy if exists "Anyone can read published materials" on public.materials;
create policy "Anyone can read published materials" on public.materials for select to anon, authenticated
  using (is_published or public.is_site_admin());
drop policy if exists "Admins manage materials" on public.materials;
create policy "Admins manage materials" on public.materials for all to authenticated
  using (public.is_site_admin()) with check (public.is_site_admin());

alter table public.material_feedback enable row level security;
drop policy if exists "Anyone can read feedback for published materials" on public.material_feedback;
create policy "Anyone can read feedback for published materials" on public.material_feedback
  for select to anon, authenticated
  using (exists (
    select 1 from public.materials
    where materials.id = material_feedback.material_id and materials.is_published
  ));
drop policy if exists "Anyone can comment on published materials" on public.material_feedback;
create policy "Anyone can comment on published materials" on public.material_feedback
  for insert to anon, authenticated
  with check (exists (
    select 1 from public.materials
    where materials.id = material_feedback.material_id and materials.is_published
  ));
drop policy if exists "Admins delete material feedback" on public.material_feedback;
create policy "Admins delete material feedback" on public.material_feedback
  for delete to authenticated using (public.is_site_admin());

insert into public.categories (slug, name, kind, description) values
  ('class-9', 'Class 9', 'Class', 'Build strong foundations with clear notes and chapter-wise practice.'),
  ('class-10', 'Class 10', 'Class', 'Revise smarter with subject notes and board exam practice.'),
  ('class-11', 'Class 11', 'Class', 'Make the transition to higher-level concepts feel manageable.'),
  ('class-12', 'Class 12', 'Class', 'Organise final-year revision and prepare for what comes next.'),
  ('jee-main', 'JEE Main', 'Entrance exam', 'Practice Physics, Chemistry and Mathematics by topic and year.'),
  ('jee-advanced', 'JEE Advanced', 'Entrance exam', 'Go deeper with challenging concepts and focused practice.'),
  ('neet', 'NEET', 'Entrance exam', 'Prepare Biology, Physics and Chemistry in one organised place.'),
  ('ssc', 'SSC', 'Competitive exam', 'Find study notes and previous year practice for SSC exams.')
on conflict (slug) do update set name = excluded.name, kind = excluded.kind, description = excluded.description;

insert into public.boards (slug, name, description) values
  ('cbse', 'CBSE', 'Central Board of Secondary Education study material for Classes 9–12.'),
  ('icse', 'ICSE', 'Council for the Indian School Certificate Examinations study material for Classes 9–12.'),
  ('jac-board', 'JAC Board', 'Jharkhand Academic Council study material for Classes 9–12.'),
  ('up-board', 'UP Board', 'Uttar Pradesh Board study material for Classes 9–12.'),
  ('bihar-board', 'Bihar Board', 'Bihar School Examination Board study material for Classes 9–12.')
on conflict (slug) do update set name = excluded.name, description = excluded.description;

insert into public.subjects (category_slug, slug, name) values
  ('class-9', 'maths', 'Maths'), ('class-9', 'science', 'Science'), ('class-9', 'english', 'English'),
  ('class-10', 'maths', 'Maths'), ('class-10', 'science', 'Science'), ('class-10', 'english', 'English'),
  ('class-11', 'physics', 'Physics'), ('class-11', 'chemistry', 'Chemistry'), ('class-11', 'mathematics', 'Mathematics'), ('class-11', 'biology', 'Biology'),
  ('class-12', 'physics', 'Physics'), ('class-12', 'chemistry', 'Chemistry'), ('class-12', 'mathematics', 'Mathematics'), ('class-12', 'biology', 'Biology'),
  ('jee-main', 'physics', 'Physics'), ('jee-main', 'chemistry', 'Chemistry'), ('jee-main', 'mathematics', 'Mathematics'),
  ('jee-advanced', 'physics', 'Physics'), ('jee-advanced', 'chemistry', 'Chemistry'), ('jee-advanced', 'mathematics', 'Mathematics'),
  ('neet', 'biology', 'Biology'), ('neet', 'physics', 'Physics'), ('neet', 'chemistry', 'Chemistry'),
  ('ssc', 'general-awareness', 'General Awareness'), ('ssc', 'quantitative-aptitude', 'Quantitative Aptitude'), ('ssc', 'reasoning', 'Reasoning')
on conflict (category_slug, slug) do update set name = excluded.name;

insert into public.chapters (category_slug, subject_slug, slug, name, sort_order) values
  ('class-10', 'maths', 'chapter-1', 'Real Numbers', 1)
on conflict (category_slug, subject_slug, slug) do update set name = excluded.name;

-- Example Telegram deep links can be added to the materials table by the owner.
-- Seed any real materials as drafts until their distribution rights are verified.
insert into public.materials
  (category_slug, subject_slug, subject_name, type, year, slug, title, description,
   license_status, license_note, is_published)
values
  ('neet', 'biology', 'Biology', 'pyqs', 2025, 'neet/pyqs/2025/biology',
   'NEET Biology Previous Year Questions 2025',
   'Sample draft listing. Add a PDF only after verifying permission to distribute it.',
   'not_verified', 'Sample listing; replace with source and permission details.', false),
  ('jee-main', 'physics', 'Physics', 'pyqs', 2025, 'jee-main/pyqs/2025/physics',
   'JEE Main Physics Previous Year Questions 2025',
   'Sample draft listing. Add a PDF only after verifying permission to distribute it.',
   'not_verified', 'Sample listing; replace with source and permission details.', false),
  ('jee-main', 'physics', 'Physics', 'notes', null, 'jee-main/notes/physics',
   'JEE Main Physics Notes',
   'Sample draft listing. Add original or licensed notes and their source details.',
   'not_verified', 'Sample listing; replace with source and permission details.', false),
  ('class-10', 'maths', 'Maths', 'chapter', null, 'class-10/maths/chapter-1',
   'Class 10 Maths Chapter 1',
   'Sample draft listing. Add a permitted chapter resource and source details.',
   'not_verified', 'Sample listing; replace with source and permission details.', false)
on conflict (slug) do nothing;
