# Daily

React + Vite app with two tools, styled with Material 3 Expressive.

- `/organizer` — home organizer (rooms, priorities, swipe-to-prioritize)
- `/docs` — writing workspace (still on its previous styling)

```
src/
├── theme/        tokens.css (color roles, shape, motion) · components.css
├── lib/          organizerApi.js (Supabase REST)
└── features/
    ├── organizer/  HomeOrganizer · ItemRow · ItemDialog · constants
    └── docs/       DocsApp
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env` to override the defaults.

```
npm i && npm run dev
```
