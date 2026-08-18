// ============================================================
// 今日工作台 - 产品首页
// ============================================================

import { useState, useCallback } from 'react';
import { useTaskStore } from '@/store/useTaskStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useAppStore } from '@/store/useAppStore';
import { aiService } from '@/services/ai/AIService';
import { getGreeting, today, formatDate, formatTime, formatDateWithWeekday } from '@/utils/date';
import { Modal, ConfirmDialog, PriorityBadge, EmptyState, LoadingButton } from '@/components/common';
import type { Task } from '@/models/types';

export function TodayPage() {
  const tasks = useTaskStore((s) => s.tasks);
  const toggleComplete = useTaskStore((s) => s.toggleComplete);
  const addParsedTask = useTaskStore((s) => s.addParsedTask);
  const loading = useTaskStore((s) => s.loading);
  const setPriority = useTaskStore((s) => s.setPriority);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const updateTask = useTaskStore((s) => s.updateTask);

  const settings = useSettingsStore((s) => s.settings);
  const setPage = useAppStore((s) => s.setPage);
  const startNewContent = useAppStore((s) => s.startNewContent);

  const [quickInput, setQuickInput] = useState('');
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [parsedPreview, setParsedPreview] = useState<Task | null>(null);

  const todayStr = today();
  const todayTasks = tasks.filter(
    (t) => t.status !== 'done' && (t.planDate === todayStr || t.dueDate === todayStr)
  );

  // Top 3: 按 P1>P2>P3 排序，取前3
  const top3 = [...todayTasks]
    .sort((a, b) => {
      const order = { P1: 0, P2: 1, P3: 2, P4: 3 };
      return order[a.priority] - order[b.priority];
    })
    .slice(0, 3);

  const importantCount = todayTasks.filter((t) => t.priority === 'P1').length;

  const handleQuickAdd = useCallback(async () => {
    if (!quickInput.trim()) return;
    try {
      const parsed = await aiService.parseTask(quickInput);
      const task = addParsedTask(parsed, {
        status: 'todo',
        planDate: todayStr,
      });
      setParsedPreview(task);
      setQuickInput('');
    } catch (e) {
      console.error('Parse task error:', e);
      alert('解析失败，请重试');
    }
  }, [quickInput, addParsedTask, todayStr]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleQuickAdd();
    }
  };

  return (
    <div className="today-page">
      {/* 顶部问候 */}
      <header className="page-header">
        <div className="greeting-area">
          <div className="date-text">{formatDateWithWeekday(todayStr)}</div>
          <div className="greeting-text">
            {getGreeting()}，{importantCount > 0
              ? `今天还有 ${importantCount} 项重要任务需要处理。`
              : '今天没有紧急任务，可以专注于深度工作。'}
          </div>
        </div>
      </header>

      {/* Top 3 */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">今日 Top 3</h2>
        </div>
        <div className="top3-list">
          {top3.length === 0 ? (
            <div className="empty-inline">
              今天没有重要任务。{` `}
              <button className="link-btn" onClick={() => setPage('tasks')}>去添加任务</button>
            </div>
          ) : (
            top3.map((task, idx) => (
              <div key={task.id} className="top3-card">
                <button
                  className={`task-checkbox ${task.status === 'done' ? 'checked' : ''}`}
                  onClick={() => toggleComplete(task.id)}
                />
                <div className="top3-main">
                  <div className="top3-index">#{idx + 1}</div>
                  <div className="top3-title">{task.title}</div>
                  <div className="top3-meta">
                    {task.project && <span className="meta-item">{task.project}</span>}
                    <PriorityBadge priority={task.priority} />
                    {task.dueDate && <span className="meta-item">截止 {formatDate(task.dueDate)}</span>}
                    {task.estimatedTime > 0 && <span className="meta-item">预计 {formatTime(task.estimatedTime)}</span>}
                  </div>
                </div>
                <div className="top3-actions">
                  <button className="btn-icon" title="编辑" onClick={() => setEditTask(task)}>✎</button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* 快速记录 */}
      <section className="section">
        <div className="quick-input-wrapper">
          <textarea
            className="quick-input"
            placeholder="有什么事情需要记录？&#10;例如：明天下午完成公众号修改。"
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
          />
          <div className="quick-input-footer">
            <span className="hint-text">⌘+Enter 提交 · AI 自动解析为结构化任务</span>
            <LoadingButton loading={loading} onClick={handleQuickAdd} disabled={!quickInput.trim()}>
              记录
            </LoadingButton>
          </div>
        </div>
      </section>

      {/* 快捷入口 */}
      <section className="section">
        <div className="quick-actions">
          <button className="quick-action-card" onClick={() => startNewContent('article')}>
            <span className="qa-icon">📝</span>
            <span className="qa-label">写公众号</span>
          </button>
          <button className="quick-action-card" onClick={() => startNewContent('video')}>
            <span className="qa-icon">🎬</span>
            <span className="qa-label">做视频</span>
          </button>
          <button className="quick-action-card" onClick={() => setPage('tasks')}>
            <span className="qa-icon">✚</span>
            <span className="qa-label">添加任务</span>
          </button>
          <button className="quick-action-card" onClick={() => setPage('review')}>
            <span className="qa-icon">🌙</span>
            <span className="qa-label">开始复盘</span>
          </button>
        </div>
      </section>

      {/* 今日任务 */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">今日任务</h2>
          <span className="section-count">{todayTasks.length}</span>
        </div>
        <div className="task-list">
          {todayTasks.length === 0 ? (
            <EmptyState
              title="今天没有计划任务"
              description="使用上方输入框快速添加，或去任务管理页面整理。"
              action={<button className="btn btn-primary" onClick={() => setPage('tasks')}>去任务管理</button>}
            />
          ) : (
            todayTasks.map((task) => (
              <div key={task.id} className="task-row">
                <button
                  className={`task-checkbox ${task.status === 'done' ? 'checked' : ''}`}
                  onClick={() => toggleComplete(task.id)}
                />
                <div className="task-row-main">
                  <div className="task-row-title">{task.title}</div>
                  <div className="task-row-meta">
                    {task.project && <span className="meta-item">{task.project}</span>}
                    <PriorityBadge priority={task.priority} />
                    {task.dueDate && <span className="meta-item">截止 {formatDate(task.dueDate)}</span>}
                    {task.estimatedTime > 0 && <span className="meta-item">预计 {formatTime(task.estimatedTime)}</span>}
                    {task.contentId && <span className="meta-item link-badge">已关联内容</span>}
                  </div>
                </div>
                <div className="task-row-actions">
                  <select
                    className="priority-select"
                    value={task.priority}
                    onChange={(e) => setPriority(task.id, e.target.value as Task['priority'])}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="P1">P1</option>
                    <option value="P2">P2</option>
                    <option value="P3">P3</option>
                    <option value="P4">P4</option>
                  </select>
                  <button className="btn-icon" title="编辑" onClick={() => setEditTask(task)}>✎</button>
                  <button className="btn-icon" title="删除" onClick={() => setDeleteTarget(task)}>🗑</button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* 编辑任务弹窗 */}
      {editTask && (
        <EditTaskModal
          task={editTask}
          onClose={() => setEditTask(null)}
          onSave={(updates) => {
            updateTask(editTask.id, updates);
            setEditTask(null);
          }}
        />
      )}

      {/* 删除确认 */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="删除任务"
        message={`确定要删除「${deleteTarget?.title}」吗？此操作不可撤销。`}
        danger
        confirmText="删除"
        onConfirm={() => {
          if (deleteTarget) deleteTask(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* 解析预览 */}
      {parsedPreview && (
        <Modal open={!!parsedPreview} onClose={() => setParsedPreview(null)} title="AI 已解析任务" width="440px">
          <div style={{ marginBottom: 16, color: 'var(--color-text-secondary)' }}>
            AI 已将你的输入整理为结构化任务：
          </div>
          <div style={{ background: 'var(--color-bg)', padding: 16, borderRadius: 10, marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{parsedPreview.title}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 13 }}>
              {parsedPreview.project && <span>项目: {parsedPreview.project}</span>}
              <span>优先级: {parsedPreview.priority}</span>
              {parsedPreview.dueDate && <span>截止: {formatDate(parsedPreview.dueDate)}</span>}
              {parsedPreview.estimatedTime && <span>预计: {formatTime(parsedPreview.estimatedTime)}</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setParsedPreview(null)}>好的</button>
          </div>
        </Modal>
      )}

      <style>{`
        .today-page {
          max-width: var(--content-max-width);
          margin: 0 auto;
          padding: 32px 40px 80px;
        }
        .page-header {
          margin-bottom: 32px;
        }
        .date-text {
          font-size: 14px;
          color: var(--color-text-tertiary);
          margin-bottom: 6px;
        }
        .greeting-text {
          font-size: 24px;
          font-weight: 700;
          color: var(--color-text-primary);
          letter-spacing: -0.5px;
        }
        .section {
          margin-bottom: 28px;
        }
        .section-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }
        .section-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--color-text-primary);
        }
        .section-count {
          font-size: 13px;
          color: var(--color-text-tertiary);
          background: var(--color-bg);
          padding: 1px 8px;
          border-radius: 10px;
        }
        .top3-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .top3-card {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px;
          background: var(--color-surface);
          border: 1px solid var(--color-border-light);
          border-radius: var(--radius-md);
          transition: var(--transition);
        }
        .top3-card:hover {
          box-shadow: var(--shadow-md);
          border-color: var(--color-border);
        }
        .top3-main {
          flex: 1;
          min-width: 0;
        }
        .top3-index {
          font-size: 12px;
          font-weight: 700;
          color: var(--color-primary);
          margin-bottom: 4px;
        }
        .top3-title {
          font-size: 15px;
          font-weight: 500;
          color: var(--color-text-primary);
          margin-bottom: 6px;
          cursor: pointer;
        }
        .top3-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          font-size: 12px;
          color: var(--color-text-tertiary);
        }
        .meta-item {
          display: inline-flex;
          align-items: center;
        }
        .link-badge {
          color: var(--color-primary);
        }
        .top3-actions {
          display: flex;
          gap: 4px;
        }
        .empty-inline {
          padding: 20px;
          text-align: center;
          color: var(--color-text-tertiary);
          font-size: 14px;
          background: var(--color-surface);
          border-radius: var(--radius-md);
          border: 1px dashed var(--color-border);
        }
        .link-btn {
          color: var(--color-primary);
          background: none;
          text-decoration: underline;
          font-size: inherit;
        }
        .quick-input-wrapper {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 12px;
          transition: var(--transition);
        }
        .quick-input-wrapper:focus-within {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px var(--color-primary-bg);
        }
        .quick-input {
          width: 100%;
          border: none;
          background: transparent;
          resize: none;
          font-size: 15px;
          line-height: 1.6;
          color: var(--color-text-primary);
        }
        .quick-input:focus {
          outline: none;
        }
        .quick-input-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 8px;
        }
        .hint-text {
          font-size: 12px;
          color: var(--color-text-tertiary);
        }
        .quick-actions {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }
        .quick-action-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 20px 12px;
          background: var(--color-surface);
          border: 1px solid var(--color-border-light);
          border-radius: var(--radius-md);
          transition: var(--transition);
        }
        .quick-action-card:hover {
          border-color: var(--color-primary);
          background: var(--color-primary-bg);
          transform: translateY(-2px);
        }
        .qa-icon {
          font-size: 28px;
        }
        .qa-label {
          font-size: 13px;
          color: var(--color-text-secondary);
          font-weight: 500;
        }
        .task-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .task-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 16px;
          background: var(--color-surface);
          border: 1px solid var(--color-border-light);
          border-radius: var(--radius-sm);
          transition: var(--transition);
        }
        .task-row:hover {
          background: var(--color-bg);
        }
        .task-row-main {
          flex: 1;
          min-width: 0;
        }
        .task-row-title {
          font-size: 14px;
          color: var(--color-text-primary);
          margin-bottom: 4px;
        }
        .task-row-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          font-size: 12px;
          color: var(--color-text-tertiary);
        }
        .task-row-actions {
          display: flex;
          align-items: center;
          gap: 4px;
          opacity: 0;
          transition: var(--transition);
        }
        .task-row:hover .task-row-actions {
          opacity: 1;
        }
        .priority-select {
          font-size: 12px;
          padding: 2px 6px;
          border: 1px solid var(--color-border);
          border-radius: 4px;
          background: var(--color-surface);
          color: var(--color-text-secondary);
        }
        @media (max-width: 768px) {
          .today-page { padding: 20px 16px 60px; }
          .greeting-text { font-size: 20px; }
          .quick-actions { grid-template-columns: repeat(2, 1fr); }
          .task-row-actions { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ---------- 编辑任务弹窗 ----------
function EditTaskModal({
  task,
  onClose,
  onSave,
}: {
  task: Task;
  onClose: () => void;
  onSave: (updates: Partial<Task>) => void;
}) {
  const [form, setForm] = useState({
    title: task.title,
    description: task.description,
    project: task.project,
    priority: task.priority,
    dueDate: task.dueDate || '',
    planDate: task.planDate || '',
    estimatedTime: task.estimatedTime,
    status: task.status,
  });

  return (
    <Modal open onClose={onClose} title="编辑任务" width="500px">
      <div className="form-group">
        <label className="form-label">任务标题</label>
        <input
          className="input"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label className="form-label">描述</label>
        <textarea
          className="textarea"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
        />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">项目</label>
          <input
            className="input"
            value={form.project}
            onChange={(e) => setForm({ ...form, project: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">优先级</label>
          <select
            className="select"
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value as Task['priority'] })}
          >
            <option value="P1">P1 - 今天必须推进</option>
            <option value="P2">P2 - 重要，应该安排</option>
            <option value="P3">P3 - 普通任务</option>
            <option value="P4">P4 - 可以推迟</option>
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">截止日期</label>
          <input
            type="date"
            className="input"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">计划日期</label>
          <input
            type="date"
            className="input"
            value={form.planDate}
            onChange={(e) => setForm({ ...form, planDate: e.target.value })}
          />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">预计时间（分钟）</label>
          <input
            type="number"
            className="input"
            value={form.estimatedTime}
            onChange={(e) => setForm({ ...form, estimatedTime: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">状态</label>
          <select
            className="select"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as Task['status'] })}
          >
            <option value="inbox">收件箱</option>
            <option value="todo">待办</option>
            <option value="in_progress">进行中</option>
            <option value="done">已完成</option>
          </select>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
        <button className="btn btn-secondary" onClick={onClose}>取消</button>
        <button className="btn btn-primary" onClick={() => onSave({
          ...form,
          dueDate: form.dueDate || null,
          planDate: form.planDate || null,
        })}>保存</button>
      </div>
    </Modal>
  );
}
