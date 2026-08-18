// ============================================================
// 灵感库页面
// ============================================================

import { useState, useMemo } from 'react';
import { useInspirationStore } from '@/store/useInspirationStore';
import { useContentStore } from '@/store/useContentStore';
import { useTaskStore } from '@/store/useTaskStore';
import { useAppStore } from '@/store/useAppStore';
import { aiService } from '@/services/ai/AIService';
import { relativeTime } from '@/utils/date';
import { Modal, ConfirmDialog, EmptyState, LoadingButton, Tag } from '@/components/common';
import type { Inspiration, InspirationStatus } from '@/models/types';

const STATUS_LABELS: Record<InspirationStatus, string> = {
  pending: '待整理',
  ready: '可创作',
  creating: '创作中',
  used: '已使用',
};

const STATUS_STYLES: Record<InspirationStatus, { bg: string; color: string }> = {
  pending: { bg: 'var(--color-p4-bg)', color: 'var(--color-p4)' },
  ready: { bg: 'var(--color-success-bg)', color: 'var(--color-success)' },
  creating: { bg: 'var(--color-info-bg)', color: 'var(--color-info)' },
  used: { bg: 'var(--color-border-light)', color: 'var(--color-text-tertiary)' },
};

export function InspirationPage() {
  const inspirations = useInspirationStore((s) => s.inspirations);
  const addInspiration = useInspirationStore((s) => s.addInspiration);
  const updateInspiration = useInspirationStore((s) => s.updateInspiration);
  const deleteInspiration = useInspirationStore((s) => s.deleteInspiration);
  const createContent = useContentStore((s) => s.createContent);
  const setActiveContentId = useAppStore((s) => s.setActiveContentId);
  const setPage = useAppStore((s) => s.setPage);
  const addTask = useTaskStore((s) => s.addTask);

  const [input, setInput] = useState('');
  const [tags, setTags] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<InspirationStatus | 'all'>('all');
  const [deleteTarget, setDeleteTarget] = useState<Inspiration | null>(null);
  const [developTarget, setDevelopTarget] = useState<Inspiration | null>(null);
  const [developing, setDeveloping] = useState(false);

  const filtered = useMemo(() => {
    return inspirations.filter((insp) => {
      if (filterStatus !== 'all' && insp.status !== filterStatus) return false;
      if (search && !insp.content.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [inspirations, search, filterStatus]);

  const handleAdd = () => {
    if (!input.trim()) return;
    const tagArr = tags.split(/[,，\s]+/).filter(Boolean);
    addInspiration(input.trim(), tagArr);
    setInput('');
    setTags('');
  };

  const handleDevelop = async (insp: Inspiration, type: 'article' | 'video') => {
    setDeveloping(true);
    try {
      const topics = await aiService.generateTopics(insp.content, type);
      const content = createContent(type, topics[0] || insp.content);
      // 更新灵感状态
      updateInspiration(insp.id, { status: 'creating', topicId: content.id, recommendedType: type });
      // 创建关联任务
      addTask({
        title: `完善${type === 'article' ? '公众号' : '视频'}：${content.title}`,
        project: type === 'article' ? '公众号运营' : '短视频',
        priority: 'P2',
        status: 'todo',
        source: 'content',
        contentId: content.id,
        estimatedTime: 60,
      });
      setActiveContentId(content.id);
      setPage('content');
      setDevelopTarget(null);
    } finally {
      setDeveloping(false);
    }
  };

  return (
    <div className="inspiration-page">
      <header className="page-header">
        <h1 className="page-title">灵感库</h1>
        <p className="page-subtitle">捕捉每一个想法，让灵感成为创作的种子</p>
      </header>

      {/* 快速记录灵感 */}
      <section className="insp-input-section">
        <textarea
          className="insp-textarea"
          placeholder="一句话记录你的灵感..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={2}
        />
        <div className="insp-input-footer">
          <input
            className="insp-tags-input"
            placeholder="标签，用逗号分隔"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
          <button className="btn btn-primary" onClick={handleAdd} disabled={!input.trim()}>
            记录灵感
          </button>
        </div>
      </section>

      {/* 搜索和筛选 */}
      <section className="insp-filters">
        <input
          className="input insp-search"
          placeholder="搜索灵感..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="filter-tabs">
          {(['all', 'pending', 'ready', 'creating', 'used'] as const).map((s) => (
            <button
              key={s}
              className={`filter-tab ${filterStatus === s ? 'active' : ''}`}
              onClick={() => setFilterStatus(s)}
            >
              {s === 'all' ? '全部' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </section>

      {/* 灵感列表 */}
      <section className="insp-list">
        {filtered.length === 0 ? (
          <EmptyState
            title="还没有灵感"
            description="在上方输入框记录你的第一个想法吧"
          />
        ) : (
          <div className="insp-grid">
            {filtered.map((insp) => (
              <div key={insp.id} className="insp-card">
                <div className="insp-card-header">
                  <span
                    className="insp-status"
                    style={{ background: STATUS_STYLES[insp.status].bg }}
                  >
                    <span style={{ color: STATUS_STYLES[insp.status].color }}>
                      {STATUS_LABELS[insp.status]}
                    </span>
                  </span>
                  <span className="insp-time">{relativeTime(insp.createdAt)}</span>
                </div>
                <div className="insp-content">{insp.content}</div>
                {insp.tags.length > 0 && (
                  <div className="insp-tags">
                    {insp.tags.map((tag) => <Tag key={tag} text={tag} />)}
                  </div>
                )}
                <div className="insp-actions">
                  <button className="btn btn-sm btn-ghost" onClick={() => setDevelopTarget(insp)}>
                    发展成选题 →
                  </button>
                  <button className="btn-icon" onClick={() => setDeleteTarget(insp)}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 发展选题弹窗 */}
      <Modal open={!!developTarget} onClose={() => setDevelopTarget(null)} title="发展为选题" width="420px">
        {developTarget && (
          <div>
            <div className="develop-preview">{developTarget.content}</div>
            <p className="develop-hint">选择内容类型，AI 将帮你发展成选题：</p>
            <div className="develop-actions">
              <LoadingButton loading={developing} onClick={() => handleDevelop(developTarget, 'article')}>
                📝 发展为公众号选题
              </LoadingButton>
              <LoadingButton loading={developing} onClick={() => handleDevelop(developTarget, 'video')}>
                🎬 发展为视频选题
              </LoadingButton>
            </div>
          </div>
        )}
      </Modal>

      {/* 删除确认 */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="删除灵感"
        message={`确定要删除这条灵感吗？此操作不可撤销。`}
        danger
        confirmText="删除"
        onConfirm={() => {
          if (deleteTarget) deleteInspiration(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      <style>{`
        .inspiration-page {
          max-width: var(--content-max-width);
          margin: 0 auto;
          padding: 32px 40px 80px;
        }
        .page-title {
          font-size: 24px;
          font-weight: 700;
          color: var(--color-text-primary);
          letter-spacing: -0.5px;
        }
        .page-subtitle {
          font-size: 14px;
          color: var(--color-text-tertiary);
          margin-top: 4px;
        }
        .insp-input-section {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 12px;
          margin: 24px 0;
          transition: var(--transition);
        }
        .insp-input-section:focus-within {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px var(--color-primary-bg);
        }
        .insp-textarea {
          width: 100%;
          border: none;
          background: transparent;
          resize: none;
          font-size: 15px;
          line-height: 1.6;
        }
        .insp-textarea:focus { outline: none; }
        .insp-input-footer {
          display: flex;
          gap: 12px;
          margin-top: 8px;
        }
        .insp-tags-input {
          flex: 1;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          padding: 6px 12px;
          font-size: 13px;
          background: var(--color-bg);
        }
        .insp-filters {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
          align-items: center;
          flex-wrap: wrap;
        }
        .insp-search {
          max-width: 240px;
        }
        .filter-tabs {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
        }
        .filter-tab {
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 13px;
          color: var(--color-text-secondary);
          background: var(--color-bg);
          transition: var(--transition);
        }
        .filter-tab.active {
          background: var(--color-primary);
          color: #fff;
        }
        .insp-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 12px;
        }
        .insp-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border-light);
          border-radius: var(--radius-md);
          padding: 16px;
          transition: var(--transition);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .insp-card:hover {
          box-shadow: var(--shadow-md);
        }
        .insp-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .insp-status {
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }
        .insp-time {
          font-size: 12px;
          color: var(--color-text-tertiary);
        }
        .insp-content {
          font-size: 15px;
          line-height: 1.6;
          color: var(--color-text-primary);
          font-weight: 500;
        }
        .insp-tags {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
        }
        .insp-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: auto;
        }
        .develop-preview {
          background: var(--color-bg);
          padding: 12px 16px;
          border-radius: var(--radius-sm);
          font-size: 14px;
          color: var(--color-text-primary);
          margin-bottom: 16px;
          line-height: 1.6;
        }
        .develop-hint {
          font-size: 13px;
          color: var(--color-text-secondary);
          margin-bottom: 16px;
        }
        .develop-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        @media (max-width: 768px) {
          .inspiration-page { padding: 20px 16px 60px; }
          .insp-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
