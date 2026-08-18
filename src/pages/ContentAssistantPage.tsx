// ============================================================
// 内容助手页面 - 管理内容列表 + 创作工作流入口
// ============================================================

import { useState, useEffect } from 'react';
import { useContentStore } from '@/store/useContentStore';
import { useAppStore } from '@/store/useAppStore';
import { ConfirmDialog, EmptyState } from '@/components/common';
import { ArticleWorkflow } from '@/components/content/ArticleWorkflow';
import { VideoWorkflow } from '@/components/content/VideoWorkflow';
import { relativeTime } from '@/utils/date';
import type { Content } from '@/models/types';

export function ContentAssistantPage() {
  const contents = useContentStore((s) => s.contents);
  const createContent = useContentStore((s) => s.createContent);
  const deleteContent = useContentStore((s) => s.deleteContent);
  const activeContentId = useAppStore((s) => s.activeContentId);
  const setActiveContentId = useAppStore((s) => s.setActiveContentId);
  const newContentType = useAppStore((s) => s.newContentType);
  const clearNewContent = useAppStore((s) => s.clearNewContent);
  const [deleteTarget, setDeleteTarget] = useState<Content | null>(null);

  // 如果有新内容类型，自动创建
  useEffect(() => {
    if (newContentType) {
      const content = createContent(newContentType, '');
      setActiveContentId(content.id);
      clearNewContent();
    }
  }, [newContentType]); // eslint-disable-line

  // 如果有激活的内容，显示工作流
  const activeContent = contents.find((c) => c.id === activeContentId);

  if (activeContent) {
    return activeContent.type === 'article' ? (
      <ArticleWorkflow content={activeContent} />
    ) : (
      <VideoWorkflow content={activeContent} />
    );
  }

  return (
    <div className="content-page">
      <header className="page-header">
        <h1 className="page-title">内容助手</h1>
        <p className="page-subtitle">从灵感到成稿，AI 陪你完成每一步创作</p>
      </header>

      <section className="content-type-section">
        <button
          className="content-type-card"
          onClick={() => {
            const c = createContent('article', '');
            setActiveContentId(c.id);
          }}
        >
          <span className="ct-icon">📝</span>
          <div className="ct-info">
            <div className="ct-title">写公众号</div>
            <div className="ct-desc">主题 → 观点 → 标题 → 大纲 → 初稿 → 检查 → 定稿</div>
          </div>
          <span className="ct-arrow">→</span>
        </button>
        <button
          className="content-type-card"
          onClick={() => {
            const c = createContent('video', '');
            setActiveContentId(c.id);
          }}
        >
          <span className="ct-icon">🎬</span>
          <div className="ct-info">
            <div className="ct-title">做视频</div>
            <div className="ct-desc">主题 → 观点 → 开头 → 结构 → 口播稿 → 标题 → 封面</div>
          </div>
          <span className="ct-arrow">→</span>
        </button>
      </section>

      <section className="content-list-section">
        <div className="section-header">
          <h2 className="section-title">内容列表</h2>
          <span className="section-count">{contents.length}</span>
        </div>
        {contents.length === 0 ? (
          <EmptyState
            title="还没有内容"
            description="选择上方类型，开始你的第一篇创作"
          />
        ) : (
          <div className="content-list">
            {contents.map((c) => (
              <div
                key={c.id}
                className="content-row"
                onClick={() => setActiveContentId(c.id)}
              >
                <span className="content-type-badge">{c.type === 'article' ? '📝' : '🎬'}</span>
                <div className="content-row-main">
                  <div className="content-row-title">{c.title || '未命名'}</div>
                  <div className="content-row-meta">
                    <span>{c.type === 'article' ? '公众号' : '视频'}</span>
                    <span>·</span>
                    <span>{STAGE_LABELS[c.stage]}</span>
                    <span>·</span>
                    <span>{relativeTime(c.updatedAt)}</span>
                    {c.taskIds.length > 0 && <><span>·</span><span className="link-badge">{c.taskIds.length} 个关联任务</span></>}
                  </div>
                </div>
                <button
                  className="btn-icon"
                  onClick={(e) => { e.stopPropagation(); setDeleteTarget(c); }}
                >
                  🗑
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={!!deleteTarget}
        title="删除内容"
        message={`确定要删除「${deleteTarget?.title}」吗？所有创作数据将丢失。`}
        danger
        confirmText="删除"
        onConfirm={() => {
          if (deleteTarget) deleteContent(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      <style>{`
        .content-page {
          max-width: var(--content-max-width);
          margin: 0 auto;
          padding: 32px 40px 80px;
        }
        .page-title { font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
        .page-subtitle { font-size: 14px; color: var(--color-text-tertiary); margin-top: 4px; }
        .content-type-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin: 24px 0;
        }
        .content-type-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px;
          background: var(--color-surface);
          border: 1px solid var(--color-border-light);
          border-radius: var(--radius-md);
          transition: var(--transition);
          text-align: left;
        }
        .content-type-card:hover {
          border-color: var(--color-primary);
          box-shadow: var(--shadow-md);
          transform: translateY(-2px);
        }
        .ct-icon { font-size: 32px; }
        .ct-info { flex: 1; }
        .ct-title { font-size: 16px; font-weight: 600; }
        .ct-desc { font-size: 12px; color: var(--color-text-tertiary); margin-top: 4px; }
        .ct-arrow { color: var(--color-text-tertiary); font-size: 20px; }
        .section-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
        .section-title { font-size: 16px; font-weight: 600; }
        .section-count { font-size: 13px; color: var(--color-text-tertiary); background: var(--color-bg); padding: 1px 8px; border-radius: 10px; }
        .content-list { display: flex; flex-direction: column; gap: 4px; }
        .content-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          background: var(--color-surface);
          border: 1px solid var(--color-border-light);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: var(--transition);
        }
        .content-row:hover { background: var(--color-bg); }
        .content-type-badge { font-size: 20px; }
        .content-row-main { flex: 1; min-width: 0; }
        .content-row-title { font-size: 14px; font-weight: 500; margin-bottom: 4px; }
        .content-row-meta {
          display: flex; align-items: center; gap: 6px;
          font-size: 12px; color: var(--color-text-tertiary);
        }
        .link-badge { color: var(--color-primary); }
        @media (max-width: 768px) {
          .content-page { padding: 20px 16px 60px; }
          .content-type-section { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}

const STAGE_LABELS: Record<string, string> = {
  topic: '选题',
  core_idea: '核心观点',
  titles: '标题',
  outline: '大纲',
  draft: '初稿',
  review: '检查',
  final: '定稿',
  one_liner: '一句话观点',
  hook: '开头',
  structure: '结构',
  script: '口播稿',
  cover: '封面',
};
