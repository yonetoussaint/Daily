# Daily

A home to-do app in **Material 3 Expressive**, plus a writing workspace (Docs), a project planner (Projects) and a place for your values and morals (Values), a quick-capture Todo, and Easy Gaz Plus (tasks for work), all in the same design system. Apps are opened from the hamburger drawer. React + Vite, Supabase REST for storage.

```
npm i && npm run dev
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env` to override the defaults.

## Database

Every app stores its data in Supabase. Run **`supabase/schema.sql`** once in the Supabase SQL editor (it is safe to re-run); it creates all tables, indexes and access policies.

| App | Tables |
| --- | --- |
| Home tasks | `home_organizer_items` |
| Todo | `todo_lists`, `todo_tasks` |
| Docs | `docs_books`, `docs_chapters`, `docs_sections` |
| Projects | `projects`, `project_milestones`, `project_tasks`, `project_notes` |
| Values | `life_values`, `life_principles`, `life_reflections` |
| Wardrobe & Grooming | `wardrobe_items` |
| Outfits | `outfits`, `outfit_items` |

How it works: each app loads its rows when opened and saves changes shortly after (only the rows that changed are sent). If saving fails, a snackbar says so and it retries. The first time an app opens on a device, anything it had saved in that browser's localStorage is copied up to the database (the old localStorage copy is left untouched as a backup). The theme choice stays in localStorage on purpose.

The app has no sign-in, so the policies allow the public anon key to read and write — anyone with your project URL and anon key can see this data. Add Supabase Auth and per-user policies before storing anything private.

## Screens

Daily is a single-page app with no router and no URL routes (so no `_redirects` / `netlify.toml` rewrites are needed). The home screen is a launcher with one tile per app. Navigation is plain React state in `src/app/NavProvider.jsx`; the back arrows only change that state.

| View | What it is |
| --- | --- |
| Home | **Launcher** — a tile for every app; the drawer lists the same apps |
| Home tasks → Tasks | progress hero, search, Open/Done filter, room chips, tasks grouped by priority |
| Home tasks → Rooms | one expressive card per room with progress; tap to jump into that room's tasks |
| Docs → Library | search, type filter, swipe a doc to edit or delete it (with Undo) |
| Docs → Editor | outline of chapters and sections, read / edit modes, rich-text toolbar |
| Projects → List | every project with progress and stage; **Mima** (an online marketplace) is the seeded example |
| Projects → Project | **Tasks** by area (product, tech, marketing, legal, operations, finance), **Roadmap** of milestones with progress, **Notes** for decisions, ideas and research |
| Values → Values | the things that matter most to you, by area of life, with how often you lived each one |
| Values → Principles | rules you want to live by (“I listen before I answer”), linked to a value |
| Values → Journal | days you lived it, fell short, lessons and quotes; a rotating **Today’s reminder** sits on top |
| Wardrobe & Grooming | nine categories, each with types: **Clothing** (shirts, jeans, suits, socks…), **Footwear**, **Skincare**, **Oral Care**, **Body Care**, **Fragrance**, **Hair & Grooming**, **Accessories**, **Grooming Tools**. Bottom Items / Categories bar, search, category chips with type chips under them, photos (grid or list), **Import / Export JSON** (paste or load a file; an AI prompt is built in). Old rooms (Shoes, Trousers, Underwear & Sleep…) are mapped into the new categories automatically. |
| Todo | type a task the moment you're told it; lists (Personal, your own), who asked, due date, grouped Overdue / Today / Upcoming / No date |
| Easy Gaz Plus | its own quick-capture task list for work: who asked, due date, grouped Overdue / Today / Upcoming / No date |

## Structure

```
src/
├── main.jsx                  entry point
├── data/                     database layer: db.js (REST client) · sync.js (diff-based saving, one-time localStorage import) · useStore.js · SyncGate.jsx (loading / retry)
├── app/                      app shell: navigation state, drawer, top bar, FAB, theme toggle
│   ├── App.jsx · NavProvider.jsx · Launcher.jsx · AppShell.jsx · AppShell.css · useTheme.js
│   ├── apps.jsx                  registry of the apps in the drawer — add new apps here + a case in App.jsx (the launcher picks them up)
│   └── AppDrawer.jsx · DrawerProvider.jsx   hamburger navigation drawer
├── design/                   the design system — no app logic in here
│   ├── tokens.css            colour roles (OKLCH + light-dark()), shape scale, motion springs, elevation
│   ├── base.css              reset, type scale, state layers
│   ├── shapes.js             morphable "cookie" polygons
│   └── components/           Button · IconButton · Fab · ButtonGroup · Chip · TextField · Sheet ·
│                             Snackbar · WavyProgress · EmptyState · NavigationBar · TopAppBar
└── features/
    ├── tasks/
    │   ├── api.js            Supabase REST (home_organizer_items)
    │   ├── model.js          rooms (hue/icon/shape) and priorities
    │   ├── TasksProvider.jsx state, optimistic sync, undoable delete, filters, derived groups/stats
    │   ├── useSwipe.js       swipe-to-reveal gesture
    │   ├── screens/          TasksScreen · RoomsScreen
    │   └── components/       TaskCard · TaskSheet · SummaryCard
    ├── docs/
        ├── model.js · storage.js    types, word counts, seed data; Supabase tables (see storage.js)
        ├── DocsProvider.jsx         library state (saved to the database, undoable delete)
        ├── DocsApp.jsx              picks Library or Editor
        ├── screens/                 LibraryScreen · BookScreen
        └── components/              BookRow · BookSheet · NodeSheet · Outline · formatting (dock + selection pill)
    ├── todo/
    │   ├── model.js · storage.js    lists, due-date groups, seed data; Supabase tables (see storage.js)
    │   ├── TodoProvider.jsx         lists + tasks (saved to the database, undoable deletes)
    │   ├── screens/                 TodoScreen (quick add, list chips, groups)
    │   └── components/              TaskSheet · ListSheet
    ├── values/
    │   ├── model.js · storage.js    areas, journal types, example data; Supabase tables (see storage.js)
    │   ├── ValuesProvider.jsx       values, principles, journal (saved to the database, undoable delete)
    │   ├── screens/                 ValuesScreen (reminder + three tabs)
    │   └── components/              Tabs · EntrySheet
    └── projects/
        ├── model.js · storage.js    areas, statuses, Mima seed data; Supabase tables (see storage.js)
        ├── ProjectsProvider.jsx     all projects (saved to the database, undoable delete)
        ├── ProjectsApp.jsx          picks the list or one project
        ├── screens/                 ProjectsScreen · ProjectScreen
        └── components/              Tabs (tasks · roadmap · notes) · EntrySheet · ProjectSheet
```

## Design notes

- **Colour**: a violet / pink / amber scheme written in OKLCH. `light-dark()` gives light and dark from one set of tokens; the top-bar button cycles auto → light → dark.
- **Shape**: pills that square off when pressed, chips that round into pills when selected, and a checkbox that morphs from a circle to the room's own scalloped shape.
- **Motion**: spring easing for spatial change (`--spring-*`), short fades for colour; the FAB collapses to an icon while scrolling down. All motion respects `prefers-reduced-motion`.
- **Adaptive**: bottom navigation bar on phones, navigation rail from 840px; the add/edit sheet is a bottom sheet on phones and a dialog on larger screens.
- **Behaviour**: swipe a task left to change its priority; deleting shows an Undo snackbar (the delete is only sent after 5 seconds).
