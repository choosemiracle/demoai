// ============================================================
// 核心数据模型与类型定义
// ============================================================

// ---------- 任务相关 ----------

export type TaskStatus = 'inbox' | 'todo' | 'in_progress' | 'done';
export type Priority = 'P1' | 'P2' | 'P3' | 'P4';

export interface Task {
  id: string;
  title: string;
  description: string;
  project: string;
  tags: string[];
  status: TaskStatus;
  priority: Priority;
  dueDate: string | null;      // ISO 日期 (截止日期)
  planDate: string | null;      // ISO 日期 (计划执行日期)
  estimatedTime: number;       // 预计分钟数
  actualTime: number;          // 实际分钟数
  createdAt: string;
  completedAt: string | null;
  source: string;              // 来源：manual / ai / content
  contentId: string | null;   // 关联内容 ID
}

// ---------- 灵感相关 ----------

export type InspirationStatus = 'pending' | 'ready' | 'creating' | 'used';

export interface Inspiration {
  id: string;
  content: string;
  createdAt: string;
  tags: string[];
  status: InspirationStatus;
  recommendedType: 'article' | 'video' | 'any';
  topicId: string | null;       // 关联选题 ID
}

// ---------- 内容创作相关 ----------

export type ContentType = 'article' | 'video';
export type ArticleStage = 'topic' | 'core_idea' | 'titles' | 'outline' | 'draft' | 'review' | 'final';
export type VideoStage = 'topic' | 'one_liner' | 'hook' | 'structure' | 'script' | 'titles' | 'cover';

export interface ArticleData {
  topic: string;
  targetReader: string;
  coreProblem: string;
  coreIdea: string;
  contentValue: string;
  titles: string[];
  selectedTitle: string | null;
  outline: string;
  draft: string;
  finalContent: string;
}

export interface VideoData {
  topic: string;
  oneLiner: string;
  hooks: string[];
  selectedHook: string | null;
  structure: string;
  script: string;
  titles: string[];
  selectedTitle: string | null;
  coverText: string;
}

export interface Content {
  id: string;
  type: ContentType;
  title: string;
  stage: ArticleStage | VideoStage;
  articleData: ArticleData | null;
  videoData: VideoData | null;
  createdAt: string;
  updatedAt: string;
  publishDate: string | null;
  status: 'draft' | 'in_progress' | 'completed' | 'published';
  taskIds: string[];
  // 内容检查结果
  reviewResult: ContentReviewResult | null;
  // 原始版本（AI修改前）
  originalDraft: string | null;
}

// ---------- 内容检查结果 ----------

export interface ContentReviewResult {
  score: number;
  dimensions: {
    name: string;
    score: number;
    comment: string;
  }[];
  topIssues: {
    issue: string;
    reason: string;
    suggestion: string;
    suggestedSentence: string;
  }[];
  suggestedOpening: string;
  suggestedEnding: string;
  createdAt: string;
}

// ---------- 每日复盘 ----------

export interface DailyReview {
  id: string;
  date: string;                 // YYYY-MM-DD
  completedCount: number;
  plannedCount: number;
  completionRate: number;
  keyAchievements: string[];
  incompleteTasks: string[];
  blockers: string;
  tomorrowTop3: string[];
  notes: string;
  createdAt: string;
}

// ---------- 用户设置 ----------

export interface UserSettings {
  workType: string;
  mainProjects: string[];
  workHoursPerDay: number;
  deepWorkHours: number;
  // 内容档案
  contentPlatforms: string[];
  contentField: string;
  targetReader: string;
  contentStyle: string;
  dislikedExpressions: string;
  articleLength: string;
  videoLength: string;
  // AI 配置
  aiProvider: string;
  aiApiKey: string;
  aiModel: string;
}

// ---------- AI 接口定义 ----------

export interface ParsedTask {
  title: string;
  description: string;
  project: string;
  priority: Priority | null;
  dueDate: string | null;
  estimatedTime: number | null;
  tags: string[];
}

export interface CoreIdeaResult {
  targetReader: string;
  coreProblem: string;
  coreIdea: string;
  contentValue: string;
}

export interface TodayPlan {
  top3: Task[];
  deepWork: Task[];
  quickTasks: Task[];
  canDefer: Task[];
  totalEstimatedHours: number;
  warning: string | null;
}
