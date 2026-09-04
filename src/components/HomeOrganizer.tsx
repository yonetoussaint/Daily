import React, { useState, useRef, useEffect } from "react";
import { Plus, Check, Pencil, Trash2, X, MoreVertical, ListChecks } from "lucide-react";

// ---------------------------------------------------------------------------
// design tokens
// ---------------------------------------------------------------------------
const C = {
  canvas: "#EEF0EE",
  surface: "#FFFFFF",
  surfaceAlt: "#F6F7F6",
  border: "#DFE2DE",
  borderStrong: "#CBD0CB",
  ink: "#1B211D",
  muted: "#6E756F",
  mutedSoft: "#9AA09A",
  accent: "#2F6F52",
  accentTint: "#E4EFE8",
  danger: "#B14B3D",
  dangerTint: "#F5E7E3",
};

const FONT =
  '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const ROOMS = ["Bedroom", "Bathroom", "Wardrobe", "Kitchen", "Living Room", "Entryway", "Garage", "Work"];

const PRIORITIES = ["High", "Medium", "Low"];

const PRIORITY_META = {
  High: { color: "#B14B3D", tint: "#F5E7E3", label: "High priority" },
  Medium: { color: "#C08A34", tint: "#F3ECDD", label: "Medium priority" },
  Low: { color: "#6E756F", tint: "#EAECEA", label: "Low priority" },
};

// ---------------------------------------------------------------------------
// Supabase (persistence)
// ---------------------------------------------------------------------------
const SUPABASE_URL = "https://wkfzhcszhgewkvwukzes.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrZnpoY3N6aGdld2t2d3VremVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg3MDE1NzksImV4cCI6MjA1NDI3NzU3OX0.TzSh8M9NOTnsmVaNxquif4xzSxWaVZp9sePHcjrgCVI";
const TABLE = "home_organizer_items";
const REST_URL = `${SUPABASE_URL}/rest/v1/${TABLE}`;
const SB_HEADERS = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
};

async function sbList() {
  const res = await fetch(`${REST_URL}?select=*&order=created_at.asc`, {
    headers: SB_HEADERS,
  });
  if (!res.ok) throw new Error(`Failed to load items (${res.status})`);
  return res.json();
}

