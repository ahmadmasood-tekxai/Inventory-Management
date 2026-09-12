import { apiClient } from '@/api/client';
import type { ItemWithStock } from '@/types';

export const alertsApi = {
  getLowStock: async (): Promise<ItemWithStock[]> => {
    const { data } = await apiClient.get<ItemWithStock[]>('/alerts/low-stock');
    return data;
  },
};
