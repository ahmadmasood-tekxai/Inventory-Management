/**
 * Global, app-wide types. These mirror the backend Pydantic schemas 1:1
 * (see backend/app/schemas/*.py) so the API contract stays in sync on
 * both sides of the stack. Do not redefine these shapes locally in a
 * page or component — import from here.
 */

// ---------------------------------------------------------------------------
// Enums (mirrors backend/app/constants.py)
// ---------------------------------------------------------------------------
export enum UserRole {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
}

export enum StockMovementType {
  OPENING = 'OPENING',
  SALE = 'SALE',
  PURCHASE = 'PURCHASE',
  ADJUSTMENT = 'ADJUSTMENT',
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  full_name?: string;
  role?: UserRole;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

// ---------------------------------------------------------------------------
// Items & Stock
// ---------------------------------------------------------------------------
export interface Item {
  id: number;
  code: string;
  name: string;
  unit: string;
  opening_stock: number;
  low_stock_threshold: number;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ItemWithStock extends Item {
  remaining_stock: number;
  total_sold: number;
  total_purchased: number;
  is_low_stock: boolean;
}

export interface StockMovement {
  id: number;
  item_id: number;
  movement_type: StockMovementType;
  quantity_delta: number;
  note?: string | null;
  created_at: string;
}

export interface ItemDetail extends ItemWithStock {
  movements: StockMovement[];
}

export interface ItemCreateInput {
  code: string;
  name: string;
  unit?: string;
  opening_stock?: number;
  low_stock_threshold?: number;
  notes?: string;
}

export interface ItemUpdateInput {
  name?: string;
  unit?: string;
  low_stock_threshold?: number;
  notes?: string;
}

export interface StockAdjustmentInput {
  quantity_delta: number;
  note?: string;
}

// ---------------------------------------------------------------------------
// Sales
// ---------------------------------------------------------------------------
export interface SaleEntryInput {
  item_id: number;
  quantity: number;
  sale_date: string; // ISO yyyy-MM-dd
  note?: string;
}

export interface SaleEntry {
  id: number;
  item_id: number;
  item_code: string;
  item_name: string;
  quantity: number;
  sale_date: string;
  note?: string | null;
  created_at: string;
  remaining_stock_after: number;
}

// ---------------------------------------------------------------------------
// Expenses
// ---------------------------------------------------------------------------
export interface ExpenseInput {
  amount: number;
  description?: string;
  expense_date: string;
}

export interface Expense {
  id: number;
  amount: number;
  description: string;
  expense_date: string;
  created_at: string;
}

export interface DailyExpenseSummary {
  expense_date: string;
  total_expenses: number;
  entries: Expense[];
}

// ---------------------------------------------------------------------------
// Cash Book
// ---------------------------------------------------------------------------
export interface CashBookInput {
  book_date: string;
  opening_cash: number;
}

export interface CashBookWithBalance {
  id: number;
  book_date: string;
  opening_cash: number;
  total_expenses: number;
  closing_balance: number;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Purchases / Carton Entries
// ---------------------------------------------------------------------------
export interface PurchaseEntryInput {
  item_id?: number | null;
  supplier_name?: string;
  total_amount: number;
  rate_per_unit: number;
  purchase_date: string;
  note?: string;
}

export interface PurchaseEntry {
  id: number;
  item_id?: number | null;
  supplier_name?: string | null;
  total_amount: number;
  rate_per_unit: number;
  quantity: number;
  purchase_date: string;
  note?: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
export interface DashboardSummary {
  total_items: number;
  low_stock_items: number;
  today_expenses_total: number;
  today_closing_cash: number | null;
  recent_low_stock_codes: string[];
}

// ---------------------------------------------------------------------------
// Generic API shapes
// ---------------------------------------------------------------------------
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ApiErrorField {
  field: string;
  message: string;
}

export interface ApiErrorResponse {
  detail: string;
  errors?: ApiErrorField[];
}
