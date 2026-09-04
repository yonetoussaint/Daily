import React, { useState, useRef, useEffect } from "react";
import { Plus, Check, Pencil, Trash2, X, MoreVertical, ListChecks, Search } from "lucide-react";

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
// persistence — uses Claude's artifact storage API so items survive reloads
// ---------------------------------------------------------------------------
const STORAGE_KEY = "home_organizer_items";

async function loadItems() {
  try {
    const result = await window.storage.get(STORAGE_KEY, false);
    return result ? JSON.parse(result.value) : [];
  } catch {
    return [];
  }
}

async function saveItems(items) {
  try {
    await window.storage.set(STORAGE_KEY, JSON.stringify(items), false);
    return true;
  } catch {
    return false;
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
// Stats Board Component
// ---------------------------------------------------------------------------
function StatsBoard({ items }) {
  const total = items.length;
  const done = items.filter((i) => i.checked).length;
  const totalRooms = new Set(items.map((i) => i.room)).size;
  const roomSections = ROOMS.filter((room) => items.some((i) => i.room === room));

  const getRoomCompletion = (room) => {
    const roomItems = items.filter((i) => i.room === room);
    const done = roomItems.filter((i) => i.checked).length;
    return {
      total: roomItems.length,
      done,
      percentage: roomItems.length === 0 ? 0 : Math.round((done / roomItems.length) * 100)
    };
  };

  const getPriorityStats = (priority) => {
    const priorityItems = items.filter((i) => i.priority === priority);
    const done = priorityItems.filter((i) => i.checked).length;
    return {
      total: priorityItems.length,
      done,
      percentage: priorityItems.length === 0 ? 0 : Math.round((done / priorityItems.length) * 100)
    };
  };

  const allDone = total > 0 && done === total;

  return (
    <div style={{
      background: C.surfaceAlt,
      borderBottom: `1px solid ${C.border}`,
      padding: "14px 20px 16px",
    }}>
      {/* Main stats */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10
      }}>
        <div>
          <div style={{
            fontSize: 20,
            fontWeight: 700,
            color: allDone ? C.accent : C.ink,
            letterSpacing: "-0.02em"
          }}>
            {done}/{total}
          </div>
          <div style={{
            fontSize: 12,
            color: C.muted,
            marginTop: 2
          }}>
            {allDone ? "🎉 All done!" : `Items completed`}
          </div>
        </div>
        <div style={{
          textAlign: "right"
        }}>
          <div style={{
            fontSize: 13,
            fontWeight: 600,
            color: C.ink
          }}>
            {totalRooms} rooms
          </div>
          <div style={{
            fontSize: 12,
            color: C.muted,
            marginTop: 2
          }}>
            {items.length} total items
          </div>
        </div>
      </div>

      {/* Overall progress bar */}
      <div style={{ marginBottom: total > 0 ? 14 : 0 }}>
        <ProgressBar value={done} total={total} height={8} />
      </div>

      {/* Room breakdown */}
      {roomSections.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{
            fontSize: 11,
            fontWeight: 600,
            color: C.muted,
            marginBottom: 6,
            letterSpacing: "0.02em",
            textTransform: "uppercase"
          }}>
            Rooms
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {roomSections.map((room) => {
              const stats = getRoomCompletion(room);
              return (
                <div key={room} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: C.ink,
                    minWidth: 80,
                    whiteSpace: "nowrap"
                  }}>
                    {room}
                  </span>
                  <div style={{ flex: 1 }}>
                    <ProgressBar 
                      value={stats.done} 
                      total={stats.total} 
                      height={4} 
                      tint={C.border}
                      fill={stats.percentage === 100 ? C.accent : C.mutedSoft}
                    />
                  </div>
                  <span style={{
                    fontSize: 11,
                    color: C.muted,
                    minWidth: 36,
                    textAlign: "right"
                  }}>
                    {stats.done}/{stats.total}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Priority breakdown */}
      <div>
        <div style={{
          fontSize: 11,
          fontWeight: 600,
          color: C.muted,
          marginBottom: 6,
          letterSpacing: "0.02em",
          textTransform: "uppercase"
        }}>
          Priority
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          {PRIORITIES.map((priority) => {
            const stats = getPriorityStats(priority);
            const meta = PRIORITY_META[priority];
            return (
              <div key={priority} style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: meta.color,
                  }}>
                    {priority}
                  </span>
                  <span style={{
                    fontSize: 10,
                    color: C.muted
                  }}>
                    {stats.done}/{stats.total}
                  </span>
                </div>
                <ProgressBar 
                  value={stats.done} 
                  total={stats.total} 
                  height={4} 
                  tint={meta.tint}
                  fill={meta.color}
                />
              </div>
            );
          })}
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
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [modal, setModal] = useState(null); // null | "add" | itemObject

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const stored = await loadItems();
      if (!cancelled) {
        setItems(stored);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = async (next) => {
    const ok = await saveItems(next);
    if (!ok) setError("Couldn't save your changes — they may not persist after you leave.");
  };

  const toggle = (id) => {
    const next = items.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i));
    setItems(next);
    persist(next);
  };

  const remove = (id) => {
    const next = items.filter((i) => i.id !== id);
    setItems(next);
    persist(next);
  };

  const upsert = (data) => {
    const editing = modal && modal !== "add";
    setModal(null);
    if (editing) {
      const next = items.map((i) => (i.id === modal.id ? { ...i, ...data } : i));
      setItems(next);
      persist(next);
    } else {
      const id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `item-${Date.now()}`;
      const next = [...items, { id, checked: false, ...data }];
      setItems(next);
      persist(next);
    }
  };

  const total = items.length;
  const done = items.filter((i) => i.checked).length;

  const roomFiltered = activeTab === "All" ? items : items.filter((i) => i.room === activeTab);
  const query = search.trim().toLowerCase();
  const visibleItems = query
    ? roomFiltered.filter((i) => i.name.toLowerCase().includes(query))
    : roomFiltered;

  return (
    <div
      style={{
        fontFamily: FONT,
        background: C.canvas,
        color: C.ink,
        width: "100%",
        maxWidth: 440,
        height: "100vh",
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
        <div>
          <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em" }}>
            Home organizer
          </div>
          <div style={{ fontSize: 12.5, color: C.muted, marginTop: 3 }}>
            {total === 0 ? "No items yet" : `${done} of ${total} items ready`}
          </div>
        </div>

        <div style={{ margin: "14px 0 12px" }}>
          <ProgressBar value={done} total={total} />
        </div>

        <div
          style={{
            position: "relative",
            marginBottom: 12,
          }}
        >
          <Search
            size={15}
            strokeWidth={2}
            color={C.mutedSoft}
            style={{
              position: "absolute",
              left: 11,
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items"
            style={{
              width: "100%",
              fontFamily: FONT,
              fontSize: 13.5,
              color: C.ink,
              background: C.surfaceAlt,
              border: `1px solid ${C.border}`,
              borderRadius: 9,
              padding: search ? "8px 32px 8px 32px" : "8px 12px 8px 32px",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              aria-label="Clear search"
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: C.mutedSoft,
                cursor: "pointer",
                padding: 3,
                display: "flex",
              }}
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            overflowX: "auto",
            paddingBottom: 14,
            paddingLeft: 20,
            paddingRight: 20,
            marginLeft: -20,
            marginRight: -20,
            scrollbarWidth: "none",
          }}
        >
          {["All", ...ROOMS].map((tab) => {
            const isActive = tab === activeTab;
            const tabItems = tab === "All" ? items : items.filter((i) => i.room === tab);
            const tabTotal = tabItems.length;
            const tabDone = tabItems.filter((i) => i.checked).length;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flexShrink: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  fontFamily: FONT,
                  textAlign: "left",
                  minWidth: 84,
                  padding: "8px 12px",
                  borderRadius: 12,
                  border: `1px solid ${isActive ? C.accent : C.border}`,
                  background: isActive ? C.accentTint : C.surfaceAlt,
                  cursor: "pointer",
                }}
              >
                <span
                  style={{
                    fontSize: 12.5,
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? C.accent : C.ink,
                    whiteSpace: "nowrap",
                  }}
                >
                  {tab}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ flex: 1, minWidth: 28 }}>
                    <ProgressBar
                      value={tabDone}
                      total={tabTotal}
                      height={4}
                      tint={isActive ? "#D3E4DA" : C.border}
                      fill={isActive ? C.accent : C.mutedSoft}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: 10.5,
                      color: isActive ? C.accent : C.mutedSoft,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {tabDone}/{tabTotal}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats Board - Below tabs */}
      <StatsBoard items={items} />

      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            padding: "9px 18px",
            background: C.dangerTint,
            color: C.danger,
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
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 76 }} onScroll={() => setMenuOpenId(null)}>
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
          <EmptyState
            message={
              query
                ? `No items match "${search.trim()}".`
                : "Nothing in this room yet."
            }
          />
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

      {/* floating add button */}
      <button
        onClick={() => setModal("add")}
        aria-label="Add item"
        style={{
          position: "absolute",
          right: 20,
          bottom: 20,
          width: 52,
          height: 52,
          borderRadius: "50%",
          border: "none",
          background: C.accent,
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 10px 24px rgba(47,111,82,0.38), 0 2px 6px rgba(20,24,20,0.14)",
          zIndex: 20,
          transition: "transform 120ms ease, box-shadow 120ms ease",
        }}
        onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.94)")}
        onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        <Plus size={22} strokeWidth={2.5} />
      </button>

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