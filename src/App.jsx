import React, { useState, useMemo, useEffect, useRef } from "react";
import { Plus, X, Check, Flame, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

// Playhub Supabase project — data is persisted as a single JSON blob in
// task_ledger_state, the same pattern this project already uses for
// propane_app_state.
const supabase = createClient(
  "https://wkfzhcszhgewkvwukzes.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrZnpoY3N6aGdld2t2d3VremVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg3MDE1NzksImV4cCI6MjA1NDI3NzU3OX0.TzSh8M9NOTnsmVaNxquif4xzSxWaVZp9sePHcjrgCVI"
);
const LEDGER_STATE_ID = "default";

// ---- Design tokens ----
// Deep warm charcoal ledger, brass accent, muted "family" palette per type.
// Navigation model: tapping a row drills into its subtasks on a fresh screen,
// same as tapping a folder — recursively, to any depth.

const TYPES = [
  { id: "projects", label: "Projects", family: "Build", color: "#5B8A82" },
  { id: "goals", label: "Goals", family: "Build", color: "#C9A24B" },
  { id: "career", label: "Career", family: "Build", color: "#4B7A8A" },
  { id: "financial", label: "Financial Tasks", family: "Build", color: "#A6A24B" },
  { id: "habits", label: "Habits", family: "Recurring", color: "#7A9B76" },
  { id: "routines", label: "Routines", family: "Recurring", color: "#92A868" },
  { id: "maintenance", label: "Maintenance", family: "Recurring", color: "#7C8A94" },
  { id: "onetime", label: "One-Time Tasks", family: "Everyday", color: "#A69481" },
  { id: "social", label: "Social / Relationships", family: "Everyday", color: "#C97B7B" },
  { id: "adventure", label: "Adventure", family: "Everyday", color: "#C9614B" },
  { id: "challenges", label: "Challenges", family: "Trials", color: "#C97B4B" },
  { id: "experiments", label: "Experiments", family: "Trials", color: "#D9954B" },
  { id: "learning", label: "Learning", family: "Growth", color: "#6E8FB0" },
  { id: "personal_dev", label: "Personal Development", family: "Growth", color: "#7C7BA6" },
  { id: "creative", label: "Creative Projects", family: "Growth", color: "#A6678A" },
  { id: "health", label: "Health & Fitness", family: "Growth", color: "#5B9B6E" },
  { id: "collections", label: "Collections", family: "Growth", color: "#8A6E4B" },
  { id: "bucket_list", label: "Bucket List", family: "Vision", color: "#8B6EA8" },
  { id: "milestones", label: "Life Milestones", family: "Vision", color: "#5B5B9B" },
  { id: "vision", label: "Dreams / Long-Term Vision", family: "Vision", color: "#6E4B7A" },
];

const typeMap = Object.fromEntries(TYPES.map((t) => [t.id, t]));
const PRIORITIES = ["low", "med", "high"];

let idCounter = 1;
const mk = (title, type, priority, parentId, doneOffset) => ({
  id: idCounter++,
  title,
  type,
  parentId: parentId || null,
  priority,
  done: !!doneOffset,
  created: Date.now() - (doneOffset || Math.random() * 200000000),
  completedAt: doneOffset ? dateKey(new Date(Date.now() - doneOffset)) : null,
  completions: [],
  notes: "",
  purpose: "",
  targetDate: null,
  cover: null,
  docMode: false,
  dueDate: null,
  blocked: false,
  blockedReason: "",
});

function seedItems() {
  const vision = mk("Become financially independent", "vision", "high");
  const goal = mk("Save $5,000 this year", "goals", "high", vision.id);
  const bucket = mk("Travel the world with the income", "bucket_list", "low", vision.id);
  const milestone = mk("Hit $10,000 net worth", "milestones", "high", vision.id);
  const targetD = new Date();
  targetD.setDate(targetD.getDate() + 45);
  milestone.targetDate = dateKey(targetD);
  const mTask1 = mk("Cut discretionary spending", "onetime", "med", milestone.id, 86400000);
  const mTask2 = mk("Move savings to high-yield account", "onetime", "med", milestone.id);

  // A project can stand on its own at the top level — it doesn't need a
  // goal or vision above it to exist.
  const project = mk("Start an online business", "projects", "high");
  project.notes = "Idea: niche down to a specific hobby audience rather than going broad. Check competitor pricing before launch.";
  const task1 = mk("Research the market", "onetime", "med", project.id, 86400000);
  const task2 = mk("Build the website", "onetime", "med", project.id);
  const subA = mk("Pick a platform", "onetime", "low", task2.id);
  const subB = mk("Design the homepage", "onetime", "med", task2.id);

  const habit = mk("Read 20 minutes", "habits", "low");
  // Seed a plausible last-30-days pattern: mostly consistent with a couple gaps.
  const habitDays = last30Days();
  habit.completions = habitDays
    .filter((_, i) => i < 27 && ![5, 12, 13].includes(i))
    .map((d) => dateKey(d));
  habit.done = habit.completions.includes(todayKey());

  const mima = mk("Mima : the biggest marketplace in Haiti", "projects", "high");
  mima.cover = "linear-gradient(135deg, #5B8A82, #2E4A46)";
  mima.purpose =
    "Haiti's markets are fragmented — vendors rely on foot traffic and word of mouth, and buyers waste time comparing prices across scattered stalls with no visibility into stock, pricing, or trust. Mima exists to give Haitian sellers, from Port-au-Prince street vendors to diaspora-run import businesses, one place to be found and paid reliably. This isn't just another app — it's the infrastructure Haiti's informal economy has never had: a marketplace big enough that being on it becomes the default way to sell.";

  return [vision, goal, bucket, milestone, mTask1, mTask2, project, task1, task2, subA, subB, habit, mima];
}

function timeAgo(ts) {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ---- Habit day-tracking helpers ----
function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function todayKey() {
  return dateKey(new Date());
}
function last30Days() {
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  return days;
}
function currentStreak(completions) {
  let streak = 0;
  const d = new Date();
  while (completions.includes(dateKey(d))) {
    streak += 1;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}
const WEEKDAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];
function currentWeekDays() {
  // Sunday–Saturday for the week containing today.
  const now = new Date();
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - now.getDay());
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    days.push(d);
  }
  return days;
}

