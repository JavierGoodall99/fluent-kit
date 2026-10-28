// Task board: a column per stage, a card per item. Use when the requirement is "move items through stages".
// Measurements follow Microsoft's "Taskboard Template (Web Large)" in the Microsoft 365 UI Kit:
//   page padding 20px, 20px between columns with a 1px divider, 12px between cards, column header 14px bold,
//   a full-width "add" button under the header, cards radius 8px (tokens.borderRadiusXLarge; borderRadiusLarge is only 6px), padding 16px, shadow04 (tokens.shadow4).
// Rules: a card shows a title, one owner and one status line; details open in a drawer or page, not in the card.
// There is no drag and drop here on purpose: every card has a "Move to" menu, so the board works with a keyboard and on a phone.
// Narrow screens stack the columns. UI text is English. Use the project's language and wording.
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Text,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { Add24Regular, MoreHorizontal20Regular } from "@fluentui/react-icons";
import { useState } from "react";

interface Task { id: string; title: string; owner: string; priority: "High" | "Normal"; due?: string }
type Stage = "todo" | "doing" | "done";
const STAGES: { id: Stage; label: string }[] = [
  { id: "todo", label: "To do" },
  { id: "doing", label: "In progress" },
  { id: "done", label: "Done" },
];

const useStyles = makeStyles({
  board: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    columnGap: tokens.spacingHorizontalXL,
    padding: tokens.spacingHorizontalXL,
    backgroundColor: tokens.colorNeutralBackground2,
    "@media (max-width: 640px)": { gridTemplateColumns: "minmax(0, 1fr)", rowGap: tokens.spacingVerticalXL },
  },
  column: { display: "flex", flexDirection: "column", rowGap: tokens.spacingVerticalM, minWidth: 0 },
  columnHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: tokens.spacingVerticalS },
  add: { width: "100%" },
  card: { padding: tokens.spacingHorizontalL, borderRadius: tokens.borderRadiusXLarge, boxShadow: tokens.shadow4 },
  meta: { display: "flex", alignItems: "center", columnGap: tokens.spacingHorizontalS, flexWrap: "wrap" },
  muted: { color: tokens.colorNeutralForeground3 },
  empty: { color: tokens.colorNeutralForeground3, paddingTop: tokens.spacingVerticalS },
});

export function TaskBoard({ initial }: { initial: Record<Stage, Task[]> }) {
  const s = useStyles();
  const [cols, setCols] = useState(initial);
  const move = (task: Task, from: Stage, to: Stage) =>
    setCols((c) => ({ ...c, [from]: c[from].filter((t) => t.id !== task.id), [to]: [...c[to], task] }));
  return (
    <div className={s.board}>
      {STAGES.map((stage) => (
        <section key={stage.id} className={s.column} aria-label={stage.label}>
          <div className={s.columnHeader}>
            <Text weight="bold">{stage.label}</Text>
            <Text className={s.muted}>{cols[stage.id].length}</Text>
          </div>
          <Button className={s.add} appearance="outline" icon={<Add24Regular />} aria-label={`Add a task to ${stage.label}`} />
          {cols[stage.id].length === 0 && <Text className={s.empty}>Nothing here yet.</Text>}
          {cols[stage.id].map((task) => (
            <Card key={task.id} className={s.card}>
              <CardHeader
                header={<Text weight="semibold">{task.title}</Text>}
                action={
                  <Menu>
                    <MenuTrigger disableButtonEnhancement>
                      <Button appearance="transparent" icon={<MoreHorizontal20Regular />} aria-label={`Actions for ${task.title}`} />
                    </MenuTrigger>
                    <MenuPopover>
                      <MenuList>
                        {STAGES.filter((x) => x.id !== stage.id).map((x) => (
                          <MenuItem key={x.id} onClick={() => move(task, stage.id, x.id)}>Move to {x.label}</MenuItem>
                        ))}
                      </MenuList>
                    </MenuPopover>
                  </Menu>
                }
              />
              <div className={s.meta}>
                <Avatar name={task.owner} size={24} />
                <Text className={s.muted}>{task.owner}</Text>
                {task.priority === "High" && <Badge appearance="tint" color="danger">High priority</Badge>}
                {task.due && <Text className={s.muted}>Due {task.due}</Text>}
              </div>
            </Card>
          ))}
        </section>
      ))}
    </div>
  );
}
