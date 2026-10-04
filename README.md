# Daily

A home to-do app in **Material 3 Expressive**, plus a writing workspace (Docs), both in the same design system. Apps are opened from the hamburger drawer. React + Vite, Supabase REST for storage.

```
npm i && npm run dev
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env` to override the defaults.

## Screens

| Route | What it is |
| --- | --- |
| `/` | **Home tasks** — progress hero, search, Open/Done filter, room chips, tasks grouped by priority |
| `/rooms` | **Rooms** — one expressive card per room with progress; tap to jump into that room's tasks |
| `/docs` | **Docs library** — search, type filter, swipe a doc to edit or delete it (with Undo) |
| `/docs/:bookId` | **Editor** — outline of chapters and sections, read / edit modes, rich-text toolbar |
| `/organizer` | Old URL, redirects to `/` |

## Structure

```
src/
├── main.jsx                  entry point
├── app/                      app shell: routes, navigation, top bar, FAB, theme toggle
│   ├── App.jsx · AppShell.jsx · AppShell.css · useTheme.js
│   ├── apps.jsx                  registry of the apps in the drawer — add new apps here
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
    └── docs/
        ├── model.js · storage.js    types, word counts, seed data; localStorage persistence
        ├── DocsProvider.jsx         library state (debounced save, undoable delete)
        ├── screens/                 LibraryScreen · BookScreen
        └── components/              BookRow · BookSheet · NodeSheet · Outline · formatting (dock + selection pill)
```

## Design notes

- **Colour**: a violet / pink / amber scheme written in OKLCH. `light-dark()` gives light and dark from one set of tokens; the top-bar button cycles auto → light → dark.
- **Shape**: pills that square off when pressed, chips that round into pills when selected, and a checkbox that morphs from a circle to the room's own scalloped shape.
- **Motion**: spring easing for spatial change (`--spring-*`), short fades for colour; the FAB collapses to an icon while scrolling down. All motion respects `prefers-reduced-motion`.
- **Adaptive**: bottom navigation bar on phones, navigation rail from 840px; the add/edit sheet is a bottom sheet on phones and a dialog on larger screens.
- **Behaviour**: swipe a task left to change its priority; deleting shows an Undo snackbar (the delete is only sent after 5 seconds).
