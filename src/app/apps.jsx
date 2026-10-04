import { BookOpenText, House } from "lucide-react";

/**
 * Registry of the apps that live inside Daily.
 * To add one (outfits, projects…): add an entry here + a <Route> in App.jsx. The drawer picks it up.
 *  - to:    where tapping it goes
 *  - match: pathnames that count as "inside this app" (highlights it in the drawer)
 *  - hue:   accent hue for its icon tile
 */
export const APPS = [
  {
    id: "home",
    label: "Home tasks",
    description: "Chores and rooms",
    to: "/",
    match: (p) => p === "/" || p.startsWith("/rooms"),
    icon: House,
    hue: 285,
  },
  {
    id: "docs",
    label: "Docs",
    description: "Writing workspace",
    to: "/docs",
    match: (p) => p.startsWith("/docs"),
    icon: BookOpenText,
    hue: 155,
  },
];
