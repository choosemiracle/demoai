// ============================================================
// 通用 UI 组件
// ============================================================

import React from 'react';

// ---------- Modal ----------
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: string;
}

export function Modal({ open, onClose, title, children, width = '480px' }: ModalProps) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: width }} onClick={(e) => e.stopPropagation()}>
        {title && (
          <div className="modal-header">
            <h3>{title}</h3>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>
        )}
        <div className="modal-body">{children}</div>
      </div>
      <style>{`
        .modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.3);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000;
          padding: 20px;
        }
        .modal-content {
          background: var(--color-surface);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          width: 100%;
          max-height: 85vh;
          display: flex; flex-direction: column;
          overflow: hidden;
        }
        .modal-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid var(--color-border-light);
        }
        .modal-header h3 { font-size: 16px; font-weight: 600; }
        .modal-close {
          width: 28px; height: 28px;
          display: flex; align-items: center; justify-content: center;
          border-radius: var(--radius-sm);
          color: var(--color-text-tertiary);
          font-size: 16px;
          transition: var(--transition);
        }
        .modal-close:hover { background: var(--color-bg); color: var(--color-text-primary); }
        .modal-body { padding: 24px; overflow-y: auto; }
      `}</style>
    </div>
  );
}

// ---------- ConfirmDialog ----------
interface ConfirmProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open, title, message, confirmText = '确认', cancelText = '取消',
  danger, onConfirm, onCancel
}: ConfirmProps) {
  if (!open) return null;
  return (
    <Modal open={open} onClose={onCancel} title={title} width="400px">
      <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: 24 }}>
        {message}
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button className="btn btn-secondary" onClick={onCancel}>{cancelText}</button>
        <button
          className={danger ? 'btn btn-danger' : 'btn btn-primary'}
          onClick={onConfirm}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}

// ---------- EmptyState ----------
export function EmptyState({
  icon = '📭',
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <div className="empty-title">{title}</div>
      {description && <div className="empty-desc">{description}</div>}
      {action && <div className="empty-action">{action}</div>}
      <style>{`
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: var(--color-text-tertiary);
        }
        .empty-icon { font-size: 48px; margin-bottom: 16px; }
        .empty-title { font-size: 16px; font-weight: 500; color: var(--color-text-secondary); margin-bottom: 8px; }
        .empty-desc { font-size: 13px; max-width: 400px; margin: 0 auto 20px; line-height: 1.6; }
      `}</style>
    </div>
  );
}

// ---------- LoadingButton ----------
export function LoadingButton({
  loading, children, onClick, className, disabled, type = 'button',
}: {
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      className={`btn ${className || 'btn-primary'}`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading && <span className="loading-spinner" style={{ marginRight: 8, verticalAlign: 'middle' }} />}
      {children}
    </button>
  );
}

// ---------- PriorityBadge ----------
export function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, { bg: string; color: string }> = {
    P1: { bg: 'var(--color-p1-bg)', color: 'var(--color-p1)' },
    P2: { bg: 'var(--color-p2-bg)', color: 'var(--color-p2)' },
    P3: { bg: 'var(--color-p3-bg)', color: 'var(--color-p3)' },
    P4: { bg: 'var(--color-p4-bg)', color: 'var(--color-p4)' },
  };
  const s = styles[priority] || styles.P4;
  return (
    <span
      className="priority-badge"
      style={{ background: s.bg, color: s.color }}
    >
      {priority}
      <style>{`
        .priority-badge {
          display: inline-flex; align-items: center;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }
      `}</style>
    </span>
  );
}

// ---------- Tag ----------
export function Tag({ text }: { text: string }) {
  return (
    <span className="tag">
      {text}
      <style>{`
        .tag {
          display: inline-block;
          padding: 2px 8px;
          background: var(--color-border-light);
          border-radius: 4px;
          font-size: 12px;
          color: var(--color-text-secondary);
        }
      `}</style>
    </span>
  );
}
