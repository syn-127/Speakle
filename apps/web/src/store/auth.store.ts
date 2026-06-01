import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@speakle/shared';
import { setToken } from '../api/client.js';

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
      setAuth: (user, token) => {
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
      partialState: (state: AuthState) => ({ token: state.token, user: state.user }),
    } as Parameters<typeof persist>[1],
  ),
);
