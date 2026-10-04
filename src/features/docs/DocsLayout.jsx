import { Outlet } from "react-router-dom";
import DocsProvider from "./DocsProvider";

/** Route wrapper for everything under /docs: shares the library between the list and the editor. */
export default function DocsLayout() {
  return (
    <DocsProvider>
      <Outlet />
    </DocsProvider>
  );
}
