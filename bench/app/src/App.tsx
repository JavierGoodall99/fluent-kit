// App shell: a tab bar that does not fit on a phone (#7). Pages are chosen by the URL hash.
import { Tab, TabList, makeStyles, tokens } from "@fluentui/react-components";
import { useEffect, useState } from "react";
import { ActivityLog } from "./pages/ActivityLog";
import { Billing } from "./pages/Billing";
import { Home } from "./pages/Home";
import { InvoiceForm } from "./pages/InvoiceForm";
import { Tenants } from "./pages/Tenants";

const PAGES = { home: ["Dashboard", Home], activity: ["Activiteitenlogboek", ActivityLog], tenants: ["Huurders", Tenants], billing: ["Facturatie", Billing], invoice: ["Nieuwe factuur", InvoiceForm] } as const;
type PageKey = keyof typeof PAGES;
const current = (): PageKey => { const h = window.location.hash.slice(1); return h in PAGES ? (h as PageKey) : "home"; };

const useStyles = makeStyles({
  bar: { display: "flex", alignItems: "center", gap: "16px", padding: "0 16px", height: "48px", whiteSpace: "nowrap", overflow: "hidden", borderBottom: `1px solid ${tokens.colorNeutralStroke2}` },
  name: { fontWeight: 600 },
});

export function App() {
  const s = useStyles();
  const [page, setPage] = useState<PageKey>(current);
  useEffect(() => { const on = () => setPage(current()); window.addEventListener("hashchange", on); return () => window.removeEventListener("hashchange", on); }, []);
  const Page = PAGES[page][1];
  return (
    <>
      <header className={s.bar}>
        <span className={s.name}>Huurdersportaal</span>
        <TabList selectedValue={page} onTabSelect={(_, d) => { window.location.hash = String(d.value); }}>
          {(Object.keys(PAGES) as PageKey[]).map((k) => <Tab key={k} value={k}>{PAGES[k][0]}</Tab>)}
        </TabList>
      </header>
      <main><Page /></main>
    </>
  );
}
