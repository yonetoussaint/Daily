import { CloudOff } from "lucide-react";
import { Button, EmptyState } from "../design/components";
import { useNav } from "../app/NavProvider";

/** Shows a loading note or a retry screen until an app's data has come from the database. */
export default function SyncGate({ status, onRetry, children }) {
  const { goApp } = useNav();
  if (status === "ready") return children;
  if (status === "error") {
    return (
      <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 24 }}>
        <EmptyState
          icon={<CloudOff size={52} />}
          title="Couldn’t reach the database"
          action={<><Button onClick={onRetry}>Try again</Button> <Button variant="text" onClick={() => goApp("launcher")}>Home</Button></>}
        >
          Check your connection (and that the SQL setup has been run), then try again.
        </EmptyState>
      </main>
    );
  }
  return (
    <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center" }}>
      <p className="body-lg muted" role="status">Loading…</p>
    </main>
  );
}
