/**
 * App-wide constants. Mirrors backend/app/constants.py so both sides of
 * the stack agree on pagination sizes, thresholds, and fixed option lists.
 * Never hardcode these values again elsewhere in the frontend.
 */
import { StockMovementType, UserRole } from '@/types';

export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8000/api/v1';

export const AUTH_TOKEN_KEY = 'qasim_inventory_access_token';
export const REFRESH_TOKEN_KEY = 'qasim_inventory_refresh_token';
export const AUTH_USER_KEY = 'qasim_inventory_user';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const LOW_STOCK_THRESHOLD_DEFAULT = 5;

export const DEFAULT_UNIT = 'pcs';

export const UNIT_OPTIONS: string[] = ['pcs', 'kg', 'meter', 'gaz', 'roll', 'box', 'dozen'];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Admin',
  [UserRole.STAFF]: 'Staff',
};

export const STOCK_MOVEMENT_LABELS: Record<StockMovementType, string> = {
  [StockMovementType.OPENING]: 'Opening Stock',
  [StockMovementType.SALE]: 'Sale',
  [StockMovementType.PURCHASE]: 'Purchase',
  [StockMovementType.ADJUSTMENT]: 'Adjustment',
};

export const STOCK_MOVEMENT_COLORS: Record<StockMovementType, string> = {
  [StockMovementType.OPENING]: 'bg-slate-100 text-slate-700 border-slate-200',
  [StockMovementType.SALE]: 'bg-rose-50 text-rose-700 border-rose-200',
  [StockMovementType.PURCHASE]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  [StockMovementType.ADJUSTMENT]: 'bg-amber-50 text-amber-700 border-amber-200',
};

export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/',
  ITEMS: '/items',
  ITEM_DETAIL: (id: number | string = ':itemId') => `/items/${id}`,
  SALES: '/sales',
  EXPENSES: '/expenses',
  CASH: '/cash',
  PURCHASES: '/purchases',
} as const;

export const CURRENCY_SYMBOL = 'Rs.';

export const DATE_FORMAT_DISPLAY = 'dd MMM yyyy';
export const DATE_FORMAT_API = 'yyyy-MM-dd';
