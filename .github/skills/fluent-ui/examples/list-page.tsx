// List page skeleton: command bar above a sortable, selectable DataGrid. Rules and measurements: patterns/list.md.
// Actions that need a selection stay visible but disabled. UI text: use the project's language.
import {
  Badge,
  DataGrid,
  DataGridBody,
  DataGridCell,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridRow,
  Text,
  Toolbar,
  ToolbarButton,
  ToolbarDivider,
  type TableColumnDefinition,
  createTableColumn,
  makeStyles,
  mergeClasses,
  tokens,
} from "@fluentui/react-components";
import {
  Add20Regular,
  ArrowClockwise20Regular,
  Delete20Regular,
} from "@fluentui/react-icons";
import { useState } from "react";

interface Item {
  id: string;
  name: string;
  status: "Active" | "Inactive";
}

const useStyles = makeStyles({
  page: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingHorizontalXL,
    backgroundColor: tokens.colorNeutralBackground2,
    minHeight: "100vh",
  },
  surface: {
    backgroundColor: tokens.colorNeutralBackground1,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
  },
  // Let the command bar wrap on narrow screens instead of cutting buttons off.
  toolbar: {
    flexWrap: "wrap",
    rowGap: tokens.spacingVerticalXS,
  },
  footer: {
    padding: tokens.spacingVerticalS,
    color: tokens.colorNeutralForeground2,
  },
});

const columns: TableColumnDefinition<Item>[] = [
  createTableColumn<Item>({
    columnId: "name",
    compare: (a, b) => a.name.localeCompare(b.name),
    renderHeaderCell: () => "Name",
    renderCell: (item) => item.name,
  }),
  createTableColumn<Item>({
    columnId: "status",
    compare: (a, b) => a.status.localeCompare(b.status),
    renderHeaderCell: () => "Status",
    renderCell: (item) => (
      <Badge appearance="tint" color={item.status === "Active" ? "success" : "informative"}>
        {item.status}
      </Badge>
    ),
  }),
];

export function ItemListPage({ items }: { items: Item[] }) {
  const styles = useStyles();
  const [selected, setSelected] = useState<Set<string | number>>(new Set());
  const hasSelection = selected.size > 0;

  return (
    <main className={styles.page}>
      <Text as="h1" size={600} weight="semibold">
        Items
      </Text>

      <Toolbar aria-label="Actions" className={mergeClasses(styles.surface, styles.toolbar)}>
        <ToolbarButton appearance="primary" icon={<Add20Regular />}>
          New
        </ToolbarButton>
        <ToolbarButton icon={<Delete20Regular />} disabled={!hasSelection}>
          Delete
        </ToolbarButton>
        <ToolbarDivider />
        <ToolbarButton icon={<ArrowClockwise20Regular />}>Refresh</ToolbarButton>
      </Toolbar>

      <div className={styles.surface}>
        <DataGrid
          items={items}
          columns={columns}
          getRowId={(item: Item) => item.id}
          sortable
          selectionMode="multiselect"
          selectedItems={selected}
          onSelectionChange={(_, data) => setSelected(new Set(data.selectedItems))}
          focusMode="composite"
        >
          <DataGridHeader>
            <DataGridRow selectionCell={{ checkboxIndicator: { "aria-label": "Select all" } }}>
              {({ renderHeaderCell }) => (
                <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
              )}
            </DataGridRow>
          </DataGridHeader>
          <DataGridBody<Item>>
            {({ item, rowId }) => (
              <DataGridRow<Item>
                key={rowId}
                selectionCell={{ checkboxIndicator: { "aria-label": "Select row" } }}
              >
                {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
              </DataGridRow>
            )}
          </DataGridBody>
        </DataGrid>
        <Text className={styles.footer} size={200} block>
          Rows: {items.length}
        </Text>
      </div>
    </main>
  );
}
