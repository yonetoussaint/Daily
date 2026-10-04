import { Moon, Sun, SunMoon } from "lucide-react";
import { IconButton, TopAppBar } from "../design/components";
import { cookie } from "../design/shapes";
import { APPS } from "./apps";
import { useNav } from "./NavProvider";
import { useTheme } from "./useTheme";
import "./Launcher.css";

const THEME_ICON = { auto: SunMoon, light: Sun, dark: Moon };
const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
const LOBES = [12, 8, 10, 9];

/** Home screen: one tile per app. Everything in Daily starts here. */
export default function Launcher() {
  const { goApp } = useNav();
  const theme = useTheme();
  const ThemeIcon = THEME_ICON[theme.mode];

  return (
    <>
      <TopAppBar
        title="Daily"
        actions={
          <IconButton label={`Theme: ${theme.mode}. Switch to ${theme.next}`} onClick={theme.cycle}>
            <ThemeIcon size={22} />
          </IconButton>
        }
      />
      <main className="launcher">
        <header className="launcher-head">
          <p className="overline muted">{today}</p>
          <h1 className="display">Daily</h1>
          <p className="body-lg muted">Pick an app to get started.</p>
        </header>

        <nav className="launcher-grid" aria-label="Apps">
          {APPS.map(({ id, label, description, icon: Icon, hue }, i) => (
            <button key={id} type="button" className="launcher-tile acc state" style={{ "--hue": hue }} onClick={() => goApp(id)}>
              <span className="launcher-icon" style={{ clipPath: cookie(LOBES[i % LOBES.length], 0.075) }}>
                <Icon size={30} />
              </span>
              <span className="launcher-text">
                <span className="title-lg">{label}</span>
                <span className="body-md">{description}</span>
              </span>
            </button>
          ))}
        </nav>
      </main>
    </>
  );
}
