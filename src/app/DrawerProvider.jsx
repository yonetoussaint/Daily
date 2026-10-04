import { createContext, useCallback, useContext, useMemo, useState } from "react";
import AppDrawer from "./AppDrawer";

const DrawerContext = createContext({ open: () => {} });
export const useDrawer = () => useContext(DrawerContext);

/** Owns the open/closed state of the app drawer; rendered once so every app can open it. */
export default function DrawerProvider({ children }) {
  const [isOpen, setOpen] = useState(false);
  const open = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);
  const value = useMemo(() => ({ open, close, isOpen }), [open, close, isOpen]);

  return (
    <DrawerContext.Provider value={value}>
      {children}
      <AppDrawer open={isOpen} onClose={close} />
    </DrawerContext.Provider>
  );
}
