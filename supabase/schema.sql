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

create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  category_slug text not null references public.categories(slug) on delete restrict,
  subject_slug text not null,
  subject_name text not null,
  chapter_slug text,
  type text not null check (type in ('notes', 'pyqs', 'chapter')),
  year integer check (year is null or year between 1900 and 2200),
  slug text not null unique check (slug ~ '^[a-z0-9]+(/[a-z0-9]+(-[a-z0-9]+)*)*$'),
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
  search_document tsvector generated always as (
    to_tsvector('english',
      coalesce(title, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(subject_name, '') || ' ' ||
      coalesce(category_slug, '') || ' ' ||
      coalesce(array_to_string(tags, ' '), '')
    )
  ) stored,
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

alter table public.materials add column if not exists search_document tsvector
  generated always as (
    to_tsvector('english',
      coalesce(title, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(subject_name, '') || ' ' ||
      coalesce(category_slug, '') || ' ' ||
      coalesce(array_to_string(tags, ' '), '')
    )
  ) stored;

create index if not exists materials_published_category_idx
  on public.materials (category_slug, is_published, updated_at desc);
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
set search_path = ''
as $$
  select material.*
  from public.materials as material
  where material.is_published
    and length(trim(coalesce(search_query, ''))) > 0
    and (
      material.search_document @@ plainto_tsquery('english', search_query)
      or lower(concat_ws(' ', material.title, material.description, material.subject_name,
        material.category_slug, array_to_string(material.tags, ' ')))
        like '%' || lower(trim(search_query)) || '%'
    )
  order by ts_rank(material.search_document, plainto_tsquery('english', search_query)) desc,
    material.updated_at desc
  limit greatest(1, least(coalesce(result_limit, 30), 100))
  offset greatest(coalesce(result_offset, 0), 0);
$$;

create or replace function public.set_material_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists materials_updated_at on public.materials;
create trigger materials_updated_at before update on public.materials
for each row execute function public.set_material_updated_at();

create or replace function public.is_site_admin()
returns boolean language sql stable security invoker set search_path = '' as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

alter table public.categories enable row level security;
alter table public.subjects enable row level security;
alter table public.chapters enable row level security;
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
grant select on public.categories, public.subjects, public.chapters to anon, authenticated;
grant insert, update, delete on public.categories, public.subjects, public.chapters to authenticated;
grant select on public.materials to anon, authenticated;
grant insert, update, delete on public.materials to authenticated;
grant execute on function public.search_materials(text, integer, integer) to anon, authenticated;

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

drop policy if exists "Anyone can read published materials" on public.materials;
create policy "Anyone can read published materials" on public.materials for select to anon, authenticated
  using (is_published or public.is_site_admin());
drop policy if exists "Admins manage materials" on public.materials;
create policy "Admins manage materials" on public.materials for all to authenticated
  using (public.is_site_admin()) with check (public.is_site_admin());

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
