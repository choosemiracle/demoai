// ============================================================
// AI Provider 接口定义
// 所有 AI 能力的统一抽象
// ============================================================

import type {
  ParsedTask,
  CoreIdeaResult,
  ContentReviewResult,
  TodayPlan,
  Task,
  UserSettings,
} from '@/models/types';

export interface AIProvider {
  name: string;

  // 任务解析
  parseTask(text: string): Promise<ParsedTask>;

  // 内容创作 - 公众号
  generateCoreIdea(topic: string, settings?: UserSettings | null): Promise<CoreIdeaResult>;
  generateTitles(topic: string, coreIdea: CoreIdeaResult, settings?: UserSettings | null): Promise<string[]>;
  generateArticleOutline(
    topic: string,
    coreIdea: CoreIdeaResult,
    title: string,
    settings?: UserSettings | null
  ): Promise<string>;
  generateArticle(
    outline: string,
    topic: string,
    coreIdea: CoreIdeaResult,
    title: string,
    settings?: UserSettings | null
  ): Promise<string>;

  // 内容创作 - 视频
  generateVideoOneLiner(topic: string, settings?: UserSettings | null): Promise<string>;
  generateVideoHooks(oneLiner: string, settings?: UserSettings | null): Promise<string[]>;
  generateVideoStructure(oneLiner: string, hook: string, settings?: UserSettings | null): Promise<string>;
  generateVideoScript(structure: string, oneLiner: string, settings?: UserSettings | null): Promise<string>;
  generateVideoTitles(oneLiner: string, script: string, settings?: UserSettings | null): Promise<string[]>;
  generateCoverText(oneLiner: string, title: string, settings?: UserSettings | null): Promise<string>;

  // 内容检查
  reviewContent(content: string, type: 'article' | 'video', settings?: UserSettings | null): Promise<ContentReviewResult>;

  // 内容优化
  optimizeContent(content: string, reviewResult: ContentReviewResult, settings?: UserSettings | null): Promise<string>;

  // 今日计划
  planToday(tasks: Task[], availableHours: number): Promise<TodayPlan>;

  // 每日复盘
  generateDailyReview(
    tasks: Task[],
    answers: { completed: string; incomplete: string; blocker: string }
  ): Promise<{
    keyAchievements: string[];
    incompleteTasks: string[];
    blockers: string;
    tomorrowTop3: string[];
  }>;

  // 选题生成
  generateTopics(inspiration: string, type: 'article' | 'video', settings?: UserSettings | null): Promise<string[]>;
}
