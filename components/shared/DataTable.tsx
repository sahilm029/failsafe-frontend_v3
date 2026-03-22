"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import { SkeletonTable } from "./LoadingSkeleton";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";

export interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  className?: string;
  rowClassName?: (item: T) => string;
}

function DataTableInternal<T extends { id?: string | number }>({
  columns,
  data,
  onRowClick,
  loading = false,
  emptyMessage = "No data available",
  emptyIcon,
  className,
  rowClassName,
}: DataTableProps<T>) {
  if (loading) {
    return <SkeletonTable rows={5} columns={columns.length} />;
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        {emptyIcon || (
          <div className="w-12 h-12 rounded-full bg-card flex items-center justify-center mb-4">
            <MagnifyingGlassIcon className="w-6 h-6 text-text-muted" />
          </div>
        )}
        <p className="text-text-secondary text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  "text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider",
                  column.className
                )}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr
              key={item.id || index}
              onClick={() => onRowClick?.(item)}
              className={cn(
                "border-b border-border transition-colors",
                onRowClick && "cursor-pointer hover:bg-card/50",
                rowClassName?.(item)
              )}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn(
                    "px-4 py-3 text-sm text-text-primary",
                    column.className
                  )}
                >
                  {column.render
                    ? column.render(item)
                    : ((item as Record<string, unknown>)[column.key] as React.ReactNode) ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const DataTable = memo(DataTableInternal) as typeof DataTableInternal;
