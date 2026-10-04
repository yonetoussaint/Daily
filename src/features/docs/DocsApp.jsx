import { useNav } from "../../app/NavProvider";
import DocsProvider from "./DocsProvider";
import LibraryScreen from "./screens/LibraryScreen";
import BookScreen from "./screens/BookScreen";

/** The Docs app: shares the library between the list and the editor, shows one or the other. */
export default function DocsApp() {
  const { bookId } = useNav();
  return (
    <DocsProvider>
      {bookId ? <BookScreen /> : <LibraryScreen />}
    </DocsProvider>
  );
}
