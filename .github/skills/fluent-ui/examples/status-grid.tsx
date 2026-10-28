// Status grid skeleton. Rules and measurements: patterns/status-page.md. UI text: use the project's language.
import { Button, Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow, Text, ToggleButton, makeStyles, mergeClasses, tokens } from "@fluentui/react-components";
import { CheckmarkCircle16Filled, ChevronDown16Regular, ChevronRight16Regular, DismissCircle16Filled, QuestionCircle16Regular, Warning16Filled } from "@fluentui/react-icons";
import { useState, type ReactElement } from "react";

// Add every status your source documents, each with one fixed icon. Problems sort first.
type Status = "unhealthy" | "degraded" | "unknown" | "healthy";
interface Check { id: string; name: string; status: Status; message?: string }
interface Group { id: string; name: string; checks: Check[] }
const STATUS: Record<Status, { label: string; icon: ReactElement; tone: "danger" | "warning" | "neutral" | "success"; problem: boolean }> = {
  unhealthy: { label: "Unhealthy", icon: <DismissCircle16Filled />, tone: "danger", problem: true },
  degraded: { label: "Degraded", icon: <Warning16Filled />, tone: "warning", problem: true },
  unknown: { label: "Unknown", icon: <QuestionCircle16Regular />, tone: "neutral", problem: false },
  healthy: { label: "Healthy", icon: <CheckmarkCircle16Filled />, tone: "success", problem: false },
};
const ORDER = Object.keys(STATUS) as Status[];
const NARROW = "@media (max-width: 640px)";

