// ============================================================
// 短视频创作工作流
// 主题 → 一句话观点 → 3秒开头 → 视频结构 → 口播稿 → 标题 → 封面
// ============================================================

import { useState } from 'react';
import { useContentStore } from '@/store/useContentStore';
import { useTaskStore } from '@/store/useTaskStore';
import { useAppStore } from '@/store/useAppStore';
import { aiService } from '@/services/ai/AIService';
import { LoadingButton } from '@/components/common';
import { ContentReview } from './ContentReview';
import { copyToClipboard } from '@/utils/id';
import type { Content, VideoStage } from '@/models/types';

const STAGES: { key: VideoStage; label: string; num: number }[] = [
  { key: 'topic', label: '主题', num: 1 },
  { key: 'one_liner', label: '一句话观点', num: 2 },
  { key: 'hook', label: '3秒开头', num: 3 },
  { key: 'structure', label: '结构', num: 4 },
  { key: 'script', label: '口播稿', num: 5 },
  { key: 'titles', label: '标题', num: 6 },
  { key: 'cover', label: '封面', num: 7 },
];

export function VideoWorkflow({ content }: { content: Content }) {
  const updateContent = useContentStore((s) => s.updateContent);
  const setActiveContentId = useAppStore((s) => s.setActiveContentId);
  const addTask = useTaskStore((s) => s.addTask);
  const linkTask = useContentStore((s) => s.linkTask);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const data = content.videoData!;
  const stage = content.stage as VideoStage;
  const stageIdx = STAGES.findIndex((s) => s.key === stage);

  const updateData = (updates: Partial<typeof data>) => {
    updateContent(content.id, {
      videoData: { ...data, ...updates },
    });
  };

  // Step 1
  const handleTopic = () => {
    if (!data.topic.trim()) return;
    updateContent(content.id, { title: data.topic, stage: 'one_liner' });
  };

  // Step 2: 一句话观点
  const handleGenerateOneLiner = async () => {
    setLoading(true);
    try {
      const result = await aiService.generateVideoOneLiner(data.topic);
      updateData({ oneLiner: result });
    } catch { setError('生成失败'); }
    finally { setLoading(false); }
  };

  // Step 3: 3秒开头
  const handleGenerateHooks = async () => {
    setLoading(true);
    try {
      const hooks = await aiService.generateVideoHooks(data.oneLiner);
      updateData({ hooks });
    } catch { setError('生成失败'); }
    finally { setLoading(false); }
  };

  // Step 4: 视频结构
  const handleGenerateStructure = async () => {
    setLoading(true);
    try {
      const structure = await aiService.generateVideoStructure(data.oneLiner, data.selectedHook || '');
      updateData({ structure });
    } catch { setError('生成失败'); }
    finally { setLoading(false); }
  };

  // Step 5: 口播稿
  const handleGenerateScript = async () => {
    setLoading(true);
    try {
      const script = await aiService.generateVideoScript(data.structure, data.oneLiner);
      updateData({ script });
      updateContent(content.id, { originalDraft: script });
    } catch { setError('生成失败'); }
    finally { setLoading(false); }
  };

  // Step 6: 标题
  const handleGenerateTitles = async () => {
    setLoading(true);
    try {
      const titles = await aiService.generateVideoTitles(data.oneLiner, data.script);
      updateData({ titles });
    } catch { setError('生成失败'); }
    finally { setLoading(false); }
  };

  // Step 7: 封面文案
  const handleGenerateCover = async () => {
    setLoading(true);
    try {
      const coverText = await aiService.generateCoverText(data.oneLiner, data.selectedTitle || '');
      updateData({ coverText });
      updateContent(content.id, { stage: 'cover', status: 'completed' });
    } catch { setError('生成失败'); }
    finally { setLoading(false); }
  };

  const handleAddToWorkPlan = () => {
    const subTasks = [
      { title: '录制口播', estimatedTime: 60 },
      { title: '剪辑视频', estimatedTime: 120 },
      { title: '添加字幕', estimatedTime: 30 },
      { title: '发布视频', estimatedTime: 30 },
    ];
    subTasks.forEach((st) => {
      const task = addTask({
        title: `${st.title} - ${content.title}`,
        project: '短视频',
        priority: 'P2',
        status: 'todo',
        source: 'content',
        contentId: content.id,
        estimatedTime: st.estimatedTime,
      });
      linkTask(content.id, task.id);
    });
    alert('已创建 4 个关联任务');
  };

  const handleCopy = async () => {
    const text = `标题：${data.selectedTitle || ''}\n\n${data.script}`;
    const ok = await copyToClipboard(text);
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  const handleBack = () => setActiveContentId(null);

  return (
    <div className="workflow-page">
      <div className="workflow-header">
        <button className="btn btn-ghost btn-sm" onClick={handleBack}>← 返回列表</button>
        <div className="workflow-type">🎬 短视频创作</div>
      </div>

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

      {/* Step 1: 主题 */}
      {stage === 'topic' && (
        <div className="stage-content">
          <h3 className="stage-title">输入主题</h3>
          <p className="stage-desc">你想拍一个关于什么的视频？</p>
          <input
            className="input"
            value={data.topic}
            onChange={(e) => updateData({ topic: e.target.value })}
            placeholder="例如：个人效率管理的终极方法"
            autoFocus
          />
          <div className="stage-actions">
            <button className="btn btn-primary" onClick={handleTopic} disabled={!data.topic.trim()}>
              下一步 →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: 一句话观点 */}
      {stage === 'one_liner' && (
        <div className="stage-content">
          <h3 className="stage-title">一句话观点</h3>
          <p className="stage-desc">用一句话说清楚：观众看完这条视频应该记住什么？</p>
          <button className="btn btn-primary" onClick={handleGenerateOneLiner} disabled={loading}>
            {loading ? <><span className="loading-spinner" /> 生成中...</> : '✨ AI 生成一句话观点'}
          </button>
          {data.oneLiner && (
            <>
              <textarea
                className="textarea"
                value={data.oneLiner}
                onChange={(e) => updateData({ oneLiner: e.target.value })}
                rows={3}
                style={{ marginTop: 12 }}
              />
              <div className="stage-actions">
                <button className="btn btn-primary" onClick={() => updateContent(content.id, { stage: 'hook' })}>
                  下一步 →
                </button>
              </div>
            </>
          )}
          {error && <div className="error-msg">{error}</div>}
        </div>
      )}

      {/* Step 3: 3秒开头 */}
      {stage === 'hook' && (
        <div className="stage-content">
          <h3 className="stage-title">3秒开头</h3>
          <p className="stage-desc">前3秒决定观众是否划走。AI 生成 3 个不同风格的开头。</p>
          <button className="btn btn-primary" onClick={handleGenerateHooks} disabled={loading}>
            {loading ? <><span className="loading-spinner" /> 生成中...</> : '✨ 生成开头方案'}
          </button>
          {data.hooks.length > 0 && (
            <div className="hooks-list">
              {data.hooks.map((hook, idx) => (
                <label key={idx} className={`hook-option ${data.selectedHook === hook ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="hook"
                    checked={data.selectedHook === hook}
                    onChange={() => updateData({ selectedHook: hook })}
                  />
                  <span className="hook-text">{hook}</span>
                  <span className="hook-type">方案 {idx + 1}</span>
                </label>
              ))}
              <div className="stage-actions">
                <button className="btn btn-primary" onClick={() => updateContent(content.id, { stage: 'structure' })} disabled={!data.selectedHook}>
                  下一步 →
                </button>
              </div>
            </div>
          )}
          {error && <div className="error-msg">{error}</div>}
        </div>
      )}

      {/* Step 4: 视频结构 */}
      {stage === 'structure' && (
        <div className="stage-content">
          <h3 className="stage-title">视频结构</h3>
          <p className="stage-desc">例如：开头 → 问题 → 观点 → 案例 → 结论</p>
          <button className="btn btn-primary" onClick={handleGenerateStructure} disabled={loading}>
            {loading ? <><span className="loading-spinner" /> 生成中...</> : '✨ 生成视频结构'}
          </button>
          {data.structure && (
            <>
              <textarea
                className="textarea"
                value={data.structure}
                onChange={(e) => updateData({ structure: e.target.value })}
                rows={10}
                style={{ marginTop: 12, fontFamily: 'monospace', fontSize: 13 }}
              />
              <div className="stage-actions">
                <button className="btn btn-primary" onClick={() => updateContent(content.id, { stage: 'script' })}>
                  下一步 →
                </button>
              </div>
            </>
          )}
          {error && <div className="error-msg">{error}</div>}
        </div>
      )}

      {/* Step 5: 完整口播稿 */}
      {stage === 'script' && (
        <div className="stage-content">
          <h3 className="stage-title">完整口播稿</h3>
          <p className="stage-desc">语言必须自然，适合真实说话。避免书面腔和 AI 套话。</p>
          <button className="btn btn-primary" onClick={handleGenerateScript} disabled={loading}>
            {loading ? <><span className="loading-spinner" /> AI 写作中...</> : '✨ 生成口播稿'}
          </button>
          {data.script && (
            <>
              <textarea
                className="textarea script-textarea"
                value={data.script}
                onChange={(e) => updateData({ script: e.target.value })}
                rows={16}
              />
              <div className="stage-actions">
                <button className="btn btn-secondary" onClick={() => updateContent(content.id, { stage: 'structure' })}>← 修改结构</button>
                <button className="btn btn-primary" onClick={() => updateContent(content.id, { stage: 'titles' })}>
                  下一步 →
                </button>
              </div>
            </>
          )}
          {error && <div className="error-msg">{error}</div>}
        </div>
      )}

      {/* Step 6: 视频标题 */}
      {stage === 'titles' && (
        <div className="stage-content">
          <h3 className="stage-title">视频标题</h3>
          <p className="stage-desc">生成 5 个候选标题。</p>
          <button className="btn btn-primary" onClick={handleGenerateTitles} disabled={loading}>
            {loading ? <><span className="loading-spinner" /> 生成中...</> : '✨ 生成标题'}
          </button>
          {data.titles.length > 0 && (
            <div className="titles-list">
              {data.titles.map((title, idx) => (
                <label key={idx} className={`title-option ${data.selectedTitle === title ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="vtitle"
                    checked={data.selectedTitle === title}
                    onChange={() => updateData({ selectedTitle: title })}
                  />
                  <span className="title-text">{title}</span>
                </label>
              ))}
              <div className="stage-actions">
                <button className="btn btn-primary" onClick={() => updateContent(content.id, { stage: 'cover' })} disabled={!data.selectedTitle}>
                  下一步 →
                </button>
              </div>
            </div>
          )}
          {error && <div className="error-msg">{error}</div>}
        </div>
      )}

      {/* Step 7: 封面文案 */}
      {stage === 'cover' && (
        <div className="stage-content">
          <h3 className="stage-title">封面文案</h3>
          <p className="stage-desc">简洁有力的短句，用于视频封面。</p>
          <button className="btn btn-primary" onClick={handleGenerateCover} disabled={loading}>
            {loading ? <><span className="loading-spinner" /> 生成中...</> : '✨ 生成封面文案'}
          </button>
          {data.coverText && (
            <div className="final-video">
              <div className="summary-section">
                <div className="summary-item">
                  <span className="summary-label">核心观点</span>
                  <p className="summary-value">{data.oneLiner}</p>
                </div>
                <div className="summary-item">
                  <span className="summary-label">选定的开头</span>
                  <p className="summary-value">{data.selectedHook}</p>
                </div>
                <div className="summary-item">
                  <span className="summary-label">视频标题</span>
                  <p className="summary-value summary-title">{data.selectedTitle}</p>
                </div>
                <div className="summary-item">
                  <span className="summary-label">封面文案</span>
                  <p className="summary-value summary-cover">{data.coverText}</p>
                </div>
              </div>
              <div className="summary-divider" />
              <div className="summary-item">
                <span className="summary-label">完整口播稿</span>
                <textarea
                  className="textarea script-textarea"
                  value={data.script}
                  onChange={(e) => updateData({ script: e.target.value })}
                  rows={16}
                />
              </div>
              <div className="stage-actions">
                <button className="btn btn-secondary btn-sm" onClick={handleCopy}>
                  {copied ? '✓ 已复制' : '复制全部'}
                </button>
                <button className="btn btn-primary btn-sm" onClick={handleAddToWorkPlan}>
                  一键加入工作计划
                </button>
              </div>
            </div>
          )}
          {error && <div className="error-msg">{error}</div>}
        </div>
      )}

      <style>{`
        .hooks-list { margin-top: 20px; display: flex; flex-direction: column; gap: 8px; }
        .hook-option {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 14px 16px;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: var(--transition);
        }
        .hook-option:hover { border-color: var(--color-primary); }
        .hook-option.selected {
          border-color: var(--color-primary);
          background: var(--color-primary-bg);
        }
        .hook-option input { margin: 4px 0 0 0; }
        .hook-text { flex: 1; font-size: 14px; line-height: 1.6; }
        .hook-type {
          font-size: 12px; color: var(--color-text-tertiary);
          background: var(--color-bg); padding: 2px 8px; border-radius: 4px;
          white-space: nowrap;
        }
        .script-textarea { font-size: 14px; line-height: 1.8; }
        .final-video { margin-top: 20px; }
        .summary-section { display: flex; flex-direction: column; gap: 16px; }
        .summary-item {}
        .summary-label {
          font-size: 12px; font-weight: 600;
          color: var(--color-text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: block; margin-bottom: 4px;
        }
        .summary-value {
          font-size: 14px; color: var(--color-text-primary);
          line-height: 1.6;
        }
        .summary-title { font-size: 18px; font-weight: 700; }
        .summary-cover {
          font-size: 24px; font-weight: 800;
          background: var(--color-primary-bg);
          padding: 12px 16px; border-radius: var(--radius-sm);
          color: var(--color-primary);
        }
        .summary-divider {
          height: 1px; background: var(--color-border-light);
          margin: 20px 0;
        }
      `}</style>
    </div>
  );
}
