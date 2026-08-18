# AI 个人工作助手

一个面向个人知识工作者和内容创作者的本地 AI 工作台。

## 核心理念

**一个入口 + 两个助手 + 一套共享工作数据。**

- **内容创作助手**：灵感 → 选题 → 标题 → 大纲 → 初稿 → 检查 → 定稿
- **工作管理助手**：任务收集 → AI 整理 → 优先级判断 → 今日计划 → 执行 → 每日复盘
- 两个助手共享数据，内容可一键转为工作任务

## 快速开始

```bash
# 进入项目目录
cd ai-work-assistant

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 浏览器打开 http://localhost:5173
```

## 技术栈

| 技术 | 说明 |
|------|------|
| React 18 + TypeScript | 前端框架 |
| Vite 5 | 构建工具 |
| Zustand | 状态管理 |
| localStorage | 本地数据持久化 |
| CSS Variables | 主题系统 |

## 目录结构

```
src/
├── components/
│   ├── common/        # 通用组件（Modal、按钮、空状态等）
│   ├── layout/        # 布局（侧边栏 + 主内容区）
│   ├── content/       # 内容创作组件
│   │   ├── ArticleWorkflow.tsx   # 公众号创作工作流
│   │   ├── VideoWorkflow.tsx     # 短视频创作工作流
│   │   └── ContentReview.tsx     # 内容检查系统
│   └── ...
├── pages/
│   ├── TodayPage.tsx              # 今日工作台
│   ├── ContentAssistantPage.tsx   # 内容助手
│   ├── InspirationPage.tsx        # 灵感库
│   ├── TasksPage.tsx              # 工作任务管理
│   ├── ReviewPage.tsx             # 每日复盘
│   └── SettingsPage.tsx           # 设置
├── services/
│   ├── ai/
│   │   ├── AIProvider.ts          # AI 接口定义
│   │   ├── MockAIProvider.ts      # Mock 实现
│   │   └── AIService.ts           # 统一 AI 服务入口
│   └── storage/
│       └── StorageService.ts      # localStorage 封装
├── store/
│   ├── useTaskStore.ts            # 任务状态
│   ├── useContentStore.ts         # 内容状态
│   ├── useInspirationStore.ts     # 灵感状态
│   ├── useReviewStore.ts          # 复盘状态
│   ├── useSettingsStore.ts        # 设置状态
│   └── useAppStore.ts             # 全局 UI 状态
├── models/
│   └── types.ts                   # 核心数据模型
├── utils/
│   ├── date.ts                    # 日期时间工具
│   └── id.ts                      # ID 生成
├── data/
│   └── demoData.ts                # Demo 数据
└── styles/
    ├── global.css                 # 全局样式 + CSS 变量
    └── components.css             # 组件样式
```

## 已完成功能

### MVP 核心功能（全部完成）

1. ✅ **今日工作台** - 问候语、Top 3、快速记录、快捷入口、今日任务列表
2. ✅ **快速添加任务** - 自然语言输入，AI 自动解析为结构化任务
3. ✅ **任务管理** - 收件箱/今天/即将到期/所有/已完成五个视图
4. ✅ **今日 Top 3** - 自动按优先级排序，突出最重要任务
5. ✅ **灵感库** - 记录灵感、标签管理、状态流转、搜索筛选
6. ✅ **公众号创作** - 7 步完整工作流（主题→观点→标题→大纲→初稿→检查→定稿）
7. ✅ **视频创作** - 7 步工作流（主题→观点→开头→结构→口播稿→标题→封面）
8. ✅ **内容检查** - 8 维度评分、三大问题分析、优化建议、原始版本保留
9. ✅ **每日复盘** - 三问引导、自动统计数据、明日建议、历史记录
10. ✅ **用户设置** - 工作信息、内容档案、AI 配置

### 其他功能

- ✅ 内容和任务联动（一键加入工作计划）
- ✅ 灵感发展为公众号/视频选题
- ✅ 今日计划智能排程（深度工作/快速任务/可延后分类）
- ✅ 数据导入/导出（JSON 备份）
- ✅ 清除 Demo 数据
- ✅ 首次运行自动加载 Demo 数据
- ✅ 所有数据 localStorage 持久化，刷新不丢失
- ✅ 不可逆操作二次确认
- ✅ AI 生成 loading 状态和失败重试
- ✅ 桌面 + 窄窗口响应式适配

## AI 架构

所有 AI 功能通过 `AIService` 统一封装，内部使用 `AIProvider` 接口。

当前使用 `MockAIProvider`（模拟实现），所有 AI 功能均可正常运行。

### 替换为真实 AI

1. 创建新的 Provider 类实现 `AIProvider` 接口
2. 在 `AIService` 构造函数中替换 provider
3. API Key 在设置页面配置，不硬编码在前端

```typescript
// 示例：替换为真实 Provider
import { RealAIProvider } from './RealAIProvider';
aiService.setProvider(new RealAIProvider(apiKey, model));
```

## 暂未完成的功能

- ❌ 真实 AI 模型接入（当前使用 Mock，架构已预留）
- ❌ 多人协作
- ❌ 复杂权限系统
- ❌ 社交平台自动发布
- ❌ 复杂项目甘特图

## 后续最值得增加的 5 个功能

1. **真实 AI 接入** - 接入大模型 API，让所有 AI 功能生成真实内容
2. **内容模板库** - 沉淀优质内容结构，一键复用
3. **数据统计分析** - 任务完成率趋势、内容产出统计、效率分析看板
4. **日历视图** - 以日历形式查看任务和内容发布计划
5. **PWA 支持** - 支持离线使用和桌面安装，成为真正的桌面应用
