import { create } from 'zustand';

type VoiceState = 'idle' | 'recording' | 'stopped' | 'transcribing' | 'polishing' | 'done' | 'error';

interface VoiceStoreState {
  state: VoiceState;
  transcript: string;
  error: string | null;
  setState: (state: VoiceState) => void;
  setTranscript: (text: string) => void;
  appendTranscript: (text: string) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useVoiceStore = create<VoiceStoreState>((set) => ({
  state: 'idle',
  transcript: '',
  error: null,
  setState: (state) => set({ state }),
  setTranscript: (transcript) => set({ transcript }),
  appendTranscript: (text) => set((s) => ({ transcript: s.transcript + text })),
  setError: (error) => set({ error, state: 'error' }),
  reset: () => set({ state: 'idle', transcript: '', error: null }),
}));
