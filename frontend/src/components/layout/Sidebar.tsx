import { NavLink } from 'react-router-dom';

import {
  Bell,
  Boxes,
  LayoutDashboard,
  Receipt,
  ShoppingCart,
  Wallet,
  TrendingUp,
  X,
} from 'lucide-react';
import clsx from 'clsx';

import { ROUTES } from '@/constants';
import { useNotifications } from '@/hooks/useNotifications';


const navItems = [
  {
    to: ROUTES.DASHBOARD,
    label: 'Dashboard',
    icon: LayoutDashboard,
    end: true,
  },
  { to: ROUTES.ITEMS, label: 'Items & Stock', icon: Boxes },
  { to: ROUTES.SALES, label: 'Sales', icon: TrendingUp },
  { to: ROUTES.EXPENSES, label: 'Expenses', icon: Receipt },
  { to: ROUTES.CASH, label: 'Cash Book', icon: Wallet },
  { to: ROUTES.PURCHASES, label: 'Purchases', icon: ShoppingCart },
];

export function Sidebar({
  isOpen = false,
  onClose,
}: {
  isOpen?: boolean;
  onClose?: () => void;
}) {

  const { unreadCount: alertCount } = useNotifications();
  return (
    <>
      {/* Mobile Overlay */}
      <div
        onClick={onClose}
        className={clsx(
          'fixed inset-0 z-40 bg-black/40 transition-opacity md:hidden',
          isOpen
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0'
        )}
      />

      {/* Sidebar */}
      <aside
        className={clsx(
          'z-50 flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white',
          'fixed inset-y-0 left-0 transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          'md:static md:translate-x-0 md:flex'
        )}
      >
        {/* Logo / Header */}
        <div className="flex items-center justify-between gap-2 px-5 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white font-bold">
              Q
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-800 leading-none">
                Qasim Inventory
              </p>

              <p className="text-[11px] text-slate-400 mt-0.5">
                Stock &amp; Cash Management
              </p>
            </div>
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 md:hidden"
            title="Close menu"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
          {/* Notifications link with live badge */}
          <NavLink
            to={ROUTES.NOTIFICATIONS}
            onClick={onClose}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              )
            }
          >
            <div className="relative">
              <Bell className="h-4 w-4" />
              {alertCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white leading-none">
                  {alertCount > 9 ? '9+' : alertCount}
                </span>
              )}
            </div>
            Notifications
            {alertCount > 0 && (
              <span className="ml-auto rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
                {alertCount}
              </span>
            )}
          </NavLink>
        </nav>
      </aside>
    </>
  );
}