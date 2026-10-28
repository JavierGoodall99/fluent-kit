// Status grid skeleton. Rules and measurements: patterns/status-page.md. UI text: use the project's language.
import {
  Button, Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow, Text, ToggleButton,
  makeStyles, mergeClasses, tokens,
} from "@fluentui/react-components";
import {
  CheckmarkCircle16Filled, ChevronDown16Regular, ChevronRight16Regular, Copy16Regular, DismissCircle16Filled,
  QuestionCircle16Regular, Warning16Filled, Wrench16Regular,
} from "@fluentui/react-icons";
import { useState, type ReactElement } from "react";

export type Status = "healthy" | "degraded" | "unhealthy" | "maintenance" | "unknown";
interface Check { id: string; name: string; status: Status; message?: string }
interface Group { id: string; name: string; checks: Check[] }

// Every status the source documents, one fixed icon each.
const STATUS: Record<Status, { label: string; icon: ReactElement; tone: "success" | "warning" | "danger" | "neutral"; problem: boolean }> = {
  unhealthy: { label: "Unhealthy", icon: <DismissCircle16Filled />, tone: "danger", problem: true },
  degraded: { label: "Degraded", icon: <Warning16Filled />, tone: "warning", problem: true },
  unknown: { label: "Unknown", icon: <QuestionCircle16Regular />, tone: "neutral", problem: false },
  maintenance: { label: "Maintenance", icon: <Wrench16Regular />, tone: "neutral", problem: false },
  healthy: { label: "Healthy", icon: <CheckmarkCircle16Filled />, tone: "success", problem: false },
};
const ORDER = Object.keys(STATUS) as Status[];
const NARROW = "@media (max-width: 640px)";

const useStyles = makeStyles({
  wrap: { backgroundColor: tokens.colorNeutralBackground1, border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`, borderRadius: tokens.borderRadiusMedium, overflowX: "hidden" },
  summary: { display: "flex", alignItems: "center", flexWrap: "wrap", columnGap: tokens.spacingHorizontalL, rowGap: tokens.spacingVerticalS, padding: tokens.spacingHorizontalM },
  filters: { display: "flex", flexWrap: "wrap", columnGap: tokens.spacingHorizontalS },
  table: { tableLayout: "fixed", width: "100%", [NARROW]: { display: "block" } },
  block: { [NARROW]: { display: "block" } },
  head: { [NARROW]: { display: "none" } },
  row: { [NARROW]: { display: "grid", gridTemplateColumns: "1fr auto", gridTemplateAreas: '"name status" "msg msg" "act act"', height: "auto", padding: tokens.spacingHorizontalM } },
  cell: { verticalAlign: "top", paddingTop: tokens.spacingVerticalS, paddingBottom: tokens.spacingVerticalS, [NARROW]: { height: "auto", padding: 0 } },
  colName: { width: "22%", [NARROW]: { gridArea: "name", width: "auto" } },
  colStatus: { width: "132px", [NARROW]: { gridArea: "status", width: "auto" } },
  colMsg: { [NARROW]: { gridArea: "msg" } },
  colAction: { width: "96px", [NARROW]: { gridArea: "act", width: "auto" } },
  groupRow: { backgroundColor: tokens.colorNeutralBackground2 },
  groupInner: { display: "flex", alignItems: "center", flexWrap: "wrap", columnGap: tokens.spacingHorizontalS },
  cause: { flex: "1 1 0", minWidth: 0, maxWidth: "75ch", color: tokens.colorNeutralForeground2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  problemRow: { backgroundColor: tokens.colorNeutralBackground1Hover },
  message: {
    display: "block", maxWidth: "75ch", padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`, overflowWrap: "anywhere",
    backgroundColor: tokens.colorNeutralBackground2, border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium, fontFamily: tokens.fontFamilyMonospace, fontSize: tokens.fontSizeBase200,
  },
  clamp: { display: "-webkit-box", WebkitLineClamp: "3", WebkitBoxOrient: "vertical", overflow: "hidden" },
  indicator: { display: "inline-flex", alignItems: "center", columnGap: tokens.spacingHorizontalSNudge },
  success: { color: tokens.colorStatusSuccessForeground1 },
  warning: { color: tokens.colorStatusWarningForeground1 },
  danger: { color: tokens.colorStatusDangerForeground1 },
  neutral: { color: tokens.colorNeutralForeground3 },
  muted: { marginLeft: "auto", color: tokens.colorNeutralForeground3 },
});

function Indicator({ status }: { status: Status }) {
  const s = useStyles();
  const st = STATUS[status];
  return <span className={s.indicator}><span className={s[st.tone]} aria-hidden="true">{st.icon}</span><Text>{st.label}</Text></span>;
}

