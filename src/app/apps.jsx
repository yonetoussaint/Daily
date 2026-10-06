import { BookOpenText, Compass, Fuel, ListTodo, FolderKanban, House, LayoutDashboard, Shirt, Sparkles } from "lucide-react";

/** The launcher itself: the home screen that lists every app. */
export const HOME = { id: "launcher", label: "Home", description: "All your apps", icon: LayoutDashboard, hue: 255 };

/**
 * Registry of the apps that live inside Daily.
 * To add one (outfits, projects…): add an entry here + a case in Current() in App.jsx.
 * The launcher and the drawer pick it up.
 *  - id:    the value of `app` in NavProvider while this app is open (also highlights it in the drawer)
 *  - hue:   accent hue for its icon tile
 */
export const APPS = [
  { id: "tasks", label: "Home tasks", description: "Chores and rooms", icon: House, hue: 285 },
  { id: "docs", label: "Docs", description: "Writing workspace", icon: BookOpenText, hue: 155 },
  { id: "projects", label: "Projects", description: "Plan what you’re building", icon: FolderKanban, hue: 25 },
  { id: "values", label: "Values", description: "What matters and why", icon: Compass, hue: 350 },
  { id: "todo", label: "Todo", description: "Quick lists for anything", icon: ListTodo, hue: 200 },
  { id: "gaz", label: "Easy Gaz Plus", description: "Tasks for work", icon: Fuel, hue: 25 },
  { id: "wardrobe", label: "Wardrobe & Grooming", description: "Clothing, footwear, skincare, fragrance, tools", icon: Shirt, hue: 335 },
  { id: "outfits", label: "Outfits", description: "Looks built from your clothes, shoes and accessories", icon: Sparkles, hue: 305 },
];
