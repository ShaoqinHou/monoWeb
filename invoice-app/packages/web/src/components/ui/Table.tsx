import { forwardRef, type HTMLAttributes, type TdHTMLAttributes, type ThHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

/* ─── Table ─── */
export interface TableProps extends HTMLAttributes<HTMLTableElement> {
  stickyHeader?: boolean;
}

export const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ stickyHeader, className, children, ...props }, ref) => {
    return (
      <div className="relative w-full overflow-auto">
        <table
          ref={ref}
          className={cn(
            "w-full caption-bottom text-sm",
            stickyHeader && "[&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10",
            className,
          )}
          {...props}
        >
          {children}
        </table>
      </div>
    );
  },
);
Table.displayName = "Table";

/* ─── TableHeader ─── */
export const TableHeader = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn("bg-[#f8f9fa] border-b border-[#e5e7eb]", className)}
    {...props}
  />
));
TableHeader.displayName = "TableHeader";

/* ─── TableBody ─── */
export const TableBody = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
));
TableBody.displayName = "TableBody";

/* ─── TableRow ─── */
export const TableRow = forwardRef<
  HTMLTableRowElement,
  HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b border-[#e5e7eb] transition-colors hover:bg-gray-50 data-[state=selected]:bg-gray-100",
      className,
    )}
    {...props}
  />
));
TableRow.displayName = "TableRow";

/* ─── TableHead ─── */
export const TableHead = forwardRef<
  HTMLTableCellElement,
  ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-10 px-4 text-left align-middle font-semibold text-[#6b7280] text-xs uppercase tracking-wide",
      className,
    )}
    {...props}
  />
));
TableHead.displayName = "TableHead";

/* ─── TableCell ─── */
export const TableCell = forwardRef<
  HTMLTableCellElement,
  TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "px-4 py-3 align-middle text-[#1a1a2e]",
      className,
    )}
    {...props}
  />
));
TableCell.displayName = "TableCell";
