// ============================================================
// 设置页面 - 工作信息 + 内容档案 + 数据管理
// ============================================================

import { useState, useRef } from 'react';
import { useSettingsStore } from '@/store/useSettingsStore';
import { storage } from '@/services/storage/StorageService';
import { useTaskStore } from '@/store/useTaskStore';
import { useInspirationStore } from '@/store/useInspirationStore';
import { useContentStore } from '@/store/useContentStore';
import { useReviewStore } from '@/store/useReviewStore';
import { ConfirmDialog } from '@/components/common';
import { aiService } from '@/services/ai/AIService';

export function SettingsPage() {
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const resetSettings = useSettingsStore((s) => s.resetSettings);

  const [saved, setSaved] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initStores = () => {
    useTaskStore.getState().init();
    useInspirationStore.getState().init();
    useContentStore.getState().init();
    useReviewStore.getState().init();
  };

  const handleSave = () => {
    updateSettings(settings);
    aiService.setSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExport = () => {
    const json = storage.exportAll();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-work-assistant-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const json = ev.target?.result as string;
      const success = storage.importAll(json);
      if (success) {
        setImportMsg('导入成功！正在刷新...');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setImportMsg('导入失败：文件格式不正确');
      }
    };
    reader.readAsText(file);
  };

  const handleClearAll = () => {
    storage.clearAll();
    window.location.reload();
  };

  return (
    <div className="settings-page">
      <header className="page-header">
        <h1 className="page-title">设置</h1>
        <p className="page-subtitle">配置你的工作档案，AI 会读取这些设置来优化内容生成</p>
      </header>

      {/* 工作信息 */}
      <section className="settings-section">
        <h2 className="section-title">工作信息</h2>
        <div className="settings-form">
          <div className="form-group">
            <label className="form-label">主要工作类型</label>
            <input className="input" value={settings.workType}
              onChange={(e) => updateSettings({ workType: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">主要项目（逗号分隔）</label>
            <input className="input" value={settings.mainProjects.join(', ')}
              onChange={(e) => updateSettings({ mainProjects: e.target.value.split(/[,，]/).map(s => s.trim()).filter(Boolean) })} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">每日工作时间（小时）</label>
              <input type="number" className="input" value={settings.workHoursPerDay}
                onChange={(e) => updateSettings({ workHoursPerDay: parseFloat(e.target.value) || 8 })} />
            </div>
            <div className="form-group">
              <label className="form-label">每日深度工作时间（小时）</label>
              <input type="number" className="input" value={settings.deepWorkHours}
                onChange={(e) => updateSettings({ deepWorkHours: parseFloat(e.target.value) || 4 })} />
            </div>
          </div>
        </div>
      </section>

      {/* 内容档案 */}
      <section className="settings-section">
        <h2 className="section-title">内容档案</h2>
        <div className="settings-form">
          <div className="form-group">
            <label className="form-label">主要内容平台</label>
            <input className="input" value={settings.contentPlatforms.join(', ')}
              onChange={(e) => updateSettings({ contentPlatforms: e.target.value.split(/[,，]/).map(s => s.trim()).filter(Boolean) })} />
          </div>
          <div className="form-group">
            <label className="form-label">内容领域</label>
            <input className="input" value={settings.contentField}
              onChange={(e) => updateSettings({ contentField: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">目标读者</label>
            <input className="input" value={settings.targetReader}
              onChange={(e) => updateSettings({ targetReader: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">内容风格</label>
            <input className="input" value={settings.contentStyle}
              onChange={(e) => updateSettings({ contentStyle: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">不喜欢的表达</label>
            <input className="input" value={settings.dislikedExpressions}
              onChange={(e) => updateSettings({ dislikedExpressions: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">常用文章长度</label>
              <input className="input" value={settings.articleLength}
                onChange={(e) => updateSettings({ articleLength: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">常用视频长度</label>
              <input className="input" value={settings.videoLength}
                onChange={(e) => updateSettings({ videoLength: e.target.value })} />
            </div>
          </div>
        </div>
      </section>

      {/* AI 配置 */}
      <section className="settings-section">
        <h2 className="section-title">AI 配置</h2>
        <div className="settings-form">
          <div className="form-group">
            <label className="form-label">AI Provider</label>
            <select className="select" value={settings.aiProvider}
              onChange={(e) => updateSettings({ aiProvider: e.target.value })}>
              <option value="mock">Mock（模拟模式，无需配置）</option>
              <option value="custom">自定义（预留）</option>
            </select>
            <p className="form-hint">
              当前使用 Mock 模式。所有 AI 功能均可正常使用，返回模拟数据。
              未来可在此配置真实 AI 模型接口。
            </p>
          </div>
          <div className="form-group">
            <label className="form-label">API Key</label>
            <input type="password" className="input" value={settings.aiApiKey} placeholder="留空则使用 Mock 模式"
              onChange={(e) => updateSettings({ aiApiKey: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">模型名称</label>
            <input className="input" value={settings.aiModel} placeholder="例如 gpt-4, claude-3-sonnet"
              onChange={(e) => updateSettings({ aiModel: e.target.value })} />
          </div>
        </div>
      </section>

      {/* 保存按钮 */}
      <div className="save-bar">
        {saved && <span className="saved-msg">✓ 已保存</span>}
        <button className="btn btn-primary" onClick={handleSave}>保存设置</button>
      </div>

      {/* 数据管理 */}
      <section className="settings-section danger-section">
        <h2 className="section-title">数据管理</h2>
        <div className="data-actions">
          <button className="btn btn-secondary" onClick={handleExport}>
            📥 导出数据（JSON）
          </button>
          <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
            📤 导入数据
          </button>
          <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }}
            onChange={handleImport} />
          <button className="btn btn-danger" onClick={() => setShowClearConfirm(true)}>
            🗑 清除所有数据
          </button>
        </div>
        {importMsg && <div className="import-msg">{importMsg}</div>}
        <p className="data-hint">
          所有数据存储在浏览器本地（localStorage），刷新页面不会丢失。
          建议定期导出备份。
        </p>
      </section>

      <ConfirmDialog
        open={showClearConfirm}
        title="⚠️ 清除所有数据"
        message="此操作将永久删除所有任务、灵感、内容和复盘数据，且不可恢复。建议先导出备份。确定继续吗？"
        danger
        confirmText="确认清除"
        onConfirm={handleClearAll}
        onCancel={() => setShowClearConfirm(false)}
      />

      <style>{`
        .settings-page { max-width: var(--content-max-width); margin: 0 auto; padding: 32px 40px 80px; }
        .page-title { font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
        .page-subtitle { font-size: 14px; color: var(--color-text-tertiary); margin-top: 4px; }
        .settings-section {
          background: var(--color-surface); border: 1px solid var(--color-border-light);
          border-radius: var(--radius-md); padding: 24px; margin: 20px 0;
        }
        .danger-section { border-color: var(--color-danger); border-style: dashed; }
        .section-title { font-size: 16px; font-weight: 600; margin-bottom: 16px; }
        .settings-form {}
        .form-hint { font-size: 12px; color: var(--color-text-tertiary); margin-top: 4px; line-height: 1.5; }
        .save-bar {
          display: flex; align-items: center; justify-content: flex-end; gap: 12px;
          margin: 20px 0;
        }
        .saved-msg { color: var(--color-success); font-size: 14px; }
        .data-actions { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 12px; }
        .import-msg { font-size: 13px; color: var(--color-info); margin-top: 8px; }
        .data-hint { font-size: 12px; color: var(--color-text-tertiary); margin-top: 8px; }
        @media (max-width: 768px) {
          .settings-page { padding: 20px 16px 60px; }
          .data-actions { flex-direction: column; }
        }
      `}</style>
    </div>
  );
}
