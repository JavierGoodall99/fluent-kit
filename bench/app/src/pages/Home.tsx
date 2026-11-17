// Home: KPI cards and recent activity. Deliberately rough (fixed colours, margins, no empty or narrow-screen handling) for prompt #4.
import { Card, Text, makeStyles, tokens } from "@fluentui/react-components";
import { eventCounts, events, invoiceTotals, invoices, tenants } from "../data";

const useStyles = makeStyles({
  page: { padding: "24px", backgroundColor: tokens.colorNeutralBackground2, minHeight: "100vh" },
  title: { fontSize: "28px", fontWeight: 700, marginBottom: "18px", display: "block", color: "#242424" },
  row: { display: "flex", gap: "14px", marginBottom: "22px" },
  kpiCard: { borderRadius: tokens.borderRadiusXLarge, boxShadow: tokens.shadow4, padding: "16px", width: "220px" },
  kpiValue: { fontSize: "32px", fontWeight: 600, color: "#0f6cbd" },
  kpiLabel: { color: "#616161", fontSize: "12px" },
  recentCard: { borderRadius: tokens.borderRadiusXLarge, boxShadow: tokens.shadow4, padding: "16px" },
  table: { width: "100%", borderCollapse: "collapse" },
  cell: { padding: "6px", borderBottom: "1px solid #e0e0e0", textAlign: "left", whiteSpace: "nowrap" },
});

export function Home() {
  const s = useStyles();
  const counts = eventCounts(events);
  const totals = invoiceTotals(invoices);
  const kpis = [
    { label: "HUURDERS", value: tenants.length },
    { label: "GEKOPPELD", value: tenants.filter((t) => t.status === "gekoppeld").length },
    { label: "SYNC FOUTEN (7D)", value: counts.errors },
    { label: "OPENSTAAND", value: `€ ${Math.round(totals.open)}` },
  ];
  return (
    <div className={s.page}>
      <Text className={s.title}>Dashboard</Text>
      <div className={s.row}>
        {kpis.map((k) => (
          <Card key={k.label} className={s.kpiCard}>
            <Text className={s.kpiLabel}>{k.label}</Text>
            <Text className={s.kpiValue}>{k.value}</Text>
          </Card>
        ))}
      </div>
      <Card className={s.recentCard}>
        <Text weight="bold">Recente activiteit</Text>
        <table className={s.table}>
          <tbody>
            {events.slice(0, 8).map((e) => (
              <tr key={e.id}>
                <td className={s.cell}>{new Date(e.at).toLocaleString("nl-NL")}</td>
                <td className={s.cell}>{e.type}</td>
                <td className={s.cell}>{e.user}</td>
                <td className={s.cell}>{e.tenant}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
