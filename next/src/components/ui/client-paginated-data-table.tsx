"use client";

import { DataTable, type Column } from "@/components/ui/data-table";
import {
  useDataTableState,
  type DataTableState,
  type DataTableStateSetters,
} from "@/components/ui/use-data-table-state";

/**
 * Self-contained data table that owns its search / sort / page state
 * internally. This is the default callers want: drop it in, hand it
 * data + columns + a rowKey, and you're done.
 *
 * For URL-synced or server-paginated variants, see `ServerDataTable`
 * or use `DataTable` directly with `serverTotalItems` / `serverPage`.
 */
export interface ClientPaginatedDataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  pageSize?: number;
  searchable?: boolean;
  toolbarTitle?: string;
  toolbarSummary?: React.ReactNode;
  toolbarActions?: React.ReactNode;
  searchPlaceholder?: string;
  emptyMessage?: string;
  emptyStateIcon?: Parameters<typeof DataTable>[0]["emptyStateIcon"];
  onRowClick?: (row: T) => void;
  rowKey: (row: T) => string;
  tableClassName?: string;
  scrollAreaClassName?: string;
  initialState?: Partial<DataTableState>;
}

export function ClientPaginatedDataTable<T extends object>(
  props: ClientPaginatedDataTableProps<T>,
) {
  const [state, setters] = useDataTableState({ initial: props.initialState });
  return (
    <DataTable
      {...props}
      searchValue={state.search}
      serverPage={state.page}
      onServerPageChange={setters.setPage}
      onServerSearch={(value) => {
        setters.setSearch(value);
        setters.setPage(1);
      }}
    />
  );
}

// Re-export for advanced callers that need the state / setters from
// outside the table.
export type { DataTableState, DataTableStateSetters };
