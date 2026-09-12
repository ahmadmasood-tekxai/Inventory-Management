import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { alertsApi } from '@/api/alerts';
import { useAuth } from '@/hooks/useAuth';

export function useNotifications() {
  const { user } = useAuth();
  
  const { data: alerts = [], isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['low-stock-alerts'],
    queryFn: alertsApi.getLowStock,
    refetchInterval: 15_000,
    staleTime: 10_000,
    enabled: !!user,
  });

  const [dismissedAlerts, setDismissedAlerts] = useState<Record<number, number>>({});

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('dismissedAlerts');
      if (stored) {
        setDismissedAlerts(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to parse dismissedAlerts', e);
    }
  }, []);

  const unreadAlerts = alerts.filter((item) => {
    const dismissedStock = dismissedAlerts[item.id];
    // If it hasn't been dismissed, or the stock has changed since it was dismissed, it's unread.
    return dismissedStock === undefined || Number(item.remaining_stock) !== dismissedStock;
  });

  const unreadCount = unreadAlerts.length;

  const markAllAsRead = useCallback(() => {
    const newDismissed = { ...dismissedAlerts };
    alerts.forEach((item) => {
      newDismissed[item.id] = Number(item.remaining_stock);
    });
    setDismissedAlerts(newDismissed);
    localStorage.setItem('dismissedAlerts', JSON.stringify(newDismissed));
  }, [alerts, dismissedAlerts]);

  // A helper function to optionally just navigate, but user said "on icon clicn notification clic read ho jjat y"
  // so clicking the icon itself can trigger markAllAsRead.

  return {
    alerts,
    unreadAlerts,
    unreadCount,
    isLoading,
    dataUpdatedAt,
    markAllAsRead,
    dismissedAlerts,
  };
}
