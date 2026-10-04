import { Code2, Gavel, Layers, Lightbulb, Megaphone, Scale, StickyNote, Truck, Wallet } from "lucide-react";

export const uid = (prefix = "pr") => `${prefix}_${Math.random().toString(36).slice(2, 9)}`;

export const AREAS = [
  { id: "product", label: "Product", hue: 285, icon: Layers },
  { id: "tech", label: "Tech", hue: 235, icon: Code2 },
  { id: "marketing", label: "Marketing", hue: 350, icon: Megaphone },
  { id: "legal", label: "Legal", hue: 60, icon: Scale },
  { id: "ops", label: "Operations", hue: 155, icon: Truck },
  { id: "finance", label: "Finance", hue: 190, icon: Wallet },
];
export const areaInfo = (id) => AREAS.find((a) => a.id === id) ?? AREAS[0];

export const STATUSES = [
  { id: "doing", label: "In progress" },
  { id: "todo", label: "To do" },
  { id: "done", label: "Done" },
];
export const nextStatus = (s) => ({ todo: "doing", doing: "done", done: "todo" })[s] ?? "todo";

export const NOTE_KINDS = [
  { id: "decision", label: "Decision", hue: 285, icon: Gavel },
  { id: "idea", label: "Idea", hue: 85, icon: Lightbulb },
  { id: "note", label: "Note", hue: 190, icon: StickyNote },
];
export const kindInfo = (id) => NOTE_KINDS.find((k) => k.id === id) ?? NOTE_KINDS[2];

export const STAGES = ["Idea", "Building", "Launched"];

/** Replace the item with the same id, or append it. */
export const upsert = (list, item) => (list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item]);

export const progress = (p) => ({ done: p.tasks.filter((t) => t.status === "done").length, total: p.tasks.length });
export const milestoneProgress = (p, m) => progress({ tasks: p.tasks.filter((t) => t.milestoneId === m.id) });

const day = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);

/** The example project: Mima, an online marketplace that is about to be built. */
export function seedProjects() {
  const now = Date.now();
  const ms = { found: uid("ms"), mvp: uid("ms"), beta: uid("ms"), launch: uid("ms") };
  const t = (title, area, status, milestoneId, due = "", details = "") => ({ id: uid("tk"), title, area, status, milestoneId, due, details });
  const n = (kind, title, body, ago) => ({ id: uid("nt"), kind, title, body, createdAt: now - ago * 864e5 });
  return [
    {
      id: uid("pj"),
      name: "Mima",
      tagline: "An online marketplace where local sellers meet buyers.",
      stage: "Building",
      hue: 25,
      createdAt: now,
      updatedAt: now,
      milestones: [
        { id: ms.found, title: "Foundations", due: day(14) },
        { id: ms.mvp, title: "MVP build", due: day(60) },
        { id: ms.beta, title: "Seller beta", due: day(90) },
        { id: ms.launch, title: "Public launch", due: day(135) },
      ],
      tasks: [
        t("Write the one-page vision and target buyers", "product", "done", ms.found, "", "Who buys, who sells, and why Mima beats a social media page."),
        t("Define MVP scope: buyer and seller flows", "product", "doing", ms.found, day(5)),
        t("Sketch listing page and checkout screens", "product", "todo", ms.found, day(10)),
        t("Register the business and open a bank account", "legal", "todo", ms.found, day(12)),
        t("Decide stack and database schema", "tech", "doing", ms.found, day(7), "Users, sellers, listings, orders, reviews, payouts."),
        t("Auth and seller profiles", "tech", "todo", ms.mvp, day(25)),
        t("Listings: create, edit, photos", "tech", "todo", ms.mvp, day(35)),
        t("Search and category browsing", "tech", "todo", ms.mvp, day(45)),
        t("Cart, checkout and payments", "tech", "todo", ms.mvp, day(55)),
        t("Admin panel: approve sellers, handle reports", "tech", "todo", ms.mvp, day(58)),
        t("Choose the commission model", "finance", "doing", ms.found, day(9)),
        t("Compare payment providers and their fees", "finance", "todo", ms.mvp, day(20)),
        t("Terms of service and seller agreement", "legal", "todo", ms.mvp, day(40)),
        t("Privacy policy", "legal", "todo", ms.beta, day(70)),
        t("Pick the brand look and build the landing page", "marketing", "todo", ms.found, day(13)),
        t("Start a waitlist for buyers and sellers", "marketing", "todo", ms.mvp, day(30)),
        t("Recruit 20 sellers for the beta", "marketing", "todo", ms.beta, day(80)),
        t("Seller onboarding checklist", "ops", "todo", ms.beta, day(75)),
        t("Decide how orders are delivered and returned", "ops", "todo", ms.mvp, day(50)),
        t("Set up a support inbox and reply templates", "ops", "todo", ms.launch, day(110)),
        t("Launch plan and first-month promotion", "marketing", "todo", ms.launch, day(120)),
      ],
      notes: [
        n("decision", "Start with one city", "Launch where I can meet sellers in person, then widen. Keeps delivery and support manageable.", 3),
        n("idea", "Verified seller badge", "Sellers who finish onboarding and ship on time get a badge. Could become a paid tier later.", 2),
        n("note", "Competitor research", "List 5 marketplaces and social-media shops buyers use today: fees, trust problems, what sellers complain about.", 1),
        n("idea", "Buyer protection", "Hold payment until the buyer confirms delivery. Check what the payment provider supports.", 0),
      ],
    },
  ];
}
