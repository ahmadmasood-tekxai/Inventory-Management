import { apiClient } from '@/api/client';
import type { DashboardSummary } from '@/types';

export const dashboardApi = {
  getSummary: async (): Promise<DashboardSummary> => {
    const { data } = await apiClient.get<DashboardSummary>('/dashboard/summary');
    return data;
  },
};
