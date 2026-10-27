// Status grid: many same-shaped records (checks, jobs, steps) grouped under a parent, read to find what is wrong.
// Use when the requirement is "see which of these items are failing, why, and compare them".
// Rules this example follows (see "Same-shaped records" in .fluent-kit/DESIGNER.md):
//  - One row component for every status. Status changes the badge, icon and emphasis, never the layout.
//  - The same columns on every row, in the same order, at the same widths.
//  - Message text wraps and is capped at about 75ch, on a neutral surface. It never runs across the screen.
//  - Status is icon + text + colour, never colour alone. Unknown statuses are shown, not hidden.
//  - Problems come first and stay open. A group with no problems is collapsed.
// UI text here is English. Use the project's language and wording.
import {
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
  Tooltip,
  makeStyles,
  mergeClasses,
  tokens,
} from "@fluentui/react-components";
import {
  CheckmarkCircle16Filled,
  ChevronDown16Regular,
  ChevronRight16Regular,
  Copy16Regular,
  DismissCircle16Filled,
  QuestionCircle16Regular,
  Warning16Filled,
  Wrench16Regular,
} from "@fluentui/react-icons";
import { useState, type ReactElement } from "react";

export type Status = "healthy" | "degraded" | "unhealthy" | "maintenance" | "unknown";

interface Check {
  id: string;
  name: string;
  type: string;
  status: Status;
  message?: string;
  durationMs?: number;
}
interface Group {
  id: string;
  name: string;
  kind: string;
  checks: Check[];
}

// One entry per status the data can have. Add every status the source documents.
const STATUS: Record<Status, { label: string; icon: ReactElement; color: "success" | "warning" | "danger" | "informative" | "subtle"; problem: boolean }> = {
  healthy: { label: "Healthy", icon: <CheckmarkCircle16Filled />, color: "success", problem: false },
  degraded: { label: "Degraded", icon: <Warning16Filled />, color: "warning", problem: true },
  unhealthy: { label: "Unhealthy", icon: <DismissCircle16Filled />, color: "danger", problem: true },
  maintenance: { label: "Maintenance", icon: <Wrench16Regular />, color: "informative", problem: false },
  unknown: { label: "Unknown", icon: <QuestionCircle16Regular />, color: "subtle", problem: false },
};
const ORDER: Status[] = ["unhealthy", "degraded", "unknown", "maintenance", "healthy"];

const useStyles = makeStyles({
  wrap: { backgroundColor: tokens.colorNeutralBackground1, border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: tokens.borderRadiusMedium, overflowX: "hidden" },
  // On narrow screens the table becomes stacked rows: name and status on one line, message under it, then the action.
  table: { tableLayout: "fixed", width: "100%", "@media (max-width: 640px)": { display: "block" } },
  body: { "@media (max-width: 640px)": { display: "block" } },
  head: { "@media (max-width: 640px)": { display: "none" } },
  row: { "@media (max-width: 640px)": { display: "grid", height: "auto", minHeight: "auto", gridTemplateColumns: "1fr auto", gridTemplateAreas: '"name status" "msg msg" "act act"', columnGap: tokens.spacingHorizontalS, padding: tokens.spacingHorizontalM, borderBottom: `1px solid ${tokens.colorNeutralStroke2}` } },
  aName: { "@media (max-width: 640px)": { height: "auto", minHeight: "auto", gridArea: "name", width: "auto", padding: 0 } },
  aStatus: { "@media (max-width: 640px)": { height: "auto", minHeight: "auto", gridArea: "status", width: "auto", padding: 0 } },
  aMsg: { "@media (max-width: 640px)": { height: "auto", minHeight: "auto", gridArea: "msg", padding: `${tokens.spacingVerticalXS} 0` } },
  aAct: { "@media (max-width: 640px)": { height: "auto", minHeight: "auto", gridArea: "act", width: "auto", padding: 0 } },
  groupBlock: { "@media (max-width: 640px)": { display: "block" } },
  // Column widths. Message gets whatever is left, so it never shrinks to nothing.
  colName: { width: "22%", minWidth: "160px" },
  colStatus: { width: "132px" },
  colType: { width: "96px", "@media (max-width: 640px)": { display: "none" } },
  colTime: { width: "80px", textAlign: "right", "@media (max-width: 640px)": { display: "none" } },
  colAction: { width: "96px" },
  groupRow: { backgroundColor: tokens.colorNeutralBackground2 },
  groupInner: { display: "flex", alignItems: "center", columnGap: tokens.spacingHorizontalS, flexWrap: "wrap" },
  groupSummary: { marginLeft: "auto", color: tokens.colorNeutralForeground3 },
  problemRow: { backgroundColor: tokens.colorNeutralBackground1Hover },
  cell: { verticalAlign: "top", paddingTop: tokens.spacingVerticalS, paddingBottom: tokens.spacingVerticalS },
  message: {
    display: "block",
    maxWidth: "75ch",
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase200,
    overflowWrap: "anywhere", // long URLs and ids wrap instead of forcing sideways scroll
  },
  muted: { color: tokens.colorNeutralForeground3 },
  visuallyHidden: { position: "absolute", width: "1px", height: "1px", overflow: "hidden", clip: "rect(0 0 0 0)" },
});

