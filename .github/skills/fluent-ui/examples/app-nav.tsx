// App shell navigation skeleton: NavDrawer (260px) that collapses to a 56px icon rail, and slides over the page under 1024px.
// Rules and measurements: patterns/nav.md. Router-agnostic: the page passes the selected value and handles navigation.
// Sub-pages: NavCategory / NavSubItem (one level). A global action (theme, help) goes in NavDrawerFooter as a
// left-aligned subtle Button (justifyContent: flex-start). UI text: use the project's language.
import {
  Button, Hamburger, NavDrawer, NavDrawerBody, NavDrawerHeader, NavItem, Text, Tooltip,
  makeStyles, mergeClasses, tokens,
} from "@fluentui/react-components";
import { Dismiss20Regular, Home20Filled, Home20Regular, Settings20Filled, Settings20Regular, bundleIcon } from "@fluentui/react-icons";
import { useState, type MouseEvent, type ReactElement } from "react";

export interface NavEntry { value: string; label: string; icon: ReactElement; href?: string }

const WIDE = "@media (min-width: 1024px)";

const useStyles = makeStyles({
  aside: {
    position: "fixed", top: 0, left: 0, zIndex: 50, height: "100vh", width: "260px",
    transform: "translateX(-100%)", visibility: "hidden", // closed on narrow screens: out of the tab order, not just off-screen
    transitionProperty: "transform, width, visibility", transitionDuration: tokens.durationSlow, transitionTimingFunction: tokens.curveEasyEase,
    "@media (prefers-reduced-motion: reduce)": { transitionDuration: "0.01ms" },
    [WIDE]: { position: "sticky", alignSelf: "flex-start", transform: "none", visibility: "visible", flexShrink: 0 },
  },
  open: { transform: "none", visibility: "visible", boxShadow: tokens.shadow64, [WIDE]: { boxShadow: "none" } },
  collapsed: { [WIDE]: { width: "56px" } },
  surface: {
    height: "100%", width: "100%", minWidth: "100%", boxSizing: "border-box", backgroundColor: tokens.colorNeutralBackground2,
    borderRight: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
  },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalM} ${tokens.spacingVerticalS}` },
  // Stock NavItem is near-black when selected: blend items into the drawer instead.
  item: {
    backgroundColor: tokens.colorSubtleBackground,
    ":hover": { backgroundColor: tokens.colorSubtleBackgroundHover },
    "&[aria-current=page]": { backgroundColor: tokens.colorSubtleBackgroundSelected },
  },
  wideOnly: { display: "none", [WIDE]: { display: "inline-flex" } },
  narrowOnly: { [WIDE]: { display: "none" } },
  rail: { display: "flex", flexDirection: "column", alignItems: "center", rowGap: tokens.spacingVerticalXS, paddingTop: tokens.spacingVerticalM, paddingBottom: tokens.spacingVerticalM },
});

export function AppNav({ items, selectedValue, onNavigate, title, collapsed, onToggle, mobileOpen, onCloseMobile }: {
  items: NavEntry[]; selectedValue: string; onNavigate: (value: string) => void; title: string;
  collapsed: boolean; onToggle: () => void; mobileOpen: boolean; onCloseMobile: () => void;
}) {
  const s = useStyles();
  const expanded = mobileOpen || !collapsed;
  const go = (value: string) => { onNavigate(value); onCloseMobile(); };
  // Plain click navigates in place; Ctrl/Cmd-click falls through so the browser opens a new tab.
  const onLink = (value: string) => (e: MouseEvent<HTMLElement>) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    go(value);
  };

  return (
    <aside className={mergeClasses(s.aside, mobileOpen && s.open, collapsed && s.collapsed)}>
      {expanded ? (
        <NavDrawer open type="inline" className={s.surface} surfaceMotion={null} selectedValue={selectedValue} onNavItemSelect={(_, d) => go(d.value)}>
          <NavDrawerHeader>
            <div className={s.header}>
              <Text weight="semibold" size={400}>{title}</Text>
              <Hamburger onClick={onToggle} aria-label="Collapse navigation" className={s.wideOnly} />
              <Button appearance="subtle" icon={<Dismiss20Regular />} onClick={onCloseMobile} aria-label="Close" className={s.narrowOnly} />
            </div>
          </NavDrawerHeader>
          <NavDrawerBody>
            {items.map((item) => (
              <NavItem key={item.value} value={item.value} icon={item.icon} href={item.href} onClick={item.href ? onLink(item.value) : undefined} className={s.item}>
                {item.label}
              </NavItem>
            ))}
          </NavDrawerBody>
        </NavDrawer>
      ) : (
        <nav className={mergeClasses(s.surface, s.rail)}>
          <Hamburger onClick={onToggle} aria-label="Expand navigation" />
          {items.map((item) => (
            <Tooltip key={item.value} content={item.label} relationship="label" positioning="after">
              <Button
                appearance={item.value === selectedValue ? "primary" : "subtle"}
                icon={item.icon}
                {...(item.href ? { as: "a" as const, href: item.href } : {})}
                onClick={item.href ? onLink(item.value) : () => go(item.value)}
                aria-label={item.label}
                aria-current={item.value === selectedValue ? "page" : undefined}
              />
            </Tooltip>
          ))}
        </nav>
      )}
    </aside>
  );
}

const HomeIcon = bundleIcon(Home20Filled, Home20Regular);
const SettingsIcon = bundleIcon(Settings20Filled, Settings20Regular);

const useShell = makeStyles({ shell: { display: "flex", minHeight: "100vh" }, main: { flexGrow: 1, minWidth: 0 } });

// The page owns the state because the content sits beside the nav. On narrow screens put a top bar with a
// Hamburger (setMobileOpen(true)) inside a <header> in <main>.
export function AppNavExample() {
  const s = useShell();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selected, setSelected] = useState("home");
  const items: NavEntry[] = [
    { value: "home", label: "Home", href: "/", icon: <HomeIcon /> },
    { value: "settings", label: "Settings", href: "/settings", icon: <SettingsIcon /> },
  ];
  return (
    <div className={s.shell}>
      <AppNav items={items} selectedValue={selected} onNavigate={setSelected} title="My app" collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <main className={s.main}>{/* page content */}</main>
    </div>
  );
}
