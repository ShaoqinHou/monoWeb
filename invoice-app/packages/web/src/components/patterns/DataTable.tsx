import { useState, useMemo, useCallback } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../ui/Table";
import { cn } from "../../lib/cn";

export interface Column<T> {
  header: string;
  accessor: keyof T & string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchable?: boolean;
  pagination?: boolean;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

type SortDirection = "asc" | "desc";

interface SortState {
  column: string;
  direction: SortDirection;
}

const PAGE_SIZES = [10, 25, 50] as const;

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  searchable = false,
  pagination = false,
  onRowClick,
  emptyMessage = "No data available",
}: DataTableProps<T>) {
  const [sort, setSort] = useState<SortState | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZES[0]);

  const handleSort = useCallback(
    (column: Column<T>) => {
      if (!column.sortable) return;

      setSort((prev) => {
        if (prev?.column === column.accessor) {
          return prev.direction === "asc"
            ? { column: column.accessor, direction: "desc" }
            : null;
        }
        return { column: column.accessor, direction: "asc" };
      });
    },
    [],
  );

  // Filter data by search term
  const filteredData = useMemo(() => {
    if (!search) return data;

    const lower = search.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        const val = row[col.accessor];
        return String(val).toLowerCase().includes(lower);
      }),
    );
  }, [data, search, columns]);

  // Sort filtered data
  const sortedData = useMemo(() => {
    if (!sort) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sort.column];
      const bVal = b[sort.column];

      let comparison = 0;
      if (typeof aVal === "number" && typeof bVal === "number") {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }

      return sort.direction === "asc" ? comparison : -comparison;
    });
  }, [filteredData, sort]);

  // Paginate sorted data
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    const start = page * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, pagination, page, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);
  const start = page * pageSize + 1;
  const end = Math.min((page + 1) * pageSize, sortedData.length);

  const handlePageSizeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setPageSize(Number(e.target.value));
      setPage(0);
    },
    [],
  );

  return (
    <div className="flex flex-col gap-4">
      {searchable && (
        <div>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="w-full max-w-sm rounded border border-[#e5e7eb] px-3 py-2 text-sm text-[#1a1a2e] placeholder:text-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#0078c8]/20 focus:border-[#0078c8]"
          />
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead
                key={col.accessor}
                onClick={() => handleSort(col)}
                className={cn(
                  col.sortable && "cursor-pointer select-none",
                )}
              >
                <span>{col.header}</span>
                {col.sortable && (
                  <span className="ml-1 text-[#9ca3af]" aria-hidden="true">
                    {sort?.column === col.accessor
                      ? sort.direction === "asc"
                        ? "\u2191"
                        : "\u2193"
                      : "\u2195"}
                  </span>
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedData.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="text-center py-8 text-[#6b7280]"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            paginatedData.map((row, rowIndex) => (
              <TableRow
                key={rowIndex}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(onRowClick && "cursor-pointer")}
              >
                {columns.map((col) => (
                  <TableCell key={col.accessor}>
                    {col.render
                      ? col.render(row)
                      : String(row[col.accessor] ?? "")}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {pagination && sortedData.length > 0 && (
        <div className="flex items-center justify-between text-sm text-[#6b7280]">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={handlePageSizeChange}
              className="rounded border border-[#e5e7eb] px-2 py-1 text-sm"
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-4">
            <span>
              {start}-{end} of {sortedData.length}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 0}
                aria-label="Previous page"
                className="rounded px-2 py-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                &laquo; Prev
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages - 1}
                aria-label="Next page"
                className="rounded px-2 py-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next &raquo;
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
