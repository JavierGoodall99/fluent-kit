import { Badge, Button, Card, SearchBox, Text, makeStyles, tokens } from "@fluentui/react-components";
import { ArrowDownload20Regular, ArrowSync20Regular, Filter20Regular, Link20Regular, Print20Regular, Settings20Regular } from "@fluentui/react-icons";
import { useState } from "react";
import { connectTenant, searchTenants, tenantStatusLabel, tenants } from "../data";

const useStyles = makeStyles({
  page: { padding: "20px" },
  toolbar: { display: "flex", gap: "8px", marginBottom: "12px", whiteSpace: "nowrap", overflow: "hidden" },
  list: { display: "flex", flexDirection: "column", gap: "6px" },
  tenantCard: { padding: "10px", borderRadius: "4px", display: "flex", alignItems: "center", gap: "12px", backgroundColor: "#ffffff" },
  name: { width: "260px", fontWeight: 600 },
  muted: { color: tokens.colorNeutralForeground3, width: "120px" },
});

export function Tenants() {
  const s = useStyles();
  const [q, setQ] = useState("");
  const list = searchTenants(tenants, q);
  return (
    <div className={s.page}>
      <Text size={600} weight="semibold">Huurders</Text>
      <div className={s.toolbar}>
        <SearchBox placeholder="Zoek huurder" value={q} onChange={(_, d) => setQ(d.value)} />
        <Button icon={<ArrowSync20Regular />}>Alles synchroniseren</Button>
        <Button icon={<Filter20Regular />}>Filteren op status</Button>
        <Button icon={<ArrowDownload20Regular />}>Exporteren naar Excel</Button>
        <Button icon={<Print20Regular />}>Afdrukken</Button>
        <Button icon={<Settings20Regular />}>Instellingen</Button>
      </div>
      <div className={s.list}>
        {list.map((t) => (
          <Card key={t.id} className={s.tenantCard}>
            <Text className={s.name}>{t.name}</Text>
            <Text className={s.muted}>{t.city}</Text>
            <Text className={s.muted}>{t.units} eenheden</Text>
            <Badge color="success">{tenantStatusLabel.gekoppeld}</Badge>
            {t.status !== "gekoppeld" && <Button size="small" icon={<Link20Regular />} onClick={() => connectTenant(t.id)}>Koppelen</Button>}
          </Card>
        ))}
      </div>
    </div>
  );
}