function CheckRow({ check }: { check: Check }) {
  const s = useStyles();
  const [more, setMore] = useState(false);
  const long = (check.message?.length ?? 0) > 160;
  return (
    <TableRow className={mergeClasses(s.row, STATUS[check.status].problem && s.problemRow)}>
      <TableCell className={mergeClasses(s.cell, s.colName)}><Text weight="semibold">{check.name}</Text></TableCell>
      <TableCell className={mergeClasses(s.cell, s.colStatus)}><Indicator status={check.status} /></TableCell>
      <TableCell className={mergeClasses(s.cell, s.colMsg)}>
        {check.message && <Text className={mergeClasses(s.message, long && !more && s.clamp)}>{check.message}</Text>}
        {long && <Button appearance="transparent" size="small" onClick={() => setMore(!more)}>{more ? "Show less" : "Show more"}</Button>}
      </TableCell>
      <TableCell className={mergeClasses(s.cell, s.colAction)}>
        {check.message && <Button size="small" appearance="subtle" icon={<Copy16Regular />} onClick={() => navigator.clipboard?.writeText(`${check.name}: ${check.message}`)}>Copy</Button>}
      </TableCell>
    </TableRow>
  );
}

function GroupRows({ group }: { group: Group }) {
  const s = useStyles();
  const [open, setOpen] = useState(false);
  const sorted = [...group.checks].sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status));
  const problems = sorted.filter((c) => STATUS[c.status].problem);
  const cause = problems[0]?.message?.split("\n")[0];
  return (
    <>
      <TableRow className={mergeClasses(s.groupRow, s.block)}>
        <TableCell colSpan={4} className={s.block}>
          <div className={s.groupInner}>
            <Button appearance="transparent" size="small" aria-expanded={open} aria-label={`${open ? "Collapse" : "Expand"} ${group.name}`} icon={open ? <ChevronDown16Regular /> : <ChevronRight16Regular />} onClick={() => setOpen(!open)} />
            <Text weight="semibold">{group.name}</Text>
            <Indicator status={sorted[0].status} />
            {cause && !open && <Text className={s.cause} title={cause}>{cause}</Text>}
            <Text className={s.muted}>{problems.length ? `${problems.length} of ${sorted.length} checks need attention` : sorted.length === 1 ? "1 check, fine" : `${sorted.length} checks, all fine`}</Text>
          </div>
        </TableCell>
      </TableRow>
      {open && sorted.map((c) => <CheckRow key={c.id} check={c} />)}
    </>
  );
}

export function StatusGrid({ groups }: { groups: Group[] }) {
  const s = useStyles();
  const [filter, setFilter] = useState<"all" | "problem" | "ok">("all");
  const failing = (g: Group) => g.checks.some((c) => STATUS[c.status].problem);
  const ordered = [...groups].sort((a, b) => Number(failing(b)) - Number(failing(a)));
  const bad = ordered.filter(failing).length;
  const shown = ordered.filter((g) => filter === "all" || (filter === "problem") === failing(g));
  return (
    <div className={s.wrap}>
      <div className={s.summary}>
        <span className={s.indicator}>
          <span className={bad ? s.danger : s.success} aria-hidden="true">{bad ? <DismissCircle16Filled /> : <CheckmarkCircle16Filled />}</span>
          <Text size={400} weight="semibold">{bad ? `${bad} of ${ordered.length} need attention` : `All ${ordered.length} are running fine`}</Text>
        </span>
        <div className={s.filters} role="group" aria-label="Filter">
          <ToggleButton size="small" checked={filter === "all"} onClick={() => setFilter("all")}>{`All ${ordered.length}`}</ToggleButton>
          <ToggleButton size="small" checked={filter === "problem"} onClick={() => setFilter("problem")}>{`Failing ${bad}`}</ToggleButton>
          <ToggleButton size="small" checked={filter === "ok"} onClick={() => setFilter("ok")}>{`Healthy ${ordered.length - bad}`}</ToggleButton>
        </div>
      </div>
      <Table aria-label="Checks by group" className={s.table}>
        <TableHeader className={s.head}>
          <TableRow>
            <TableHeaderCell className={s.colName}>Check</TableHeaderCell>
            <TableHeaderCell className={s.colStatus}>Status</TableHeaderCell>
            <TableHeaderCell>Message</TableHeaderCell>
            <TableHeaderCell className={s.colAction}>Action</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody className={s.block}>{shown.map((g) => <GroupRows key={g.id} group={g} />)}</TableBody>
      </Table>
    </div>
  );
}
