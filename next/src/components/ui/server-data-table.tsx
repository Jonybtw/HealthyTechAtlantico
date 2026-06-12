"use client";

import { DataTable, type Column } from "@/components/ui/data-table";

/**
 * Server-paginated variant of the data table. Search and pagination
 * state is fully controlled — the caller is expected to push it
 * into the URL (search params) or a TanStack Query state, and
 * reconcile the `totalItems` from the server response.
 *
 * Use this when the underlying dataset can be tens of thousands of
 * rows and the cost of shipping them all to the client outweighs
 * the simplicity of `ClientPaginatedDataTable`.
 */
export interface ServerDataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  totalItems: number;
  page: number;
  onPageChange: (page: number) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
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
}

export function ServerDataTable<T extends object>(props: ServerDataTableProps<T>) {
  return (
    <DataTable
      {...props}
      serverTotalItems={props.totalItems}
      serverPage={props.page}
      onServerPageChange={props.onPageChange}
      searchValue={props.searchValue}
      onServerSearch={props.onSearchChange}
    />
  );
}
