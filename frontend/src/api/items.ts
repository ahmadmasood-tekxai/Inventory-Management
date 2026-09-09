import { apiClient } from '@/api/client';
import type {
  ItemCreateInput,
  ItemDetail,
  ItemUpdateInput,
  ItemWithStock,
  PaginatedResponse,
  SaleEntry,
  SaleEntryInput,
  StockAdjustmentInput,
} from '@/types';

export interface ListItemsParams {
  search?: string;
  low_stock_only?: boolean;
  page?: number;
  page_size?: number;
}

export const itemsApi = {
  list: async (params: ListItemsParams = {}): Promise<PaginatedResponse<ItemWithStock>> => {
    const { data } = await apiClient.get<PaginatedResponse<ItemWithStock>>('/items', { params });
    return data;
  },

  getById: async (id: number): Promise<ItemDetail> => {
    const { data } = await apiClient.get<ItemDetail>(`/items/${id}`);
    return data;
  },

  create: async (payload: ItemCreateInput): Promise<ItemWithStock> => {
    const { data } = await apiClient.post<ItemWithStock>('/items', payload);
    return data;
  },

  update: async (id: number, payload: ItemUpdateInput): Promise<ItemWithStock> => {
    const { data } = await apiClient.patch<ItemWithStock>(`/items/${id}`, payload);
    return data;
  },

  adjustStock: async (id: number, payload: StockAdjustmentInput): Promise<ItemWithStock> => {
    const { data } = await apiClient.post<ItemWithStock>(`/items/${id}/adjust`, payload);
    return data;
  },

  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`/items/${id}`);
  },
};

export const salesApi = {
  list: async (itemId?: number): Promise<SaleEntry[]> => {
    const { data } = await apiClient.get<SaleEntry[]>('/sales', { params: { item_id: itemId } });
    return data;
  },

  create: async (payload: SaleEntryInput): Promise<SaleEntry> => {
    const { data } = await apiClient.post<SaleEntry>('/sales', payload);
    return data;
  },
};
