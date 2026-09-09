import { apiClient } from '@/api/client';
import type { CashBookInput, CashBookWithBalance } from '@/types';

export const cashApi = {
  list: async (): Promise<CashBookWithBalance[]> => {
    const { data } = await apiClient.get<CashBookWithBalance[]>('/cash');
    return data;
  },

  getByDate: async (bookDate: string): Promise<CashBookWithBalance> => {
    const { data } = await apiClient.get<CashBookWithBalance>(`/cash/${bookDate}`);
    return data;
  },

  setOpeningCash: async (payload: CashBookInput): Promise<CashBookWithBalance> => {
    const { data } = await apiClient.post<CashBookWithBalance>('/cash', payload);
    return data;
  },
};
