import { apiClient } from '@/api/client';
import type { LoginRequest, RegisterRequest, TokenResponse, User } from '@/types';

export const authApi = {
  login: async (payload: LoginRequest): Promise<TokenResponse> => {
    const { data } = await apiClient.post<TokenResponse>('/auth/login', payload);
    return data;
  },

  register: async (payload: RegisterRequest): Promise<User> => {
    const { data } = await apiClient.post<User>('/auth/register', payload);
    return data;
  },

  getMe: async (): Promise<User> => {
    const { data } = await apiClient.get<User>('/auth/me');
    return data;
  },
};
