import OutfitsProvider from "./OutfitsProvider";
import OutfitsScreen from "./screens/OutfitsScreen";

/** The Outfits app: combine pieces from your Wardrobe into looks, by occasion. */
export default function OutfitsApp() {
  return (
    <OutfitsProvider>
      <OutfitsScreen />
    </OutfitsProvider>
  );
}
