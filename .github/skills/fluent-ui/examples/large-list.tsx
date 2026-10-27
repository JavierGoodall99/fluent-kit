// Large list: a virtualized DataGrid for thousands of rows, with search and sorting.
// Use this when the requirement is "scan, search and sort hundreds or thousands of rows in the browser". Under about 200 rows use the plain DataGrid (list-page.tsx).
// If the data lives on a server and is bigger than the browser should hold, search, sort and page on the server instead and show one page at a time.
// Package: npm i @fluentui-contrib/react-data-grid-react-window react-window@1 (Fluent's own virtualized DataGrid; pin the version).
// Only the visible rows exist in the DOM. Row height is fixed, so keep cells to one line (truncate). The row renderer must be memoized.
import {
  DataGrid,
  DataGridBody,
  DataGridHeader,
  DataGridRow,
  type RowRenderer,
} from "@fluentui-contrib/react-data-grid-react-window";
import {
  DataGridCell,
  DataGridHeaderCell,
  SearchBox,
  TableCellLayout,
  Text,
  createTableColumn,
  makeStyles,
  tokens,
  type TableColumnDefinition,
} from "@fluentui/react-components";
import { useCallback, useMemo, useState } from "react";

interface Customer {
  id: string;
  name: string;
  city: string;
  email: string;
}

const useStyles = makeStyles({
  page: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingHorizontalXXL,
    backgroundColor: tokens.colorNeutralBackground2,
    minHeight: "100vh",
    boxSizing: "border-box",
  },
  surface: {
    backgroundColor: tokens.colorNeutralBackground1,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
  },
  search: { maxWidth: "360px" },
  bar: { padding: tokens.spacingVerticalS },
  empty: { padding: tokens.spacingVerticalXXXL, textAlign: "center" },
  footer: { padding: tokens.spacingVerticalS, color: tokens.colorNeutralForeground2 },
});

const columns: TableColumnDefinition<Customer>[] = [
  createTableColumn<Customer>({
    columnId: "name",
    compare: (a, b) => a.name.localeCompare(b.name),
    renderHeaderCell: () => "Name",
    renderCell: (c) => <TableCellLayout truncate>{c.name}</TableCellLayout>,
  }),
  createTableColumn<Customer>({
    columnId: "city",
    compare: (a, b) => a.city.localeCompare(b.city),
    renderHeaderCell: () => "City",
    renderCell: (c) => <TableCellLayout truncate>{c.city}</TableCellLayout>,
  }),
  createTableColumn<Customer>({
    columnId: "email",
    compare: (a, b) => a.email.localeCompare(b.email),
    renderHeaderCell: () => "Email",
    renderCell: (c) => <TableCellLayout truncate>{c.email}</TableCellLayout>,
  }),
];

// Placeholder data for the example.
const customers: Customer[] = Array.from({ length: 5000 }, (_, i) => ({
  id: String(i),
  name: `Customer ${i + 1}`,
  city: ["Amsterdam", "Cape Town", "Dublin", "Utrecht"][i % 4],
  email: `customer${i + 1}@example.com`,
}));

const ROW_HEIGHT = 44;
const GRID_HEIGHT = 480;

export function CustomerListPage() {
  const styles = useStyles();
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? customers.filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)) : customers;
  }, [query]);

  // Memoized: a new function on every render makes the grid remount its rows.
  const renderRow: RowRenderer<Customer> = useCallback(
    ({ item, rowId }, style) => (
      <DataGridRow<Customer> key={rowId} style={style}>
        {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
      </DataGridRow>
    ),
    [],
  );

  return (
    <main className={styles.page}>
      <Text as="h1" size={600} weight="semibold">
        Customers
      </Text>
      <div className={styles.surface}>
        <div className={styles.bar}>
          <SearchBox
            className={styles.search}
            placeholder="Search name or email"
            aria-label="Search customers"
            value={query}
            onChange={(_, data) => setQuery(data.value)}
          />
        </div>
        {visible.length === 0 ? (
          <div className={styles.empty}>
            <Text weight="semibold">No customers match your search</Text>
          </div>
        ) : (
          <DataGrid items={visible} columns={columns} getRowId={(c: Customer) => c.id} sortable focusMode="composite" aria-label="Customers">
            <DataGridHeader>
              <DataGridRow>{({ renderHeaderCell }) => <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>}</DataGridRow>
            </DataGridHeader>
            <DataGridBody<Customer> itemSize={ROW_HEIGHT} height={GRID_HEIGHT}>
              {renderRow}
            </DataGridBody>
          </DataGrid>
        )}
        <Text className={styles.footer} size={200} block aria-live="polite">
          Showing {visible.length.toLocaleString()} of {customers.length.toLocaleString()} customers
        </Text>
      </div>
    </main>
  );
}