export default function TaskLedger() {
  const [items, setItems] = useState(seedItems);
  const [loaded, setLoaded] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const saveTimer = useRef(null);

  // Load persisted state once on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("task_ledger_state")
        .select("payload")
        .eq("id", LEDGER_STATE_ID)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        setSyncError(error.message);
      } else if (data && Array.isArray(data.payload) && data.payload.length > 0) {
        setItems(data.payload);
        const maxId = data.payload.reduce((m, it) => Math.max(m, it.id || 0), 0);
        idCounter = maxId + 1;
      }
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist on every change, debounced, once the initial load has settled
  // (so we don't immediately overwrite remote state with local seed data).
  useEffect(() => {
    if (!loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const { error } = await supabase
        .from("task_ledger_state")
        .upsert({ id: LEDGER_STATE_ID, payload: items, updated_at: new Date().toISOString() });
      setSyncError(error ? error.message : null);
    }, 600);
    return () => clearTimeout(saveTimer.current);
  }, [items, loaded]);
  const [draft, setDraft] = useState("");
  const [draftType, setDraftType] = useState("onetime");
  const [draftPriority, setDraftPriority] = useState("med");
  const [filter, setFilter] = useState("all");
  const [collapsed, setCollapsed] = useState({});
  const [justStamped, setJustStamped] = useState(null);
  const [stack, setStack] = useState([]); // array of item ids, drill-down path
  const [rootView, setRootView] = useState("home"); // "home" | "structure" — only matters when stack is empty
  const [showAddModal, setShowAddModal] = useState(false);
  const [homeSort, setHomeSort] = useState("priority"); // "priority" | "due" | "location" | "az"

  const byId = useMemo(() => Object.fromEntries(items.map((i) => [i.id, i])), [items]);

  const ROOT_KEY = "root";

  const childrenOf = useMemo(() => {
    const map = {};
    items.forEach((it) => {
      const key = it.parentId == null ? ROOT_KEY : it.parentId;
      (map[key] = map[key] || []).push(it);
    });
    Object.values(map).forEach((list) => list.sort((a, b) => b.created - a.created));
    return map;
  }, [items]);

  const progressOf = (id) => {
    const kids = childrenOf[id] || [];
    let done = 0;
    let total = 0;
    kids.forEach((k) => {
      total += 1;
      if (k.done) done += 1;
      const sub = progressOf(k.id);
      done += sub.done;
      total += sub.total;
    });
    return { done, total };
  };

  const currentId = stack.length ? stack[stack.length - 1] : null;
  const currentItem = currentId ? byId[currentId] : null;

  // A branch is "documentation" if it or any ancestor is flagged docMode.
  // Descendants don't need the flag themselves — this walks up to find it,
  // so anything added under a doc project inherits the doc treatment.
  const isDocMode = (id) => {
    let cur = id != null ? byId[id] : null;
    while (cur) {
      if (cur.docMode) return true;
      cur = cur.parentId != null ? byId[cur.parentId] : null;
    }
    return false;
  };
  const inDocMode = currentItem ? isDocMode(currentItem.id) : false;

  const addItem = () => {
    const title = draft.trim();
    if (!title) return;
    setItems((list) => [
      {
        id: idCounter++,
        title,
        type: draftType,
        parentId: currentId,
        priority: draftPriority,
        done: false,
        created: Date.now(),
        completedAt: null,
        completions: [],
        notes: "",
        purpose: "",
        targetDate: null,
        cover: null,
        docMode: false,
        dueDate: null,
        blocked: false,
        blockedReason: "",
      },
      ...list,
    ]);
    setDraft("");
    setShowAddModal(false);
  };

  const toggleItem = (id) => {
    setItems((list) =>
      list.map((it) => {
        if (it.id !== id) return it;
        if (it.type === "habits") {
          const today = todayKey();
          const has = (it.completions || []).includes(today);
          if (!has) {
            setJustStamped(id);
            setTimeout(() => setJustStamped((cur) => (cur === id ? null : cur)), 500);
          }
          const completions = has
            ? it.completions.filter((d) => d !== today)
            : [...(it.completions || []), today];
          return { ...it, completions, done: !has };
        }
        if (!it.done) {
          setJustStamped(id);
          setTimeout(() => setJustStamped((cur) => (cur === id ? null : cur)), 500);
        }
        return { ...it, done: !it.done, completedAt: !it.done ? todayKey() : null };
      })
    );
  };

  const toggleHabitDay = (id, dayKey) => {
    setItems((list) =>
      list.map((it) => {
        if (it.id !== id) return it;
        const has = (it.completions || []).includes(dayKey);
        const completions = has
          ? it.completions.filter((d) => d !== dayKey)
          : [...(it.completions || []), dayKey];
        const isToday = dayKey === todayKey();
        return { ...it, completions, done: isToday ? !has : it.done };
      })
    );
  };

  const removeItem = (id) => {
    // Also drop any descendants so nothing is orphaned.
    const toRemove = new Set([id]);
    let grew = true;
    while (grew) {
      grew = false;
      items.forEach((it) => {
        if (it.parentId != null && toRemove.has(it.parentId) && !toRemove.has(it.id)) {
          toRemove.add(it.id);
          grew = true;
        }
      });
    }
    setItems((list) => list.filter((it) => !toRemove.has(it.id)));
    setStack((s) => s.filter((sid) => !toRemove.has(sid)));
  };

  const updateNotes = (id, text) => {
    setItems((list) => list.map((it) => (it.id === id ? { ...it, notes: text } : it)));
  };

  const updatePurpose = (id, text) => {
    setItems((list) => list.map((it) => (it.id === id ? { ...it, purpose: text } : it)));
  };

  const updateTargetDate = (id, dateStr) => {
    setItems((list) => list.map((it) => (it.id === id ? { ...it, targetDate: dateStr || null } : it)));
  };

  const updateCover = (id, cover) => {
    setItems((list) => list.map((it) => (it.id === id ? { ...it, cover } : it)));
  };

  const updateField = (id, field, value) => {
    setItems((list) => list.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
  };

  const renameItem = (id, title) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    updateField(id, "title", trimmed);
  };

  const childItems = childrenOf[currentId == null ? ROOT_KEY : currentId] || [];
  const filteredChildren = useMemo(() => {
    let list = childItems;
    if (filter === "open") list = list.filter((i) => !i.done);
    else if (filter === "done") list = list.filter((i) => i.done);
    return list;
  }, [childItems, filter]);

  const groupedRoot = useMemo(() => {
    if (currentId) return null;
    const map = {};
    filteredChildren.forEach((it) => {
      (map[it.type] = map[it.type] || []).push(it);
    });
    return TYPES.filter((t) => map[t.id]?.length).map((t) => ({ type: t, entries: map[t.id] }));
  }, [currentId, filteredChildren]);

  const toggleCollapsed = (typeId) => setCollapsed((c) => ({ ...c, [typeId]: !c[typeId] }));

  const openCount = items.filter((i) => !i.done).length;

  // Location breadcrumb text for a task, excluding the top-level root itself
  // (e.g. "Development / Backend / Competition System") — used on Home rows.
  const locationLabel = (id) => {
    const names = [];
    let cur = byId[id]?.parentId != null ? byId[byId[id].parentId] : null;
    while (cur) {
      names.unshift(cur.title);
      cur = cur.parentId != null ? byId[cur.parentId] : null;
    }
    return names.slice(1).join(" / ") || names.join(" / ");
  };

  const homeData = useMemo(() => {
    const today = dateKey(new Date());
    const effectiveDue = (it) => it.dueDate || (it.type === "milestones" ? it.targetDate : null);

    // Every leaf, non-done, actionable task anywhere in the tree — a leaf is
    // a task with no children (habits are their own recurring entry and
    // doc-mode branches are reference material, so neither counts as a task).
    const leafPool = items.filter(
      (it) => !it.done && it.type !== "habits" && !isDocMode(it.id) && (childrenOf[it.id] || []).length === 0
    );

    const priorityRank = { high: 0, med: 1, low: 2 };
    const sorters = {
      priority: (a, b) => priorityRank[a.priority] - priorityRank[b.priority] || a.title.localeCompare(b.title),
      due: (a, b) => {
        const da = effectiveDue(a);
        const db = effectiveDue(b);
        if (da && db) return da.localeCompare(db);
        if (da) return -1;
        if (db) return 1;
        return a.title.localeCompare(b.title);
      },
      location: (a, b) => locationLabel(a.id).localeCompare(locationLabel(b.id)) || a.title.localeCompare(b.title),
      az: (a, b) => a.title.localeCompare(b.title),
    };

    const allLeafTasks = [...leafPool].sort(sorters[homeSort] || sorters.priority);

    // Group leaf tasks under their top-level ancestor, same root items the
    // Progress section lists — so "All Tasks" reads as an expansion of that
    // structure rather than a separate flat pile.
    const rootOf = (id) => {
      let cur = byId[id];
      if (!cur) return null;
      while (cur.parentId != null && byId[cur.parentId]) cur = byId[cur.parentId];
      return cur;
    };

    const groupOrder = items.filter((it) => it.parentId == null);
    const groups = groupOrder
      .map((root) => ({
        root,
        tasks: allLeafTasks.filter((t) => rootOf(t.id)?.id === root.id),
        progress: progressOf(root.id),
      }))
      .filter((g) => g.tasks.length > 0);

    return { allLeafTasks, groups, today, effectiveDue };
  }, [items, byId, childrenOf, homeSort]);

  // Sun–Sat strip for the current week: each circle's fill reflects how much
  // got done that day. Habits are the recurring "slots" a day can fill
  // (partial fill when only some are checked); a one-off task completed that
  // day always counts as its own fully-filled slot, whether or not it had a
  // matching due date.
  const weekStrip = useMemo(() => {
    const habits = items.filter((it) => it.type === "habits");
    const leafTasks = items.filter(
      (it) => it.type !== "habits" && !isDocMode(it.id) && (childrenOf[it.id] || []).length === 0
    );
    const effectiveDue = (it) => it.dueDate || (it.type === "milestones" ? it.targetDate : null);
    const todayStr = todayKey();

    return currentWeekDays().map((d) => {
      const key = dateKey(d);
      const habitDone = habits.filter((h) => (h.completions || []).includes(key)).length;
      const dueTasks = leafTasks.filter((t) => effectiveDue(t) === key);
      const dueDone = dueTasks.filter((t) => t.done).length;
      const extraDone = leafTasks.filter((t) => t.completedAt === key && effectiveDue(t) !== key).length;

      const total = habits.length + dueTasks.length + extraDone;
      const done = habitDone + dueDone + extraDone;

      return {
        key,
        label: WEEKDAY_LETTERS[d.getDay()],
        dayNum: d.getDate(),
        isToday: key === todayStr,
        isFuture: key > todayStr,
        pct: total > 0 ? Math.round((done / total) * 100) : 0,
      };
    });
  }, [items, childrenOf]);

  const drillInto = (id) => setStack((s) => [...s, id]);
  const goBack = () => setStack((s) => s.slice(0, -1));
  const jumpTo = (index) => setStack((s) => s.slice(0, index + 1));

  // Used from Home: jump directly to a task buried anywhere in the tree,
  // but still build the full ancestor path so breadcrumbs/back behave normally.
  const drillToPath = (id) => {
    const path = [];
    let cur = byId[id];
    while (cur) {
      path.unshift(cur.id);
      cur = cur.parentId != null ? byId[cur.parentId] : null;
    }
    setStack(path);
  };

  return (
    <div
      style={{
        background: "#1A1816",
        color: "#EDE8DF",
        fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
        minHeight: "100%",
        padding: "22px 20px 90px",
      }}
    >
      {syncError && (
        <div
          style={{
            background: "#3A1E1A",
            border: "1px solid #6E3A2E",
            color: "#E0A896",
            fontSize: 11.5,
            borderRadius: 8,
            padding: "8px 10px",
            marginBottom: 12,
          }}
        >
          Sync issue: {syncError}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 18, borderBottom: "1px solid #33302B", paddingBottom: 16 }}>
        {currentItem ? (
          <>
            {currentItem.type === "projects" && (
              <ProjectCover item={currentItem} onChange={(cover) => updateCover(currentItem.id, cover)} />
            )}
            <button
              onClick={goBack}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 3,
                background: "transparent",
                border: "none",
                color: "#948E80",
                fontSize: 12.5,
                cursor: "pointer",
                padding: "2px 0 8px",
              }}
            >
              <ChevronLeft size={14} /> Back
            </button>
            {/* Breadcrumb */}
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 4, marginBottom: 8 }}>
              <button
                onClick={() => setStack([])}
                style={{ background: "none", border: "none", color: "#6E6858", fontSize: 11, cursor: "pointer", padding: 0 }}
              >
                Ledger
              </button>
              {stack.map((id, idx) => (
                <span key={id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <ChevronRight size={10} color="#4A4539" />
                  <button
                    onClick={() => jumpTo(idx)}
                    style={{
                      background: "none",
                      border: "none",
                      color: idx === stack.length - 1 ? "#C9C3B6" : "#6E6858",
                      fontSize: 11,
                      cursor: "pointer",
                      padding: 0,
                      maxWidth: 120,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {byId[id]?.title}
                  </button>
                </span>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{ width: 8, height: 8, borderRadius: "50%", background: typeMap[currentItem.type].color, flexShrink: 0 }}
              />
              <EditableTitle
                value={currentItem.title}
                onSave={(t) => renameItem(currentItem.id, t)}
                tag="h1"
                textStyle={{
                  fontFamily: "ui-serif, Georgia, serif",
                  fontWeight: 600,
                  fontSize: 22,
                  letterSpacing: "-0.01em",
                  margin: 0,
                  color: "#F3EEE3",
                }}
                inputStyle={{
                  fontFamily: "ui-serif, Georgia, serif",
                  fontWeight: 600,
                  fontSize: 22,
                  letterSpacing: "-0.01em",
                  width: "100%",
                }}
              />
            </div>
            <p style={{ margin: "6px 0 0", fontSize: 12.5, color: "#948E80" }}>
              {typeMap[currentItem.type].label}
              {(() => {
                const { done, total } = progressOf(currentItem.id);
                if (total === 0) return "";
                return inDocMode ? ` · ${total} section${total === 1 ? "" : "s"}` : ` · ${done}/${total} done`;
              })()}
            </p>
            {inDocMode && (
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "#6E6858", fontStyle: "italic" }}>
                Reference material — nothing here needs checking off.
              </p>
            )}
          </>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              <h1
                style={{
                  fontFamily: "ui-serif, Georgia, serif",
                  fontWeight: 600,
                  fontSize: 26,
                  letterSpacing: "-0.01em",
                  margin: 0,
                  color: "#F3EEE3",
                }}
              >
                {rootView === "home" ? "Home" : "Ledger"}
              </h1>
              <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, color: "#8A8478" }}>
                {openCount} open
              </span>
            </div>
            <p style={{ margin: "6px 0 0", fontSize: 13, color: "#948E80" }}>
              {rootView === "home"
                ? "What matters right now, wherever it lives in the tree."
                : "Tap anything with subtasks to open it."}
            </p>
          </>
        )}
      </div>

      {/* Add item — opens as a modal sheet, triggered by the floating button */}
      {showAddModal && (
        <div
          onClick={() => setShowAddModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(10, 9, 8, 0.6)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 480,
              background: "#211E1B",
              border: "1px solid #33302B",
              borderBottom: "none",
              borderRadius: "16px 16px 0 0",
              padding: "18px 16px 22px",
              boxShadow: "0 -8px 30px rgba(0,0,0,0.4)",
            }}
          >
            <div
              style={{
                width: 36,
                height: 4,
                borderRadius: 999,
                background: "#3A362F",
                margin: "0 auto 14px",
              }}
            />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#C9C3B6" }}>
                {currentItem ? `Add under "${currentItem.title}"` : "Log something"}
              </span>
              <button
                onClick={() => setShowAddModal(false)}
                aria-label="Close"
                style={{ background: "transparent", border: "none", color: "#5E594E", cursor: "pointer", padding: 4 }}
              >
                <X size={16} />
              </button>
            </div>

            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addItem()}
              placeholder="Title…"
              style={{
                width: "100%",
                background: "#1A1816",
                border: "1px solid #33302B",
                borderRadius: 8,
                outline: "none",
                color: "#EDE8DF",
                fontSize: 14,
                padding: "10px 12px",
                marginBottom: 10,
                boxSizing: "border-box",
              }}
            />

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
              <select
                value={draftType}
                onChange={(e) => setDraftType(e.target.value)}
                style={selectStyle(typeMap[draftType].color)}
              >
                {Object.entries(
                  TYPES.reduce((acc, t) => {
                    (acc[t.family] = acc[t.family] || []).push(t);
                    return acc;
                  }, {})
                ).map(([family, ts]) => (
                  <optgroup key={family} label={family}>
                    {ts.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>

              <select value={draftPriority} onChange={(e) => setDraftPriority(e.target.value)} style={selectStyle("#4A4539")}>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p === "med" ? "Med priority" : `${p[0].toUpperCase()}${p.slice(1)} priority`}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={addItem}
              style={{
                width: "100%",
                background: "#C9A24B",
                border: "none",
                borderRadius: 8,
                color: "#1A1816",
                fontSize: 14,
                fontWeight: 600,
                padding: "11px 0",
                cursor: "pointer",
              }}
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Floating action button */}
      <button
        onClick={() => setShowAddModal(true)}
        aria-label="Add task"
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: "#C9A24B",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 6px 18px rgba(0,0,0,0.45)",
          zIndex: 40,
        }}
      >
        <Plus size={24} color="#1A1816" strokeWidth={2.5} />
      </button>

      {/* Week-at-a-glance strip — only at the root screen */}
      {!currentItem && <DayStrip days={weekStrip} />}

      {/* Home / Structure toggle — only at the root screen */}
      {!currentItem && (
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {[{ id: "home", label: "Home" }, { id: "structure", label: "Structure" }].map((v) => (
            <button
              key={v.id}
              onClick={() => setRootView(v.id)}
              style={{
                fontSize: 12.5,
                padding: "7px 14px",
                borderRadius: 8,
                border: "1px solid",
                borderColor: rootView === v.id ? "#C9A24B" : "#2E2B26",
                background: rootView === v.id ? "#C9A24B" : "transparent",
                color: rootView === v.id ? "#1A1816" : "#8A8478",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              {v.label}
            </button>
          ))}
        </div>
      )}

      {/* Filters — not shown on a habit's board (calendar, not a filtered list), in doc-mode branches, where done/open doesn't apply, or on the Home dashboard */}
      {!(currentItem && (currentItem.type === "habits" || inDocMode)) && !(!currentItem && rootView === "home") && (
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {[{ id: "all", label: "All" }, { id: "open", label: "Open" }, { id: "done", label: "Done" }].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                fontSize: 11.5,
                padding: "5px 10px",
                borderRadius: 7,
                border: "1px solid",
                borderColor: filter === f.id ? "#EDE8DF" : "#2E2B26",
                background: filter === f.id ? "#EDE8DF" : "transparent",
                color: filter === f.id ? "#1A1816" : "#8A8478",
                cursor: "pointer",
                fontWeight: filter === f.id ? 600 : 400,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Root view: grouped by type (Structure) */}
      {!currentItem && rootView === "structure" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {(!groupedRoot || groupedRoot.length === 0) && (
            <div style={{ padding: "28px 10px", textAlign: "center", color: "#5E594E", fontSize: 13 }}>
              Nothing here. Log something above to start the ledger.
            </div>
          )}
          {groupedRoot &&
            groupedRoot.map(({ type, entries }) => {
              const isCollapsed = collapsed[type.id];
              return (
                <div key={type.id}>
                  <button
                    onClick={() => toggleCollapsed(type.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      padding: "2px 0 8px",
                      width: "100%",
                      textAlign: "left",
                    }}
                  >
                    {isCollapsed ? <ChevronRight size={13} color="#6E6858" /> : <ChevronDownIcon />}
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: type.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: "#C9C3B6", letterSpacing: "0.01em" }}>
                      {type.label}
                    </span>
                    <span style={{ fontSize: 11, color: "#5E594E", fontFamily: "ui-monospace, monospace" }}>
                      {entries.length}
                    </span>
                  </button>

                  {!isCollapsed && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {entries.map((it) => (
                        <Row
                          key={it.id}
                          item={it}
                          progressOf={progressOf}
                          hasChildren={(childrenOf[it.id] || []).length > 0 || it.type === "habits"}
                          justStamped={justStamped}
                          toggleItem={toggleItem}
                          removeItem={removeItem}
                          onOpen={() => drillInto(it.id)}
                          renameItem={renameItem}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {!currentItem && rootView === "home" && (
        <HomeDashboard
          data={homeData}
          toggleItem={toggleItem}
          justStamped={justStamped}
          onOpen={(id) => drillToPath(id)}
          locationLabel={locationLabel}
          homeSort={homeSort}
          setHomeSort={setHomeSort}
          renameItem={renameItem}
          updateField={updateField}
        />
      )}

      {/* Drilled-in view */}
      {currentItem && currentItem.type === "habits" && (
        <HabitBoard item={currentItem} onToggleDay={(dayKey) => toggleHabitDay(currentItem.id, dayKey)} />
      )}

      {currentItem && currentItem.type === "projects" && (
        <PurposePanel item={currentItem} onChange={(text) => updatePurpose(currentItem.id, text)} />
      )}

      {currentItem && currentItem.type === "milestones" && (
        <MilestonePanel
          item={currentItem}
          progress={progressOf(currentItem.id)}
          onChange={(dateStr) => updateTargetDate(currentItem.id, dateStr)}
        />
      )}

      {currentItem && currentItem.type !== "habits" && !inDocMode && (
        <StatusPanel item={currentItem} updateField={updateField} />
      )}

      {currentItem && currentItem.type !== "habits" && (
        <NotesPanel
          item={currentItem}
          onChange={(text) => updateNotes(currentItem.id, text)}
          label={inDocMode ? "Content" : "Notes"}
          forceExpanded={inDocMode && (childrenOf[currentItem.id] || []).length === 0}
          placeholder={inDocMode ? "Write the reference content for this entry…" : undefined}
        />
      )}

      {currentItem && currentItem.type !== "habits" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {filteredChildren.length === 0 && (
            <div style={{ padding: "28px 10px", textAlign: "center", color: "#5E594E", fontSize: 13 }}>
              {inDocMode ? "No sub-entries yet. Add one above." : "No subtasks yet. Add one above."}
            </div>
          )}
          {filteredChildren.map((it) => (
            <Row
              key={it.id}
              item={it}
              progressOf={progressOf}
              hasChildren={(childrenOf[it.id] || []).length > 0 || it.type === "habits"}
              justStamped={justStamped}
              toggleItem={toggleItem}
              removeItem={removeItem}
              onOpen={() => drillInto(it.id)}
              docMode={inDocMode}
              renameItem={renameItem}
            />
          ))}
        </div>
      )}

      {/* A habit can still carry sub-tasks (e.g. supporting steps); show them below the board. */}
      {currentItem && currentItem.type === "habits" && filteredChildren.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 18 }}>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: "#8A8478", letterSpacing: "0.02em", marginBottom: 2 }}>
            RELATED TASKS
          </div>
          {filteredChildren.map((it) => (
            <Row
              key={it.id}
              item={it}
              progressOf={progressOf}
              hasChildren={(childrenOf[it.id] || []).length > 0 || it.type === "habits"}
              justStamped={justStamped}
              toggleItem={toggleItem}
              removeItem={removeItem}
              onOpen={() => drillInto(it.id)}
              renameItem={renameItem}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_LABELS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const COVER_PRESETS = [
  { id: "brass", css: "linear-gradient(135deg, #C9A24B, #6E5730)" },
  { id: "teal", css: "linear-gradient(135deg, #5B8A82, #2E4A46)" },
  { id: "rose", css: "linear-gradient(135deg, #C97B7B, #6E3A3A)" },
  { id: "indigo", css: "linear-gradient(135deg, #7C7BA6, #3A3A6E)" },
  { id: "ember", css: "linear-gradient(135deg, #C9614B, #6E2E22)" },
  { id: "forest", css: "linear-gradient(135deg, #7A9B76, #37452F)" },
  { id: "slate", css: "linear-gradient(135deg, #7C8A94, #2E3438)" },
];

function ProjectCover({ item, onChange }) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div style={{ marginBottom: 12 }}>
      {item.cover ? (
        <div
          style={{
            position: "relative",
            height: 96,
            borderRadius: 10,
            background: item.cover,
            marginBottom: pickerOpen ? 8 : 0,
          }}
        >
          <button
            onClick={() => setPickerOpen((o) => !o)}
            style={{
              position: "absolute",
              bottom: 8,
              right: 8,
              background: "rgba(26,24,22,0.65)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 6,
              color: "#F3EEE3",
              fontSize: 11,
              padding: "5px 9px",
              cursor: "pointer",
            }}
          >
            Change cover
          </button>
        </div>
      ) : (
        <button
          onClick={() => setPickerOpen((o) => !o)}
          style={{
            width: "100%",
            background: "transparent",
            border: "1px dashed #3A362F",
            borderRadius: 10,
            color: "#6E6858",
            fontSize: 12,
            padding: "8px 12px",
            cursor: "pointer",
            marginBottom: pickerOpen ? 8 : 0,
          }}
        >
          + Add cover
        </button>
      )}

      {pickerOpen && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {COVER_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                onChange(p.css);
                setPickerOpen(false);
              }}
              aria-label={p.id}
              style={{
                width: 26,
                height: 26,
                borderRadius: 6,
                background: p.css,
                border: item.cover === p.css ? "2px solid #F3EEE3" : "1px solid #33302B",
                cursor: "pointer",
                padding: 0,
              }}
            />
          ))}
          {item.cover && (
            <button
              onClick={() => {
                onChange(null);
                setPickerOpen(false);
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "#948E80",
                fontSize: 11.5,
                cursor: "pointer",
                padding: "4px 6px",
              }}
            >
              Remove
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function PurposePanel({ item, onChange }) {
  const [expanded, setExpanded] = useState(true);
  const color = typeMap[item.type]?.color || "#5B8A82";

  return (
    <div style={{ marginBottom: 16 }}>
      <button
        onClick={() => setExpanded((e) => !e)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: "2px 0 8px",
          width: "100%",
          textAlign: "left",
        }}
      >
        {expanded ? <ChevronDownIcon /> : <ChevronRight size={13} color="#6E6858" />}
        <span style={{ fontSize: 12.5, fontWeight: 600, color: "#C9C3B6", letterSpacing: "0.01em" }}>
          Purpose / Why
        </span>
      </button>
      {expanded && (
        <div
          style={{
            background: `${color}14`,
            border: `1px solid ${color}44`,
            borderRadius: 10,
            padding: "12px 14px",
          }}
        >
          <textarea
            value={item.purpose || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Why does this project exist? What's the reason you're building it?"
            rows={4}
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#EDE8DF",
              fontSize: 13.5,
              lineHeight: 1.6,
              fontStyle: item.purpose ? "normal" : "italic",
              resize: "vertical",
              boxSizing: "border-box",
              fontFamily: "inherit",
            }}
          />
        </div>
      )}
    </div>
  );
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const target = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
}

function MilestonePanel({ item, progress, onChange }) {
  const [expanded, setExpanded] = useState(true);
  const color = typeMap[item.type]?.color || "#5B5B9B";
  const days = daysUntil(item.targetDate);

  let statusText = "No target date set";
  let statusColor = "#6E6858";
  if (days !== null) {
    if (days > 0) {
      statusText = `${days} day${days === 1 ? "" : "s"} to go`;
      statusColor = color;
    } else if (days === 0) {
      statusText = "Today";
      statusColor = "#C9A24B";
    } else {
      statusText = `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue`;
      statusColor = "#C9614B";
    }
  }

  const { done = 0, total = 0 } = progress || {};
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div style={{ marginBottom: 16 }}>
      <button
        onClick={() => setExpanded((e) => !e)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: "2px 0 8px",
          width: "100%",
          textAlign: "left",
        }}
      >
        {expanded ? <ChevronDownIcon /> : <ChevronRight size={13} color="#6E6858" />}
        <span style={{ fontSize: 12.5, fontWeight: 600, color: "#C9C3B6", letterSpacing: "0.01em" }}>
          Checkpoint
        </span>
        {!expanded && (
          <span style={{ fontSize: 11, color: statusColor, fontFamily: "ui-monospace, monospace" }}>
            {statusText}
          </span>
        )}
      </button>
      {expanded && (
        <div
          style={{
            background: `${color}14`,
            border: `1px solid ${color}44`,
            borderRadius: 10,
            padding: "12px 14px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <input
              type="date"
              value={item.targetDate || ""}
              onChange={(e) => onChange(e.target.value)}
              style={{
                background: "#1A1816",
                border: "1px solid #33302B",
                borderRadius: 8,
                outline: "none",
                color: "#EDE8DF",
                fontSize: 13.5,
                padding: "8px 10px",
                fontFamily: "inherit",
                colorScheme: "dark",
              }}
            />
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: statusColor,
                fontFamily: "ui-monospace, monospace",
              }}
            >
              {statusText}
            </span>
          </div>

          <div style={{ marginTop: 14 }}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              <span style={{ fontSize: 11.5, color: "#948E80" }}>
                {total > 0 ? "Tasks toward this milestone" : "No subtasks yet"}
              </span>
              <span
                style={{
                  fontSize: 11.5,
                  fontFamily: "ui-monospace, monospace",
                  color: total > 0 && done === total ? "#7A9B76" : "#948E80",
                }}
              >
                {done}/{total} · {pct}%
              </span>
            </div>
            <div
              style={{
                width: "100%",
                height: 8,
                borderRadius: 999,
                background: "#1A1816",
                border: "1px solid #33302B",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${pct}%`,
                  height: "100%",
                  borderRadius: 999,
                  background: total > 0 && done === total ? "#7A9B76" : color,
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const PRIORITY_META = {
  high: { label: "High", short: "High priority", color: "#C9614B" },
  med: { label: "Med", short: "Med priority", color: "#C9A24B" },
  low: { label: "Low", short: "Low priority", color: "#6E6858" },
};

function StatusPanel({ item, updateField }) {
  const [expanded, setExpanded] = useState(!!item.dueDate || !!item.blocked);
  const color = typeMap[item.type]?.color || "#7C7BA6";
  const priorityMeta = PRIORITY_META[item.priority] || PRIORITY_META.med;

  let dueLabel = null;
  if (item.dueDate) {
    const days = daysUntil(item.dueDate);
    if (days > 0) dueLabel = { text: `Due in ${days}d`, color };
    else if (days === 0) dueLabel = { text: "Due today", color: "#C9A24B" };
    else dueLabel = { text: `${Math.abs(days)}d overdue`, color: "#C9614B" };
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <button
        onClick={() => setExpanded((e) => !e)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: "2px 0 8px",
          width: "100%",
          textAlign: "left",
        }}
      >
        {expanded ? <ChevronDownIcon /> : <ChevronRight size={13} color="#6E6858" />}
        <span style={{ fontSize: 12.5, fontWeight: 600, color: "#C9C3B6", letterSpacing: "0.01em" }}>
          Status
        </span>
        {!expanded && (
          <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: priorityMeta.color, fontFamily: "ui-monospace, monospace" }}>
              {priorityMeta.short}
            </span>
            {dueLabel && (
              <span style={{ fontSize: 11, color: dueLabel.color, fontFamily: "ui-monospace, monospace" }}>
                {dueLabel.text}
              </span>
            )}
            {item.blocked && <span style={{ fontSize: 11, color: "#D9954B" }}>Blocked</span>}
          </span>
        )}
      </button>
      {expanded && (
        <div
          style={{
            background: `${color}14`,
            border: `1px solid ${color}44`,
            borderRadius: 10,
            padding: "12px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12.5, color: "#C9C3B6" }}>Priority</span>
            <div style={{ display: "flex", gap: 6 }}>
              {PRIORITIES.map((p) => {
                const meta = PRIORITY_META[p];
                const active = item.priority === p;
                return (
                  <button
                    key={p}
                    onClick={() => updateField(item.id, "priority", p)}
                    style={{
                      fontSize: 11.5,
                      fontWeight: 600,
                      padding: "5px 10px",
                      borderRadius: 7,
                      border: `1px solid ${active ? meta.color : "#33302B"}`,
                      background: active ? `${meta.color}26` : "#1A1816",
                      color: active ? meta.color : "#948E80",
                      cursor: "pointer",
                    }}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12.5, color: "#C9C3B6" }}>Due date</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="date"
                value={item.dueDate || ""}
                onChange={(e) => updateField(item.id, "dueDate", e.target.value || null)}
                style={{
                  background: "#1A1816",
                  border: "1px solid #33302B",
                  borderRadius: 8,
                  outline: "none",
                  color: "#EDE8DF",
                  fontSize: 13,
                  padding: "7px 9px",
                  fontFamily: "inherit",
                  colorScheme: "dark",
                }}
              />
              {dueLabel && (
                <span style={{ fontSize: 11.5, fontWeight: 600, color: dueLabel.color, fontFamily: "ui-monospace, monospace" }}>
                  {dueLabel.text}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <span style={{ fontSize: 12.5, color: "#C9C3B6" }}>Blocked</span>
            <button
              onClick={() => updateField(item.id, "blocked", !item.blocked)}
              style={{
                width: 40,
                height: 22,
                borderRadius: 999,
                border: "1px solid #33302B",
                background: item.blocked ? "#D9954B" : "#1A1816",
                position: "relative",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 2,
                  left: item.blocked ? 20 : 2,
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: "#EDE8DF",
                  transition: "left 0.15s ease",
                }}
              />
            </button>
          </div>

          {item.blocked && (
            <input
              type="text"
              value={item.blockedReason || ""}
              onChange={(e) => updateField(item.id, "blockedReason", e.target.value)}
              placeholder="Waiting on…"
              style={{
                background: "#1A1816",
                border: "1px solid #33302B",
                borderRadius: 8,
                outline: "none",
                color: "#EDE8DF",
                fontSize: 13,
                padding: "8px 10px",
                fontFamily: "inherit",
                width: "100%",
                boxSizing: "border-box",
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

function NotesPanel({ item, onChange, label = "Notes", forceExpanded = false, placeholder }) {
  const [manuallyExpanded, setManuallyExpanded] = useState(null);
  const expanded = manuallyExpanded !== null ? manuallyExpanded : forceExpanded || !!item.notes;
  const color = typeMap[item.type]?.color || "#7C7BA6";

  return (
    <div style={{ marginBottom: 16 }}>
      <button
        onClick={() => setManuallyExpanded(!expanded)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: "2px 0 8px",
          width: "100%",
          textAlign: "left",
        }}
      >
        {expanded ? <ChevronDownIcon /> : <ChevronRight size={13} color="#6E6858" />}
        <span style={{ fontSize: 12.5, fontWeight: 600, color: "#C9C3B6", letterSpacing: "0.01em" }}>{label}</span>
        {!expanded && item.notes && (
          <span
            style={{
              fontSize: 11,
              color: "#6E6858",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: 1,
              minWidth: 0,
            }}
          >
            {item.notes}
          </span>
        )}
      </button>
      {expanded && (
        <textarea
          value={item.notes || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "Jot down ideas, context, links…"}
          rows={4}
          style={{
            width: "100%",
            background: "#211E1B",
            border: `1px solid #33302B`,
            borderLeft: `3px solid ${color}`,
            borderRadius: 8,
            color: "#EDE8DF",
            fontSize: 13.5,
            lineHeight: 1.5,
            padding: "10px 12px",
            outline: "none",
            resize: "vertical",
            boxSizing: "border-box",
            fontFamily: "inherit",
          }}
        />
      )}
    </div>
  );
}

function HabitBoard({ item, onToggleDay }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const completions = item.completions || [];
  const color = typeMap[item.type]?.color || "#7A9B76";
  const todayStr = todayKey();

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const leadingBlanks = firstOfMonth.getDay();
  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();

  const monthCompletedCount = completions.filter((k) => k.startsWith(
    `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`
  )).length;
  const streak = currentStreak(completions);

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };
  const goNextMonth = () => {
    if (isCurrentMonth) return; // don't navigate into the future
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const cells = [];
  for (let i = 0; i < leadingBlanks; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);

  return (
    <div>
      <div style={{ display: "flex", gap: 18, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 600, color: "#F3EEE3", fontFamily: "ui-serif, Georgia, serif" }}>
            {monthCompletedCount}
            <span style={{ fontSize: 13, color: "#8A8478", fontFamily: "inherit" }}>/{daysInMonth}</span>
          </div>
          <div style={{ fontSize: 10.5, color: "#8A8478", marginTop: 1 }}>this month</div>
        </div>
        <div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: streak > 0 ? color : "#F3EEE3",
              fontFamily: "ui-serif, Georgia, serif",
            }}
          >
            {streak}
          </div>
          <div style={{ fontSize: 10.5, color: "#8A8478", marginTop: 1 }}>day streak</div>
        </div>
      </div>

      {/* Month navigation */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <button
          onClick={goPrevMonth}
          aria-label="Previous month"
          style={{ background: "transparent", border: "none", color: "#948E80", cursor: "pointer", padding: 6 }}
        >
          <ChevronLeft size={18} />
        </button>
        <span style={{ fontSize: 13.5, fontWeight: 600, color: "#C9C3B6" }}>
          {MONTH_LABELS[viewMonth]} {viewYear}
        </span>
        <button
          onClick={goNextMonth}
          aria-label="Next month"
          disabled={isCurrentMonth}
          style={{
            background: "transparent",
            border: "none",
            color: isCurrentMonth ? "#3A362F" : "#948E80",
            cursor: isCurrentMonth ? "default" : "pointer",
            padding: 6,
          }}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Weekday header */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 6 }}>
        {WEEKDAY_LABELS.map((w, i) => (
          <div key={i} style={{ textAlign: "center", fontSize: 10, color: "#5E594E", fontFamily: "ui-monospace, monospace" }}>
            {w}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
        {cells.map((day, i) => {
          if (day == null) return <div key={`blank-${i}`} />;
          const key = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const done = completions.includes(key);
          const isToday = key === todayStr;
          const isFuture = key > todayStr;
          return (
            <button
              key={key}
              onClick={() => !isFuture && onToggleDay(key)}
              disabled={isFuture}
              aria-label={`${key}${done ? " completed" : ""}`}
              style={{
                aspectRatio: "1",
                borderRadius: 7,
                border: isToday ? `1.5px solid ${color}` : "1px solid #2E2B26",
                background: done ? color : "#211E1B",
                color: isFuture ? "#3A362F" : done ? "#1A1816" : "#6E6858",
                fontSize: 11,
                fontFamily: "ui-monospace, monospace",
                fontWeight: isToday ? 700 : 400,
                cursor: isFuture ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {day}
            </button>
          );
        })}
      </div>
      <p style={{ fontSize: 11.5, color: "#6E6858", marginTop: 12 }}>
        Tap any past day to mark it done or undo it — today is outlined.
      </p>
    </div>
  );
}

function EditableTitle({ value, onSave, tag = "span", textStyle, inputStyle, placeholder }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing) {
      setDraft(value);
      const t = setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 0);
      return () => clearTimeout(t);
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) onSave(trimmed);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          } else if (e.key === "Escape") {
            e.preventDefault();
            setEditing(false);
          }
        }}
        placeholder={placeholder}
        style={{
          background: "#1A1816",
          border: "1px solid #4A4539",
          borderRadius: 5,
          color: "#EDE8DF",
          outline: "none",
          padding: "2px 6px",
          ...inputStyle,
        }}
      />
    );
  }

  const Tag = tag;
  return (
    <Tag
      onClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      title="Click to edit"
      style={{ cursor: "text", ...textStyle }}
    >
      {value}
    </Tag>
  );
}

