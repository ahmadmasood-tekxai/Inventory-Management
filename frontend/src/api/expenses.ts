import { apiClient } from '@/api/client';
import type { DailyExpenseSummary, Expense, ExpenseInput } from '@/types';

export const expensesApi = {
  list: async (expenseDate?: string): Promise<Expense[]> => {
    const { data } = await apiClient.get<Expense[]>('/expenses', { params: { expense_date: expenseDate } });
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
