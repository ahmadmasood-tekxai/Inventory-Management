import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Boxes, TrendingDown, Wallet, Image as ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

import { dashboardApi } from '@/api/dashboard';
import { itemsApi } from '@/api/items';
import { Card } from '@/components/common/Card';
import { Pagination } from '@/components/common/Pagination';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { API_BASE_URL, ROUTES } from '@/constants';
import { formatCurrency, formatQuantity } from '@/utils/format';

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: typeof Boxes;
  tone: 'brand' | 'amber' | 'rose' | 'emerald';
}) {
  const toneClasses = {
    brand: 'bg-brand-50 text-brand-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  };
  return (
    <Card>
      <div className="flex items-center gap-4">
        <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${toneClasses[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-400">{label}</p>
          <p className="text-xl font-semibold text-slate-800">{value}</p>
        </div>
      </div>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 rounded-lg bg-slate-200"></div>
              <div className="space-y-2 flex-1">
                <div className="h-3 w-1/2 rounded bg-slate-200"></div>
                <div className="h-5 w-3/4 rounded bg-slate-200"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <Card title="Low Stock Alerts" subtitle="Items at or below their threshold — restock soon">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
              <div className="h-12 w-12 rounded-lg bg-slate-200 flex-shrink-0"></div>
              <div className="space-y-2 flex-1">
                <div className="h-4 w-3/4 rounded bg-slate-200"></div>
                <div className="h-3 w-1/2 rounded bg-slate-200"></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <div className="h-4 w-1/2 rounded bg-slate-200 mb-2"></div>
            <div className="h-3 w-3/4 rounded bg-slate-200"></div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function DashboardPage() {
  const [lowStockPage, setLowStockPage] = useState(1);

  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: dashboardApi.getSummary,
  });

  const { data: lowStockData, isLoading: isLowStockLoading } = useQuery({
    queryKey: ['items', 'low-stock', lowStockPage],
    queryFn: () => itemsApi.list({ low_stock_only: true, page: lowStockPage, page_size: 6 }),
  });

  const isLoading = isSummaryLoading || isLowStockLoading;

  return (
    <DashboardLayout pageTitle="Dashboard">
      {isLoading || !summary ? (
        <DashboardSkeleton />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Items" value={String(summary.total_items)} icon={Boxes} tone="brand" />
            <StatCard label="Low Stock Items" value={String(summary.low_stock_items)} icon={TrendingDown} tone="rose" />
            <StatCard
              label="Today's Expenses"
              value={formatCurrency(summary.today_expenses_total)}
              icon={AlertTriangle}
              tone="amber"
            />
            <StatCard
              label="Today's Closing Cash"
              value={summary.today_closing_cash !== null ? formatCurrency(summary.today_closing_cash) : '—'}
              icon={Wallet}
              tone="emerald"
            />
          </div>

          <Card noPadding title="Low Stock Alerts" subtitle="Items at or below their threshold — restock soon">
            <div className="p-4">
              {!lowStockData?.items || lowStockData.items.length === 0 ? (
                <p className="text-sm text-slate-400">All items are comfortably stocked. 🎉</p>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {lowStockData.items.map((item) => (
                    <Link
                      key={item.id}
                      to={ROUTES.ITEM_DETAIL(item.id)}
                      className="group flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition-colors hover:border-brand-200 hover:bg-brand-50"
                    >
                      {item.image_path ? (
                        <img
                          src={`${API_BASE_URL.replace('/api/v1', '')}/uploads/items/${item.image_path.split(/[/\\]/).pop()}`}
                          alt={item.name}
                          className="h-12 w-12 rounded-lg object-cover border border-slate-200 shadow-sm flex-shrink-0"
                        />
                      ) : (
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 border border-slate-200 group-hover:bg-white group-hover:border-brand-200">
                          <ImageIcon className="h-5 w-5 text-slate-400 group-hover:text-brand-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">{item.name}</p>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">{item.code}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-rose-600">{formatQuantity(item.remaining_stock)}</p>
                        <p className="text-[10px] font-medium text-slate-400">{item.unit}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            {lowStockData && lowStockData.total_pages > 1 && (
              <div className="border-t border-slate-100">
                <Pagination
                  page={lowStockData.page}
                  pageSize={lowStockData.page_size}
                  total={lowStockData.total}
                  totalPages={lowStockData.total_pages}
                  onPageChange={setLowStockPage}
                />
              </div>
            )}
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Link to={ROUTES.ITEMS} className="group">
              <Card className="transition-shadow group-hover:shadow-md h-full">
                <p className="text-sm font-semibold text-slate-800 group-hover:text-brand-600 transition-colors">Manage Items &amp; Stock →</p>
                <p className="mt-1 text-xs text-slate-400">Add items, record sales, view stock history</p>
              </Card>
            </Link>
            <Link to={ROUTES.EXPENSES} className="group">
              <Card className="transition-shadow group-hover:shadow-md h-full">
                <p className="text-sm font-semibold text-slate-800 group-hover:text-brand-600 transition-colors">Log Today's Expenses →</p>
                <p className="mt-1 text-xs text-slate-400">Add expense entries, see the daily total</p>
              </Card>
            </Link>
            <Link to={ROUTES.CASH} className="group">
              <Card className="transition-shadow group-hover:shadow-md h-full">
                <p className="text-sm font-semibold text-slate-800 group-hover:text-brand-600 transition-colors">Update Cash Book →</p>
                <p className="mt-1 text-xs text-slate-400">Set opening cash, view closing balance</p>
              </Card>
            </Link>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
