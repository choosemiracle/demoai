// ============================================================
// 工作任务管理页面
// ============================================================

import { useState, useMemo } from 'react';
import { useTaskStore } from '@/store/useTaskStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useAppStore } from '@/store/useAppStore';
import { aiService } from '@/services/ai/AIService';
import { Modal, ConfirmDialog, EmptyState, LoadingButton, PriorityBadge } from '@/components/common';
import { today, formatDate, formatTime, isOverdue } from '@/utils/date';
import type { Task, TaskStatus, Priority } from '@/models/types';

type Tab = 'inbox' | 'today' | 'upcoming' | 'all' | 'done';

const TAB_LABELS: Record<Tab, string> = {
  inbox: '收件箱',
  today: '今天',
  upcoming: '即将到期',
  all: '所有任务',
  done: '已完成',
};

export function TasksPage() {
  const tasks = useTaskStore((s) => s.tasks);
  const loading = useTaskStore((s) => s.loading);
  const toggleComplete = useTaskStore((s) => s.toggleComplete);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const updateTask = useTaskStore((s) => s.updateTask);
  const setPriority = useTaskStore((s) => s.setPriority);
  const moveTaskToToday = useTaskStore((s) => s.moveTaskToToday);
  const addParsedTask = useTaskStore((s) => s.addParsedTask);
  const settings = useSettingsStore((s) => s.settings);
  const setPage = useAppStore((s) => s.setPage);

  const [tab, setTab] = useState<Tab>('today');
  const [quickInput, setQuickInput] = useState('');
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [parsedPreview, setParsedPreview] = useState<Task | null>(null);
  const [planResult, setPlanResult] = useState<any>(null);
  const [planning, setPlanning] = useState(false);

  const filteredTasks = useMemo(() => {
    const t = today();
    switch (tab) {
      case 'inbox':
        return tasks.filter((task) => task.status === 'inbox');
      case 'today':
        return tasks.filter(
          (task) => task.status !== 'done' && (task.planDate === t || task.dueDate === t)
        );
      case 'upcoming':
        return tasks.filter(
          (task) =>
            task.status !== 'done' &&
            task.dueDate !== null &&
            task.dueDate > t &&
            task.dueDate !== t
        );
      case 'all':
        return tasks.filter((task) => task.status !== 'done');
      case 'done':
        return tasks.filter((task) => task.status === 'done')
          .sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''));
    }
  }, [tasks, tab]);

  const tabCounts = useMemo(() => {
    const t = today();
    return {
      inbox: tasks.filter((task) => task.status === 'inbox').length,
      today: tasks.filter((task) => task.status !== 'done' && (task.planDate === t || task.dueDate === t)).length,
      upcoming: tasks.filter((task) => task.status !== 'done' && task.dueDate !== null && task.dueDate > t).length,
      all: tasks.filter((task) => task.status !== 'done').length,
      done: tasks.filter((task) => task.status === 'done').length,
    };
  }, [tasks]);

  const handleQuickAdd = async () => {
    if (!quickInput.trim()) return;
    try {
      const parsed = await aiService.parseTask(quickInput);
      const task = addParsedTask(parsed, {
        status: 'todo',
        planDate: parsed.dueDate === today() ? today() : null,
      });
      setParsedPreview(task);
      setQuickInput('');
    } catch {
      alert('解析失败，请重试');
    }
  };

  const handlePlan = async () => {
    setPlanning(true);
    try {
      const allTasks = useTaskStore.getState().tasks;
      const result = await aiService.planToday(allTasks, settings.workHoursPerDay);
      setPlanResult(result);
    } finally {
      setPlanning(false);
    }
  };

  return (
    <div className="tasks-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">工作任务</h1>
          <p className="page-subtitle">不是让你看到更多任务，而是帮你判断现在最应该做什么</p>
        </div>
        <button className="btn btn-secondary" onClick={handlePlan} disabled={planning}>
          {planning ? <><span className="loading-spinner" /> 排程中...</> : '📅 帮我安排今天'}
        </button>
      </header>

      {/* 快速添加 */}
      <div className="quick-add-bar">
        <input
          className="input quick-add-input"
          placeholder="自然语言添加任务，例如：周五之前完成视频脚本，大概需要2小时"
          value={quickInput}
          onChange={(e) => setQuickInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleQuickAdd();
          }}
        />
        <LoadingButton loading={loading} onClick={handleQuickAdd} disabled={!quickInput.trim()}>
          AI 添加
        </LoadingButton>
      </div>

      {/* 标签页 */}
      <div className="task-tabs">
        {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
          <button
            key={t}
            className={`task-tab ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {TAB_LABELS[t]}
            {tabCounts[t] > 0 && <span className="tab-count">{tabCounts[t]}</span>}
          </button>
        ))}
      </div>

      {/* 任务列表 */}
      <div className="task-table">
        {filteredTasks && filteredTasks.length === 0 ? (
          <EmptyState
            title={`「${TAB_LABELS[tab]}」中没有任务`}
            description="使用上方输入框快速添加任务"
          />
        ) : (
          filteredTasks?.map((task) => (
            <div key={task.id} className={`task-table-row ${task.status === 'done' ? 'done' : ''}`}>
              <button
                className={`task-checkbox ${task.status === 'done' ? 'checked' : ''}`}
                onClick={() => toggleComplete(task.id)}
              />
              <div className="tt-main">
                <div className="tt-title">{task.title}</div>
                {task.description && <div className="tt-desc">{task.description}</div>}
                <div className="tt-meta">
                  <PriorityBadge priority={task.priority} />
                  {task.project && <span className="meta-item">{task.project}</span>}
                  {task.dueDate && (
                    <span className={`meta-item ${isOverdue(task.dueDate) ? 'overdue' : ''}`}>
                      截止 {formatDate(task.dueDate)}
                    </span>
                  )}
                  {task.planDate && <span className="meta-item">计划 {formatDate(task.planDate)}</span>}
                  {task.estimatedTime > 0 && <span className="meta-item">预计 {formatTime(task.estimatedTime)}</span>}
                  {task.contentId && (
                    <span className="meta-item link-badge" onClick={() => setPage('content')}>
                      已关联内容 →
                    </span>
                  )}
                </div>
              </div>
              <div className="tt-actions">
                {tab === 'inbox' && (
                  <button className="btn btn-sm btn-secondary" onClick={() => moveTaskToToday(task.id)}>
                    加入今天
                  </button>
                )}
                <select
                  className="priority-select"
                  value={task.priority}
                  onChange={(e) => setPriority(task.id, e.target.value as Priority)}
                >
                  <option value="P1">P1</option>
                  <option value="P2">P2</option>
                  <option value="P3">P3</option>
                  <option value="P4">P4</option>
                </select>
                <button className="btn-icon" onClick={() => setEditTask(task)}>✎</button>
                <button className="btn-icon" onClick={() => setDeleteTarget(task)}>🗑</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 编辑弹窗 */}
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

      {/* AI 解析预览 */}
      {parsedPreview && (
        <Modal open={!!parsedPreview} onClose={() => setParsedPreview(null)} title="AI 已解析任务" width="440px">
          <div style={{ marginBottom: 16, color: 'var(--color-text-secondary)' }}>
            AI 已将你的输入整理为结构化任务，已添加到收件箱：
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

      {/* 今日计划结果 */}
      {planResult && (
        <Modal open={!!planResult} onClose={() => setPlanResult(null)} title="今日计划" width="560px">
          <div className="plan-result">
            {planResult.warning && (
              <div className="plan-warning">⚠️ {planResult.warning}</div>
            )}
            {planResult.top3.length > 0 && (
              <div className="plan-section">
                <h4>Top 3</h4>
                {planResult.top3.map((t: Task) => (
                  <div key={t.id} className="plan-task">
                    <span className="plan-task-title">{t.title}</span>
                    <PriorityBadge priority={t.priority} />
                  </div>
                ))}
              </div>
            )}
            {planResult.deepWork.length > 0 && (
              <div className="plan-section">
                <h4>深度工作</h4>
                {planResult.deepWork.map((t: Task) => (
                  <div key={t.id} className="plan-task">
                    <span className="plan-task-title">{t.title}</span>
                    <span className="plan-time">{formatTime(t.estimatedTime)}</span>
                  </div>
                ))}
              </div>
            )}
            {planResult.quickTasks.length > 0 && (
              <div className="plan-section">
                <h4>快速任务</h4>
                {planResult.quickTasks.map((t: Task) => (
                  <div key={t.id} className="plan-task">
                    <span className="plan-task-title">{t.title}</span>
                    <span className="plan-time">{formatTime(t.estimatedTime)}</span>
                  </div>
                ))}
              </div>
            )}
            {planResult.canDefer.length > 0 && (
              <div className="plan-section">
                <h4>可以延后</h4>
                {planResult.canDefer.map((t: Task) => (
                  <div key={t.id} className="plan-task">
                    <span className="plan-task-title">{t.title}</span>
                    <PriorityBadge priority={t.priority} />
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
            <button className="btn btn-secondary" onClick={() => setPlanResult(null)}>关闭</button>
          </div>
        </Modal>
      )}

      <style>{`
        .tasks-page {
          max-width: var(--content-max-width);
          margin: 0 auto;
          padding: 32px 40px 80px;
        }
        .page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 24px;
        }
        .page-title { font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
        .page-subtitle { font-size: 14px; color: var(--color-text-tertiary); margin-top: 4px; }
        .quick-add-bar {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
        }
        .quick-add-input { flex: 1; }
        .task-tabs {
          display: flex;
          gap: 2px;
          margin-bottom: 16px;
          border-bottom: 1px solid var(--color-border-light);
          overflow-x: auto;
        }
        .task-tab {
          padding: 8px 16px;
          font-size: 14px;
          color: var(--color-text-secondary);
          border-bottom: 2px solid transparent;
          transition: var(--transition);
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .task-tab:hover { color: var(--color-text-primary); }
        .task-tab.active {
          color: var(--color-primary);
          border-bottom-color: var(--color-primary);
          font-weight: 500;
        }
        .tab-count {
          font-size: 11px;
          background: var(--color-bg);
          padding: 1px 6px;
          border-radius: 10px;
          color: var(--color-text-tertiary);
        }
        .task-table {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .task-table-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 16px;
          background: var(--color-surface);
          border: 1px solid var(--color-border-light);
          border-radius: var(--radius-sm);
          transition: var(--transition);
        }
        .task-table-row:hover { background: var(--color-bg); }
        .task-table-row.done .tt-title { text-decoration: line-through; color: var(--color-text-tertiary); }
        .tt-main { flex: 1; min-width: 0; }
        .tt-title { font-size: 14px; font-weight: 500; margin-bottom: 4px; }
        .tt-desc { font-size: 12px; color: var(--color-text-tertiary); margin-bottom: 4px; }
        .tt-meta {
          display: flex; align-items: center; gap: 8px;
          flex-wrap: wrap; font-size: 12px; color: var(--color-text-tertiary);
        }
        .meta-item { display: inline-flex; align-items: center; }
        .overdue { color: var(--color-danger); font-weight: 500; }
        .link-badge { color: var(--color-primary); cursor: pointer; }
        .tt-actions {
          display: flex; align-items: center; gap: 4px;
          opacity: 0;
          transition: var(--transition);
        }
        .task-table-row:hover .tt-actions { opacity: 1; }
        .priority-select {
          font-size: 12px;
          padding: 2px 6px;
          border: 1px solid var(--color-border);
          border-radius: 4px;
          background: var(--color-surface);
          color: var(--color-text-secondary);
        }
        .plan-result {}
        .plan-warning {
          background: var(--color-warning-bg);
          color: var(--color-warning);
          padding: 12px 16px;
          border-radius: var(--radius-sm);
          font-size: 14px;
          margin-bottom: 16px;
        }
        .plan-section { margin-bottom: 20px; }
        .plan-section h4 { font-size: 15px; font-weight: 600; margin-bottom: 8px; }
        .plan-task {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: var(--color-bg);
          border-radius: var(--radius-sm);
          margin-bottom: 4px;
        }
        .plan-task-title { font-size: 14px; }
        .plan-time { font-size: 12px; color: var(--color-text-tertiary); }
        @media (max-width: 768px) {
          .tasks-page { padding: 20px 16px 60px; }
          .page-header { flex-direction: column; gap: 12px; }
          .quick-add-bar { flex-direction: column; }
          .tt-actions { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// 复用编辑弹窗
function EditTaskModal({ task, onClose, onSave }: {
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
        <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </div>
      <div className="form-group">
        <label className="form-label">描述</label>
        <textarea className="textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">项目</label>
          <input className="input" value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">优先级</label>
          <select className="select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}>
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
          <input type="date" className="input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">计划日期</label>
          <input type="date" className="input" value={form.planDate} onChange={(e) => setForm({ ...form, planDate: e.target.value })} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">预计时间（分钟）</label>
          <input type="number" className="input" value={form.estimatedTime} onChange={(e) => setForm({ ...form, estimatedTime: parseInt(e.target.value) || 0 })} />
        </div>
        <div className="form-group">
          <label className="form-label">状态</label>
          <select className="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}>
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
