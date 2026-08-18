// ============================================================
// Content Store
// ============================================================

import { create } from 'zustand';
import type { Content, ContentType, ArticleStage, VideoStage } from '@/models/types';
import { storage } from '@/services/storage/StorageService';
import { generateId } from '@/utils/id';
import { createDemoContents } from '@/data/demoData';

interface ContentState {
  contents: Content[];
  loaded: boolean;

  init: () => void;
  createContent: (type: ContentType, topic?: string) => Content;
  updateContent: (id: string, updates: Partial<Content>) => void;
  deleteContent: (id: string) => void;
  getById: (id: string) => Content | undefined;
  linkTask: (contentId: string, taskId: string) => void;
  setStage: (id: string, stage: ArticleStage | VideoStage) => void;
}

export const useContentStore = create<ContentState>((set, get) => ({
  contents: [],
  loaded: false,

  init: () => {
    if (get().loaded) return;
    const stored = storage.get<Content[]>('contents', []);
    if (stored.length === 0 && !storage.hasData()) {
      const demo = createDemoContents();
      storage.set('contents', demo);
      set({ contents: demo, loaded: true });
    } else {
      set({ contents: stored, loaded: true });
    }
  },

  createContent: (type, topic = '') => {
    const now = new Date().toISOString();
    const content: Content = {
      id: generateId('content'),
      type,
      title: topic || '未命名内容',
      stage: 'topic',
      articleData: type === 'article' ? {
        topic,
        targetReader: '',
        coreProblem: '',
        coreIdea: '',
        contentValue: '',
        titles: [],
        selectedTitle: null,
        outline: '',
        draft: '',
        finalContent: '',
      } : null,
      videoData: type === 'video' ? {
        topic,
        oneLiner: '',
        hooks: [],
        selectedHook: null,
        structure: '',
        script: '',
        titles: [],
        selectedTitle: null,
        coverText: '',
      } : null,
      createdAt: now,
      updatedAt: now,
      publishDate: null,
      status: 'draft',
      taskIds: [],
      reviewResult: null,
      originalDraft: null,
    };
    set((state) => {
      const contents = [content, ...state.contents];
      storage.set('contents', contents);
      return { contents };
    });
    return content;
  },

  updateContent: (id, updates) => {
    set((state) => {
      const contents = state.contents.map((c) =>
        c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
      );
      storage.set('contents', contents);
      return { contents };
    });
  },

  deleteContent: (id) => {
    set((state) => {
      const contents = state.contents.filter((c) => c.id !== id);
      storage.set('contents', contents);
      return { contents };
    });
  },

  getById: (id) => {
    return get().contents.find((c) => c.id === id);
  },

  linkTask: (contentId, taskId) => {
    set((state) => {
      const contents = state.contents.map((c) => {
        if (c.id !== contentId) return c;
        if (c.taskIds.includes(taskId)) return c;
        return { ...c, taskIds: [...c.taskIds, taskId] };
      });
      storage.set('contents', contents);
      return { contents };
    });
  },

  setStage: (id, stage) => {
    get().updateContent(id, { stage });
  },
}));
