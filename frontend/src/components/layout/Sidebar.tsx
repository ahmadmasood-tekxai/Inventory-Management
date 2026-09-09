import { NavLink } from 'react-router-dom';
import { Boxes, LayoutDashboard, Receipt, ShoppingCart, Wallet, TrendingUp } from 'lucide-react';
import clsx from 'clsx';

import { ROUTES } from '@/constants';

const navItems = [
  { to: ROUTES.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: ROUTES.ITEMS, label: 'Items & Stock', icon: Boxes },
  { to: ROUTES.SALES, label: 'Sales', icon: TrendingUp },
  { to: ROUTES.EXPENSES, label: 'Expenses', icon: Receipt },
  { to: ROUTES.CASH, label: 'Cash Book', icon: Wallet },
  { to: ROUTES.PURCHASES, label: 'Purchases', icon: ShoppingCart },
];

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
      <div className="flex items-center gap-2 px-5 py-5 border-b border-slate-100">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white font-bold">
          Q
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800 leading-none">Qasim Inventory</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Stock &amp; Cash Management</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
