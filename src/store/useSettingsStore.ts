// ============================================================
// Settings Store
// ============================================================

import { create } from 'zustand';
import type { UserSettings } from '@/models/types';
import { storage } from '@/services/storage/StorageService';
import { createDefaultSettings } from '@/data/demoData';
import { aiService } from '@/services/ai/AIService';

interface SettingsState {
  settings: UserSettings;
  loaded: boolean;

  init: () => void;
  updateSettings: (updates: Partial<UserSettings>) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: createDefaultSettings(),
  loaded: false,

  init: () => {
    if (get().loaded) return;
    const stored = storage.get<UserSettings | null>('settings', null);
    if (stored) {
      aiService.setSettings(stored);
      set({ settings: stored, loaded: true });
    } else {
      const def = createDefaultSettings();
      aiService.setSettings(def);
      set({ settings: def, loaded: true });
    }
  },

  updateSettings: (updates) => {
    set((state) => {
      const settings = { ...state.settings, ...updates };
      storage.set('settings', settings);
      aiService.setSettings(settings);
      return { settings };
    });
  },

  resetSettings: () => {
    const def = createDefaultSettings();
    storage.set('settings', def);
    aiService.setSettings(def);
    set({ settings: def });
  },
}));
