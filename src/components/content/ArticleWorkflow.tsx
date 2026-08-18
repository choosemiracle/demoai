// ============================================================
// 公众号创作工作流 - 7 步
// ============================================================

import { useState } from 'react';
import { useContentStore } from '@/store/useContentStore';
import { useTaskStore } from '@/store/useTaskStore';
import { useAppStore } from '@/store/useAppStore';
import { aiService } from '@/services/ai/AIService';
import { LoadingButton } from '@/components/common';
import { ContentReview } from './ContentReview';
import { copyToClipboard } from '@/utils/id';
import type { Content, ArticleStage, CoreIdeaResult } from '@/models/types';

const STAGES: { key: ArticleStage; label: string; num: number }[] = [
  { key: 'topic', label: '主题', num: 1 },
  { key: 'core_idea', label: '核心观点', num: 2 },
  { key: 'titles', label: '标题', num: 3 },
  { key: 'outline', label: '大纲', num: 4 },
  { key: 'draft', label: '初稿', num: 5 },
  { key: 'review', label: '检查', num: 6 },
  { key: 'final', label: '定稿', num: 7 },
];

export function ArticleWorkflow({ content }: { content: Content }) {
  const updateContent = useContentStore((s) => s.updateContent);
  const setActiveContentId = useAppStore((s) => s.setActiveContentId);
  const addTask = useTaskStore((s) => s.addTask);
  const linkTask = useContentStore((s) => s.linkTask);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const data = content.articleData!;
  const stage = content.stage as ArticleStage;
  const stageIdx = STAGES.findIndex((s) => s.key === stage);

  const updateData = (updates: Partial<typeof data>) => {
    updateContent(content.id, {
      articleData: { ...data, ...updates },
    });
  };

  // --- Step 1: 主题输入 ---
  const handleTopic = () => {
    if (!data.topic.trim()) return;
    updateContent(content.id, { title: data.topic, stage: 'core_idea' });
  };

  // --- Step 2: 提炼核心观点 ---
  const handleGenerateCoreIdea = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await aiService.generateCoreIdea(data.topic);
      updateData(result);
    } catch {
      setError('生成失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleCoreIdeaNext = () => {
    updateContent(content.id, { stage: 'titles' });
  };

  // --- Step 3: 生成标题 ---
  const handleGenerateTitles = async () => {
    setLoading(true);
    setError('');
    try {
      const coreIdea: CoreIdeaResult = {
        targetReader: data.targetReader,
        coreProblem: data.coreProblem,
        coreIdea: data.coreIdea,
        contentValue: data.contentValue,
      };
      const titles = await aiService.generateTitles(data.topic, coreIdea);
      updateData({ titles });
    } catch {
      setError('生成失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // --- Step 4: 生成大纲 ---
  const handleGenerateOutline = async () => {
    if (!data.selectedTitle) return;
    setLoading(true);
    setError('');
    try {
      const coreIdea: CoreIdeaResult = {
        targetReader: data.targetReader,
        coreProblem: data.coreProblem,
        coreIdea: data.coreIdea,
        contentValue: data.contentValue,
      };
      const outline = await aiService.generateArticleOutline(data.topic, coreIdea, data.selectedTitle);
      updateData({ outline });
    } catch {
      setError('生成失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // --- Step 5: 生成初稿 ---
  const handleGenerateDraft = async () => {
    setLoading(true);
    setError('');
    try {
      const coreIdea: CoreIdeaResult = {
        targetReader: data.targetReader,
        coreProblem: data.coreProblem,
        coreIdea: data.coreIdea,
        contentValue: data.contentValue,
      };
      const draft = await aiService.generateArticle(data.outline, data.topic, coreIdea, data.selectedTitle || '');
      // 保存原始版本
      updateData({ draft });
      updateContent(content.id, { stage: 'review', originalDraft: draft });
    } catch {
      setError('生成失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // --- Step 7: 保存定稿 ---
  const handleFinalize = () => {
    updateContent(content.id, {
      stage: 'final',
      articleData: { ...data, finalContent: data.draft },
      status: 'completed',
    });
  };

  // --- 一键加入工作计划 ---
  const handleAddToWorkPlan = () => {
    const subTasks = [
      { title: '确认文章结构', estimatedTime: 30 },
      { title: '完成初稿', estimatedTime: 120 },
      { title: '修改文章', estimatedTime: 60 },
      { title: '配图', estimatedTime: 30 },
      { title: '发布', estimatedTime: 30 },
    ];
    subTasks.forEach((st) => {
      const task = addTask({
        title: `${st.title} - ${content.title}`,
        project: '公众号运营',
        priority: 'P2',
        status: 'todo',
        source: 'content',
        contentId: content.id,
        estimatedTime: st.estimatedTime,
      });
      linkTask(content.id, task.id);
    });
    alert('已创建 5 个关联任务');
  };

  // --- 复制全文 ---
  const handleCopy = async () => {
    const text = (data.finalContent || data.draft || '') + (data.selectedTitle ? `# ${data.selectedTitle}\n\n` : '');
    const ok = await copyToClipboard(`${data.selectedTitle || ''}\n\n${data.finalContent || data.draft || ''}`);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // --- 返回列表 ---
  const handleBack = () => setActiveContentId(null);

  return (
    <div className="workflow-page">
      <div className="workflow-header">
        <button className="btn btn-ghost btn-sm" onClick={handleBack}>← 返回列表</button>
        <div className="workflow-type">📝 公众号创作</div>
      </div>

      {/* 步骤指示器 */}
      <div className="step-indicator">
        {STAGES.map((s, idx) => (
          <div key={s.key} className="step-item">
            <div className={`step-dot ${idx < stageIdx ? 'done' : idx === stageIdx ? 'active' : ''}`}>
              {idx < stageIdx ? '✓' : s.num}
            </div>
            <span className={`step-label ${idx === stageIdx ? 'active' : ''}`}>{s.label}</span>
            {idx < STAGES.length - 1 && <span className="step-arrow">›</span>}
          </div>
        ))}
      </div>

      {/* Step 1: 主题输入 */}
      {stage === 'topic' && (
        <div className="stage-content">
          <h3 className="stage-title">输入主题</h3>
          <p className="stage-desc">你想写什么？输入一个主题或你的原始观点。</p>
          <textarea
            className="textarea"
            value={data.topic}
            onChange={(e) => updateData({ topic: e.target.value })}
            placeholder="例如：为什么每个人都需要自己的 AI 工作助手"
            rows={4}
            autoFocus
          />
          <div className="stage-actions">
            <button className="btn btn-primary" onClick={handleTopic} disabled={!data.topic.trim()}>
              下一步 →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: 核心观点 */}
      {stage === 'core_idea' && (
        <div className="stage-content">
          <h3 className="stage-title">提炼核心观点</h3>
          <p className="stage-desc">AI 帮你分析目标读者、核心问题、核心观点和内容价值。</p>
          <div className="form-group">
            <label className="form-label">主题</label>
            <div className="read-only-field">{data.topic}</div>
          </div>
          <button className="btn btn-primary" onClick={handleGenerateCoreIdea} disabled={loading}>
            {loading ? <><span className="loading-spinner" /> AI 分析中...</> : '✨ AI 提炼核心观点'}
          </button>
          {data.coreIdea && (
            <div className="ai-result">
              <div className="form-group">
                <label className="form-label">目标读者</label>
                <input className="input" value={data.targetReader} onChange={(e) => updateData({ targetReader: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">核心问题</label>
                <textarea className="textarea" value={data.coreProblem} onChange={(e) => updateData({ coreProblem: e.target.value })} rows={2} />
              </div>
              <div className="form-group">
                <label className="form-label">核心观点</label>
                <textarea className="textarea" value={data.coreIdea} onChange={(e) => updateData({ coreIdea: e.target.value })} rows={2} />
              </div>
              <div className="form-group">
                <label className="form-label">内容价值</label>
                <textarea className="textarea" value={data.contentValue} onChange={(e) => updateData({ contentValue: e.target.value })} rows={2} />
              </div>
              <div className="stage-actions">
                <button className="btn btn-primary" onClick={handleCoreIdeaNext}>下一步 →</button>
              </div>
            </div>
          )}
          {error && <div className="error-msg">{error}</div>}
        </div>
      )}

      {/* Step 3: 标题 */}
      {stage === 'titles' && (
        <div className="stage-content">
          <h3 className="stage-title">生成标题</h3>
          <p className="stage-desc">AI 生成 5 个不同风格的高质量标题。</p>
          <button className="btn btn-primary" onClick={handleGenerateTitles} disabled={loading}>
            {loading ? <><span className="loading-spinner" /> 生成中...</> : '✨ 生成标题'}
          </button>
          {data.titles.length > 0 && (
            <div className="titles-list">
              {data.titles.map((title, idx) => (
                <label key={idx} className={`title-option ${data.selectedTitle === title ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="title"
                    checked={data.selectedTitle === title}
                    onChange={() => updateData({ selectedTitle: title })}
                  />
                  <span className="title-text">{title}</span>
                  <span className="title-type">{TITLE_TYPES[idx] || '创意型'}</span>
                </label>
              ))}
              <div className="stage-actions">
                <button className="btn btn-primary" onClick={() => updateContent(content.id, { stage: 'outline' })} disabled={!data.selectedTitle}>
                  下一步 →
                </button>
              </div>
            </div>
          )}
          {error && <div className="error-msg">{error}</div>}
        </div>
      )}

      {/* Step 4: 大纲 */}
      {stage === 'outline' && (
        <div className="stage-content">
          <h3 className="stage-title">文章大纲</h3>
          <p className="stage-desc">AI 生成大纲，你可以直接编辑。</p>
          <div className="form-group">
            <label className="form-label">选定标题</label>
            <div className="read-only-field">{data.selectedTitle}</div>
          </div>
          <button className="btn btn-primary" onClick={handleGenerateOutline} disabled={loading}>
            {loading ? <><span className="loading-spinner" /> 生成中...</> : '✨ 生成大纲'}
          </button>
          {data.outline && (
            <>
              <textarea
                className="textarea"
                value={data.outline}
                onChange={(e) => updateData({ outline: e.target.value })}
                rows={12}
                style={{ marginTop: 12, fontFamily: 'monospace', fontSize: 13 }}
              />
              <div className="stage-actions">
                <button className="btn btn-primary" onClick={() => updateContent(content.id, { stage: 'draft' })}>
                  下一步 →
                </button>
              </div>
            </>
          )}
          {error && <div className="error-msg">{error}</div>}
        </div>
      )}

      {/* Step 5: 初稿 */}
      {stage === 'draft' && (
        <div className="stage-content">
          <h3 className="stage-title">生成初稿</h3>
          <p className="stage-desc">根据大纲生成公众号正文初稿。</p>
          <button className="btn btn-primary" onClick={handleGenerateDraft} disabled={loading}>
            {loading ? <><span className="loading-spinner" /> AI 写作中...</> : '✨ 生成初稿'}
          </button>
          {data.draft && (
            <>
              <textarea
                className="textarea article-textarea"
                value={data.draft}
                onChange={(e) => updateData({ draft: e.target.value })}
                rows={20}
              />
              <div className="stage-actions">
                <button className="btn btn-secondary" onClick={() => updateContent(content.id, { stage: 'outline' })}>← 修改大纲</button>
                <button className="btn btn-primary" onClick={() => updateContent(content.id, { stage: 'review' })}>
                  进入内容检查 →
                </button>
              </div>
            </>
          )}
          {error && <div className="error-msg">{error}</div>}
        </div>
      )}

      {/* Step 6: 内容检查 */}
      {stage === 'review' && (
        <ContentReview content={content} />
      )}

      {/* Step 7: 定稿 */}
      {stage === 'final' && (
        <div className="stage-content">
          <h3 className="stage-title">最终版本</h3>
          <div className="final-header">
            <h2 className="final-title">{data.selectedTitle}</h2>
            <div className="final-actions">
              <button className="btn btn-secondary btn-sm" onClick={handleCopy}>
                {copied ? '✓ 已复制' : '复制全文'}
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleAddToWorkPlan}>
                一键加入工作计划
              </button>
            </div>
          </div>
          <textarea
            className="textarea article-textarea"
            value={data.finalContent || data.draft}
            onChange={(e) => updateData({ finalContent: e.target.value, draft: e.target.value })}
            rows={24}
          />
          <div className="stage-actions">
            <button className="btn btn-secondary" onClick={() => updateContent(content.id, { stage: 'review' })}>
              ← 回到检查
            </button>
            <button className="btn btn-primary" onClick={handleFinalize}>
              ✓ 保存为定稿
            </button>
          </div>
        </div>
      )}

      <style>{`
        .workflow-page {
          max-width: var(--content-max-width);
          margin: 0 auto;
          padding: 24px 40px 80px;
        }
        .workflow-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }
        .workflow-type {
          font-size: 14px;
          font-weight: 600;
          color: var(--color-primary);
        }
        .stage-content {
          background: var(--color-surface);
          border: 1px solid var(--color-border-light);
          border-radius: var(--radius-md);
          padding: 28px;
        }
        .stage-title {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .stage-desc {
          font-size: 14px;
          color: var(--color-text-tertiary);
          margin-bottom: 20px;
        }
        .stage-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 20px;
        }
        .read-only-field {
          padding: 10px 14px;
          background: var(--color-bg);
          border-radius: var(--radius-sm);
          font-size: 14px;
          color: var(--color-text-secondary);
        }
        .ai-result {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid var(--color-border-light);
        }
        .titles-list {
          margin-top: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .title-option {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: var(--transition);
        }
        .title-option:hover { border-color: var(--color-primary); }
        .title-option.selected {
          border-color: var(--color-primary);
          background: var(--color-primary-bg);
        }
        .title-option input { margin: 0; }
        .title-text { flex: 1; font-size: 14px; }
        .title-type {
          font-size: 12px;
          color: var(--color-text-tertiary);
          background: var(--color-bg);
          padding: 2px 8px;
          border-radius: 4px;
        }
        .article-textarea {
          font-size: 14px;
          line-height: 1.8;
          font-family: var(--font-sans);
        }
        .final-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 16px;
          gap: 16px;
          flex-wrap: wrap;
        }
        .final-title {
          font-size: 22px;
          font-weight: 700;
        }
        .final-actions {
          display: flex;
          gap: 8px;
        }
        .error-msg {
          color: var(--color-danger);
          font-size: 13px;
          margin-top: 12px;
        }
        @media (max-width: 768px) {
          .workflow-page { padding: 16px 16px 60px; }
          .step-indicator { overflow-x: auto; }
          .stage-content { padding: 20px 16px; }
        }
      `}</style>
    </div>
  );
}

const TITLE_TYPES = ['观点型', '反常识型', '结果型', '故事型', '问题型'];
