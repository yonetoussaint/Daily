import { useState } from "react";
import { CheckCircle2, Circle, ListChecks, Menu, Moon, Plus, Sun, SunMoon, User } from "lucide-react";
import { EmptyState, Fab, IconButton, TextField, TopAppBar, WavyProgress, useScrollingDown, useSnackbar } from "../../../design/components";
import { useDrawer } from "../../../app/DrawerProvider";
import { useTheme } from "../../../app/useTheme";
import { useGaz } from "../GazProvider";
import { GROUPS, HUE, fmtDate, groupOf, todayIso } from "../model";
import TaskSheet from "../components/TaskSheet";

const THEME_ICON = { auto: SunMoon, light: Sun, dark: Moon };

export default function GazScreen() {
  const drawer = useDrawer();
  const theme = useTheme();
  const snackbar = useSnackbar();
  const scrollingDown = useScrollingDown();
  const { tasks, saveTask, toggle, removeTask, restoreTask, clearDone, restoreMany } = useGaz();
  const [showDone, setShowDone] = useState(false);
  const [quick, setQuick] = useState("");
  const [sheet, setSheet] = useState(null); // { task? } while open
  const ThemeIcon = THEME_ICON[theme.mode];

  const open = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done).sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0));
  const today = todayIso();
  const dueSoon = open.filter((t) => t.due && t.due <= today).length;

  const addQuick = (e) => {
    e.preventDefault();
    const title = quick.trim();
    if (!title) return;
    saveTask({ title });
    setQuick("");
  };

  const del = (task) => {
    const index = removeTask(task.id);
    setSheet(null);
    snackbar.show({ message: `Deleted “${task.title}”`, actionLabel: "Undo", onAction: () => restoreTask(task, index) });
  };

  const clear = () => {
    const removed = clearDone();
    snackbar.show({ message: `Cleared ${removed.length} done task${removed.length === 1 ? "" : "s"}`, actionLabel: "Undo", onAction: () => restoreMany(removed) });
  };

  const row = (t) => {
    const late = !t.done && t.due && t.due < today;
    return (
      <li key={t.id} className="gz-row acc" style={{ "--hue": HUE }}>
        <button className={`gz-check state${t.done ? " is-done" : ""}`} aria-label={t.done ? "Mark as not done" : "Mark as done"} onClick={() => toggle(t.id)}>
          {t.done ? <CheckCircle2 size={26} /> : <Circle size={26} />}
        </button>
        <button className="gz-main state" onClick={() => setSheet({ task: t })}>
          <span className={`title-md${t.done ? " is-done" : ""}`}>{t.title}</span>
          <span className="gz-meta body-md muted">
            {t.askedBy && <span className="gz-who"><User size={14} />{t.askedBy}</span>}
            {t.due && <span className={late ? "gz-late" : ""}>{late ? "Overdue, " : ""}{t.due === today ? "Today" : fmtDate(t.due)}</span>}
          </span>
          {t.notes && !t.done && <span className="gz-notes body-md muted">{t.notes}</span>}
        </button>
      </li>
    );
  };

  return (
    <>
      <TopAppBar
        title="Easy Gaz Plus"
        leading={<IconButton label="Open menu" onClick={drawer.open}><Menu size={24} /></IconButton>}
        actions={<IconButton label={`Theme: ${theme.mode}. Switch to ${theme.next}`} onClick={theme.cycle}><ThemeIcon size={22} /></IconButton>}
      />
      <main className="gz-page acc" style={{ "--hue": HUE }}>
        <header className="gz-head">
          <p className="overline muted">{open.length} to do{dueSoon > 0 ? ` · ${dueSoon} due or overdue` : ""}</p>
          <h1 className="display">Easy Gaz Plus</h1>
        </header>

        <form onSubmit={addQuick} className="gz-quick">
          <TextField
            className="field-pill"
            label="Add a task"
            value={quick}
            onChange={(e) => setQuick(e.target.value)}
            leading={<Plus size={22} />}
            enterKeyHint="done"
            maxLength={160}
            autoComplete="off"
          />
        </form>

        {tasks.length > 0 && (
          <div className="gz-listbar">
            <WavyProgress value={done.length} total={tasks.length} label="Easy Gaz Plus progress" />
          </div>
        )}

        {open.length === 0 && (
          <EmptyState icon={<ListChecks size={48} />} title={tasks.length ? "All done" : "Nothing to do"}>
            {tasks.length ? "Nice. Everything here is finished." : "Type above the moment someone asks you for something, so you don’t forget it."}
          </EmptyState>
        )}

        {GROUPS.map(({ id, label }) => {
          const group = open.filter((t) => groupOf(t, today) === id).sort((a, b) => (a.due || "9999").localeCompare(b.due || "9999"));
          if (!group.length) return null;
          return (
            <section key={id} className="gz-group" aria-label={label}>
              <h3 className={`label-lg muted${id === "overdue" ? " gz-late" : ""}`}>{label} <span className="gz-count">{group.length}</span></h3>
              <ul className="gz-list-ul">{group.map(row)}</ul>
            </section>
          );
        })}

        {done.length > 0 && (
          <section className="gz-group" aria-label="Done">
            <div className="gz-donebar">
              <button className="gz-toggle state label-lg muted" aria-expanded={showDone} onClick={() => setShowDone((s) => !s)}>
                Done <span className="gz-count">{done.length}</span>
              </button>
              {showDone && <button className="gz-toggle state label-lg" onClick={clear}>Clear done</button>}
            </div>
            {showDone && <ul className="gz-list-ul">{done.map(row)}</ul>}
          </section>
        )}
      </main>

      <Fab className="gz-fab" icon={<Plus size={26} strokeWidth={2.6} />} label="New task" extended={!scrollingDown} onClick={() => setSheet({})} />

      {sheet && (
        <TaskSheet
          key={sheet.task?.id ?? "new"}
          task={sheet.task}
          onClose={() => setSheet(null)}
          onSave={(t) => { saveTask(t); setSheet(null); }}
          onDelete={() => del(sheet.task)}
        />
      )}
    </>
  );
}
