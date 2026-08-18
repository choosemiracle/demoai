// ============================================================
// Inspiration Store
// ============================================================

import { create } from 'zustand';
import type { Inspiration } from '@/models/types';
import { storage } from '@/services/storage/StorageService';
import { generateId } from '@/utils/id';
import { createDemoInspirations } from '@/data/demoData';

interface InspirationState {
  inspirations: Inspiration[];
  loaded: boolean;

  init: () => void;
  addInspiration: (content: string, tags?: string[]) => Inspiration;
  updateInspiration: (id: string, updates: Partial<Inspiration>) => void;
  deleteInspiration: (id: string) => void;
  setStatus: (id: string, status: Inspiration['status']) => void;
}

export const useInspirationStore = create<InspirationState>((set, get) => ({
  inspirations: [],
  loaded: false,

  init: () => {
    if (get().loaded) return;
    const stored = storage.get<Inspiration[]>('inspirations', []);
    if (stored.length === 0 && !storage.hasData()) {
      const demo = createDemoInspirations();
      storage.set('inspirations', demo);
      set({ inspirations: demo, loaded: true });
    } else {
      set({ inspirations: stored, loaded: true });
    }
  },

  addInspiration: (content, tags = []) => {
    const insp: Inspiration = {
      id: generateId('insp'),
      content,
      createdAt: new Date().toISOString(),
      tags,
      status: 'pending',
      recommendedType: 'any',
      topicId: null,
    };
    set((state) => {
      const inspirations = [insp, ...state.inspirations];
      storage.set('inspirations', inspirations);
      return { inspirations };
    });
    return insp;
  },

  updateInspiration: (id, updates) => {
    set((state) => {
      const inspirations = state.inspirations.map((i) =>
        i.id === id ? { ...i, ...updates } : i
      );
      storage.set('inspirations', inspirations);
      return { inspirations };
    });
  },

  deleteInspiration: (id) => {
    set((state) => {
      const inspirations = state.inspirations.filter((i) => i.id !== id);
      storage.set('inspirations', inspirations);
      return { inspirations };
    });
  },

  setStatus: (id, status) => {
    get().updateInspiration(id, { status });
  },
}));
