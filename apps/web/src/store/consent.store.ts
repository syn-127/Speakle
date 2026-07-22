import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ConsentStatus = 'pending' | 'accepted' | 'rejected';

interface ConsentState {
  status: ConsentStatus;
  accept: () => void;
  reject: () => void;
  reset: () => void;
}

// Storing the consent choice itself is a strictly-necessary preference, not tracking.
export const useConsentStore = create<ConsentState>()(
  persist(
    (set) => ({
      status: 'pending',
      accept: () => set({ status: 'accepted' }),
      reject: () => set({ status: 'rejected' }),
      reset: () => set({ status: 'pending' }),
    }),
    {
      name: 'speakle-cookie-consent',
    },
  ),
);
