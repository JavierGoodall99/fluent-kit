import { Button, Field, Input, Text, makeStyles, tokens } from "@fluentui/react-components";
import { useState } from "react";
import { saveInvoice } from "../data";

const useStyles = makeStyles({
  page: { padding: tokens.spacingHorizontalXL, maxWidth: "560px", display: "flex", flexDirection: "column", gap: tokens.spacingVerticalM },
});

export function InvoiceForm() {
  const s = useStyles();
  const [values, setValues] = useState({ period: "", amount: "", reference: "" });
  const [saved, setSaved] = useState(false);
  const set = (k: keyof typeof values) => (_: unknown, d: { value: string }) => setValues({ ...values, [k]: d.value });
  return (
    <form className={s.page} onSubmit={(e) => { e.preventDefault(); setSaved(saveInvoice(values)); }}>
      <Text as="h1" size={600} weight="semibold">Nieuwe factuur</Text>
      <Field label="Periode" required><Input value={values.period} onChange={set("period")} /></Field>
      <Field label="Bedrag (excl. btw)" required><Input value={values.amount} onChange={set("amount")} /></Field>
      <Field label="Uw referentie"><Input value={values.reference} onChange={set("reference")} /></Field>
      <Button appearance="primary" type="submit">Opslaan</Button>
      {saved && <Text>De factuur is opgeslagen.</Text>}
    </form>
  );
}
