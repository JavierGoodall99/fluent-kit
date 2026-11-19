// Command bar for a list page: search, then the actions. Actions that do not fit move into a "..." menu, so the bar
// stays on one line at every width, a phone included. Rules: patterns/list.md. UI text: use the project's language.
import {
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Overflow,
  OverflowItem,
  SearchBox,
  Toolbar,
  ToolbarButton,
  Tooltip,
  makeStyles,
  tokens,
  useIsOverflowItemVisible,
  useOverflowMenu,
} from "@fluentui/react-components";
import { MoreHorizontal20Regular } from "@fluentui/react-icons";
import type { ReactElement } from "react";

export interface Action {
  id: string;
  label: string;
  icon: ReactElement;
  onClick?: () => void;
}

const useStyles = makeStyles({
  bar: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
  },
  // Shrinks to 120px on a phone so the actions keep room; never wider than the hint needs.
  search: { flex: "0 1 240px", minWidth: "120px" },
  // Overflow measures this box: it must be allowed to shrink and must not wrap.
  actions: { flex: "1 1 0", minWidth: 0, flexWrap: "nowrap", overflow: "hidden" },
});

// One menu entry per action that Overflow has hidden from the bar.
function MenuEntry({ action }: { action: Action }) {
  const visible = useIsOverflowItemVisible(action.id);
  if (visible) return null;
  return (
    <MenuItem icon={action.icon} onClick={action.onClick}>
      {action.label}
    </MenuItem>
  );
}

function MoreActions({ actions }: { actions: Action[] }) {
  const { ref, isOverflowing } = useOverflowMenu<HTMLButtonElement>();
  if (!isOverflowing) return null;
  return (
    <Menu>
      <MenuTrigger disableButtonEnhancement>
        <Tooltip content="More actions" relationship="label">
          <ToolbarButton ref={ref} icon={<MoreHorizontal20Regular />} aria-label="More actions" />
        </Tooltip>
      </MenuTrigger>
      <MenuPopover>
        <MenuList>
          {actions.map((a) => (
            <MenuEntry key={a.id} action={a} />
          ))}
        </MenuList>
      </MenuPopover>
    </Menu>
  );
}

export function CommandBar({ actions, query, onQuery }: { actions: Action[]; query: string; onQuery: (q: string) => void }) {
  const styles = useStyles();
  return (
    <div className={styles.bar}>
      <SearchBox className={styles.search} placeholder="Search" value={query} onChange={(_, d) => onQuery(d.value)} />
      <Overflow>
        <Toolbar className={styles.actions} aria-label="Actions">
          {actions.map((a) => (
            <OverflowItem key={a.id} id={a.id}>
              <ToolbarButton icon={a.icon} onClick={a.onClick}>
                {a.label}
              </ToolbarButton>
            </OverflowItem>
          ))}
          <MoreActions actions={actions} />
        </Toolbar>
      </Overflow>
    </div>
  );
}
