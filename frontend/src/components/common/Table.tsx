import type { ReactNode } from 'react';
import clsx from 'clsx';

export interface TableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  rowKey: (row: T) => string | number;
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

/**
 * Generic, typed data table used across Items, Sales, Expenses, Cash and
 * Purchases pages. Column definitions are passed in per-page so this stays
 * a single reusable component instead of copy-pasted markup everywhere.
 */
export function Table<T>({
  columns,
  data,
  rowKey,
  isLoading,
  emptyMessage = 'No records found.',
  onRowClick,
}: TableProps<T>) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            {columns.map((col) => (
              <th
                key={col.key}
                className={clsx(
                  'whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500',
                  col.align === 'right' && 'text-right',
                  col.align === 'center' && 'text-center'
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, rowIndex) => (
              <tr key={`skeleton-${rowIndex}`} className="border-b border-slate-100 last:border-0">
                {columns.map((col, colIndex) => (
                  <td
                    key={`skeleton-${rowIndex}-${colIndex}`}
                    className={clsx(
                      'whitespace-nowrap px-4 py-3',
                      col.align === 'right' && 'text-right',
                      col.align === 'center' && 'text-center',
                      col.className
                    )}
                  >
                    <div
                      className="h-4 animate-pulse rounded bg-slate-200"
                      style={{
                        width: `${Math.floor(Math.random() * 40) + 40}%`, // random width between 40-80%
                        marginLeft: col.align === 'right' || col.align === 'center' ? 'auto' : undefined,
                        marginRight: col.align === 'center' ? 'auto' : undefined,
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-slate-400">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={() => onRowClick?.(row)}
                className={clsx(
                  'border-b border-slate-100 last:border-0',
                  onRowClick && 'cursor-pointer hover:bg-slate-50'
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={clsx(
                      'whitespace-nowrap px-4 py-3 text-slate-700',
                      col.align === 'right' && 'text-right',
                      col.align === 'center' && 'text-center',
                      col.className
                    )}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