function Row({ item, progressOf, hasChildren, justStamped, toggleItem, removeItem, onOpen, docMode, renameItem }) {
  const color = typeMap[item.type]?.color || "#7C7BA6";
  const { done: doneCount, total } = progressOf(item.id);

  return (
    <div
      onClick={onOpen}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "#211E1B",
        border: "1px solid #2E2B26",
        borderLeft: `3px solid ${color}`,
        borderRadius: 8,
        padding: "10px 12px",
        opacity: docMode ? 1 : item.done ? 0.55 : 1,
        cursor: "pointer",
        transition: "opacity 0.3s ease",
      }}
    >
      {docMode ? (
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            border: "1.5px solid #4A4539",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <FileText size={12} color="#8A8478" />
        </div>
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleItem(item.id);
          }}
          aria-label={item.done ? "Mark incomplete" : "Mark complete"}
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            border: `1.5px solid ${item.done ? color : "#4A4539"}`,
            background: item.done ? color : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
            transform: justStamped === item.id ? "scale(1.35) rotate(-8deg)" : "scale(1) rotate(0deg)",
            transition: "transform 0.35s cubic-bezier(.34,1.56,.64,1), background 0.2s, border-color 0.2s",
          }}
        >
          {item.done && <Check size={14} color="#1A1816" strokeWidth={3} />}
        </button>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <EditableTitle
            value={item.title}
            onSave={(t) => renameItem(item.id, t)}
            textStyle={{
              fontSize: 14,
              color: !docMode && item.done ? "#7A7568" : "#EDE8DF",
              textDecoration: !docMode && item.done ? "line-through" : "none",
              overflowWrap: "break-word",
            }}
            inputStyle={{ fontSize: 14, minWidth: 0, flex: 1 }}
          />
          {total > 0 && (
            <span
              style={{
                fontSize: 10,
                fontFamily: "ui-monospace, monospace",
                color: docMode ? "#948E80" : doneCount === total ? "#7A9B76" : "#948E80",
                background: "#1A1816",
                border: "1px solid #33302B",
                borderRadius: 999,
                padding: "1px 6px",
              }}
            >
              {docMode ? total : `${doneCount}/${total}`}
            </span>
          )}
        </div>
        {!docMode && (
          <div style={{ display: "flex", gap: 8, marginTop: 3, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 10.5, fontFamily: "ui-monospace, monospace", color: "#6E6858" }}>
              {timeAgo(item.created)}
            </span>
            {item.priority === "high" && !item.done && <Flame size={11} color="#C9A24B" />}
          </div>
        )}
      </div>

      {hasChildren && <ChevronRight size={16} color="#5E594E" style={{ flexShrink: 0 }} />}

      <button
        onClick={(e) => {
          e.stopPropagation();
          removeItem(item.id);
        }}
        aria-label="Delete"
        style={{ background: "transparent", border: "none", cursor: "pointer", color: "#5E594E", padding: 4, flexShrink: 0 }}
      >
        <X size={14} />
      </button>
    </div>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6E6858" strokeWidth="2.5">
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HomeBadge({ label, color }) {
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.03em",
        textTransform: "uppercase",
        color,
        border: `1px solid ${color}`,
        borderRadius: 5,
        padding: "1px 5px",
        flexShrink: 0,
      }}
    >
      {label}
    </span>
  );
}

