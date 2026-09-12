import { useRef, useEffect } from 'react';
import { Bell, LogOut, User as UserIcon, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { USER_ROLE_LABELS, ROUTES } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';

// Plays a short, professional alert beep using Web Audio API (no external files needed)
function playAlertSound() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
    setTimeout(() => ctx.close(), 600);
  } catch {
    // Silently fail if audio context isn't available
  }
}

export function Header({
  pageTitle,
  onMenuClick,
}: {
  pageTitle: string;
  onMenuClick?: () => void;
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const prevCountRef = useRef<number>(0);
  const { unreadCount, markAllAsRead } = useNotifications();

  useEffect(() => {
    if (unreadCount > prevCountRef.current) {
      playAlertSound();
    }
    prevCountRef.current = unreadCount;
  }, [unreadCount]);

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
          {/* Bell Alert Button */}
          <button
            onClick={() => {
              markAllAsRead();
              navigate(ROUTES.NOTIFICATIONS);
            }}
            className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            title={unreadCount > 0 ? `${unreadCount} low-stock alert${unreadCount !== 1 ? 's' : ''}` : 'No alerts'}
            aria-label={`Notifications (${unreadCount} alerts)`}
          >
            <Bell
              className={`h-5 w-5 transition-all ${
                unreadCount > 0 ? 'text-amber-500 animate-[wiggle_0.4s_ease-in-out]' : ''
              }`}
            />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

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