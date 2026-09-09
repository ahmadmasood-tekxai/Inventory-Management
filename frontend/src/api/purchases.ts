import { apiClient } from '@/api/client';
import type { PurchaseEntry, PurchaseEntryInput } from '@/types';

export const purchasesApi = {
  list: async (): Promise<PurchaseEntry[]> => {
    const { data } = await apiClient.get<PurchaseEntry[]>('/purchases');
    return data;
  },

  create: async (payload: PurchaseEntryInput): Promise<PurchaseEntry> => {
    const { data } = await apiClient.post<PurchaseEntry>('/purchases', payload);
    return data;
  },
};