// ---- Swipe-to-reveal (priority picker) ----
// Classic iOS swipe-actions pattern: content sits on top of a hidden
// actions layer, and dragging left translates the content to reveal it.
// Pointer events unify touch and mouse. A `moved` flag distinguishes a
// genuine tap (which opens the row) from a drag (which shouldn't).
const SWIPE_REVEAL_WIDTH = 168; // px of actions revealed when fully open
const SWIPE_TAP_TOLERANCE = 6; // px of movement still treated as a tap

function useSwipeReveal({ revealWidth = SWIPE_REVEAL_WIDTH } = {}) {
  const [offset, setOffset] = useState(0); // 0 = closed, negative = revealed
  const [dragging, setDragging] = useState(false);
  const pointerId = useRef(null);
  const startX = useRef(0);
  const startOffset = useRef(0);
  const moved = useRef(false);

  const close = () => setOffset(0);

  const onPointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    pointerId.current = e.pointerId;
    startX.current = e.clientX;
    startOffset.current = offset;
    moved.current = false;
    setDragging(true);
  };

  const onPointerMove = (e) => {
    if (pointerId.current !== e.pointerId) return;
    const dx = e.clientX - startX.current;
    if (Math.abs(dx) > SWIPE_TAP_TOLERANCE) moved.current = true;
    const next = Math.min(0, Math.max(-revealWidth, startOffset.current + dx));
    setOffset(next);
  };

  const endDrag = (e) => {
    if (pointerId.current !== e.pointerId) return;
    pointerId.current = null;
    setDragging(false);
    // Snap fully open or fully closed depending on how far past the
    // midpoint the drag went — swiping right (or a short left swipe)
    // closes it back up without changing anything.
    setOffset((current) => (current <= -revealWidth / 2 ? -revealWidth : 0));
  };

  return {
    offset,
    dragging,
    isOpen: offset < 0,
    moved,
    close,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
    },
  };
}

