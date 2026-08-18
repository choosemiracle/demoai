// ============================================================
// Review Store
// ============================================================

import { create } from 'zustand';
import type { DailyReview } from '@/models/types';
import { storage } from '@/services/storage/StorageService';
import { generateId } from '@/utils/id';
import { today } from '@/utils/date';

interface ReviewState {
  reviews: DailyReview[];
  loaded: boolean;

  init: () => void;
  addReview: (review: Omit<DailyReview, 'id' | 'createdAt'>) => DailyReview;
  getByDate: (date: string) => DailyReview | undefined;
  getAll: () => DailyReview[];
}

export const useReviewStore = create<ReviewState>((set, get) => ({
  reviews: [],
  loaded: false,

  init: () => {
    if (get().loaded) return;
    const stored = storage.get<DailyReview[]>('reviews', []);
    set({ reviews: stored, loaded: true });
  },

  addReview: (reviewData) => {
    const review: DailyReview = {
      ...reviewData,
      id: generateId('review'),
      createdAt: new Date().toISOString(),
    };
    set((state) => {
      // 替换同一天的复盘
      const filtered = state.reviews.filter((r) => r.date !== review.date);
      const reviews = [review, ...filtered];
      storage.set('reviews', reviews);
      return { reviews };
    });
    return review;
  },

  getByDate: (date) => {
    return get().reviews.find((r) => r.date === date);
  },

  getAll: () => {
    return [...get().reviews].sort((a, b) => b.date.localeCompare(a.date));
  },
}));
