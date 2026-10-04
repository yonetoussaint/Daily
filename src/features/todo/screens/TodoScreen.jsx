import { useMemo, useState } from "react";
import { CheckCircle2, Circle, ListChecks, Menu, Moon, Pencil, Plus, Sun, SunMoon, User } from "lucide-react";
import { Chip, EmptyState, Fab, IconButton, TextField, TopAppBar, WavyProgress, useScrollingDown, useSnackbar } from "../../../design/components";
import { useDrawer } from "../../../app/DrawerProvider";
import { useTheme } from "../../../app/useTheme";
import { useTodo } from "../TodoProvider";
import { GROUPS, fmtDate, groupOf, todayIso } from "../model";
import TaskSheet from "../components/TaskSheet";
import ListSheet from "../components/ListSheet";

const THEME_ICON = { auto: SunMoon, light: Sun, dark: Moon };

export default function TodoScreen() {
  const drawer = useDrawer();
  const theme = useTheme();
  const snackbar = useSnackbar();
  const scrollingDown = useScrollingDown();
  const { lists, tasks, saveTask, toggle, removeTask, restoreTask, clearDone, restoreMany, saveList, removeList, restoreList } = useTodo();
  const [listId, setListId] = useState("all");
  const [showDone, setShowDone] = useState(false);
  const [quick, setQuick] = useState("");
  const [sheet, setSheet] = useState(null); // { task? } | { list? } with kind
  const ThemeIcon = THEME_ICON[theme.mode];

  const current = lists.find((l) => l.id === listId) ?? null;
  const activeId = current ? listId : "all"; // a deleted list falls back to All
  const listOf = useMemo(() => Object.fromEntries(lists.map((l) => [l.id, l])), [lists]);
  const inList = tasks.filter((t) => activeId === "all" || t.listId === activeId);
  const open = inList.filter((t) => !t.done);
  const done = inList.filter((t) => t.done).sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0));
  const today = todayIso();
  const dueSoon = open.filter((t) => t.due && t.due <= today).length;

  const addQuick = (e) => {
    e.preventDefault();
    const title = quick.trim();
    if (!title) return;
    saveTask({ title, listId: current?.id ?? lists[0]?.id });
    setQuick("");
  };

  const del = (task) => {
    const index = removeTask(task.id);
    setSheet(null);
    snackbar.show({ message: `Deleted “${task.title}”`, actionLabel: "Undo", onAction: () => restoreTask(task, index) });
  };

  const delList = (list) => {
    const undo = removeList(list.id);
    setSheet(null);
    setListId("all");
    snackbar.show({ message: `Deleted “${list.name}”`, actionLabel: "Undo", onAction: () => restoreList(undo) });
  };

  const clear = () => {
    const removed = clearDone(current?.id);
    snackbar.show({ message: `Cleared ${removed.length} done task${removed.length === 1 ? "" : "s"}`, actionLabel: "Undo", onAction: () => restoreMany(removed) });
  };

  const row = (t) => {
    const l = listOf[t.listId];
    const late = !t.done && t.due && t.due < today;
    return (
      <li key={t.id} className="td-row acc" style={{ "--hue": l?.hue ?? 285 }}>
        <button className={`td-check state${t.done ? " is-done" : ""}`} aria-label={t.done ? "Mark as not done" : "Mark as done"} onClick={() => toggle(t.id)}>
          {t.done ? <CheckCircle2 size={26} /> : <Circle size={26} />}
        </button>
        <button className="td-main state" onClick={() => setSheet({ kind: "task", task: t })}>
          <span className={`title-md${t.done ? " is-done" : ""}`}>{t.title}</span>
          <span className="td-meta body-md muted">
            {activeId === "all" && l && <span className="td-list">{l.name}</span>}
            {t.askedBy && <span className="td-who"><User size={14} />{t.askedBy}</span>}
            {t.due && <span className={late ? "is-late" : ""}>{late ? "Overdue, " : ""}{t.due === today ? "Today" : fmtDate(t.due)}</span>}
          </span>
          {t.notes && !t.done && <span className="td-notes body-md muted">{t.notes}</span>}
        </button>
      </li>
    );
  };

  return (
    <>
      <TopAppBar
        title="Todo"
        leading={<IconButton label="Open menu" onClick={drawer.open}><Menu size={24} /></IconButton>}
        actions={<IconButton label={`Theme: ${theme.mode}. Switch to ${theme.next}`} onClick={theme.cycle}><ThemeIcon size={22} /></IconButton>}
      />
      <main className="td-page">
        <header className="td-head">
          <p className="overline muted">{open.length} to do{dueSoon > 0 ? ` · ${dueSoon} due or overdue` : ""}</p>
          <h1 className="display">{current ? current.name : "Todo"}</h1>
        </header>

        <form onSubmit={addQuick} className="td-quick">
          <TextField
            className="field-pill"
            label={current ? `Add to ${current.name}` : "Add a task"}
            value={quick}
            onChange={(e) => setQuick(e.target.value)}
            leading={<Plus size={22} />}
            enterKeyHint="done"
            maxLength={160}
            autoComplete="off"
          />
        </form>

        <nav className="chips-row" aria-label="Lists">
          <Chip selected={activeId === "all"} onClick={() => setListId("all")}>All</Chip>
          {lists.map((l) => <Chip key={l.id} hue={l.hue} selected={activeId === l.id} onClick={() => setListId(l.id)}>{l.name}</Chip>)}
          <Chip icon={<Plus size={18} />} onClick={() => setSheet({ kind: "list" })}>New list</Chip>
        </nav>

        {current && (
          <div className="td-listbar">
            <WavyProgress value={done.length} total={inList.length} label={`${current.name} progress`} />
            <IconButton label={`Edit ${current.name}`} onClick={() => setSheet({ kind: "list", list: current })}><Pencil size={20} /></IconButton>
          </div>
        )}

        {open.length === 0 && (
          <EmptyState icon={<ListChecks size={48} />} title={inList.length ? "All done" : "Nothing to do"}>
            {inList.length ? "Nice. Everything here is finished." : "Type above the moment someone asks you for something, so you don’t forget it."}
          </EmptyState>
        )}

        {GROUPS.map(({ id, label }) => {
          const group = open.filter((t) => groupOf(t, today) === id).sort((a, b) => (a.due || "9999").localeCompare(b.due || "9999"));
          if (!group.length) return null;
          return (
            <section key={id} className="td-group" aria-label={label}>
              <h3 className={`label-lg muted${id === "overdue" ? " is-late" : ""}`}>{label} <span className="count">{group.length}</span></h3>
              <ul className="td-list-ul">{group.map(row)}</ul>
            </section>
          );
        })}

        {done.length > 0 && (
          <section className="td-group" aria-label="Done">
            <div className="td-donebar">
              <button className="td-toggle state label-lg muted" aria-expanded={showDone} onClick={() => setShowDone((s) => !s)}>
                Done <span className="count">{done.length}</span>
              </button>
              {showDone && <button className="td-toggle state label-lg" onClick={clear}>Clear done</button>}
            </div>
            {showDone && <ul className="td-list-ul">{done.map(row)}</ul>}
          </section>
        )}
      </main>

      <Fab className="td-fab" icon={<Plus size={26} strokeWidth={2.6} />} label="New task" extended={!scrollingDown} onClick={() => setSheet({ kind: "task" })} />

      {sheet?.kind === "task" && (
        <TaskSheet
          key={sheet.task?.id ?? "new"}
          task={sheet.task}
          lists={lists}
          defaultListId={current?.id}
          onClose={() => setSheet(null)}
          onSave={(t) => { saveTask(t); setSheet(null); }}
          onDelete={() => del(sheet.task)}
        />
      )}
      {sheet?.kind === "list" && (
        <ListSheet
          key={sheet.list?.id ?? "new"}
          list={sheet.list}
          onClose={() => setSheet(null)}
          onSave={(l) => { const id = saveList(l); setListId(id); setSheet(null); }}
          onDelete={() => delList(sheet.list)}
        />
      )}
    </>
  );
}
