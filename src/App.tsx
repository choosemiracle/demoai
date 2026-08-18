// ============================================================
// App 主组件
// ============================================================

import { Layout } from '@/components/layout/Layout';
import { useAppStore } from '@/store/useAppStore';
import { TodayPage } from '@/pages/TodayPage';
import { ContentAssistantPage } from '@/pages/ContentAssistantPage';
import { InspirationPage } from '@/pages/InspirationPage';
import { TasksPage } from '@/pages/TasksPage';
import { ReviewPage } from '@/pages/ReviewPage';
import { SettingsPage } from '@/pages/SettingsPage';

export function App() {
  const currentPage = useAppStore((s) => s.currentPage);

  const renderPage = () => {
    switch (currentPage) {
      case 'today': return <TodayPage />;
      case 'content': return <ContentAssistantPage />;
      case 'inspiration': return <InspirationPage />;
      case 'tasks': return <TasksPage />;
      case 'review': return <ReviewPage />;
      case 'settings': return <SettingsPage />;
      default: return <TodayPage />;
    }
  };

  return (
    <Layout>
      <div className="page-wrapper fade-in" key={currentPage}>
        {renderPage()}
      </div>
      <style>{`
        .page-wrapper { min-height: 100vh; }
      `}</style>
    </Layout>
  );
}
