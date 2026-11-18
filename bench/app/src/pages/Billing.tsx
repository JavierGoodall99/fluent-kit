import { Card, Text, makeStyles } from "@fluentui/react-components";
import { invoiceTotals, invoices } from "../data";

const useStyles = makeStyles({
  page: { padding: "16px" },
  card: { padding: "10px", marginTop: "10px" },
  row: { display: "flex", gap: "30px", padding: "4px 0" },
});

export function Billing() {
  const s = useStyles();
  const totals = invoiceTotals(invoices);
  return (
    <div className={s.page}>
      <Text size={600}>Facturatie</Text>
      <Card className={s.card}>
        {invoices.map((i) => (
          <div key={i.id} className={s.row}>
            <Text>{i.id}</Text>
            <Text>{i.tenant}</Text>
            <Text>{i.period}</Text>
            <Text>€{i.amount}</Text>
            <Text>{i.vat * 100}% btw</Text>
            <Text>{i.paid ? "betaald" : "OPEN"}</Text>
          </div>
        ))}
      </Card>
      <Card className={s.card}>
        <Text>Netto: €{totals.net} | Btw: €{totals.vat} | Bruto: €{totals.gross} | Openstaand: €{totals.open}</Text>
      </Card>
    </div>
  );
}
