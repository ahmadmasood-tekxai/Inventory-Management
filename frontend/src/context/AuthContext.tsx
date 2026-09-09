import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { authApi } from '@/api/auth';
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from '@/constants';
import type { LoginRequest, User } from '@/types';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  logout: () => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const cachedUser = localStorage.getItem(AUTH_USER_KEY);

    if (token && cachedUser) {
      setUser(JSON.parse(cachedUser) as User);
      // Revalidate in the background in case the token expired server-side.
      authApi
        .getMe()
        .then((freshUser) => {
          setUser(freshUser);
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(freshUser));
        })
        .catch(() => {
          setUser(null);
          localStorage.removeItem(AUTH_TOKEN_KEY);
          localStorage.removeItem(AUTH_USER_KEY);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (payload: LoginRequest) => {
    const tokenResponse = await authApi.login(payload);
    localStorage.setItem(AUTH_TOKEN_KEY, tokenResponse.access_token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(tokenResponse.user));
    setUser(tokenResponse.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isAuthenticated: !!user, isLoading, login, logout }),
    [user, isLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
