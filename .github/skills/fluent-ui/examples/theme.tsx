// PLACEHOLDER theme (Microsoft's default blue ramp). A real project generates its own: see tasks/new-app.md
// (node .fluent-kit/scripts/make-theme.mjs <#hex|stock> --out src/theme.tsx). The theme file is the one place raw hex is allowed.
import {
  type BrandVariants,
  createDarkTheme,
  createLightTheme,
  FluentProvider,
  type Theme,
} from "@fluentui/react-components";
import { useSyncExternalStore, type ReactNode } from "react";

const brand: BrandVariants = {
  10: "#061724", 20: "#082338", 30: "#0a2e4a", 40: "#0c3b5e",
  50: "#0e4775", 60: "#0f548c", 70: "#115ea3", 80: "#0f6cbd",
  90: "#2886de", 100: "#479ef5", 110: "#62abf5", 120: "#77b7f7",
  130: "#96c6fa", 140: "#b4d6fa", 150: "#cfe4fa", 160: "#ebf3fc",
};

// Do not override fonts, radii or shadows here. Only the ramp varies.
const lightTheme: Theme = createLightTheme(brand);
const darkTheme: Theme = createDarkTheme(brand);

function subscribeDark(onChange: () => void) {
  const query = window.matchMedia("(prefers-color-scheme: dark)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function useSystemDark(): boolean {
  // false on the server and during hydration, so the markup matches
  return useSyncExternalStore(
    subscribeDark,
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
    () => false,
  );
}

export function AppProvider({ children }: { children: ReactNode }) {
  const dark = useSystemDark();
  return <FluentProvider theme={dark ? darkTheme : lightTheme}>{children}</FluentProvider>;
}
