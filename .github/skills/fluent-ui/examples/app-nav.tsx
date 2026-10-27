// Collapsible side navigation (app shell sidebar).
// - Expanded: NavDrawer with a Hamburger toggle, NavItems with bundleIcon icons (filled when selected),
//   and a NavCategory when an item has sub-pages.
// - Collapsed: a 56px icon rail. Each item is a subtle Button with a Tooltip; the selected one is primary.
// - Under 1024px the drawer slides over the page and has a close button.
// - Router-agnostic: the page passes the selected value and handles navigation. Labels come from props, not hard-coded.
import {
  Button,
  Hamburger,
  NavCategory,
  NavCategoryItem,
  NavDrawer,
  NavDrawerBody,
  NavDrawerHeader,
  NavItem,
  NavSubItem,
  NavSubItemGroup,
  Text,
  Tooltip,
  makeStyles,
  mergeClasses,
  tokens,
} from "@fluentui/react-components";
import {
  Dismiss20Regular,
  Home20Filled,
  Home20Regular,
  People20Filled,
  People20Regular,
  Settings20Filled,
  Settings20Regular,
  bundleIcon,
} from "@fluentui/react-icons";
import { useEffect, useState, type ReactElement } from "react";

const HomeIcon = bundleIcon(Home20Filled, Home20Regular);
const PeopleIcon = bundleIcon(People20Filled, People20Regular);
const SettingsIcon = bundleIcon(Settings20Filled, Settings20Regular);

export interface NavEntry {
  value: string;
  label: string;
  icon: ReactElement;
  /** Sub-pages. The item becomes a NavCategory; in the collapsed rail it opens the first sub-page. */
  children?: { value: string; label: string }[];
}

interface AppNavProps {
  items: NavEntry[];
  selectedValue: string;
  onNavigate: (value: string) => void;
  /** App name shown in the header while expanded. */
  title: string;
  collapsed: boolean;
  onToggle: () => void;
  /** Narrow screens: the drawer is hidden until opened. */
  mobileOpen: boolean;
  onCloseMobile: () => void;
  labels: { expand: string; collapse: string; close: string };
}

const WIDE = "(min-width: 1024px)";

const useStyles = makeStyles({
  aside: {
    position: "fixed",
    top: 0,
    left: 0,
    height: "100vh",
    zIndex: 50,
    width: "260px",
    transform: "translateX(-100%)",
    transitionProperty: "transform, width, box-shadow",
    transitionDuration: tokens.durationSlow,
    transitionTimingFunction: tokens.curveEasyEase,
    [`@media ${WIDE}`]: { position: "relative", transform: "translateX(0)", flexShrink: 0 },
  },
  asideMobileOpen: { transform: "translateX(0)", boxShadow: tokens.shadow64, [`@media ${WIDE}`]: { boxShadow: "none" } },
  asideCollapsed: { [`@media ${WIDE}`]: { width: "56px" } },
  drawer: {
    height: "100%",
    width: "100%",
    minWidth: "100%",
    maxWidth: "100%",
    backgroundColor: tokens.colorNeutralBackground2,
    borderRightWidth: tokens.strokeWidthThin,
    borderRightStyle: "solid",
    borderRightColor: tokens.colorNeutralStroke2,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    columnGap: tokens.spacingHorizontalS,
    paddingTop: tokens.spacingVerticalM,
    paddingBottom: tokens.spacingVerticalS,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    whiteSpace: "nowrap",
    overflow: "hidden",
  },
  controls: { display: "flex", alignItems: "center", columnGap: tokens.spacingHorizontalXS },
  desktopOnly: { display: "none", [`@media ${WIDE}`]: { display: "inline-flex" } },
  mobileOnly: { [`@media ${WIDE}`]: { display: "none" } },
  rail: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    rowGap: tokens.spacingVerticalXS,
    paddingTop: tokens.spacingVerticalM,
    paddingBottom: tokens.spacingVerticalM,
    width: "100%",
    height: "100%",
    boxSizing: "border-box",
    backgroundColor: tokens.colorNeutralBackground2,
    borderRightWidth: tokens.strokeWidthThin,
    borderRightStyle: "solid",
    borderRightColor: tokens.colorNeutralStroke2,
  },
});