function HomeTaskRow({ item, toggleItem, justStamped, onOpen, locationLabel, today, effectiveDue, renameItem, updateField }) {
  const color = typeMap[item.type]?.color || "#7C7BA6";
  const loc = locationLabel(item.id);
  const due = effectiveDue ? effectiveDue(item) : item.dueDate;
  const isOverdue = due && today && due < today;
  const isToday = due && today && due === today;
  const tint = item.blocked ? "#D9954B" : isOverdue ? "#C9614B" : color;

  const { offset, dragging, isOpen, moved, close, handlers } = useSwipeReveal();

  const handleRowClick = () => {
    // A real drag shouldn't also trigger the tap-to-open action.
    if (moved.current) {
      moved.current = false;
      return;
    }
    if (isOpen) {
      close();
      return;
    }
    onOpen(item.id);
  };

  const pickPriority = (p) => {
    updateField(item.id, "priority", p);
    close();
  };

  return (
    <div style={{ position: "relative", borderRadius: 8, overflow: "hidden" }}>
      {/* Hidden priority-picker layer, revealed as the content swipes left */}
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          right: 0,
          width: SWIPE_REVEAL_WIDTH,
          display: "flex",
        }}
      >
        {PRIORITIES.map((p) => {
          const meta = PRIORITY_META[p];
          const active = item.priority === p;
          return (
            <button
              key={p}
              onClick={(e) => {
                e.stopPropagation();
                pickPriority(p);
              }}
              aria-label={`Set ${meta.label} priority`}
              style={{
                flex: 1,
                border: "none",
                borderLeft: "1px solid rgba(0,0,0,0.15)",
                background: meta.color,
                color: "#1A1816",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.01em",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: active ? 1 : 0.82,
              }}
            >
              {meta.label}
            </button>
          );
        })}
      </div>

      {/* Foreground content — slides left via pointer drag to reveal actions */}
      <div
        onClick={handleRowClick}
        {...handlers}
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          background: "#211E1B",
          border: "1px solid #2E2B26",
          borderLeft: `3px solid ${tint}`,
          borderRadius: 8,
          padding: "10px 12px",
          cursor: "pointer",
          position: "relative",
          touchAction: "pan-y",
          transform: `translateX(${offset}px)`,
          transition: dragging ? "none" : "transform 0.2s ease",
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleItem(item.id);
          }}
          aria-label="Mark complete"
          style={{
            width: 22,
            height: 22,
            marginTop: 1,
            borderRadius: 6,
            border: "1.5px solid #4A4539",
            background: "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
            transform: justStamped === item.id ? "scale(1.35) rotate(-8deg)" : "scale(1) rotate(0deg)",
            transition: "transform 0.35s cubic-bezier(.34,1.56,.64,1)",
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <EditableTitle
              value={item.title}
              onSave={(t) => renameItem(item.id, t)}
              textStyle={{ fontSize: 14, color: "#EDE8DF" }}
              inputStyle={{ fontSize: 14, minWidth: 0, flex: 1 }}
            />
            {item.priority === "high" && <Flame size={11} color="#C9A24B" />}
            {isOverdue && <HomeBadge label="Overdue" color="#C9614B" />}
            {!isOverdue && isToday && <HomeBadge label="Today" color="#C9A24B" />}
            {item.blocked && <HomeBadge label="Blocked" color="#D9954B" />}
            {due && !isOverdue && !isToday && (
              <span style={{ fontSize: 10.5, fontFamily: "ui-monospace, monospace", color: "#6E6858" }}>
                {due.slice(5)}
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: "#6E6858", marginTop: 3, overflowWrap: "break-word" }}>
            {loc || typeMap[item.type]?.label}
            {item.blocked && item.blockedReason ? ` · Waiting on: ${item.blockedReason}` : ""}
          </div>
        </div>
      </div>
    </div>
  );
}

