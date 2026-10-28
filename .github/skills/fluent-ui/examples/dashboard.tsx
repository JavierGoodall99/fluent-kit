// Dashboard skeleton: a canvas of cards, one message each, with an optional per-card time range. Rules and measurements: patterns/dashboard.md.
// Charts: @fluentui/react-charts (name it in the design note). UI text: use the project's language.
import {
  Button,
  Card,
  CardHeader,
  Link,
  Tab,
  TabList,
  Text,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { MoreHorizontal20Regular } from "@fluentui/react-icons";
import { GaugeChart, LineChart, VerticalBarChart } from "@fluentui/react-charts";
import { useState, type ReactNode } from "react";

const useStyles = makeStyles({
  canvas: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingHorizontalXL,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  card: { minWidth: 0, rowGap: tokens.spacingVerticalL, padding: tokens.spacingHorizontalL, borderRadius: tokens.borderRadiusXLarge, boxShadow: tokens.shadow4 },
  headerStack: { display: "flex", flexDirection: "column" },
  description: { color: tokens.colorNeutralForeground3 },
  body: { flexGrow: 1, minHeight: "200px", display: "flex", flexDirection: "column", gap: tokens.spacingVerticalS, minWidth: 0, overflowX: "hidden" },
  summary: { color: tokens.colorNeutralForeground2 },
  footer: { display: "flex", justifyContent: "space-between", alignItems: "center" },
});

type Range = "7" | "30" | "60";

// One card shape for every measure. The range switch is optional and belongs to this card only.
function DashboardCard({ title, description, summary, range, onRange, children, onDetails }: {
  title: string;
  description: string;
  summary: string; // the one-sentence message of this card, also the text alternative of the chart
  range?: Range;
  onRange?: (r: Range) => void;
  children: ReactNode;
  onDetails?: () => void;
}) {
  const s = useStyles();
  return (
    <Card className={s.card} role="group" aria-label={title}>
      <CardHeader
        header={<Text weight="bold" size={300}>{title}</Text>}
        description={<Text size={200} className={s.description}>{description}</Text>}
        action={<Button appearance="transparent" icon={<MoreHorizontal20Regular />} aria-label={`More options for ${title}`} />}
      />
      {range && onRange && (
        <TabList size="small" selectedValue={range} onTabSelect={(_, d) => onRange(d.value as Range)} aria-label={`Time range for ${title}`}>
          <Tab value="7">7 days</Tab>
          <Tab value="30">30 days</Tab>
          <Tab value="60">60 days</Tab>
        </TabList>
      )}
      <div className={s.body}>
        <Text className={s.summary}>{summary}</Text>
        {children}
      </div>
      <div className={s.footer}>
        <Link as="button" onClick={onDetails}>View details</Link>
      </div>
    </Card>
  );
}

const DAILY: Record<Range, { x: string; y: number }[]> = {
  "7": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((x, i) => ({ x, y: [42, 55, 38, 61, 70, 24, 18][i] })),
  "30": ["Wk 1", "Wk 2", "Wk 3", "Wk 4"].map((x, i) => ({ x, y: [210, 248, 190, 265][i] })),
  "60": ["Wk 1-2", "Wk 3-4", "Wk 5-6", "Wk 7-8"].map((x, i) => ({ x, y: [458, 455, 430, 502][i] })),
};

export function Dashboard() {
  const s = useStyles();
  const [barRange, setBarRange] = useState<Range>("7");
  const [trendRange, setTrendRange] = useState<Range>("30");
  const bars = DAILY[barRange];
  const trend = DAILY[trendRange];
  return (
    <div className={s.canvas}>
      <DashboardCard title="Tickets resolved" description="Share of tickets closed in time" summary="72 of 100 tickets were resolved within the target time.">
        <GaugeChart chartValue={72} minValue={0} maxValue={100} segments={[{ legend: "Resolved in time", size: 72, color: tokens.colorBrandBackground }, { legend: "Still open", size: 28, color: tokens.colorNeutralStroke1 }]} chartValueFormat={() => "72%"} sublabel="Target: 80%" hideLegend width={260} height={170} />
      </DashboardCard>

      <DashboardCard title="Tickets per day" description="New tickets by day" summary={`${bars.reduce((n, p) => n + p.y, 0)} new tickets in this period.`} range={barRange} onRange={setBarRange}>
        <VerticalBarChart
          chartTitle="New tickets"
          data={bars.map((p) => ({ x: p.x, y: p.y, legend: "Tickets", color: tokens.colorBrandBackground }))}
          hideLegend
          height={180}
          barWidth="auto"
          maxBarWidth={32}
        />
      </DashboardCard>

      <DashboardCard title="Backlog trend" description="Open tickets over time" summary="The backlog is flat; no growth in this period." range={trendRange} onRange={setTrendRange}>
        <LineChart
          data={{
            chartTitle: "Open tickets",
            lineChartData: [{ legend: "Open", data: trend.map((p, i) => ({ x: new Date(2026, 8, 1 + i * (trendRange === "7" ? 1 : 7)), y: p.y })), color: tokens.colorBrandBackground }],
          }}
          hideLegend
          height={180}
        />
      </DashboardCard>
    </div>
  );
}