export function AppNav({ items, selectedValue, onNavigate, title, collapsed, onToggle, mobileOpen, onCloseMobile, labels }: AppNavProps) {
  const styles = useStyles();

  // Show labels only after the width transition has finished opening; hide them at once when closing.
  const [settledCollapsed, setSettledCollapsed] = useState(collapsed);
  useEffect(() => {
    const t = setTimeout(() => setSettledCollapsed(collapsed), collapsed ? 0 : 300);
    return () => clearTimeout(t);
  }, [collapsed]);
  const expanded = mobileOpen || (!collapsed && !settledCollapsed);

  const categoryOf = (value: string) => items.find((i) => i.children?.some((c) => c.value === value))?.value;
  // Start with the category of the selected page open; after that the user controls it.
  const [openCategories, setOpenCategories] = useState<string[]>(() => {
    const c = categoryOf(selectedValue);
    return c ? [c] : [];
  });

  const go = (value: string) => {
    onNavigate(value);
    onCloseMobile();
  };

  return (
    <aside className={mergeClasses(styles.aside, mobileOpen && styles.asideMobileOpen, collapsed && styles.asideCollapsed)}>
      {expanded ? (
        <NavDrawer
          open
          type="inline"
          size="small"
          className={styles.drawer}
          selectedValue={selectedValue}
          openCategories={openCategories}
          onNavItemSelect={(_, data) => go(data.value)}
          onNavCategoryItemToggle={(_, data) =>
            setOpenCategories((open) => (open.includes(data.value) ? open.filter((v) => v !== data.value) : [...open, data.value]))
          }
        >
          <NavDrawerHeader>
            <div className={styles.header}>
              <Text weight="semibold" size={400}>
                {title}
              </Text>
              <div className={styles.controls}>
                <Hamburger onClick={onToggle} aria-label={labels.collapse} className={styles.desktopOnly} />
                <Button appearance="subtle" icon={<Dismiss20Regular />} onClick={onCloseMobile} aria-label={labels.close} className={styles.mobileOnly} />
              </div>
            </div>
          </NavDrawerHeader>
          <NavDrawerBody>
            {items.map((item) =>
              item.children ? (
                <NavCategory key={item.value} value={item.value}>
                  <NavCategoryItem icon={item.icon}>{item.label}</NavCategoryItem>
                  <NavSubItemGroup>
                    {item.children.map((child) => (
                      <NavSubItem key={child.value} value={child.value}>
                        {child.label}
                      </NavSubItem>
                    ))}
                  </NavSubItemGroup>
                </NavCategory>
              ) : (
                <NavItem key={item.value} value={item.value} icon={item.icon}>
                  {item.label}
                </NavItem>
              ),
            )}
          </NavDrawerBody>
        </NavDrawer>
      ) : (
        <nav className={styles.rail}>
          <Hamburger onClick={onToggle} aria-label={labels.expand} />
          {items.map((item) => {
            const active = item.value === selectedValue || !!item.children?.some((c) => c.value === selectedValue);
            return (
              <Tooltip key={item.value} content={item.label} relationship="label" positioning="after">
                <Button
                  appearance={active ? "primary" : "subtle"}
                  icon={item.icon}
                  onClick={() => go(item.children?.[0].value ?? item.value)}
                  aria-label={item.label}
                  aria-current={active ? "page" : undefined}
                />
              </Tooltip>
            );
          })}
        </nav>
      )}
    </aside>
  );
}

// Example use. The page owns the state because the main content sits beside the nav.
// Replace the values with your routes and call your router in onNavigate.
export function AppNavExample() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selected, setSelected] = useState("home");
  const items: NavEntry[] = [
    { value: "home", label: "Home", icon: <HomeIcon /> },
    {
      value: "people",
      label: "People",
      icon: <PeopleIcon />,
      children: [
        { value: "users", label: "Users" },
        { value: "groups", label: "Groups" },
      ],
    },
    { value: "settings", label: "Settings", icon: <SettingsIcon /> },
  ];
  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <AppNav
        items={items}
        selectedValue={selected}
        onNavigate={setSelected}
        title="My app"
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        labels={{ expand: "Expand navigation", collapse: "Collapse navigation", close: "Close" }}
      />
      <main style={{ flex: 1, overflow: "auto" }}>{/* page content; a top bar with a Hamburger calls setMobileOpen(true) on narrow screens */}</main>
    </div>
  );
}
