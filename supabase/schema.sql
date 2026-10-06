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

-- The two starting lists.
insert into public.todo_lists (id, name, hue, position) values
  ('list_easygaz',  'Easy Gaz Plus', 25,  0),
  ('list_personal', 'Personal',      285, 1)
on conflict (id) do nothing;

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
create index if not exists wardrobe_items_category_idx on public.wardrobe_items (category);

-- ── Access (no sign-in: the anon key may read and write) ──────────────────
do $$
declare
  t text;
begin
  foreach t in array array[
    'home_organizer_items',
    'todo_lists', 'todo_tasks',
    'docs_books', 'docs_chapters', 'docs_sections',
    'projects', 'project_milestones', 'project_tasks', 'project_notes',
    'life_values', 'life_principles', 'life_reflections',
    'wardrobe_items'
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
