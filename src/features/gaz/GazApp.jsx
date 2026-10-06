import GazProvider from "./GazProvider";
import GazScreen from "./screens/GazScreen";

/** Easy Gaz Plus: a quick to-do list for the work you're asked to do there. */
export default function GazApp() {
  return (
    <GazProvider>
      <GazScreen />
    </GazProvider>
  );
}
