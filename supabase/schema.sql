-- ============================================================================
-- Daily — database schema for ALL apps
-- Run this whole file once in the Supabase SQL editor. It is safe to re-run.
--
--   Home tasks  home_organizer_items
--   Todo        todo_lists, todo_tasks
--   Docs        docs_books, docs_chapters, docs_sections
--   Projects    projects, project_milestones, project_tasks, project_notes
--   Values      life_values, life_principles, life_reflections
--   Wardrobe    wardrobe_items
--   Outfits     outfits, outfit_items (links to wardrobe_items)
--
-- The app has no sign-in (it talks to Supabase with the public anon key), so the
-- policies at the bottom let the anon role read and write. Anyone who has your
-- project URL + anon key can read and change this data. If you add sign-in later,
-- replace those policies with per-user ones (add a user_id column first).
-- ============================================================================

-- ── Home tasks ─────────────────────────────────────────────────────────────
-- Already exists if the app has been working; then this statement does nothing.
create table if not exists public.home_organizer_items (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  room       text,
  priority   text,
  checked    boolean not null default false,
  created_at timestamptz not null default now()
);

-- ── Todo ───────────────────────────────────────────────────────────────────
create table if not exists public.todo_lists (
  id         text primary key,
  name       text not null,
  hue        integer not null default 25,
  position   integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.todo_tasks (
  id         text primary key,
  list_id    text not null references public.todo_lists(id) on delete cascade,
  title      text not null,
  asked_by   text not null default '',
  due        date,
  notes      text not null default '',
  done       boolean not null default false,
  done_at    timestamptz,
  created_at timestamptz default now()
);
create index if not exists todo_tasks_list_idx on public.todo_tasks (list_id);
create index if not exists todo_tasks_due_idx  on public.todo_tasks (due) where not done;

-- The starting list.
insert into public.todo_lists (id, name, hue, position) values
  ('list_personal', 'Personal', 285, 0)
on conflict (id) do nothing;

-- ── Easy Gaz Plus ──────────────────────────────────────────────────────────
-- Its own app (it used to be a list inside Todo).
create table if not exists public.gaz_tasks (
  id         text primary key,
  title      text not null,
  asked_by   text not null default '',
  due        date,
  notes      text not null default '',
  done       boolean not null default false,
  done_at    timestamptz,
  created_at timestamptz default now()
);
create index if not exists gaz_tasks_due_idx on public.gaz_tasks (due) where not done;

-- One-time move for existing databases: copy the old Easy Gaz Plus list's tasks
-- over, then remove that list from Todo (its tasks go with it). Safe to re-run.
insert into public.gaz_tasks (id, title, asked_by, due, notes, done, done_at, created_at)
  select id, title, asked_by, due, notes, done, done_at, created_at
  from public.todo_tasks where list_id = 'list_easygaz'
on conflict (id) do nothing;
delete from public.todo_lists where id = 'list_easygaz';

-- ── Docs ───────────────────────────────────────────────────────────────────
create table if not exists public.docs_books (
  id         text primary key,
  title      text not null,
  type       text not null default 'book',        -- note | book | documentation
  tags       text[] not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.docs_chapters (
  id          text primary key,
  book_id     text not null references public.docs_books(id) on delete cascade,
  title       text not null default '',
  description text not null default '',
  content     text not null default '',            -- HTML
  position    integer not null default 0
);
create index if not exists docs_chapters_book_idx on public.docs_chapters (book_id, position);

create table if not exists public.docs_sections (
  id         text primary key,
  chapter_id text not null references public.docs_chapters(id) on delete cascade,
  title      text not null default '',
  content    text not null default '',             -- HTML
  position   integer not null default 0
);
create index if not exists docs_sections_chapter_idx on public.docs_sections (chapter_id, position);

-- ── Projects ───────────────────────────────────────────────────────────────
create table if not exists public.projects (
  id         text primary key,
  name       text not null,
  tagline    text not null default '',
  stage      text not null default 'Idea',         -- Idea | Building | Launched
  hue        integer not null default 285,
  position   integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.project_milestones (
  id         text primary key,
  project_id text not null references public.projects(id) on delete cascade,
  title      text not null,
  due        date,
  position   integer not null default 0
);
create index if not exists project_milestones_project_idx on public.project_milestones (project_id, position);

create table if not exists public.project_tasks (
  id           text primary key,
  project_id   text not null references public.projects(id) on delete cascade,
  milestone_id text references public.project_milestones(id) on delete set null,
  title        text not null,
  area         text not null default 'product',    -- product | tech | marketing | legal | ops | finance
  details      text not null default '',
  due          date,
  status       text not null default 'todo',       -- todo | doing | done
  position     integer not null default 0
);
create index if not exists project_tasks_project_idx   on public.project_tasks (project_id, position);
create index if not exists project_tasks_milestone_idx on public.project_tasks (milestone_id);

create table if not exists public.project_notes (
  id         text primary key,
  project_id text not null references public.projects(id) on delete cascade,
  title      text not null,
  kind       text not null default 'note',         -- decision | idea | note
  body       text not null default '',
  created_at timestamptz default now(),
  position   integer not null default 0
);
create index if not exists project_notes_project_idx on public.project_notes (project_id, position);

-- ── Values ─────────────────────────────────────────────────────────────────
create table if not exists public.life_values (
  id         text primary key,
  title      text not null,
  meaning    text not null default '',
  category   text not null default 'character',    -- character | people | work | money | body | growth
  position   integer not null default 0,
  created_at timestamptz default now()
);

-- value_id is a plain reference (no foreign key): deleting a value in the app
-- keeps the principles and journal entries that mentioned it.
create table if not exists public.life_principles (
  id         text primary key,
  title      text not null,
  why        text not null default '',
  category   text not null default 'character',
  value_id   text,
  position   integer not null default 0,
  created_at timestamptz default now()
);
create index if not exists life_principles_value_idx on public.life_principles (value_id);

create table if not exists public.life_reflections (
  id         text primary key,
  title      text not null,
  body       text not null default '',
  kind       text not null default 'lived',        -- lived | short | lesson | quote
  value_id   text,
  position   integer not null default 0,
  created_at timestamptz default now()
);
create index if not exists life_reflections_value_idx on public.life_reflections (value_id);

-- ── Wardrobe ───────────────────────────────────────────────────────────────
create table if not exists public.wardrobe_items (
  id         text primary key,
  name       text not null,
  category   text not null default 'Other',         -- Tops | Bottoms | Outerwear | Dresses | Shoes | Accessories | Activewear | Sleep & Under | Other
  color      text not null default '',
  brand      text not null default '',
  size       text not null default '',
  season     text not null default 'all',           -- all | warm | cold
  notes      text not null default '',
  created_at timestamptz default now()
);
-- Photo: a small JPEG data URL (made in the app) or an https link.
alter table public.wardrobe_items add column if not exists image text not null default '';
create index if not exists wardrobe_items_category_idx on public.wardrobe_items (category);

-- ── Outfits ────────────────────────────────────────────────────────────────
create table if not exists public.outfits (
  id         text primary key,
  name       text not null,
  occasion   text not null default 'casual',        -- casual | work | formal | evening | sport | home | other
  season     text not null default 'all',           -- all | warm | cold
  notes      text not null default '',
  favorite   boolean not null default false,
  wear_count integer not null default 0,
  last_worn  timestamptz,
  created_at timestamptz default now()
);
-- One row per piece in an outfit. item_id is a wardrobe_items id (no foreign key, so a
-- stale browser can never block saving); the trigger below removes links when a piece is deleted.
create table if not exists public.outfit_items (
  id         text primary key,                      -- "<outfit id>~<item id>"
  outfit_id  text not null references public.outfits(id) on delete cascade,
  item_id    text not null,
  position   integer not null default 0
);
create index if not exists outfit_items_outfit_idx on public.outfit_items (outfit_id);
create index if not exists outfit_items_item_idx on public.outfit_items (item_id);

create or replace function public.outfit_items_unlink_deleted_piece() returns trigger
language plpgsql as $$
begin
  delete from public.outfit_items where item_id = old.id;
  return old;
end $$;
drop trigger if exists wardrobe_items_unlink on public.wardrobe_items;
create trigger wardrobe_items_unlink after delete on public.wardrobe_items
  for each row execute function public.outfit_items_unlink_deleted_piece();

-- ── Access (no sign-in: the anon key may read and write) ──────────────────
do $$
declare
  t text;
begin
  foreach t in array array[
    'home_organizer_items',
    'todo_lists', 'todo_tasks', 'gaz_tasks',
    'docs_books', 'docs_chapters', 'docs_sections',
    'projects', 'project_milestones', 'project_tasks', 'project_notes',
    'life_values', 'life_principles', 'life_reflections',
    'wardrobe_items',
    'outfits', 'outfit_items'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists daily_anon_all on public.%I', t);
    execute format('create policy daily_anon_all on public.%I for all to anon, authenticated using (true) with check (true)', t);
    execute format('grant select, insert, update, delete on public.%I to anon, authenticated', t);
  end loop;
end $$;

-- Make the new tables visible to the API right away.
notify pgrst, 'reload schema';
