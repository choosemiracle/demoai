// ============================================================
// App Store - 全局 UI 状态
// ============================================================

import { create } from 'zustand';

export type PageKey = 'today' | 'content' | 'inspiration' | 'tasks' | 'review' | 'settings';

interface AppState {
  currentPage: PageKey;
  // 内容创作相关
  activeContentId: string | null;
  newContentType: 'article' | 'video' | null;

  setPage: (page: PageKey) => void;
  setActiveContentId: (id: string | null) => void;
  startNewContent: (type: 'article' | 'video') => void;
  clearNewContent: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: 'today',
  activeContentId: null,
  newContentType: null,

  setPage: (page) => set({ currentPage: page }),
  setActiveContentId: (id) => set({ activeContentId: id }),
  startNewContent: (type) => set({ newContentType: type, currentPage: 'content' }),
  clearNewContent: () => set({ newContentType: null }),
}));
