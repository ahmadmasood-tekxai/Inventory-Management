import { apiClient } from '@/api/client';
import type { PurchaseEntry, PurchaseEntryInput, PaginatedResponse } from '@/types';

export interface ListPurchasesParams {
  search?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  page_size?: number;
}

export const purchasesApi = {
  list: async (params: ListPurchasesParams = {}): Promise<PaginatedResponse<PurchaseEntry>> => {
    const { data } = await apiClient.get<PaginatedResponse<PurchaseEntry>>('/purchases', { params });
    return data;
  },

  create: async (payload: PurchaseEntryInput): Promise<PurchaseEntry> => {
    const { data } = await apiClient.post<PurchaseEntry>('/purchases', payload);
    return data;
  },
};
