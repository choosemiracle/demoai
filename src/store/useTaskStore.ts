// ============================================================
// Task Store
// ============================================================

import { create } from 'zustand';
import type { Task, ParsedTask } from '@/models/types';
import { storage } from '@/services/storage/StorageService';
import { generateId } from '@/utils/id';
import { today } from '@/utils/date';
import { aiService } from '@/services/ai/AIService';
import { createDemoTasks } from '@/data/demoData';

interface TaskState {
  tasks: Task[];
  loaded: boolean;
  loading: boolean;

  init: () => void;
  addTask: (task: Partial<Task>) => Task;
  addParsedTask: (parsed: ParsedTask, overrides?: Partial<Task>) => Task;
  addTaskFromText: (text: string) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleComplete: (id: string) => void;
  setPriority: (id: string, priority: Task['priority']) => void;
  moveTaskToToday: (id: string) => void;
  linkContent: (taskId: string, contentId: string) => void;

  // selectors
  getTodayTasks: () => Task[];
  getInboxTasks: () => Task[];
  getUpcomingTasks: () => Task[];
  getCompletedTasks: () => Task[];
  getByContentId: (contentId: string) => Task[];
}

function persist(state: TaskState) {
  storage.set('tasks', state.tasks);
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  loaded: false,
  loading: false,

  init: () => {
    if (get().loaded) return;
    const stored = storage.get<Task[]>('tasks', []);
    if (stored.length === 0 && !storage.hasData()) {
      const demo = createDemoTasks();
      storage.set('tasks', demo);
      set({ tasks: demo, loaded: true });
    } else {
      set({ tasks: stored, loaded: true });
    }
  },

  addTask: (taskData) => {
    const now = new Date().toISOString();
    const task: Task = {
      id: generateId('task'),
      title: taskData.title || '',
      description: taskData.description || '',
      project: taskData.project || '',
      tags: taskData.tags || [],
      status: taskData.status || 'inbox',
      priority: taskData.priority || 'P3',
      dueDate: taskData.dueDate || null,
      planDate: taskData.planDate || null,
      estimatedTime: taskData.estimatedTime || 0,
      actualTime: taskData.actualTime || 0,
      createdAt: now,
      completedAt: taskData.completedAt || null,
      source: taskData.source || 'manual',
      contentId: taskData.contentId || null,
    };
    set((state) => {
      const tasks = [...state.tasks, task];
      persist({ ...state, tasks });
      return { tasks };
    });
    return task;
  },

  addParsedTask: (parsed, overrides) => {
    return get().addTask({
      title: parsed.title,
      description: parsed.description,
      project: parsed.project,
      tags: parsed.tags,
      status: 'inbox',
      priority: parsed.priority || 'P3',
      dueDate: parsed.dueDate,
      estimatedTime: parsed.estimatedTime || 0,
      source: 'ai',
      ...overrides,
    });
  },

  addTaskFromText: async (text) => {
    set({ loading: true });
    try {
      const parsed = await aiService.parseTask(text);
      const task = get().addParsedTask(parsed);
      return task;
    } finally {
      set({ loading: false });
    }
  },

  updateTask: (id, updates) => {
    set((state) => {
      const tasks = state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t));
      persist({ ...state, tasks });
      return { tasks };
    });
  },

  deleteTask: (id) => {
    set((state) => {
      const tasks = state.tasks.filter((t) => t.id !== id);
      persist({ ...state, tasks });
      return { tasks };
    });
  },

  toggleComplete: (id) => {
    set((state) => {
      const tasks = state.tasks.map((t) => {
        if (t.id !== id) return t;
        if (t.status === 'done') {
          return { ...t, status: 'todo' as const, completedAt: null };
        }
        return { ...t, status: 'done' as const, completedAt: new Date().toISOString() };
      });
      persist({ ...state, tasks });
      return { tasks };
    });
  },

  setPriority: (id, priority) => {
    get().updateTask(id, { priority });
  },

  moveTaskToToday: (id) => {
    get().updateTask(id, { planDate: today(), status: 'todo' });
  },

  linkContent: (taskId, contentId) => {
    get().updateTask(taskId, { contentId, source: 'content' });
  },

  getTodayTasks: () => {
    const t = today();
    return get().tasks.filter(
      (task) => task.status !== 'done' && (task.planDate === t || task.dueDate === t)
    );
  },

  getInboxTasks: () => {
    return get().tasks.filter((t) => t.status === 'inbox');
  },

  getUpcomingTasks: () => {
    const t = today();
    return get().tasks.filter(
      (task) =>
        task.status !== 'done' &&
        task.dueDate !== null &&
        task.dueDate > t &&
        task.dueDate !== t
    );
  },

  getCompletedTasks: () => {
    return get()
      .tasks.filter((t) => t.status === 'done')
      .sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''));
  },

  getByContentId: (contentId) => {
    return get().tasks.filter((t) => t.contentId === contentId);
  },
}));
