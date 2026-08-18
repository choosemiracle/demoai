// ============================================================
// 主布局组件
// ============================================================

import React, { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { useTaskStore } from '@/store/useTaskStore';
import { useInspirationStore } from '@/store/useInspirationStore';
import { useContentStore } from '@/store/useContentStore';
import { useReviewStore } from '@/store/useReviewStore';
import { useSettingsStore } from '@/store/useSettingsStore';

export function Layout({ children }: { children: React.ReactNode }) {
  const initTasks = useTaskStore((s) => s.init);
  const initInsp = useInspirationStore((s) => s.init);
  const initContent = useContentStore((s) => s.init);
  const initReview = useReviewStore((s) => s.init);
  const initSettings = useSettingsStore((s) => s.init);

  useEffect(() => {
    initSettings();
    initTasks();
    initInsp();
    initContent();
    initReview();
  }, [initTasks, initInsp, initContent, initReview, initSettings]);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
      <style>{`
        .app-layout {
          display: flex;
          min-height: 100vh;
        }
        .main-content {
          flex: 1;
          min-width: 0;
          overflow-x: hidden;
        }
        @media (max-width: 768px) {
          .app-layout { flex-direction: column; }
          .sidebar {
            width: 100%;
            height: auto;
            position: sticky;
            top: 0;
            z-index: 100;
          }
          .sidebar-nav { flex-direction: row; overflow-x: auto; }
          .sidebar-footer { display: none; }
        }
      `}</style>
    </div>
  );
}
