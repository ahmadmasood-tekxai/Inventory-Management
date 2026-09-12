import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';

export interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

const CONFIGS = {
  success: {
    icon: CheckCircle2,
    bg: 'bg-emerald-50 border-emerald-200',
    icon_color: 'text-emerald-600',
    text: 'text-emerald-900',
    bar: 'bg-emerald-500',
  },
  error: {
    icon: XCircle,
    bg: 'bg-rose-50 border-rose-200',
    icon_color: 'text-rose-600',
    text: 'text-rose-900',
    bar: 'bg-rose-500',
  },
  info: {
    icon: Info,
    bg: 'bg-blue-50 border-blue-200',
    icon_color: 'text-blue-600',
    text: 'text-blue-900',
    bar: 'bg-blue-500',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-amber-50 border-amber-200',
    icon_color: 'text-amber-600',
    text: 'text-amber-900',
    bar: 'bg-amber-500',
  },
};

export function Toast({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: number) => void;
}) {
  const [visible, setVisible] = useState(false);
  const cfg = CONFIGS[item.type];
  const Icon = cfg.icon;

  // Mount animation
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  return (
    <div
      className={`pointer-events-auto relative flex items-start gap-3 overflow-hidden rounded-xl border px-4 py-3 shadow-lg transition-all duration-300 ${cfg.bg} ${
        visible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
      }`}
    >
      {/* Progress bar */}
      <div className={`absolute bottom-0 left-0 h-0.5 ${cfg.bar} animate-[shrink_3.5s_linear_forwards]`} style={{ width: '100%' }} />

      <Icon className={`mt-0.5 h-4 w-4 flex-shrink-0 ${cfg.icon_color}`} />
      <p className={`flex-1 text-sm font-medium ${cfg.text}`}>{item.message}</p>
      <button
        onClick={() => onDismiss(item.id)}
        className={`flex-shrink-0 rounded p-0.5 opacity-60 hover:opacity-100 ${cfg.icon_color}`}
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
