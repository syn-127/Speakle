import { create } from 'zustand';

interface EditorState {
  isDirty: boolean;
  isSaving: boolean;
  lastSaved: number | null;
  sidebarTab: 'status' | 'seo' | 'ai' | 'revisions';
  aiPanelTab: 'generate' | 'research' | 'voice';
  setDirty: (dirty: boolean) => void;
  setSaving: (saving: boolean) => void;
  setLastSaved: (ts: number) => void;
  setSidebarTab: (tab: EditorState['sidebarTab']) => void;
  setAIPanelTab: (tab: EditorState['aiPanelTab']) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  isDirty: false,
  isSaving: false,
  lastSaved: null,
  sidebarTab: 'status',
  aiPanelTab: 'generate',
  setDirty: (isDirty) => set({ isDirty }),
  setSaving: (isSaving) => set({ isSaving }),
  setLastSaved: (lastSaved) => set({ lastSaved, isDirty: false }),
  setSidebarTab: (sidebarTab) => set({ sidebarTab }),
  setAIPanelTab: (aiPanelTab) => set({ aiPanelTab }),
}));