const HOME_SORT_OPTIONS = [
  { id: "priority", label: "Sort: Priority" },
  { id: "due", label: "Sort: Due date" },
  { id: "location", label: "Sort: Location" },
  { id: "az", label: "Sort: Name (A–Z)" },
];

function DayStrip({ days }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 4, marginBottom: 18 }}>
      {days.map((d) => {
        const ringColor = d.isToday ? "#C9A24B" : "#7A9B76";
        const filled = d.pct >= 100;
        return (
          <div
            key={d.key}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, flex: 1, minWidth: 0 }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: d.isToday ? "#C9A24B" : "#6E6858",
              }}
            >
              {d.label}
            </span>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                boxSizing: "border-box",
                background:
                  d.pct > 0
                    ? `conic-gradient(${ringColor} ${d.pct * 3.6}deg, #26221D ${d.pct * 3.6}deg 360deg)`
                    : "#26221D",
                border: filled ? `1px solid ${ringColor}` : "1px solid #33302B",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "#1A1816",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  fontFamily: "ui-monospace, monospace",
                  fontWeight: d.isToday ? 700 : 500,
                  color: d.isToday ? "#EDE8DF" : d.isFuture ? "#4A453B" : "#8A8478",
                }}
              >
                {d.dayNum}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HomeDashboard({ data, toggleItem, justStamped, onOpen, locationLabel, homeSort, setHomeSort, renameItem, updateField }) {
  const { allLeafTasks, groups, today, effectiveDue } = data;
  // Per-group priority sections are collapsible dropdowns; only the highest
  // priority present in a given parent auto-opens, med/low stay tucked away
  // until tapped. Keyed by `${rootId}:${priority}` so state is independent
  // per parent group.
  const [openPriority, setOpenPriority] = useState({});

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div
          style={{
            fontSize: 11.5,
            fontWeight: 700,
            letterSpacing: "0.04em",
            color: "#8A8478",
            textTransform: "uppercase",
          }}
        >
          All Tasks · {allLeafTasks.length}
        </div>
        <select value={homeSort} onChange={(e) => setHomeSort(e.target.value)} style={selectStyle("#3A362E")}>
          {HOME_SORT_OPTIONS.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {groups.length === 0 && (
        <div style={{ fontSize: 12.5, color: "#5E594E", padding: "4px 2px", marginBottom: 22 }}>
          No open tasks. Add one to get started.
        </div>
      )}

      {groups.map(({ root, tasks, progress }) => {
        const color = typeMap[root.type]?.color || "#7C7BA6";
        const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

        // Sub-group this parent's tasks by priority, keeping the order the
        // tasks already arrived in (per the top homeSort control) within
        // each priority band.
        const byPriority = { high: [], med: [], low: [] };
        tasks.forEach((t) => (byPriority[t.priority] || byPriority.med).push(t));
        const priorityKeys = ["high", "med", "low"].filter((p) => byPriority[p].length > 0);
        const topPriority = priorityKeys[0];

        return (
          <div key={root.id} style={{ marginBottom: 22 }}>
            <div onClick={() => onOpen(root.id)} style={{ cursor: "pointer", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, flexShrink: 0 }} />
                <span style={{ fontSize: 12.5, fontWeight: 600, color: "#C9C3B6", letterSpacing: "0.01em" }}>
                  {root.title}
                </span>
                <span style={{ fontSize: 11, color: "#5E594E", fontFamily: "ui-monospace, monospace" }}>
                  {tasks.length}
                </span>
                {progress.total > 0 && (
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: "ui-monospace, monospace",
                      color: "#948E80",
                      marginLeft: "auto",
                    }}
                  >
                    {progress.done}/{progress.total} · {pct}%
                  </span>
                )}
              </div>
              {progress.total > 0 && (
                <div
                  style={{
                    width: "100%",
                    height: 6,
                    borderRadius: 999,
                    background: "#211E1B",
                    border: "1px solid #2E2B26",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      height: "100%",
                      borderRadius: 999,
                      background: color,
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {priorityKeys.map((p) => {
                const key = `${root.id}:${p}`;
                const isOpen = openPriority[key] !== undefined ? openPriority[key] : p === topPriority;
                const meta = PRIORITY_META[p];
                return (
                  <div key={p}>
                    <button
                      onClick={() => setOpenPriority((s) => ({ ...s, [key]: !isOpen }))}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: "2px 0 6px",
                        width: "100%",
                        textAlign: "left",
                      }}
                    >
                      {isOpen ? <ChevronDownIcon /> : <ChevronRight size={12} color="#6E6858" />}
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: meta.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 11.5, fontWeight: 600, color: "#948E80", letterSpacing: "0.01em" }}>
                        {meta.short}
                      </span>
                      <span style={{ fontSize: 10.5, color: "#5E594E", fontFamily: "ui-monospace, monospace" }}>
                        {byPriority[p].length}
                      </span>
                    </button>
                    {isOpen && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 4 }}>
                        {byPriority[p].map((it) => (
                          <HomeTaskRow
                            key={it.id}
                            item={it}
                            toggleItem={toggleItem}
                            justStamped={justStamped}
                            onOpen={onOpen}
                            locationLabel={locationLabel}
                            today={today}
                            effectiveDue={effectiveDue}
                            renameItem={renameItem}
                            updateField={updateField}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function selectStyle(accent) {
  return {
    fontSize: 11.5,
    padding: "6px 8px",
    borderRadius: 7,
    border: `1px solid ${accent}`,
    background: "#1A1816",
    color: "#C9C3B6",
    outline: "none",
    cursor: "pointer",
    maxWidth: 160,
  };
}
