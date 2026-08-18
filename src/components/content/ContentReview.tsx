// ============================================================
// 内容检查系统 - 8维度评分 + 问题分析 + 优化建议
// ============================================================

import { useState } from 'react';
import { useContentStore } from '@/store/useContentStore';
import { aiService } from '@/services/ai/AIService';
import { LoadingButton, ConfirmDialog } from '@/components/common';
import type { Content, ContentReviewResult } from '@/models/types';

export function ContentReview({ content }: { content: Content }) {
  const updateContent = useContentStore((s) => s.updateContent);

  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [error, setError] = useState('');
  const [showOptimizeConfirm, setShowOptimizeConfirm] = useState(false);

  const text = content.type === 'article'
    ? content.articleData?.draft || ''
    : content.videoData?.script || '';

  const reviewResult = content.reviewResult;

  const handleReview = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    try {
      const result = await aiService.reviewContent(text, content.type);
      updateContent(content.id, { reviewResult: result });
    } catch {
      setError('检查失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleOptimize = async () => {
    if (!reviewResult) return;
    setOptimizing(true);
    setError('');
    try {
      // 保存原始版本
      if (!content.originalDraft) {
        updateContent(content.id, { originalDraft: text });
      }
      const optimized = await aiService.optimizeContent(text, reviewResult);
      if (content.type === 'article') {
        updateContent(content.id, {
          articleData: { ...content.articleData!, draft: optimized },
        });
      } else {
        updateContent(content.id, {
          videoData: { ...content.videoData!, script: optimized },
        });
      }
      setShowOptimizeConfirm(false);
    } catch {
      setError('优化失败，请重试');
    } finally {
      setOptimizing(false);
    }
  };

  const handleRestore = () => {
    if (!content.originalDraft) return;
    if (content.type === 'article') {
      updateContent(content.id, {
        articleData: { ...content.articleData!, draft: content.originalDraft },
        originalDraft: null,
      });
    } else {
      updateContent(content.id, {
        videoData: { ...content.videoData!, script: content.originalDraft },
        originalDraft: null,
      });
    }
  };

  return (
    <div className="review-container">
      <h3 className="stage-title">内容检查</h3>
      <p className="stage-desc">AI 从 8 个维度评估内容质量，给出评分和修改建议。</p>

      {/* 原文预览 */}
      <div className="review-original">
        <div className="review-original-header">
          <span className="review-label">原文{content.originalDraft && '（已保留原始版本）'}</span>
          {content.originalDraft && (
            <button className="btn btn-ghost btn-sm" onClick={handleRestore}>
              ↩ 恢复原始版本
            </button>
          )}
        </div>
        <pre className="review-text">{text || '（暂无内容）'}</pre>
      </div>

      {/* 检查按钮 */}
      <div className="review-action">
        <LoadingButton loading={loading} onClick={handleReview} disabled={!text.trim()}>
          {reviewResult ? '🔄 重新检查' : '✨ 开始内容检查'}
        </LoadingButton>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {/* 检查结果 */}
      {reviewResult && (
        <div className="review-result fade-in">
          {/* 总评分 */}
          <div className="score-header">
            <div className="score-circle" style={{
              background: reviewResult.score >= 80 ? 'var(--color-success-bg)' : 'var(--color-warning-bg)',
              color: reviewResult.score >= 80 ? 'var(--color-success)' : 'var(--color-warning)',
            }}>
              <span className="score-num">{reviewResult.score}</span>
              <span className="score-label">总分</span>
            </div>
            <div className="score-summary">
              {reviewResult.score >= 85 ? '内容质量优秀，可以发布' :
               reviewResult.score >= 75 ? '内容质量不错，稍作修改更好' :
               '内容需要优化后再发布'}
            </div>
          </div>

          {/* 维度评分 */}
          <div className="dimensions-grid">
            {reviewResult.dimensions.map((dim, idx) => (
              <div key={idx} className="dim-card">
                <div className="dim-header">
                  <span className="dim-name">{dim.name}</span>
                  <span className="dim-score" style={{
                    color: dim.score >= 80 ? 'var(--color-success)' :
                           dim.score >= 60 ? 'var(--color-warning)' : 'var(--color-danger)',
                  }}>{dim.score}</span>
                </div>
                <div className="dim-bar">
                  <div className="dim-bar-fill" style={{
                    width: `${dim.score}%`,
                    background: dim.score >= 80 ? 'var(--color-success)' :
                                dim.score >= 60 ? 'var(--color-warning)' : 'var(--color-danger)',
                  }} />
                </div>
                <p className="dim-comment">{dim.comment}</p>
              </div>
            ))}
          </div>

          {/* 三大问题 */}
          <div className="issues-section">
            <h4 className="issues-title">需要重点改善的 3 个问题</h4>
            {reviewResult.topIssues.map((issue, idx) => (
              <div key={idx} className="issue-card">
                <div className="issue-header">
                  <span className="issue-num">{idx + 1}</span>
                  <span className="issue-title">{issue.issue}</span>
                </div>
                <div className="issue-detail">
                  <div className="issue-row">
                    <span className="issue-label">问题原因</span>
                    <span>{issue.reason}</span>
                  </div>
                  <div className="issue-row">
                    <span className="issue-label">修改建议</span>
                    <span>{issue.suggestion}</span>
                  </div>
                  <div className="issue-row">
                    <span className="issue-label">推荐修改</span>
                    <span className="issue-suggestion">「{issue.suggestedSentence}」</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 推荐开头和结尾 */}
          <div className="suggestions-section">
            <h4 className="issues-title">推荐的新开头</h4>
            <div className="suggestion-card">{reviewResult.suggestedOpening}</div>
            <h4 className="issues-title">推荐的新结尾</h4>
            <div className="suggestion-card">{reviewResult.suggestedEnding}</div>
          </div>

          {/* 优化按钮 */}
          <div className="optimize-actions">
            <LoadingButton
              loading={optimizing}
              onClick={() => setShowOptimizeConfirm(true)}
              className="btn-primary"
            >
              🚀 帮我优化全文
            </LoadingButton>
            <span className="optimize-hint">优化不会覆盖原始版本，可随时恢复</span>
          </div>
        </div>
      )}

      {/* 优化确认 */}
      <ConfirmDialog
        open={showOptimizeConfirm}
        title="优化全文"
        message="AI 将根据检查结果优化你的文章。原始版本会被保留，你可以随时恢复。确认继续？"
        confirmText="开始优化"
        onConfirm={handleOptimize}
        onCancel={() => setShowOptimizeConfirm(false)}
      />

      <style>{`
        .review-container {
          background: var(--color-surface);
          border: 1px solid var(--color-border-light);
          border-radius: var(--radius-md);
          padding: 28px;
        }
        .stage-title { font-size: 20px; font-weight: 700; margin-bottom: 8px; }
        .stage-desc { font-size: 14px; color: var(--color-text-tertiary); margin-bottom: 20px; }
        .review-original {
          background: var(--color-bg);
          border-radius: var(--radius-sm);
          padding: 16px;
          margin-bottom: 16px;
        }
        .review-original-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .review-label {
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text-secondary);
        }
        .review-text {
          font-size: 13px;
          line-height: 1.7;
          color: var(--color-text-secondary);
          white-space: pre-wrap;
          word-break: break-word;
          max-height: 300px;
          overflow-y: auto;
          font-family: var(--font-sans);
        }
        .review-action { margin: 20px 0; }
        .score-header {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 20px;
          background: var(--color-bg);
          border-radius: var(--radius-md);
          margin-bottom: 24px;
        }
        .score-circle {
          width: 80px; height: 80px;
          border-radius: 50%;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .score-num { font-size: 28px; font-weight: 800; line-height: 1; }
        .score-label { font-size: 11px; margin-top: 2px; }
        .score-summary {
          font-size: 15px;
          color: var(--color-text-primary);
          font-weight: 500;
        }
        .dimensions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 12px;
          margin-bottom: 24px;
        }
        .dim-card {
          padding: 14px;
          border: 1px solid var(--color-border-light);
          border-radius: var(--radius-sm);
        }
        .dim-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .dim-name { font-size: 14px; font-weight: 500; }
        .dim-score { font-size: 16px; font-weight: 700; }
        .dim-bar {
          height: 4px;
          background: var(--color-border-light);
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 8px;
        }
        .dim-bar-fill { height: 100%; border-radius: 2px; transition: width 0.3s; }
        .dim-comment { font-size: 12px; color: var(--color-text-tertiary); line-height: 1.5; }
        .issues-section { margin-bottom: 24px; }
        .issues-title {
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 12px;
          color: var(--color-text-primary);
        }
        .issue-card {
          border: 1px solid var(--color-border-light);
          border-radius: var(--radius-sm);
          padding: 16px;
          margin-bottom: 12px;
        }
        .issue-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }
        .issue-num {
          width: 22px; height: 22px;
          border-radius: 50%;
          background: var(--color-danger);
          color: #fff;
          font-size: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .issue-title { font-size: 15px; font-weight: 600; }
        .issue-detail { display: flex; flex-direction: column; gap: 8px; }
        .issue-row { display: flex; gap: 8px; font-size: 13px; line-height: 1.6; }
        .issue-label {
          color: var(--color-text-tertiary);
          white-space: nowrap;
          min-width: 60px;
        }
        .issue-suggestion {
          color: var(--color-primary);
          font-style: italic;
        }
        .suggestion-card {
          background: var(--color-primary-bg);
          padding: 14px 16px;
          border-radius: var(--radius-sm);
          font-size: 14px;
          color: var(--color-text-primary);
          line-height: 1.7;
          margin-bottom: 20px;
        }
        .optimize-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-top: 20px;
          border-top: 1px solid var(--color-border-light);
        }
        .optimize-hint {
          font-size: 12px;
          color: var(--color-text-tertiary);
        }
        @media (max-width: 768px) {
          .dimensions-grid { grid-template-columns: 1fr; }
          .score-header { flex-direction: column; text-align: center; }
        }
      `}</style>
    </div>
  );
}
