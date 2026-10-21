import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export interface Column<T> {
  header: string;
  cell: (row: T) => ReactNode;
  className?: string | undefined;
}

export function DataTable<T extends { id: string }>({ columns, rows, loading }: { columns: Column<T>[]; rows: T[]; loading?: boolean | undefined }) {
  return (
    <div className="overflow-x-auto rounded-md border bg-card">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="border-b text-left">
            {columns.map((c) => (
              <th key={c.header} className={`px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground ${c.className ?? ""}`}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b last:border-0">
                  {columns.map((c) => (
                    <td key={c.header} className="px-4 py-3"><Skeleton className="h-5 w-full" /></td>
                  ))}
                </tr>
              ))
            : rows.map((r) => (
                <tr key={r.id} className="border-b last:border-0 hover:bg-muted/40">
                  {columns.map((c) => (
                    <td key={c.header} className={`px-4 py-3 align-middle ${c.className ?? ""}`}>{c.cell(r)}</td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}
