/**
 * Central axios instance. Every API module (items.ts, auth.ts, etc.)
 * imports this instead of creating its own axios client, so auth headers,
 * base URL, and error normalization live in exactly one place.
 */
import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { API_BASE_URL, AUTH_TOKEN_KEY } from '@/constants';
import type { ApiErrorResponse } from '@/types';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Normalized, human-readable error message extracted from any API failure. */
export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    const data = axiosError.response?.data;
    if (data?.errors && data.errors.length > 0) {
      return data.errors.map((e) => `${e.field}: ${e.message}`).join(', ');
    }
    if (data?.detail) return data.detail;
    if (axiosError.message) return axiosError.message;
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
