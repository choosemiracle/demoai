// ============================================================
// 侧边导航栏
// ============================================================

import { useAppStore, type PageKey } from '@/store/useAppStore';

interface NavItem {
  key: PageKey;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { key: 'today', label: '今日', icon: '☀️' },
  { key: 'content', label: '内容助手', icon: '✍️' },
  { key: 'inspiration', label: '灵感库', icon: '💡' },
  { key: 'tasks', label: '工作任务', icon: '📋' },
  { key: 'review', label: '每日复盘', icon: '🌙' },
  { key: 'settings', label: '设置', icon: '⚙️' },
];

export function Sidebar() {
  const currentPage = useAppStore((s) => s.currentPage);
  const setPage = useAppStore((s) => s.setPage);

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-icon">◆</span>
        <span className="logo-text">AI 工作助手</span>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.key}
            className={`nav-item ${currentPage === item.key ? 'active' : ''}`}
            onClick={() => setPage(item.key)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="ai-status">
          <span className="ai-dot" />
          <span>AI 已就绪</span>
        </div>
      </div>
      <style>{`
        .sidebar {
          width: var(--sidebar-width);
          height: 100vh;
          background: var(--color-sidebar);
          border-right: 1px solid var(--color-border-light);
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          position: sticky;
          top: 0;
        }
        .sidebar-logo {
          padding: 20px 20px 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .logo-icon {
          font-size: 20px;
          color: var(--color-primary);
        }
        .logo-text {
          font-size: 15px;
          font-weight: 700;
          color: var(--color-text-primary);
          letter-spacing: -0.3px;
        }
        .sidebar-nav {
          flex: 1;
          padding: 8px 12px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: var(--radius-sm);
          font-size: 14px;
          color: var(--color-text-secondary);
          transition: var(--transition);
          width: 100%;
          text-align: left;
        }
        .nav-item:hover {
          background: var(--color-bg);
          color: var(--color-text-primary);
        }
        .nav-item.active {
          background: var(--color-primary-bg);
          color: var(--color-primary);
          font-weight: 500;
        }
        .nav-icon {
          font-size: 16px;
          width: 20px;
          text-align: center;
        }
        .sidebar-footer {
          padding: 12px 20px;
          border-top: 1px solid var(--color-border-light);
        }
        .ai-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--color-text-tertiary);
        }
        .ai-dot {
          width: 8px;
          height: 8px;
          background: var(--color-success);
          border-radius: 50%;
        }
      `}</style>
    </aside>
  );
}
