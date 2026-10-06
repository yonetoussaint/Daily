import WardrobeProvider from "./WardrobeProvider";
import WardrobeScreen from "./screens/WardrobeScreen";

/** The Wardrobe app: every piece of clothing you own, sorted by category, with JSON import and export. */
export default function WardrobeApp() {
  return (
    <WardrobeProvider>
      <WardrobeScreen />
    </WardrobeProvider>
  );
}
