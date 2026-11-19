// Renders every example in the skill with demo data, one per URL hash (#status-grid, #list-page, ...), so CI can open each
// one in a browser and check it the way verify checks an app. Typed against each example's own props: when an example
// changes its props, the type check fails here. Used by tests/render-examples.mjs only; never installed.
import { Badge, Button, Card, Dropdown, FluentProvider, Input, Link, Option, Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow, Text, makeStaticStyles, makeStyles, tokens, webDarkTheme, webLightTheme } from "@fluentui/react-components";
import { useState, type ComponentProps, type ReactNode } from "react";
import { ArrowDownload20Regular, ArrowSync20Regular, Filter20Regular, Print20Regular, Settings20Regular } from "@fluentui/react-icons";
import { createRoot } from "react-dom/client";
import { AppNavExample } from "../../.github/skills/fluent-ui/examples/app-nav";
import { ConfirmDeleteDialog } from "../../.github/skills/fluent-ui/examples/confirm-dialog";
import { Dashboard } from "../../.github/skills/fluent-ui/examples/dashboard";
import { EditDrawer } from "../../.github/skills/fluent-ui/examples/edit-drawer";
import { EmptyState } from "../../.github/skills/fluent-ui/examples/empty-state";
import { FormPage } from "../../.github/skills/fluent-ui/examples/form-page";
import { GalleryPage } from "../../.github/skills/fluent-ui/examples/gallery-page";
import { CommandBar } from "../../.github/skills/fluent-ui/examples/command-bar";
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
  item: { paddingBlock: tokens.spacingVerticalXS }, // index links 28px apart, so each keeps its 24px target
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
  // Six cards, two rows at 1440px: the first row is taller because of its content. Every card wraps to at least 3 lines in
  // any font, so none drops under the probe's 60px floor (3 short lines fit on one line with CI's fonts, F-69).
  const lines = [6, 12, 6, 6, 6, 6];
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
function BadClip() {
  return <Card style={{ width: 120 }}><Text size={600}>€&nbsp;1.234.567.890</Text></Card>; // a figure wider than its card
}
// A table squeezed into a narrow box: its cells keep one line, so the text runs over the next cell (bench run #4, F-72).
const cols = ["Tijdstip", "Gebeurtenis", "Gebruiker", "Huurder"];
function BadTable({ width, scroll }: { width: number; scroll?: boolean }) {
  const table = (
    <Table style={scroll ? { minWidth: 900 } : undefined}>
      <TableHeader><TableRow>{cols.map((c) => <TableHeaderCell key={c}>{c}</TableHeaderCell>)}</TableRow></TableHeader>
      <TableBody>{[1, 2, 3].map((i) => <TableRow key={i}>{["16-11-2026 11:00", "SYNC_OK_DONE", "m.jansen", "WoonstichtingDeLinde"].map((v) => <TableCell key={v} style={{ whiteSpace: "nowrap" }}>{v}</TableCell>)}</TableRow>)}</TableBody>
    </Table>
  );
  return <div style={{ width, overflowX: scroll ? "auto" : undefined }}>{table}</div>;
}
// Five text buttons that wrap into ragged rows on a phone (bench #6, F-81), and a hint longer than its box (bench #5, F-82).
function BadToolbar() {
  return <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{["Alles synchroniseren", "Filteren op status", "Exporteren naar Excel", "Afdrukken", "Instellingen"].map((l) => <Button key={l}>{l}</Button>)}</div>;
}
// Rows whose status badge has no fixed width: the cells before it shift on every row (bench #6, 1.10d, F-88).
function BadColumns() {
  const rows = [["Woonstichting De Linde", "Utrecht", "Gekoppeld"], ["Stichting Eigen Haard", "Amsterdam", "Fout bij synchroniseren"], ["Woonbedrijf Noord", "Groningen", "Niet ingesteld"]];
  return <div>{rows.map(([n, c, b]) => <div key={n} style={{ display: "flex", gap: 16, padding: 8 }}><span style={{ flexGrow: 1 }}>{n}</span><span style={{ width: 120 }}>{c}</span><Badge>{b}</Badge><span style={{ width: 100 }} /></div>)}</div>;
}
// A cell squeezed with overflow-wrap "anywhere": the tenant name breaks inside the word (bench #4, 1.10e, F-91).
function BadBrokenWord() {
  return <Table style={{ width: 300 }}><TableBody><TableRow><TableCell>16-11-2026</TableCell><TableCell style={{ overflowWrap: "anywhere", width: 70 }}>Woonstichting De Linde</TableCell></TableRow></TableBody></Table>;
}
// Bench #5, 1.10f: badges that wrap inside their pill, and a tenant column cut with "…" on every row (F-94).
function BadPill() {
  return <div style={{ width: 90 }}><Badge appearance="tint">Synchronisatie geslaagd</Badge></div>;
}
const ellipsis = { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 80 } as const;
function BadCutColumn() {
  return <Table style={{ width: 330 }}><TableBody>{["Woonstichting De Linde", "Stichting Eigen Haard", "Wooncorporatie Zuid"].map((t) => <TableRow key={t}><TableCell>16 nov 2026</TableCell><TableCell>Inloggen</TableCell><TableCell><div style={ellipsis}>{t}</div></TableCell></TableRow>)}</TableBody></Table>;
}
function BadPlaceholder() {
  return <Input style={{ width: 140 }} placeholder="Zoek op gebruiker of huurder" aria-label="Zoeken" />;
}
// Five actions, as on the bench app's tenant page: on a phone, the bar keeps one line and the rest go in "...".
function CommandBarDemo() {
  const [q, setQ] = useState("");
  const actions = [["sync", "Sync all", <ArrowSync20Regular />], ["filter", "Filter by status", <Filter20Regular />], ["export", "Export to Excel", <ArrowDownload20Regular />], ["print", "Print", <Print20Regular />], ["settings", "Settings", <Settings20Regular />]] as const;
  return <><Text as="h1" size={600} weight="semibold">Tenants</Text><CommandBar query={q} onQuery={setQ} actions={actions.map(([id, label, icon]) => ({ id, label, icon }))} /></>;
}
function BadLinks() {
  return <div>{["Edit", "Copy", "Delete"].map((l) => <div key={l}><Link href={`#${l}`}>{l}</Link></div>)}</div>; // stacked, 20px apart
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
  "bad-links": () => <Page><BadLinks /></Page>,
  "bad-clip": () => <Page><BadClip /></Page>,
  "bad-spill": () => <Page><BadTable width={300} /></Page>,
  "bad-wide-table": () => <Page><BadTable width={320} scroll /></Page>,
  "bad-toolbar": () => <Page><BadToolbar /></Page>,
  "bad-placeholder": () => <Page><BadPlaceholder /></Page>,
  "bad-columns": () => <Page><BadColumns /></Page>,
  "bad-broken-word": () => <Page><BadBrokenWord /></Page>,
  "bad-pill": () => <Page><BadPill /></Page>,
  "bad-cut-column": () => <Page><BadCutColumn /></Page>,
  "confirm-dialog": () => <Page><Overlay kind="dialog" /></Page>,
  "command-bar": () => <Page><CommandBarDemo /></Page>,
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

// No hash: the gallery's index page (tests/build-gallery.mjs publishes this bundle), one link per example in each theme.
const dark = new URLSearchParams(window.location.search).has("dark");
function Index() {
  const s = usePage();
  return (
    <main className={s.page}>
      <Text as="h1" size={600} weight="semibold" block>Fluent kit examples</Text>
      <Text block>What agents copy when they build a page with the kit. Each example in the light and the dark theme.</Text>
      <ul>{EXAMPLES.filter((n) => !n.startsWith("bad-")).map((n) => <li key={n} className={s.item}><Link href={`?#${n}`}>{n}</Link> (<Link href={`?dark#${n}`}>dark</Link>)</li>)}</ul>
    </main>
  );
}
function App() {
  useGlobal();
  const name = window.location.hash.slice(1);
  const demo = DEMOS[name];
  return demo ? <>{!name.startsWith("bad-scrollbar") && <Scrollbars />}{demo()}</> : name ? <p>Unknown example: {name}</p> : <Index />;
}
const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<FluentProvider theme={dark ? webDarkTheme : webLightTheme}><App /></FluentProvider>);
  window.addEventListener("hashchange", () => window.location.reload());
}
