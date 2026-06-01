import { api } from './client.js';
import type { User } from '@speakle/shared';

export interface LoginResponse {
  token: string;
  user: User;
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { email, password }),

  logout: () => api.post<{ success: boolean }>('/auth/logout'),

  session: () => api.get<{ user: User }>('/auth/session'),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.post<{ success: boolean }>('/auth/change-password', { currentPassword, newPassword }),
};