async function sbInsert(item) {
  const res = await fetch(REST_URL, {
    method: "POST",
    headers: { ...SB_HEADERS, Prefer: "return=representation" },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error(`Failed to add item (${res.status})`);
  const rows = await res.json();
  return rows[0];
}

async function sbUpdate(id, patch) {
  const res = await fetch(`${REST_URL}?id=eq.${id}`, {
    method: "PATCH",
    headers: { ...SB_HEADERS, Prefer: "return=representation" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`Failed to update item (${res.status})`);
  const rows = await res.json();
  return rows[0];
}

async function sbDelete(id) {
  const res = await fetch(`${REST_URL}?id=eq.${id}`, {
    method: "DELETE",
    headers: SB_HEADERS,
  });
  if (!res.ok) throw new Error(`Failed to delete item (${res.status})`);
}

// ---------------------------------------------------------------------------
// Local fallback cache (used when Supabase is unreachable)
// Uses Claude's artifact storage API when running inside Claude.ai (where
// browser localStorage is unavailable), and falls back to real localStorage
// when this file is run in a normal browser (e.g. copied out of Claude.ai).
// ---------------------------------------------------------------------------
const LOCAL_CACHE_KEY = "home_organizer_items_cache";

const hasArtifactStorage = typeof window !== "undefined" && !!window.storage;

const hasLocalStorage = (() => {
  try {
    if (typeof window === "undefined" || !window.localStorage) return false;
    const testKey = "__home_organizer_ls_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
})();

async function localLoad() {
  try {
    if (hasArtifactStorage) {
      const result = await window.storage.get(LOCAL_CACHE_KEY, false);
      return result ? JSON.parse(result.value) : null;
    }
    if (hasLocalStorage) {
      const raw = window.localStorage.getItem(LOCAL_CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    }
    return null;
  } catch {
    return null;
  }
}

async function localSave(items) {
  try {
    if (hasArtifactStorage) {
      await window.storage.set(LOCAL_CACHE_KEY, JSON.stringify(items), false);
      return;
    }
    if (hasLocalStorage) {
      window.localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(items));
    }
  } catch {
    // best-effort cache; ignore failures
  }
}

// ---------------------------------------------------------------------------
// small building blocks
// ---------------------------------------------------------------------------
function ProgressBar({ value, total, height = 6, tint = C.accentTint, fill = C.accent }) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100);
  return (
    <div style={{ background: tint, height, width: "100%", borderRadius: height }}>
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          background: fill,
          borderRadius: height,
          transition: "width 220ms ease",
        }}
      />
    </div>
  );
}

function Checkbox({ checked, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label="toggle done"
      style={{
        width: 20,
        height: 20,
        flexShrink: 0,
        borderRadius: 6,
        border: `1.5px solid ${checked ? C.accent : C.borderStrong}`,
        background: checked ? C.accent : "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "background 120ms ease, border-color 120ms ease",
      }}
    >
      {checked && <Check size={13} strokeWidth={3} color="#fff" />}
    </button>
  );
}

// ---------------------------------------------------------------------------
// row with kebab menu (edit / delete)
// ---------------------------------------------------------------------------
function Row({ item, menuOpen, onToggleMenu, onToggle, onEdit, onDelete }) {
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onToggleMenu(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen, onToggleMenu]);

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 18px",
        borderBottom: `1px solid ${C.border}`,
        background: C.surface,
      }}
    >
      <Checkbox checked={item.checked} onClick={() => onToggle(item.id)} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
          }}
        >
          <span
            aria-label={PRIORITY_META[item.priority].label}
            title={PRIORITY_META[item.priority].label}
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              background: PRIORITY_META[item.priority].color,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 14,
              color: item.checked ? C.mutedSoft : C.ink,
              textDecoration: item.checked ? "line-through" : "none",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {item.name}
          </span>
        </div>
        <div style={{ fontSize: 11.5, color: C.mutedSoft, marginTop: 2, marginLeft: 13 }}>
          {item.room}
        </div>
      </div>

      <button
        onClick={() => onToggleMenu(menuOpen ? null : item.id)}
        aria-label="item actions"
        style={{
          background: "transparent",
          border: "none",
          color: C.mutedSoft,
          cursor: "pointer",
          padding: 6,
          borderRadius: 6,
          display: "flex",
        }}
      >
        <MoreVertical size={16} />
      </button>

      {menuOpen && (
        <div
          ref={menuRef}
          style={{
            position: "absolute",
            right: 12,
            top: "calc(100% - 6px)",
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            boxShadow: "0 8px 24px rgba(20,24,20,0.12)",
            overflow: "hidden",
            zIndex: 30,
            minWidth: 128,
          }}
        >
          <button
            onClick={() => {
              onEdit(item);
              onToggleMenu(null);
            }}
            style={menuItemStyle}
          >
            <Pencil size={13} strokeWidth={1.8} />
            Edit
          </button>
          <button
            onClick={() => {
              onDelete(item.id);
              onToggleMenu(null);
            }}
            style={{ ...menuItemStyle, color: C.danger }}
          >
            <Trash2 size={13} strokeWidth={1.8} />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

const menuItemStyle = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "9px 12px",
  background: "transparent",
  border: "none",
  fontFamily: FONT,
  fontSize: 13,
  color: C.ink,
  cursor: "pointer",
  textAlign: "left",
};

// ---------------------------------------------------------------------------
// modal: add / edit item
// ---------------------------------------------------------------------------
function ItemModal({ initial, defaultRoom, onCancel, onSubmit }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [priority, setPriority] = useState(initial?.priority ?? "Medium");
  const [room, setRoom] = useState(initial?.room ?? defaultRoom ?? ROOMS[0]);

  const labelStyle = {
    display: "block",
    fontSize: 12,
    fontWeight: 500,
    color: C.muted,
    marginBottom: 6,
  };

  const inputStyle = {
    width: "100%",
    background: C.surfaceAlt,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    color: C.ink,
    fontFamily: FONT,
    fontSize: 14,
    padding: "9px 11px",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 40,
      }}
    >
      <div
        onClick={onCancel}
        style={{ position: "absolute", inset: 0, background: "rgba(18,22,18,0.4)" }}
      />
      <div
        style={{
          position: "relative",
          width: 320,
          background: C.surface,
          borderRadius: 14,
          boxShadow: "0 24px 48px rgba(15,20,15,0.22)",
          padding: "20px 22px 22px",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>
            {initial ? "Edit item" : "Add item"}
          </span>
          <button
            onClick={onCancel}
            style={{ background: "none", border: "none", color: C.mutedSoft, cursor: "pointer", padding: 4 }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Name</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Desk organizer"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Priority</label>
          <div style={{ display: "flex", gap: 6 }}>
            {PRIORITIES.map((p) => {
              const isActive = p === priority;
              const meta = PRIORITY_META[p];
              return (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    fontFamily: FONT,
                    fontSize: 12.5,
                    fontWeight: isActive ? 600 : 400,
                    padding: "7px 0",
                    borderRadius: 8,
                    cursor: "pointer",
                    border: `1px solid ${isActive ? meta.color : C.border}`,
                    color: isActive ? meta.color : C.muted,
                    background: isActive ? meta.tint : "transparent",
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 999,
                      background: meta.color,
                    }}
                  />
                  {p}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Room</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {ROOMS.map((r) => (
              <button
                key={r}
                onClick={() => setRoom(r)}
                style={{
                  fontFamily: FONT,
                  fontSize: 12.5,
                  padding: "6px 12px",
                  borderRadius: 999,
                  cursor: "pointer",
                  border: `1px solid ${r === room ? C.accent : C.border}`,
                  color: r === room ? C.accent : C.muted,
                  background: r === room ? C.accentTint : "transparent",
                  fontWeight: r === room ? 600 : 400,
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              fontFamily: FONT,
              fontSize: 13.5,
              fontWeight: 500,
              padding: "10px 0",
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              background: "transparent",
              color: C.muted,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (!name.trim()) return;
              onSubmit({ name: name.trim(), priority, room });
            }}
            style={{
              flex: 1,
              fontFamily: FONT,
              fontSize: 13.5,
              fontWeight: 600,
              padding: "10px 0",
              borderRadius: 8,
              border: "none",
              background: C.accent,
              color: "#fff",
              cursor: "pointer",
            }}
          >
            {initial ? "Save changes" : "Add item"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// main component
// ---------------------------------------------------------------------------
export default function HomeOrganizer() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [offline, setOffline] = useState(false);
  const [activeTab, setActiveTab] = useState("All");
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [modal, setModal] = useState(null); // null | "add" | itemObject

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const rows = await sbList();
        if (cancelled) return;
        setItems(rows);
        setOffline(false);
        setError(null);
        localSave(rows);
      } catch (e) {
        if (cancelled) return;
        const cached = await localLoad();
        if (cached) {
          setItems(cached);
          setOffline(true);
          setError("Can't reach the server — showing your last saved data locally.");
        } else {
          setError(e.message || "Failed to load items");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = async (id) => {
    const current = items.find((i) => i.id === id);
    if (!current) return;
    const nextChecked = !current.checked;
    const next = items.map((i) => (i.id === id ? { ...i, checked: nextChecked } : i));
    setItems(next);
    try {
      await sbUpdate(id, { checked: nextChecked });
      setOffline(false);
      localSave(next);
    } catch (e) {
      setOffline(true);
      setError("Can't reach the server — change saved locally, will not sync yet.");
      localSave(next);
    }
  };

  const remove = async (id) => {
    const next = items.filter((i) => i.id !== id);
    setItems(next);
    try {
      await sbDelete(id);
      setOffline(false);
      localSave(next);
    } catch (e) {
      setOffline(true);
      setError("Can't reach the server — deletion saved locally, will not sync yet.");
      localSave(next);
    }
  };

  const upsert = async (data) => {
    const editing = modal && modal !== "add";
    setModal(null);
    if (editing) {
      const next = items.map((i) => (i.id === modal.id ? { ...i, ...data } : i));
      setItems(next);
      try {
        await sbUpdate(modal.id, data);
        setOffline(false);
        localSave(next);
      } catch (e) {
        setOffline(true);
        setError("Can't reach the server — changes saved locally, will not sync yet.");
        localSave(next);
      }
    } else {
      const tempId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `local-${Date.now()}`;
      const newItem = { id: tempId, checked: false, ...data };
      const withNew = [...items, newItem];
      setItems(withNew);
      try {
        const created = await sbInsert({ checked: false, ...data });
        const synced = items.concat(created);
        setItems(synced);
        setOffline(false);
        localSave(synced);
      } catch (e) {
        setOffline(true);
        setError("Can't reach the server — new item saved locally, will not sync yet.");
        localSave(withNew);
      }
    }
  };

  const total = items.length;
  const done = items.filter((i) => i.checked).length;

  const visibleItems = activeTab === "All" ? items : items.filter((i) => i.room === activeTab);

  return (
    <div
      style={{
        fontFamily: FONT,
        background: C.canvas,
        color: C.ink,
        width: "100%",
        maxWidth: 440,
        height: 660,
        margin: "0 auto",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        borderRadius: 16,
        overflow: "hidden",
        border: `1px solid ${C.border}`,
        boxShadow: "0 1px 3px rgba(20,24,20,0.06)",
      }}
    >
      {/* header */}
      <div
        style={{
          background: C.surface,
          borderBottom: `1px solid ${C.border}`,
          padding: "20px 20px 0",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em" }}>
              Home organizer
            </div>
            <div style={{ fontSize: 12.5, color: C.muted, marginTop: 3 }}>
              {total === 0 ? "No items yet" : `${done} of ${total} items ready`}
            </div>
          </div>
          <button
            onClick={() => setModal("add")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontFamily: FONT,
              fontSize: 13,
              fontWeight: 600,
              color: "#fff",
              background: C.accent,
              border: "none",
              borderRadius: 8,
              padding: "8px 12px",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <Plus size={14} strokeWidth={2.5} />
            Add item
          </button>
        </div>

        <div style={{ margin: "14px 0 16px" }}>
          <ProgressBar value={done} total={total} />
        </div>

        <div
          style={{
            display: "flex",
            gap: 6,
            overflowX: "auto",
            paddingBottom: 14,
            scrollbarWidth: "none",
          }}
        >
          {["All", ...ROOMS].map((tab) => {
            const isActive = tab === activeTab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flexShrink: 0,
                  fontFamily: FONT,
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 500,
                  padding: "6px 13px",
                  borderRadius: 999,
                  border: `1px solid ${isActive ? C.accent : C.border}`,
                  background: isActive ? C.accentTint : "transparent",
                  color: isActive ? C.accent : C.muted,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            padding: "9px 18px",
            background: offline ? "#FBF3DD" : C.dangerTint,
            color: offline ? "#8A6A1F" : C.danger,
            fontSize: 12.5,
            flexShrink: 0,
          }}
        >
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: 2, display: "flex" }}
            aria-label="dismiss error"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* list */}
      <div style={{ flex: 1, overflowY: "auto" }} onScroll={() => setMenuOpenId(null)}>
        {loading ? (
          <div
            style={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: C.mutedSoft,
              fontSize: 13,
            }}
          >
            Loading items…
          </div>
        ) : total === 0 ? (
          <EmptyState />
        ) : visibleItems.length === 0 ? (
          <EmptyState message="Nothing in this room yet." />
        ) : (
          PRIORITIES.map((priority) => {
            const rows = visibleItems.filter((i) => i.priority === priority);
            if (rows.length === 0) return null;
            const priorityDone = rows.filter((i) => i.checked).length;
            const meta = PRIORITY_META[priority];
            return (
              <div key={priority}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 18px 8px",
                    background: C.surfaceAlt,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: 999,
                        background: meta.color,
                      }}
                    />
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>
                      {priority} priority
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11.5, color: C.muted }}>
                      {priorityDone}/{rows.length}
                    </span>
                    <div style={{ width: 44 }}>
                      <ProgressBar value={priorityDone} total={rows.length} height={4} tint={meta.tint} fill={meta.color} />
                    </div>
                  </div>
                </div>
                {rows.map((item) => (
                  <Row
                    key={item.id}
                    item={item}
                    menuOpen={menuOpenId === item.id}
                    onToggleMenu={setMenuOpenId}
                    onToggle={toggle}
                    onEdit={(it) => setModal(it)}
                    onDelete={remove}
                  />
                ))}
              </div>
            );
          })
        )}
      </div>

      {modal && (
        <ItemModal
          initial={modal === "add" ? null : modal}
          defaultRoom={activeTab !== "All" ? activeTab : undefined}
          onCancel={() => setModal(null)}
          onSubmit={upsert}
        />
      )}
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        color: C.mutedSoft,
        padding: "0 40px",
        textAlign: "center",
      }}
    >
      <ListChecks size={30} strokeWidth={1.5} color={C.borderStrong} />
      <div style={{ fontSize: 13.5, fontWeight: 600, color: C.muted }}>No items yet</div>
      <div style={{ fontSize: 12.5 }}>
        {message ?? "Add something for your bedroom, bathroom, wardrobe, or work setup."}
      </div>
    </div>
  );
}
