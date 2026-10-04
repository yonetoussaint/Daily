import { Bath, Bed, Briefcase, Car, ChevronsDown, ChevronsUp, CookingPot, DoorOpen, Equal, ListChecks, Shirt, Sofa } from "lucide-react";

/** Rooms: each gets its own hue, icon and scalloped silhouette. */
export const ROOMS = [
  { name: "Bedroom", hue: 285, icon: Bed, lobes: 8, amp: 0.07 },
  { name: "Bathroom", hue: 215, icon: Bath, lobes: 6, amp: 0.09 },
  { name: "Wardrobe", hue: 335, icon: Shirt, lobes: 10, amp: 0.06 },
  { name: "Kitchen", hue: 55, icon: CookingPot, lobes: 12, amp: 0.05 },
  { name: "Living Room", hue: 150, icon: Sofa, lobes: 7, amp: 0.08 },
  { name: "Entryway", hue: 100, icon: DoorOpen, lobes: 5, amp: 0.09 },
  { name: "Garage", hue: 190, icon: Car, lobes: 9, amp: 0.07 },
  { name: "Work", hue: 255, icon: Briefcase, lobes: 11, amp: 0.05 },
];

const FALLBACK_ROOM = { name: "Other", hue: 285, icon: ListChecks, lobes: 8, amp: 0.07 };
export const roomMeta = (name) => ROOMS.find((r) => r.name === name) ?? { ...FALLBACK_ROOM, name };

export const PRIORITIES = ["High", "Medium", "Low"];
export const PRIORITY_META = {
  High: { label: "High priority", short: "High", hue: 25, icon: ChevronsUp },
  Medium: { label: "Medium priority", short: "Medium", hue: 75, icon: Equal },
  Low: { label: "Low priority", short: "Low", hue: 230, icon: ChevronsDown },
};
export const normalizePriority = (p) => (PRIORITIES.includes(p) ? p : "Medium");

export const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "done", label: "Done" },
];
