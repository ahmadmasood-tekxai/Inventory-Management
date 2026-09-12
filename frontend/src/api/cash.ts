import { apiClient } from '@/api/client';
import type { CashBookInput, CashBookWithBalance, PaginatedResponse } from '@/types';

export interface ListCashParams {
  start_date?: string;
  end_date?: string;
  page?: number;
  page_size?: number;
}

export const cashApi = {
  list: async (params: ListCashParams = {}): Promise<PaginatedResponse<CashBookWithBalance>> => {
    const { data } = await apiClient.get<PaginatedResponse<CashBookWithBalance>>('/cash', { params });
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
