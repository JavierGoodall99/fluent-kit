// Cards of data: equal-size cards in a grid, label and value rows lined up, long content scrolls inside the card.
// Rules and measurements: patterns/alignment.md. UI text: use the project's language.
import { Card, CardHeader, Text, makeStyles, tokens } from "@fluentui/react-components";
import { Fragment } from "react";

export interface DataRow { label: string; value: number | null }

const useStyles = makeStyles({
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
    gridAutoRows: "250px",
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingHorizontalXL,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  card: { minWidth: 0, minHeight: 0, rowGap: tokens.spacingVerticalL, padding: tokens.spacingHorizontalL, borderRadius: tokens.borderRadiusXLarge, boxShadow: tokens.shadow4 },
  description: { color: tokens.colorNeutralForeground3 },
  // One grid for all rows, so every value lines up. The body scrolls when the rows do not fit; the card keeps its size.
  rows: { flexGrow: 1, minHeight: 0, overflowY: "auto", display: "grid", gridTemplateColumns: "1fr auto", alignContent: "start", columnGap: tokens.spacingHorizontalM, rowGap: tokens.spacingVerticalS },
  label: { minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  value: { justifySelf: "end", fontVariantNumeric: "tabular-nums" },
});

export function DataCard({ title, description, rows }: { title: string; description: string; rows: DataRow[] }) {
  const s = useStyles();
  return (
    <Card className={s.card} role="group" aria-label={title}>
      <CardHeader
        header={<Text weight="semibold" size={300}>{title}</Text>}
        description={<Text size={200} className={s.description}>{description}</Text>}
      />
      <div className={s.rows} tabIndex={0}>
        {rows.map((r) => (
          <Fragment key={r.label}>
            <Text className={s.label} title={r.label}>{r.label}</Text>
            <Text className={s.value}>{r.value === null ? "-" : r.value.toLocaleString()}</Text>
          </Fragment>
        ))}
      </div>
    </Card>
  );
}

export function DataCards({ cards }: { cards: { title: string; description: string; rows: DataRow[] }[] }) {
  const s = useStyles();
  return <div className={s.grid}>{cards.map((c) => <DataCard key={c.title} {...c} />)}</div>;
}
