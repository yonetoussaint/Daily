import { useMemo, useState } from "react";
import { Menu, Moon, Plus, RefreshCw, Sun, SunMoon } from "lucide-react";
import { ButtonGroup, Fab, IconButton, TopAppBar, useScrollingDown, useSnackbar } from "../../../design/components";
import { useDrawer } from "../../../app/DrawerProvider";
import { useTheme } from "../../../app/useTheme";
import { useValues } from "../ValuesProvider";
import { reminders } from "../model";
import { JournalTab, PrinciplesTab, TABS, ValuesTab } from "../components/Tabs";
import EntrySheet from "../components/EntrySheet";

const THEME_ICON = { auto: SunMoon, light: Sun, dark: Moon };
const FAB = { values: ["value", "New value"], principles: ["principle", "New principle"], journal: ["reflection", "New entry"] };
const SHEET_KIND = { values: "value", principles: "principle", journal: "reflection" };
const dayNumber = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 6e4) / 864e5);

export default function ValuesScreen() {
  const drawer = useDrawer();
  const theme = useTheme();
  const snackbar = useSnackbar();
  const scrollingDown = useScrollingDown();
  const data = useValues();
  const { values, principles, reflections, save, remove, restore } = data;
  const [tab, setTab] = useState("values");
  const [sheet, setSheet] = useState(null); // { kind, item? }
  const [skip, setSkip] = useState(0);
  const ThemeIcon = THEME_ICON[theme.mode];
  const [fabKind, fabLabel] = FAB[tab];

  const pool = useMemo(() => reminders({ values, principles }), [values, principles]);
  const today = pool.length ? pool[(dayNumber() + skip) % pool.length] : null;

  const del = (kind, item) => {
    const index = remove(kind, item.id);
    setSheet(null);
    snackbar.show({ message: `Deleted “${item.title}”`, actionLabel: "Undo", onAction: () => restore(kind, item, index) });
  };

  return (
    <>
      <TopAppBar
        title="Values"
        leading={<IconButton label="Open menu" onClick={drawer.open}><Menu size={24} /></IconButton>}
        actions={<IconButton label={`Theme: ${theme.mode}. Switch to ${theme.next}`} onClick={theme.cycle}><ThemeIcon size={22} /></IconButton>}
      />
      <main className="vals-page">
        <header className="vals-head">
          <p className="overline muted">{values.length} value{values.length === 1 ? "" : "s"} · {principles.length} principle{principles.length === 1 ? "" : "s"}</p>
          <h1 className="display">Values</h1>
        </header>

        {today && (
          <section className="vals-today acc" style={{ "--hue": today.hue }} aria-label="Reminder for today">
            <p className="overline">Today’s reminder · {today.label}</p>
            <h2 className="headline">{today.title}</h2>
            {today.body && <p className="body-lg">{today.body}</p>}
            <IconButton label="Show another reminder" className="vals-shuffle" onClick={() => setSkip((s) => s + 1)}><RefreshCw size={20} /></IconButton>
          </section>
        )}

        <ButtonGroup label="Section" value={tab} onChange={setTab} options={TABS} className="vals-tabs" />

        {tab === "values" && <ValuesTab values={values} reflections={reflections} onOpen={(item) => setSheet({ kind: "value", item })} />}
        {tab === "principles" && <PrinciplesTab principles={principles} values={values} onOpen={(item) => setSheet({ kind: "principle", item })} />}
        {tab === "journal" && <JournalTab reflections={reflections} values={values} onOpen={(item) => setSheet({ kind: "reflection", item })} />}
      </main>

      <Fab className="vals-fab" icon={<Plus size={26} strokeWidth={2.6} />} label={fabLabel} extended={!scrollingDown} onClick={() => setSheet({ kind: fabKind })} />

      {sheet && (
        <EntrySheet
          key={sheet.item?.id ?? `new-${sheet.kind}`}
          kind={sheet.kind}
          item={sheet.item}
          values={values}
          onClose={() => setSheet(null)}
          onSave={(item) => { save(sheet.kind, item); setSheet(null); }}
          onDelete={() => del(sheet.kind, sheet.item)}
        />
      )}
    </>
  );
}
