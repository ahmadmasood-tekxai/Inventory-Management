import { apiClient } from '@/api/client';
import type { DailyExpenseSummary, Expense, ExpenseInput, PaginatedResponse } from '@/types';

export interface ListExpensesParams {
  search?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  page_size?: number;
}

export const expensesApi = {
  list: async (params: ListExpensesParams = {}): Promise<PaginatedResponse<Expense>> => {
    const { data } = await apiClient.get<PaginatedResponse<Expense>>('/expenses', { params });
    return data;
  },

  create: async (payload: ExpenseInput): Promise<Expense> => {
    const { data } = await apiClient.post<Expense>('/expenses', payload);
    return data;
  },

  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`/expenses/${id}`);
  },

  dailySummary: async (forDate: string): Promise<DailyExpenseSummary> => {
    const { data } = await apiClient.get<DailyExpenseSummary>(`/expenses/summary/${forDate}`);
    return data;
  },
};
