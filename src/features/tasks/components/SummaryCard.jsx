import { cookie } from "../../../design/shapes";
import { WavyProgress } from "../../../design/components";

function headline({ done, total }) {
  if (total === 0) return "Nothing planned yet";
  if (done === total) return "All caught up";
  return `${done} of ${total} done`;
}

function subline({ done, total }, scope) {
  if (total === 0) return `Add a task to get ${scope} started.`;
  if (done === total) return "Every task is ticked off. Nice work.";
  const left = total - done;
  return `${left} ${left === 1 ? "task" : "tasks"} to go in ${scope}.`;
}

/** Hero progress card: spinning scalloped percentage badge + wavy progress. */
export default function SummaryCard({ stats, scope }) {
  const pct = stats.total === 0 ? 0 : Math.round((stats.done / stats.total) * 100);
  return (
    <section className="hero" aria-label="Progress">
      <div className="hero-row">
        <div className="hero-badge">
          <span className="hero-badge-bg" style={{ clipPath: cookie(12, 0.075) }} />
          <span className="hero-badge-text">{pct}<small>%</small></span>
        </div>
        <div className="hero-text">
          <h2 className="title-lg">{headline(stats)}</h2>
          <p className="body-md">{subline(stats, scope)}</p>
        </div>
      </div>
      <WavyProgress value={stats.done} total={stats.total} label="Tasks completed" />
    </section>
  );
}
