import { useEffect, useMemo, useState } from "react";
import { Check, ListChecks, Plus, Search, X } from "lucide-react";
import { deleteItem, fetchItems, insertItem, updateItem } from "../../lib/organizerApi";
import { PRIORITIES, PRIORITY_META, ROOMS } from "./constants";
import ItemRow from "./ItemRow";
import ItemDialog from "./ItemDialog";

function WavyProgress({ value, total }) {
  const pct = total === 0 ? 0 : (value / total) * 100;
  return (
    <div className="wavy" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={value}>
      <svg aria-hidden="true">
        <defs>
          <pattern id="wave" width="24" height="10" patternUnits="userSpaceOnUse">
            <path d="M0 5 Q6 0 12 5 T24 5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </pattern>
        </defs>
        <rect x="0" y="0" width={`${pct}%`} height="10" fill="url(#wave)" />
      </svg>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="empty">
      <div className="blob"><ListChecks size={40} /></div>
      <div className="title-md">Nothing here yet</div>
      <div className="body-md muted">{message ?? "Add something for your bedroom, kitchen, wardrobe, or work setup."}</div>
    </div>
  );
}

export default function HomeOrganizer() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [swipeOpenId, setSwipeOpenId] = useState(null);
  const [modal, setModal] = useState(null); // null | "add" | item

  useEffect(() => {
    let cancelled = false;
    fetchItems()
      .then((rows) => !cancelled && setItems(rows))
      .catch(() => !cancelled && setError("Couldn't load items. Check your connection and reload."))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  // optimistic update with rollback
  const mutate = async (optimistic, request, failMessage) => {
    const prev = items;
    setItems(optimistic);
    try { await request(); } catch { setItems(prev); setError(failMessage); }
  };

  const toggle = (item) =>
    mutate(items.map((i) => (i.id === item.id ? { ...i, checked: !i.checked } : i)), () => updateItem(item.id, { checked: !item.checked }), "Couldn't save that change. Try again.");

  const setPriority = (item, priority) => {
    setSwipeOpenId(null);
    if (item.priority === priority) return;
    mutate(items.map((i) => (i.id === item.id ? { ...i, priority } : i)), () => updateItem(item.id, { priority }), "Couldn't update priority. Try again.");
  };

  const remove = (id) => mutate(items.filter((i) => i.id !== id), () => deleteItem(id), "Couldn't delete that item. Try again.");

  const upsert = async (data) => {
    const editing = modal && modal !== "add";
    const target = modal;
    setModal(null);
    if (editing) {
      mutate(items.map((i) => (i.id === target.id ? { ...i, ...data } : i)), () => updateItem(target.id, data), "Couldn't save changes. Try again.");
      return;
    }
    try {
      const created = await insertItem({ ...data, checked: false });
      setItems((cur) => [...cur, created]);
    } catch {
      setError("Couldn't add that item. Try again.");
    }
  };

  const done = items.filter((i) => i.checked).length;
  const query = search.trim().toLowerCase();
  const visible = useMemo(() => {
    const byRoom = activeTab === "All" ? items : items.filter((i) => i.room === activeTab);
    return query ? byRoom.filter((i) => i.name.toLowerCase().includes(query)) : byRoom;
  }, [items, activeTab, query]);

  const closeOverlays = () => { setMenuOpenId(null); setSwipeOpenId(null); };

  return (
    <main className="shell">
      <header className="app-bar">
        <h1 className="headline-lg" style={{ margin: 0 }}>Home organizer</h1>
        <p className="body-md muted">{done} of {items.length} done</p>
        <div className="search">
          <Search size={20} />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search items" aria-label="Search items" />
          {search && (
            <button className="icon-btn state" aria-label="Clear search" onClick={() => setSearch("")}><X size={20} /></button>
          )}
        </div>
        <WavyProgress value={done} total={items.length} />
      </header>

      <nav className="chips" aria-label="Rooms">
        {["All", ...ROOMS].map((tab) => {
          const tabItems = tab === "All" ? items : items.filter((i) => i.room === tab);
          const active = tab === activeTab;
          return (
            <button key={tab} className="chip state" aria-pressed={active} onClick={() => setActiveTab(tab)}>
              {active && <Check size={16} />}
              {tab}
              <small>{tabItems.filter((i) => i.checked).length}/{tabItems.length}</small>
            </button>
          );
        })}
      </nav>

      <div className="list" onScroll={closeOverlays}>
        {loading ? (
          <div className="empty body-md muted">Loading items…</div>
        ) : items.length === 0 ? (
          <EmptyState />
        ) : visible.length === 0 ? (
          <EmptyState message={query ? `No items match "${search.trim()}".` : "Nothing in this room yet."} />
        ) : (
          PRIORITIES.map((priority) => {
            const rows = visible.filter((i) => i.priority === priority);
            if (rows.length === 0) return null;
            const meta = PRIORITY_META[priority];
            return (
              <section key={priority} className={`group ${meta.cls}`}>
                <div className="group-head">
                  <span className="badge"><span style={{ width: 10, height: 10, borderRadius: 999, background: "currentColor" }} /></span>
                  <h2 className="title-md" style={{ margin: 0 }}>{meta.label}</h2>
                  <span className="count label-md">{rows.filter((r) => r.checked).length}/{rows.length}</span>
                </div>
                <div className="group-rows">
                  {rows.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      menuOpen={menuOpenId === item.id}
                      swipeOpen={swipeOpenId === item.id}
                      onToggleMenu={(id) => { setMenuOpenId(id); setSwipeOpenId(null); }}
                      onSwipeOpenChange={(id) => { setSwipeOpenId(id); if (id) setMenuOpenId(null); }}
                      onToggle={toggle}
                      onEdit={setModal}
                      onDelete={remove}
                      onSetPriority={setPriority}
                    />
                  ))}
                </div>
              </section>
            );
          })
        )}
      </div>

      {error && (
        <div className="snackbar" role="alert">
          <span>{error}</span>
          <button className="icon-btn state" aria-label="Dismiss" onClick={() => setError(null)}><X size={20} /></button>
        </div>
      )}

      <button className="fab state" onClick={() => setModal("add")}>
        <Plus size={24} strokeWidth={2.5} /> Add item
      </button>

      {modal && (
        <ItemDialog
          initial={modal === "add" ? null : modal}
          defaultRoom={activeTab !== "All" ? activeTab : undefined}
          onCancel={() => setModal(null)}
          onSubmit={upsert}
        />
      )}
    </main>
  );
}
