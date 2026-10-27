// Side navigation: filled icon when active, regular otherwise (bundleIcon).
import {
  Hamburger,
  NavDrawer,
  NavDrawerBody,
  NavDrawerHeader,
  NavItem,
} from "@fluentui/react-components";
import { Home24Filled, Home24Regular, Settings24Filled, Settings24Regular, bundleIcon } from "@fluentui/react-icons";
import { useState } from "react";

const HomeIcon = bundleIcon(Home24Filled, Home24Regular);
const SettingsIcon = bundleIcon(Settings24Filled, Settings24Regular);

export function AppNav() {
  const [selected, setSelected] = useState("home");
  return (
    <NavDrawer
      open
      type="inline"
      selectedValue={selected}
      onNavItemSelect={(_, data) => setSelected(data.value)}
    >
      <NavDrawerHeader>
        <Hamburger aria-label="Expand or collapse navigation" />
      </NavDrawerHeader>
      <NavDrawerBody>
        <NavItem value="home" icon={<HomeIcon />}>
          Home
        </NavItem>
        <NavItem value="settings" icon={<SettingsIcon />}>
          Settings
        </NavItem>
      </NavDrawerBody>
    </NavDrawer>
  );
}
