import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@speakle/shared';
import { setToken } from '../api/client';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user: User, token: string) => {
        setToken(token);
        set({ user, token, isAuthenticated: true });
      },
      clearAuth: () => {
        setToken(null);
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'speakle-auth',
      partialize: (state: AuthState) => ({ token: state.token, user: state.user }),
    },
  ),
);
