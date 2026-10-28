# Pattern: app shell and navigation

Move between the main sections of the app. Example: `examples/app-nav.tsx`.

**Shell**
- Left `NavDrawer` (the project's app shell first, if it has one), a slim top header with the app name, an organisation or environment selector if the app needs one, and the user `Persona`.
- Content to the right on `colorNeutralBackground2`; each page starts with its title and command bar.
- Breadcrumbs only inside nested pages, never as the main navigation. `TabList` for a few closely related views of one page.

**Nav measurements**
- 260px wide expanded, 56px icon rail collapsed. Items 40px high, 2px apart, 20px icon, 14px text.
- Selected item: a 4px by 20px rounded brand bar at the left edge, a filled icon (`bundleIcon(XFilled, XRegular)`), semibold text.
- Stock `NavItem` is near-black when selected. Override: `colorSubtleBackground` at rest, `colorSubtleBackgroundHover` on hover, `colorSubtleBackgroundSelected` when selected.
- One level of nesting (`NavCategory` with `NavSubItem`); deeper hierarchies use a `Tree` in the page.
- Global actions (theme, help, sign out) in `NavDrawerFooter`, left-aligned with the items: the `Button` needs `justifyContent: flex-start`, the item padding and regular weight.

**Behaviour**
- Collapse with a `Hamburger`. The rail shows icon buttons with a `Tooltip` and `aria-label` each; the active one is marked `aria-current="page"`.
- Set `surfaceMotion={null}` on `NavDrawer` when the wrapper animates width or position, or it slides twice. Use `durationSlow` and `curveEasyEase`, and respect `prefers-reduced-motion`.
- Items with an `href` are real links: Ctrl or Cmd-click opens a new tab.
- Wide screens: the nav is sticky while the page scrolls.

**Narrow (under 1024px)**
- The nav is hidden (`visibility: hidden`, out of the tab order) until opened; it slides over the page with `shadow64` and a close button.
- A top bar inside `<header>` holds a `Hamburger` that opens it and the page title.
- Choosing an item closes the drawer. Tabs and toolbars that could clip go into `Overflow` with a "..." menu.
