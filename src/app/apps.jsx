import { BookOpenText, House } from "lucide-react";

/**
 * Registry of the apps that live inside Daily.
 * To add one (outfits, projects…): add an entry here + a case in Current() in App.jsx. The drawer picks it up.
 *  - id:    the value of `app` in NavProvider while this app is open (also highlights it in the drawer)
 *  - hue:   accent hue for its icon tile
 */
export const APPS = [
  {
    id: "home",
    label: "Home tasks",
    description: "Chores and rooms",
    icon: House,
    hue: 285,
  },
  {
    id: "docs",
    label: "Docs",
    description: "Writing workspace",
    icon: BookOpenText,
    hue: 155,
  },
];
