import { api } from './client.js';

export const settingsApi = {
  getAll: () => api.get<Record<string, Record<string, unknown>>>('/settings'),

  getCategory: (category: string) => api.get<Record<string, unknown>>(`/settings/${category}`),

  batchUpdate: (updates: Array<{ key: string; value: unknown; category: string }>) =>
    api.put<{ success: boolean }>('/settings', updates),

  update: (key: string, value: unknown, category: string) =>
    api.put<{ success: boolean }>('/settings', [{ key, value, category }]),
};
