// ============================================================
// StorageService - 基于 localStorage 的持久化
// ============================================================

const PREFIX = 'aiwa_'; // AI Work Assistant

export const storage = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (raw === null) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage set error:', e);
    }
  },

  remove(key: string): void {
    localStorage.removeItem(PREFIX + key);
  },

  clearAll(): void {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith(PREFIX));
    keys.forEach((k) => localStorage.removeItem(k));
  },

  exportAll(): string {
    const data: Record<string, unknown> = {};
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => {
        const raw = localStorage.getItem(k);
        if (raw) data[k.slice(PREFIX.length)] = JSON.parse(raw);
      });
    return JSON.stringify(data, null, 2);
  },

  importAll(json: string): boolean {
    try {
      const data = JSON.parse(json) as Record<string, unknown>;
      // 先清除旧的
      this.clearAll();
      // 写入新的
      for (const [key, value] of Object.entries(data)) {
        localStorage.setItem(PREFIX + key, JSON.stringify(value));
      }
      return true;
    } catch (e) {
      console.error('Import error:', e);
      return false;
    }
  },

  hasData(): boolean {
    return Object.keys(localStorage).some((k) => k.startsWith(PREFIX));
  },
};
