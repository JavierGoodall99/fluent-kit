// Dashboard skeleton: a canvas of cards, one message each, with an optional per-card time range. Rules and measurements: patterns/dashboard.md.
// Charts: @fluentui/react-charts (name it in the design note). UI text: use the project's language.
import { Card, CardHeader, Link, Tab, TabList, Text, makeStyles, tokens } from "@fluentui/react-components";
import { LineChart, VerticalBarChart } from "@fluentui/react-charts";
import { useState, type ReactNode } from "react";

const useStyles = makeStyles({
  canvas: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
    gridAutoRows: "380px", // every card the same size; 250px for cards without a chart
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingHorizontalXL,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  card: { minWidth: 0, minHeight: 0, rowGap: tokens.spacingVerticalL, padding: tokens.spacingHorizontalL, borderRadius: tokens.borderRadiusXLarge, boxShadow: tokens.shadow4 },
  description: { color: tokens.colorNeutralForeground3 },
  body: { flexGrow: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: tokens.spacingVerticalS, minWidth: 0, overflowX: "hidden", overflowY: "auto", scrollbarGutter: "stable" }, // scrolls when the content is taller than the card
  summary: { color: tokens.colorNeutralForeground2 },
  details: { alignSelf: "flex-start" },
});

type Range = "7" | "30" | "60";

// One card shape for every measure. The range switch and the details link are optional and belong to this card only.
// No "..." menu: add one only when the card has real actions.
function DashboardCard({ title, description, summary, range, onRange, detailsHref, children }: {
  title: string;
  description: string;
  summary: string; // the one-sentence message of this card, also the text alternative of the chart
  range?: Range;
  onRange?: (r: Range) => void;
  detailsHref?: string; // only when a page with the details exists
  children: ReactNode;
}) {
  const s = useStyles();
  return (
    <Card className={s.card} role="group" aria-label={title}>
      <CardHeader
        header={<Text weight="semibold" size={300}>{title}</Text>}
        description={<Text size={200} className={s.description}>{description}</Text>}
      />
      {range && onRange && (
        <TabList size="small" selectedValue={range} onTabSelect={(_, d) => onRange(d.value as Range)} aria-label={`Time range for ${title}`}>
          <Tab value="7">7 days</Tab>
          <Tab value="30">30 days</Tab>
          <Tab value="60">60 days</Tab>
        </TabList>
      )}
      <div className={s.body} tabIndex={0}>
        <Text className={s.summary}>{summary}</Text>
        {children}
      </div>
      {detailsHref && <Link className={s.details} href={detailsHref}>View details</Link>}
    </Card>
  );
}

const POINTS: Record<Range, number[]> = { "7": [42, 55, 38, 61, 70, 24, 18], "30": [210, 248, 190, 265], "60": [458, 455, 430, 502] };
const label = (r: Range, i: number) => (r === "7" ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i] : `Wk ${i + 1}`);

export function Dashboard() {
  const s = useStyles();
  const [barRange, setBarRange] = useState<Range>("7");
  const [trendRange, setTrendRange] = useState<Range>("30");
  const bars = POINTS[barRange];
  return (
    <div className={s.canvas}>
      <DashboardCard title="Tickets per day" description="New tickets by day" summary={`${bars.reduce((n, y) => n + y, 0)} new tickets in this period.`} range={barRange} onRange={setBarRange} detailsHref="#tickets">
        <VerticalBarChart chartTitle="New tickets" data={bars.map((y, i) => ({ x: label(barRange, i), y, legend: "Tickets", color: tokens.colorBrandBackground }))} hideLegend height={180} barWidth="auto" maxBarWidth={32} />
      </DashboardCard>

      <DashboardCard title="Backlog trend" description="Open tickets over time" summary="The backlog is flat; no growth in this period." range={trendRange} onRange={setTrendRange}>
        <LineChart
          data={{
            chartTitle: "Open tickets",
            lineChartData: [{ legend: "Open", data: POINTS[trendRange].map((y, i) => ({ x: new Date(2026, 8, 1 + i * (trendRange === "7" ? 1 : 7)), y })), color: tokens.colorBrandBackground }],
          }}
          hideLegend
          height={180}
        />
      </DashboardCard>
    </div>
  );
}
