// Renders every example in the skill with demo data, one per URL hash (#status-grid, #list-page, ...), so CI can open each
// one in a browser and check it the way verify checks an app. Typed against each example's own props: when an example
// changes its props, the type check fails here. Used by tests/render-examples.mjs only; never installed.
import { Card, Dropdown, FluentProvider, Option, Text, makeStaticStyles, makeStyles, tokens, webLightTheme } from "@fluentui/react-components";
import { useState, type ComponentProps, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { AppNavExample } from "../../.github/skills/fluent-ui/examples/app-nav";
import { ConfirmDeleteDialog } from "../../.github/skills/fluent-ui/examples/confirm-dialog";
import { Dashboard } from "../../.github/skills/fluent-ui/examples/dashboard";
import { EditDrawer } from "../../.github/skills/fluent-ui/examples/edit-drawer";
import { EmptyState } from "../../.github/skills/fluent-ui/examples/empty-state";
import { FormPage } from "../../.github/skills/fluent-ui/examples/form-page";
import { GalleryPage } from "../../.github/skills/fluent-ui/examples/gallery-page";
import { DataCards } from "../../.github/skills/fluent-ui/examples/data-card";
import { CustomerListPage } from "../../.github/skills/fluent-ui/examples/large-list";
import { ItemListPage } from "../../.github/skills/fluent-ui/examples/list-page";
import { LoadErrorBar } from "../../.github/skills/fluent-ui/examples/notifications";
import { SettingsPage } from "../../.github/skills/fluent-ui/examples/settings-page";
import { StatusGrid } from "../../.github/skills/fluent-ui/examples/status-grid";
import { TaskBoard } from "../../.github/skills/fluent-ui/examples/task-board";

const useGlobal = makeStaticStyles({ body: { margin: 0 } });
// The scrollbar rule the kit's generated provider sets (make-theme.mjs); audit AUD-18 keeps the two the same.
const useScrollbars = makeStaticStyles({
  html: { colorScheme: "light dark" },
  "*": { scrollbarWidth: "thin", scrollbarColor: `${tokens.colorNeutralStrokeAccessible} transparent` },
});
function Scrollbars() {
  useScrollbars();
  return null;
}
const usePage = makeStyles({
  page: { minHeight: "100vh", boxSizing: "border-box", padding: tokens.spacingHorizontalXL, backgroundColor: tokens.colorNeutralBackground2 },
});
function Page({ children }: { children: ReactNode }) {
  const s = usePage();
  return <div className={s.page}>{children}</div>;
}

const long = "HTTP 503 Service Unavailable from upstream ledger-db: connection pool exhausted (30 of 30 in use), request timed out after 5000 ms while writing the payment record.";
const groups: ComponentProps<typeof StatusGrid>["groups"] = [
  { id: "payments", name: "Payments", checks: [
    { id: "p1", name: "Create payment", status: "unhealthy", message: long },
    { id: "p2", name: "Read payment", status: "degraded", message: "p95 1840 ms is over the 800 ms threshold for 12 minutes." },
    { id: "p3", name: "Health", status: "healthy" },
  ] },
  { id: "search", name: "Search", checks: [{ id: "s1", name: "Query", status: "unknown", message: "No result for 26 minutes." }] },
  { id: "invoices", name: "Invoices", checks: [{ id: "i1", name: "List", status: "healthy" }, { id: "i2", name: "Create", status: "healthy" }] },
];
const items: ComponentProps<typeof ItemListPage>["items"] = Array.from({ length: 24 }, (_, i) => ({ id: String(i + 1), name: `Contract ${1000 + i} for a tenant with a long name`, status: i % 4 ? "Active" : "Inactive" }));
const tasks: ComponentProps<typeof TaskBoard>["initial"] = {
  todo: [{ id: "t1", title: "Check the April invoices", owner: "Sam", priority: "High", due: "2026-11-12" }, { id: "t2", title: "Update tenant list", owner: "Ana", priority: "Normal" }],
  doing: [{ id: "t3", title: "Migrate settings screen", owner: "Lee", priority: "Normal" }],
  done: [{ id: "t4", title: "Fix the export", owner: "Sam", priority: "Normal" }],
};
const noop = () => {};

// Fixtures that break the rules on purpose: tests/render-examples.mjs checks that verify reports each one. Never copy these.
const useBad = makeStyles({
  scroller: { height: "100px", overflowY: "auto" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: tokens.spacingHorizontalM },
  card: { padding: tokens.spacingHorizontalL, boxShadow: tokens.shadow4 },
});
function BadGrid() {
  const s = useBad();
  const lines = [2, 12, 4, 3, 3, 3]; // six cards, two rows: the first row is taller because of its content
  return <div className={s.grid}>{lines.map((n, i) => <Card key={i} className={s.card}><Text>{Array.from({ length: n }, (_, k) => `Line ${k + 1} of card ${i + 1}.`).join(" ")}</Text></Card>)}</div>;
}
function BadScrollbar() {
  const s = useBad();
  return <div className={s.scroller}>{Array.from({ length: 30 }, (_, i) => <Text key={i} block>{`Row ${i + 1}`}</Text>)}</div>;
}
function BadDropdown() {
  return (
    <Dropdown placeholder="Pick a customer" aria-label="Customer">
      {Array.from({ length: 200 }, (_, i) => <Option key={i}>{`Customer ${i + 1}`}</Option>)}
    </Dropdown>
  );
}
// Uneven content on purpose: a card with 40 rows next to cards with 3, and one with long labels. They must stay one size.
const rowsOf = (n: number) => Array.from({ length: n }, (_, i) => ({ label: `Team ${i + 1}`, value: i % 7 === 3 ? null : 1200 * (i + 1) + i }));
const dataCards: ComponentProps<typeof DataCards>["cards"] = [
  { title: "Tickets by team", description: "Open tickets, all teams", rows: rowsOf(40) },
  { title: "Escalations", description: "Last 30 days", rows: rowsOf(3) },
  { title: "Slowest customers", description: "Median resolution time in hours", rows: [{ label: "Acme Industrial Holdings International (Europe, Middle East and Africa) B.V.", value: 412 }, { label: "Contoso", value: 38 }, { label: "Northwind Traders", value: 7 }] },
];

function Overlay({ kind }: { kind: "drawer" | "dialog" }) {
  const [open, setOpen] = useState(true);
  return kind === "drawer"
    ? <EditDrawer open={open} onClose={() => setOpen(false)} onSave={() => setOpen(false)} />
    : <ConfirmDeleteDialog open={open} count={3} onOpenChange={setOpen} onConfirm={() => setOpen(false)} />;
}

const DEMOS: Record<string, () => ReactNode> = {
  "app-nav": () => <AppNavExample />,
  "bad-dropdown": () => <Page><BadDropdown /></Page>,
  "bad-grid": () => <Page><BadGrid /></Page>,
  "bad-scrollbar": () => <Page><BadScrollbar /></Page>,
  "confirm-dialog": () => <Page><Overlay kind="dialog" /></Page>,
  "dashboard": () => <Page><Dashboard /></Page>,
  "data-card": () => <Page><DataCards cards={dataCards} /></Page>,
  "edit-drawer": () => <Page><Overlay kind="drawer" /></Page>,
  "empty-state": () => <Page><EmptyState title="No invoices yet" description="Invoices you create or import show up here." primary={{ label: "New invoice", onClick: noop }} secondary={{ label: "Import", onClick: noop }} tertiary={{ label: "Learn more", href: "#empty-state" }} /></Page>,
  "form-page": () => <Page><FormPage /></Page>,
  "gallery-page": () => <Page><GalleryPage /></Page>,
  "large-list": () => <Page><CustomerListPage /></Page>,
  "list-page": () => <Page><ItemListPage items={items} /></Page>,
  "notifications": () => <Page><LoadErrorBar message="The invoices could not be loaded. Check your connection and try again." /></Page>,
  "settings-page": () => <Page><SettingsPage initial={{ language: "en", email: true, autoStart: false }} /></Page>,
  "status-grid": () => <Page><StatusGrid groups={groups} /></Page>,
  "task-board": () => <Page><TaskBoard initial={tasks} /></Page>,
};
export const EXAMPLES = Object.keys(DEMOS);

function App() {
  useGlobal();
  const name = window.location.hash.slice(1);
  const demo = DEMOS[name];
  return demo ? <>{!name.startsWith("bad-scrollbar") && <Scrollbars />}{demo()}</> : <p>Unknown example: {name}</p>;
}
const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<FluentProvider theme={webLightTheme}><App /></FluentProvider>);
  window.addEventListener("hashchange", () => window.location.reload());
}
