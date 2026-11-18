import { Button, Card, Dropdown, Option, SearchBox, Text, makeStyles, tokens } from "@fluentui/react-components";
import { useState } from "react";
import { type EventType, eventCounts, events, exportActivityCsv, filterEvents, paginate } from "../data";

const PAGE_SIZE = 15;
const useStyles = makeStyles({
  page: { padding: "12px" },
  kpis: { display: "flex", gap: "8px", marginBottom: "8px" },
  statCard: { borderRadius: tokens.borderRadiusMedium, borderLeft: `4px solid ${tokens.colorBrandStroke1}`, padding: "8px", width: "160px" },
  toolbar: { display: "flex", gap: "8px", marginBottom: "8px" },
  table: { width: "100%", fontSize: "11px", borderCollapse: "collapse" },
  cell: { padding: "2px 4px", borderBottom: `1px solid ${tokens.colorNeutralStroke2}`, whiteSpace: "nowrap" },
});

export function ActivityLog() {
  const s = useStyles();
  const [q, setQ] = useState("");
  const [type, setType] = useState<EventType | "ALL">("ALL");
  const [page, setPage] = useState(0);
  const list = filterEvents(events, q, type);
  const counts = eventCounts(list);
  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  return (
    <div className={s.page}>
      <Text size={500}>Activity log</Text>
      <div className={s.kpis}>
        <Card className={s.statCard}><Text>TOTAL: {counts.total}</Text></Card>
        <Card className={s.statCard}><Text>SYNC_ERR: {counts.errors}</Text></Card>
        <Card className={s.statCard}><Text>LOGIN: {counts.logins}</Text></Card>
      </div>
      <div className={s.toolbar}>
        <SearchBox placeholder="zoek..." value={q} onChange={(_, d) => { setQ(d.value); setPage(0); }} />
        <Dropdown value={type} selectedOptions={[type]} onOptionSelect={(_, d) => { setType(d.optionValue as EventType | "ALL"); setPage(0); }}>
          {["ALL", "LOGIN", "SYNC_OK", "SYNC_ERR", "EXPORT", "USER_ADD"].map((t) => <Option key={t} value={t}>{t}</Option>)}
        </Dropdown>
        <Button onClick={() => window.open(exportActivityCsv(list))}>CSV</Button>
      </div>
      <table className={s.table}>
        <thead><tr>{["ID", "TS", "TYPE", "USR", "TENANT", "DETAIL"].map((h) => <th key={h} className={s.cell}>{h}</th>)}</tr></thead>
        <tbody>
          {paginate(list, page, PAGE_SIZE).map((e) => (
            <tr key={e.id}>
              <td className={s.cell}>{e.id}</td><td className={s.cell}>{e.at}</td><td className={s.cell}>{e.type}</td>
              <td className={s.cell}>{e.user}</td><td className={s.cell}>{e.tenant}</td><td className={s.cell}>{e.detail}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className={s.toolbar}>
        <Button disabled={page === 0} onClick={() => setPage(page - 1)}>&lt;</Button>
        <Text>{page + 1}/{pages}</Text>
        <Button disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>&gt;</Button>
      </div>
    </div>
  );
}
