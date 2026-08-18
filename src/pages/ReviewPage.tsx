// ============================================================
// 每日复盘页面
// ============================================================

import { useState, useEffect } from 'react';
import { useTaskStore } from '@/store/useTaskStore';
import { useReviewStore } from '@/store/useReviewStore';
import { aiService } from '@/services/ai/AIService';
import { LoadingButton, EmptyState } from '@/components/common';
import { today, formatDateWithWeekday, formatDate, relativeTime } from '@/utils/date';
import type { DailyReview } from '@/models/types';

export function ReviewPage() {
  const tasks = useTaskStore((s) => s.tasks);
  const reviews = useReviewStore((s) => s.reviews);
  const addReview = useReviewStore((s) => s.addReview);
  const updateTask = useTaskStore((s) => s.updateTask);

  const [mode, setMode] = useState<'list' | 'conduct'>('list');
  const [answers, setAnswers] = useState({ completed: '', incomplete: '', blocker: '' });
  const [generating, setGenerating] = useState(false);
  const [generatedReview, setGeneratedReview] = useState<any>(null);

  const todayStr = today();
  const todayReview = reviews.find((r) => r.date === todayStr);

  useEffect(() => {
    if (todayReview) {
      setMode('list');
    }
  }, [todayReview]);

  // 今日任务统计
  const todayTasks = tasks.filter(
    (t) => t.planDate === todayStr || t.dueDate === todayStr
  );
  const doneCount = todayTasks.filter((t) => t.status === 'done').length;
  const incompleteTasks = todayTasks.filter((t) => t.status !== 'done');

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await aiService.generateDailyReview(tasks, {
        completed: answers.completed || `完成了 ${doneCount} 项任务`,
        incomplete: answers.incomplete || `${incompleteTasks.length} 项任务未完成`,
        blocker: answers.blocker || '暂无明显阻碍',
      });

      addReview({
        date: todayStr,
        completedCount: doneCount,
        plannedCount: todayTasks.length,
        completionRate: todayTasks.length > 0 ? Math.round((doneCount / todayTasks.length) * 100) : 0,
        keyAchievements: result.keyAchievements,
        incompleteTasks: result.incompleteTasks,
        blockers: result.blockers,
        tomorrowTop3: result.tomorrowTop3,
        notes: answers.completed + '\n' + answers.incomplete + '\n' + answers.blocker,
      });
      setGeneratedReview(result);
      setMode('list');
    } finally {
      setGenerating(false);
    }
  };

  const handleMoveIncompleteToTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
    
    incompleteTasks.forEach((t) => {
      updateTask(t.id, { planDate: tomorrowStr, status: 'todo' });
    });
    alert(`已将 ${incompleteTasks.length} 项任务移至明天`);
  };

  const sortedReviews = [...reviews].sort((a, b) => b.date.localeCompare(a.date));

  // ---------- 复盘进行模式 ----------
  if (mode === 'conduct') {
    return (
      <div className="review-page">
        <div className="review-conduct">
          <h1 className="page-title">今日复盘</h1>
          <p className="page-subtitle">{formatDateWithWeekday(todayStr)}</p>

          {/* 今日数据预览 */}
          <div className="review-stats">
            <div className="stat-card">
              <div className="stat-num">{todayTasks.length}</div>
              <div className="stat-label">计划任务</div>
            </div>
            <div className="stat-card">
              <div className="stat-num" style={{ color: 'var(--color-success)' }}>{doneCount}</div>
              <div className="stat-label">已完成</div>
            </div>
            <div className="stat-card">
              <div className="stat-num" style={{ color: 'var(--color-warning)' }}>{incompleteTasks.length}</div>
              <div className="stat-label">未完成</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">
                {todayTasks.length > 0 ? Math.round((doneCount / todayTasks.length) * 100) : 0}%
              </div>
              <div className="stat-label">完成率</div>
            </div>
          </div>

          {/* 三个问题 */}
          <div className="review-questions">
            <div className="form-group">
              <label className="form-label">1. 今天完成了什么？</label>
              <textarea
                className="textarea"
                value={answers.completed}
                onChange={(e) => setAnswers({ ...answers, completed: e.target.value })}
                placeholder="简要描述今天的主要成果..."
                rows={3}
              />
            </div>
            <div className="form-group">
              <label className="form-label">2. 什么没有完成？</label>
              <textarea
                className="textarea"
                value={answers.incomplete}
                onChange={(e) => setAnswers({ ...answers, incomplete: e.target.value })}
                placeholder="哪些任务延期了？为什么？"
                rows={3}
              />
            </div>
            <div className="form-group">
              <label className="form-label">3. 最大的阻碍是什么？</label>
              <textarea
                className="textarea"
                value={answers.blocker}
                onChange={(e) => setAnswers({ ...answers, blocker: e.target.value })}
                placeholder="遇到了什么困难或阻力？"
                rows={3}
              />
            </div>
          </div>

          <div className="review-actions">
            <button className="btn btn-secondary" onClick={() => setMode('list')}>取消</button>
            <LoadingButton loading={generating} onClick={handleGenerate}>
              ✨ 生成复盘报告
            </LoadingButton>
          </div>
        </div>

        <style>{`
          .review-page { max-width: var(--content-max-width); margin: 0 auto; padding: 32px 40px 80px; }
          .page-title { font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
          .page-subtitle { font-size: 14px; color: var(--color-text-tertiary); margin-top: 4px; margin-bottom: 24px; }
          .review-stats {
            display: grid; grid-template-columns: repeat(4, 1fr);
            gap: 12px; margin-bottom: 28px;
          }
          .stat-card {
            background: var(--color-surface); border: 1px solid var(--color-border-light);
            border-radius: var(--radius-md); padding: 20px; text-align: center;
          }
          .stat-num { font-size: 32px; font-weight: 800; color: var(--color-primary); }
          .stat-label { font-size: 13px; color: var(--color-text-tertiary); margin-top: 4px; }
          .review-questions {
            background: var(--color-surface); border: 1px solid var(--color-border-light);
            border-radius: var(--radius-md); padding: 24px; margin-bottom: 24px;
          }
          .review-actions {
            display: flex; gap: 12px; justify-content: flex-end;
          }
          @media (max-width: 768px) {
            .review-page { padding: 20px 16px 60px; }
            .review-stats { grid-template-columns: repeat(2, 1fr); }
          }
        `}</style>
      </div>
    );
  }

  // ---------- 复盘列表模式 ----------
  return (
    <div className="review-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">每日复盘</h1>
          <p className="page-subtitle">回顾今天的成果，规划明天的方向</p>
        </div>
        {!todayReview && (
          <button className="btn btn-primary" onClick={() => setMode('conduct')}>
            🌙 开始今日复盘
          </button>
        )}
      </header>

      {/* 今日复盘结果 */}
      {todayReview ? (
        <div className="today-review">
          <div className="review-summary-header">
            <div className="review-date">{formatDateWithWeekday(todayStr)}</div>
            <div className="completion-badge" style={{
              background: todayReview.completionRate >= 70 ? 'var(--color-success-bg)' : 'var(--color-warning-bg)',
              color: todayReview.completionRate >= 70 ? 'var(--color-success)' : 'var(--color-warning)',
            }}>
              完成率 {todayReview.completionRate}%
            </div>
          </div>

          <div className="review-stats">
            <div className="stat-card">
              <div className="stat-num">{todayReview.plannedCount}</div>
              <div className="stat-label">计划任务</div>
            </div>
            <div className="stat-card">
              <div className="stat-num" style={{ color: 'var(--color-success)' }}>{todayReview.completedCount}</div>
              <div className="stat-label">已完成</div>
            </div>
            <div className="stat-card">
              <div className="stat-num" style={{ color: 'var(--color-warning)' }}>{todayReview.plannedCount - todayReview.completedCount}</div>
              <div className="stat-label">未完成</div>
            </div>
          </div>

          {todayReview.keyAchievements.length > 0 && (
            <div className="review-block">
              <h3 className="block-title">✨ 今日关键成果</h3>
              <ul className="block-list">
                {todayReview.keyAchievements.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {todayReview.incompleteTasks.length > 0 && (
            <div className="review-block">
              <h3 className="block-title">📋 未完成事项</h3>
              <ul className="block-list">
                {todayReview.incompleteTasks.map((item, idx) => (
                  <li key={idx} className="incomplete-item">{item}</li>
                ))}
              </ul>
              <button className="btn btn-sm btn-secondary" onClick={handleMoveIncompleteToTomorrow} style={{ marginTop: 12 }}>
                全部移至明天 →
              </button>
            </div>
          )}

          {todayReview.blockers && (
            <div className="review-block">
              <h3 className="block-title">🚧 今日问题</h3>
              <p className="block-text">{todayReview.blockers}</p>
            </div>
          )}

          {todayReview.tomorrowTop3.length > 0 && (
            <div className="review-block tomorrow">
              <h3 className="block-title">🌅 明日建议 Top 3</h3>
              <ol className="block-list ordered">
                {todayReview.tomorrowTop3.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      ) : (
        <div className="no-today-review">
          <EmptyState
            icon="🌙"
            title="今天还没有复盘"
            description="花几分钟回顾今天的成果，让明天的计划更清晰"
            action={<button className="btn btn-primary" onClick={() => setMode('conduct')}>开始复盘</button>}
          />
        </div>
      )}

      {/* 历史复盘 */}
      {sortedReviews.length > 1 && (
        <section className="history-section">
          <h2 className="section-title">历史复盘</h2>
          <div className="history-list">
            {sortedReviews.filter(r => r.date !== todayStr).slice(0, 10).map((r) => (
              <div key={r.id} className="history-item">
                <div className="history-date">{formatDate(r.date)}</div>
                <div className="history-stats">
                  完成 {r.completedCount}/{r.plannedCount}（{r.completionRate}%）
                </div>
                {r.tomorrowTop3.length > 0 && (
                  <div className="history-top">
                    明日建议: {r.tomorrowTop3.slice(0, 2).join('、')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <style>{`
        .review-page { max-width: var(--content-max-width); margin: 0 auto; padding: 32px 40px 80px; }
        .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
        .page-title { font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
        .page-subtitle { font-size: 14px; color: var(--color-text-tertiary); margin-top: 4px; }
        .today-review {
          background: var(--color-surface); border: 1px solid var(--color-border-light);
          border-radius: var(--radius-md); padding: 24px; margin-bottom: 32px;
        }
        .review-summary-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 20px;
        }
        .review-date { font-size: 16px; font-weight: 600; }
        .completion-badge { padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: 600; }
        .review-stats {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 12px; margin-bottom: 24px;
        }
        .stat-card {
          background: var(--color-bg); border-radius: var(--radius-sm);
          padding: 16px; text-align: center;
        }
        .stat-num { font-size: 28px; font-weight: 800; color: var(--color-primary); }
        .stat-label { font-size: 12px; color: var(--color-text-tertiary); margin-top: 4px; }
        .review-block { margin-bottom: 24px; }
        .block-title { font-size: 15px; font-weight: 600; margin-bottom: 12px; }
        .block-list { list-style: none; padding: 0; }
        .block-list li {
          padding: 8px 0; font-size: 14px; color: var(--color-text-secondary);
          border-bottom: 1px solid var(--color-border-light);
        }
        .block-list li:last-child { border-bottom: none; }
        .block-list.ordered { counter-reset: item; list-style: none; }
        .block-list.ordered li { counter-increment: item; }
        .block-list.ordered li::before {
          content: counter(item); display: inline-block;
          width: 22px; height: 22px; line-height: 22px;
          text-align: center; border-radius: 50%;
          background: var(--color-primary); color: #fff;
          font-size: 12px; font-weight: 700; margin-right: 10px;
        }
        .incomplete-item { color: var(--color-warning); }
        .block-text { font-size: 14px; color: var(--color-text-secondary); line-height: 1.6; }
        .review-block.tomorrow {
          background: var(--color-primary-bg); padding: 16px;
          border-radius: var(--radius-sm); margin-bottom: 0;
        }
        .review-block.tomorrow .block-title { color: var(--color-primary); }
        .history-section {}
        .section-title { font-size: 16px; font-weight: 600; margin-bottom: 12px; }
        .history-list { display: flex; flex-direction: column; gap: 8px; }
        .history-item {
          background: var(--color-surface); border: 1px solid var(--color-border-light);
          border-radius: var(--radius-sm); padding: 12px 16px;
        }
        .history-date { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
        .history-stats { font-size: 13px; color: var(--color-text-tertiary); }
        .history-top { font-size: 13px; color: var(--color-text-tertiary); margin-top: 4px; }
        @media (max-width: 768px) {
          .review-page { padding: 20px 16px 60px; }
          .page-header { flex-direction: column; gap: 12px; }
          .review-stats { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>
    </div>
  );
}
