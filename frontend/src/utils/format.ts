import { format, parseISO } from 'date-fns';

import { CURRENCY_SYMBOL, DATE_FORMAT_DISPLAY } from '@/constants';

/** Formats a number as "Rs. 1,23,456" style currency for display. */
export function formatCurrency(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (Number.isNaN(num)) return `${CURRENCY_SYMBOL} 0`;
  return `${CURRENCY_SYMBOL} ${num.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

/** Formats a plain quantity number, trimming unnecessary decimal zeros. */
export function formatQuantity(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (Number.isNaN(num)) return '0';
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

/** Formats an ISO date string for display (e.g. "09 Sep 2026"). */
export function formatDate(isoDate: string): string {
  try {
    return format(parseISO(isoDate), DATE_FORMAT_DISPLAY);
  } catch {
    return isoDate;
  }
}

/** Formats a full ISO datetime string for display, including time. */
export function formatDateTime(isoDateTime: string): string {
  try {
    return format(parseISO(isoDateTime), 'dd MMM yyyy, hh:mm a');
  } catch {
    return isoDateTime;
  }
}

/** Today's date as a yyyy-MM-dd string, matching the backend's expected format. */
export function todayIso(): string {
  return format(new Date(), 'yyyy-MM-dd');
}