// One row for every status. Only the badge, icon and (for problems) a subtle background change.
function CheckRow({ check }: { check: Check }) {
  const s = useStyles();
  const st = STATUS[check.status];
  return (
    <TableRow className={mergeClasses(s.row, st.problem && s.problemRow)}>
      <TableCell className={mergeClasses(s.cell, s.colName, s.aName)}>
        <Text weight="semibold">{check.name}</Text>
      </TableCell>
      <TableCell className={mergeClasses(s.cell, s.colType)}><Text className={s.muted}>{check.type}</Text></TableCell>
      <TableCell className={mergeClasses(s.cell, s.colStatus, s.aStatus)}>
        <Badge appearance={st.problem ? "tint" : "outline"} color={st.color} icon={st.icon} size="medium">{st.label}</Badge>
      </TableCell>
      <TableCell className={mergeClasses(s.cell, s.aMsg)}>
        {check.message ? <Text className={s.message}>{check.message}</Text> : <Text className={s.muted}>No message</Text>}
      </TableCell>
      <TableCell className={mergeClasses(s.cell, s.colTime)}><Text className={s.muted}>{check.durationMs == null ? "" : `${check.durationMs} ms`}</Text></TableCell>
      <TableCell className={mergeClasses(s.cell, s.colAction, s.aAct)}>
        {check.message && (
          <Tooltip content="Copy the error with its context" relationship="label">
            <Button size="small" appearance="subtle" icon={<Copy16Regular />} onClick={() => navigator.clipboard?.writeText(`${check.name}: ${check.message}`)}>Copy</Button>
          </Tooltip>
        )}
      </TableCell>
    </TableRow>
  );
}

function GroupSection({ group }: { group: Group }) {
  const s = useStyles();
  const problems = group.checks.filter((c) => STATUS[c.status].problem).length;
  const [open, setOpen] = useState(problems > 0); // problems open, all-healthy collapsed
  const sorted = [...group.checks].sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status));
  return (
    <>
      <TableRow className={mergeClasses(s.groupRow, s.groupBlock)}>
        <TableCell colSpan={6} className={s.groupBlock}>
          <div className={s.groupInner}>
            <Button appearance="transparent" size="small" aria-expanded={open} aria-label={`${open ? "Collapse" : "Expand"} ${group.name}`} icon={open ? <ChevronDown16Regular /> : <ChevronRight16Regular />} onClick={() => setOpen(!open)} />
            <Text weight="semibold">{group.name}</Text>
            <Text className={s.muted}>{group.kind}</Text>
            <Text className={s.groupSummary}>{problems === 0 ? `${group.checks.length} checks, all fine` : `${problems} of ${group.checks.length} checks need attention`}</Text>
          </div>
        </TableCell>
      </TableRow>
      {open && sorted.map((c) => <CheckRow key={c.id} check={c} />)}
    </>
  );
}

export function StatusGrid({ groups }: { groups: Group[] }) {
  const s = useStyles();
  // Groups with problems first, so what is wrong is at the top.
  const ordered = [...groups].sort((a, b) => Number(b.checks.some((c) => STATUS[c.status].problem)) - Number(a.checks.some((c) => STATUS[c.status].problem)));
  return (
    <div className={s.wrap}>
      <Table aria-label="Checks by integration" className={s.table}>
        <TableHeader className={s.head}>
          <TableRow>
            <TableHeaderCell className={s.colName}>Check</TableHeaderCell>
            <TableHeaderCell className={s.colType}>Type</TableHeaderCell>
            <TableHeaderCell className={s.colStatus}>Status</TableHeaderCell>
            <TableHeaderCell>Message</TableHeaderCell>
            <TableHeaderCell className={s.colTime}>Time</TableHeaderCell>
            <TableHeaderCell className={s.colAction}><span className={s.visuallyHidden}>Actions</span></TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody className={s.body}>{ordered.map((g) => <GroupSection key={g.id} group={g} />)}</TableBody>
      </Table>
    </div>
  );
}
