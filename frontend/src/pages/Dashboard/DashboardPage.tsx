import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Boxes, TrendingDown, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';

import { dashboardApi } from '@/api/dashboard';
import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { Loader } from '@/components/common/Loader';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ROUTES } from '@/constants';
import { formatCurrency } from '@/utils/format';

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

export function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: dashboardApi.getSummary,
  });

  return (
    <DashboardLayout pageTitle="Dashboard">
      {isLoading || !data ? (
        <Loader />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Items" value={String(data.total_items)} icon={Boxes} tone="brand" />
            <StatCard label="Low Stock Items" value={String(data.low_stock_items)} icon={TrendingDown} tone="rose" />
            <StatCard
              label="Today's Expenses"
              value={formatCurrency(data.today_expenses_total)}
              icon={AlertTriangle}
              tone="amber"
            />
            <StatCard
              label="Today's Closing Cash"
              value={data.today_closing_cash !== null ? formatCurrency(data.today_closing_cash) : '—'}
              icon={Wallet}
              tone="emerald"
            />
          </div>

          <Card title="Low Stock Alerts" subtitle="Items at or below their threshold — restock soon">
            {data.recent_low_stock_codes.length === 0 ? (
              <p className="text-sm text-slate-400">All items are comfortably stocked. 🎉</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {data.recent_low_stock_codes.map((code) => (
                  <Badge key={code} tone="danger">
                    {code}
                  </Badge>
                ))}
              </div>
            )}
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Link to={ROUTES.ITEMS} className="group">
              <Card className="transition-shadow group-hover:shadow-md">
                <p className="text-sm font-semibold text-slate-800">Manage Items &amp; Stock →</p>
                <p className="mt-1 text-xs text-slate-400">Add items, record sales, view stock history</p>
              </Card>
            </Link>
            <Link to={ROUTES.EXPENSES} className="group">
              <Card className="transition-shadow group-hover:shadow-md">
                <p className="text-sm font-semibold text-slate-800">Log Today's Expenses →</p>
                <p className="mt-1 text-xs text-slate-400">Add expense entries, see the daily total</p>
              </Card>
            </Link>
            <Link to={ROUTES.CASH} className="group">
              <Card className="transition-shadow group-hover:shadow-md">
                <p className="text-sm font-semibold text-slate-800">Update Cash Book →</p>
                <p className="mt-1 text-xs text-slate-400">Set opening cash, view closing balance</p>
              </Card>
            </Link>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
