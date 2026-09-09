import { LogOut, User as UserIcon, Menu } from 'lucide-react';

import { USER_ROLE_LABELS } from '@/constants';
import { useAuth } from '@/hooks/useAuth';

export function Header({
  pageTitle,
  onMenuClick,
}: {
  pageTitle: string;
  onMenuClick?: () => void;
}) {
  const { user, logout } = useAuth();

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger */}
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
          title="Open menu"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <h1 className="text-lg font-semibold text-slate-800">{pageTitle}</h1>
      </div>

      {user && (
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-slate-700 leading-none">
              {user.full_name || user.username}
            </p>

            <p className="text-xs text-slate-400 mt-0.5">
              {USER_ROLE_LABELS[user.role]}
            </p>
          </div>

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-brand-700">
            <UserIcon className="h-4 w-4" />
          </div>

          <button
            onClick={logout}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            title="Logout"
            aria-label="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      )}
    </header>
  );
}