const useStyles = makeStyles({
  wrap: { backgroundColor: tokens.colorNeutralBackground1, border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`, borderRadius: tokens.borderRadiusMedium },
  summary: { display: "flex", alignItems: "center", flexWrap: "wrap", gap: tokens.spacingHorizontalM, padding: tokens.spacingHorizontalM },
  table: { tableLayout: "fixed", [NARROW]: { display: "block" } },
  narrowBlock: { [NARROW]: { display: "block" } },
  head: { [NARROW]: { display: "none" } },
  // Narrow: each row stacks: name and status, then the message, then the action.
  row: { [NARROW]: { display: "flex", flexWrap: "wrap", columnGap: tokens.spacingHorizontalS, padding: tokens.spacingVerticalS } },
  cell: { verticalAlign: "top", paddingTop: tokens.spacingVerticalS, paddingBottom: tokens.spacingVerticalS, [NARROW]: { display: "block", width: "auto", padding: 0 } },
  full: { [NARROW]: { flexBasis: "100%" } },
  wName: { width: "22%" }, wStatus: { width: "132px" }, wAction: { width: "96px" },
  group: { backgroundColor: tokens.colorNeutralBackground2 },
  groupInner: { display: "flex", alignItems: "center", flexWrap: "wrap", columnGap: tokens.spacingHorizontalS },
  cause: { flex: "1 1 0", minWidth: 0, maxWidth: "75ch", color: tokens.colorNeutralForeground2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  message: {
    display: "block", maxWidth: "75ch", padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`, overflowWrap: "anywhere", fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase200, backgroundColor: tokens.colorNeutralBackground2, border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`, borderRadius: tokens.borderRadiusMedium,
  },
  clamp: { display: "-webkit-box", WebkitLineClamp: "3", WebkitBoxOrient: "vertical", overflow: "hidden" },
  indicator: { display: "inline-flex", alignItems: "center", columnGap: tokens.spacingHorizontalSNudge },
  danger: { color: tokens.colorStatusDangerForeground1 },
  warning: { color: tokens.colorStatusWarningForeground1 },
  neutral: { color: tokens.colorNeutralForeground3 },
  success: { color: tokens.colorStatusSuccessForeground1 },
  count: { marginLeft: "auto", color: tokens.colorNeutralForeground3 },
});

function Indicator({ status }: { status: Status }) {
  const s = useStyles();
  return <span className={s.indicator}><span className={s[STATUS[status].tone]} aria-hidden="true">{STATUS[status].icon}</span><Text>{STATUS[status].label}</Text></span>;
}

function CheckRow({ check }: { check: Check }) {
  const s = useStyles();
  const [more, setMore] = useState(false);
  const long = (check.message?.length ?? 0) > 160;
  return (
    <TableRow className={s.row}>
      <TableCell className={s.cell}><Text weight="semibold">{check.name}</Text></TableCell>
      <TableCell className={s.cell}><Indicator status={check.status} /></TableCell>
      <TableCell className={mergeClasses(s.cell, s.full)}>
        {check.message && <Text className={mergeClasses(s.message, long && !more && s.clamp)}>{check.message}</Text>}
        {long && <Button appearance="transparent" size="small" onClick={() => setMore(!more)}>{more ? "Show less" : "Show more"}</Button>}
      </TableCell>
      <TableCell className={s.cell}>{STATUS[check.status].problem && <Button size="small">Retry</Button>}</TableCell>
    </TableRow>
  );
}

function GroupRows({ group }: { group: Group }) {
  const s = useStyles();
  const [open, setOpen] = useState(false); // overview first, detail on demand
  const sorted = [...group.checks].sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status));
  const problems = sorted.filter((c) => STATUS[c.status].problem);
  const cause = problems[0]?.message?.split("\n")[0];
  return (
    <>
      <TableRow className={mergeClasses(s.group, s.narrowBlock)}>
        <TableCell colSpan={4} className={s.narrowBlock}>
          <div className={s.groupInner}>
            <Button appearance="transparent" size="small" aria-expanded={open} aria-label={`${open ? "Collapse" : "Expand"} ${group.name}`} icon={open ? <ChevronDown16Regular /> : <ChevronRight16Regular />} onClick={() => setOpen(!open)} />
            <Text weight="semibold">{group.name}</Text>
            <Indicator status={sorted[0].status} />
            {cause && !open && <Text className={s.cause} title={cause}>{cause}</Text>}
            <Text className={s.count}>{problems.length ? `${problems.length} of ${sorted.length} checks need attention` : "All checks fine"}</Text>
          </div>
        </TableCell>
      </TableRow>
      {open && sorted.map((c) => <CheckRow key={c.id} check={c} />)}
    </>
  );
}

export function StatusGrid({ groups }: { groups: Group[] }) {
  const s = useStyles();
  const [filter, setFilter] = useState<"all" | "failing" | "healthy">("all");
  const failing = (g: Group) => g.checks.some((c) => STATUS[c.status].problem);
  const ordered = [...groups].sort((a, b) => Number(failing(b)) - Number(failing(a)));
  const bad = ordered.filter(failing).length;
  const counts = { all: ordered.length, failing: bad, healthy: ordered.length - bad };
  const shown = ordered.filter((g) => filter === "all" || (filter === "failing") === failing(g));
  return (
    <div className={s.wrap}>
      <div className={s.summary}>
        <Indicator status={bad ? "unhealthy" : "healthy"} />
        <Text size={400} weight="semibold">{bad ? `${bad} of ${ordered.length} need attention` : `All ${ordered.length} are running fine`}</Text>
        <div role="group" aria-label="Filter">
          {(["all", "failing", "healthy"] as const).map((f) => (
            <ToggleButton key={f} size="small" appearance="subtle" checked={filter === f} onClick={() => setFilter(f)}>{`${f[0].toUpperCase()}${f.slice(1)} ${counts[f]}`}</ToggleButton>
          ))}
        </div>
      </div>
      <Table aria-label="Checks by group" className={s.table}>
        <TableHeader className={s.head}>
          <TableRow>
            <TableHeaderCell className={s.wName}>Check</TableHeaderCell>
            <TableHeaderCell className={s.wStatus}>Status</TableHeaderCell>
            <TableHeaderCell>Message</TableHeaderCell>
            <TableHeaderCell className={s.wAction}>Action</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody className={s.narrowBlock}>{shown.map((g) => <GroupRows key={g.id} group={g} />)}</TableBody>
      </Table>
    </div>
  );
}
