# Daily

A home to-do app in **Material 3 Expressive**, plus a writing workspace (Docs) and a project planner (Projects), all in the same design system. Apps are opened from the hamburger drawer. React + Vite, Supabase REST for storage.

```
npm i && npm run dev
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env` to override the defaults.

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

## Structure

```
src/
├── main.jsx                  entry point
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
        ├── model.js · storage.js    types, word counts, seed data; localStorage persistence
        ├── DocsProvider.jsx         library state (debounced save, undoable delete)
        ├── DocsApp.jsx              picks Library or Editor
        ├── screens/                 LibraryScreen · BookScreen
        └── components/              BookRow · BookSheet · NodeSheet · Outline · formatting (dock + selection pill)
    └── projects/
        ├── model.js · storage.js    areas, statuses, Mima seed data; localStorage persistence
        ├── ProjectsProvider.jsx     all projects (debounced save, undoable delete)
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
