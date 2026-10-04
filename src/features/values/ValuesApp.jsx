import ValuesProvider from "./ValuesProvider";
import ValuesScreen from "./screens/ValuesScreen";

/** The Values app: what matters to me, the rules I live by, and a journal of how it went. */
export default function ValuesApp() {
  return (
    <ValuesProvider>
      <ValuesScreen />
    </ValuesProvider>
  );
}
