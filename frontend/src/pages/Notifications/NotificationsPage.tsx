import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ArrowRight, Wifi } from 'lucide-react';

import { alertsApi } from '@/api/alerts';
import { Card } from '@/components/common/Card';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ROUTES } from '@/constants';
import { formatQuantity } from '@/utils/format';
import type { ItemWithStock } from '@/types';

function StockProgress({ item }: { item: ItemWithStock }) {
  const pct = item.low_stock_threshold > 0
    ? Math.min(100, (Number(item.remaining_stock) / Number(item.low_stock_threshold)) * 100)
    : 0;

  const color =
    Number(item.remaining_stock) === 0
      ? 'bg-rose-600'
      : pct < 50
      ? 'bg-rose-400'
      : 'bg-amber-400';

  return (
    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function NotificationsPage() {
  const navigate = useNavigate();

  const { data: alerts = [], isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['low-stock-alerts'],
    queryFn: alertsApi.getLowStock,
    refetchInterval: 15_000,
    staleTime: 10_000,
  });

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString()
    : null;

  return (
    <DashboardLayout pageTitle="Notifications">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Low Stock Alerts</h2>
          <p className="text-sm text-slate-500">
            Items at or below their minimum stock threshold
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
          <Wifi className="h-3.5 w-3.5 animate-pulse" />
          Live · {lastUpdated ?? 'updating…'}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl bg-slate-200" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <AlertTriangle className="h-8 w-8 text-emerald-500" />
            </div>
            <h3 className="text-base font-semibold text-slate-700">All good!</h3>
            <p className="mt-1 text-sm text-slate-400">
              No items are below their minimum stock level right now.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {alerts.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(ROUTES.ITEM_DETAIL(item.id))}
              className="group relative flex flex-col rounded-xl border border-rose-200 bg-white p-4 text-left shadow-sm transition-all hover:border-rose-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2"
            >
              {/* Critical badge if stock is 0 */}
              {Number(item.remaining_stock) === 0 && (
                <span className="absolute right-3 top-3 rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  Out of Stock
                </span>
              )}

              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-rose-50">
                  <AlertTriangle className="h-5 w-5 text-rose-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">{item.name}</p>
                  <p className="text-xs text-slate-400">{item.code}</p>
                </div>
              </div>

              <div className="mt-4 space-y-1">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Remaining</span>
                  <span
                    className={`font-semibold ${
                      Number(item.remaining_stock) === 0 ? 'text-rose-600' : 'text-amber-600'
                    }`}
                  >
                    {formatQuantity(item.remaining_stock)} {item.unit}
                  </span>
                </div>
                <StockProgress item={item} />
                <p className="text-right text-xs text-slate-400">
                  Min: {formatQuantity(item.low_stock_threshold)} {item.unit}
                </p>
              </div>

              <div className="mt-3 flex items-center gap-1 text-xs font-medium text-rose-600 opacity-0 transition-opacity group-hover:opacity-100">
                View item <ArrowRight className="h-3 w-3" />
              </div>
            </button>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
