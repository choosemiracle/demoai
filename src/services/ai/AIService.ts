// ============================================================
// AIService - 统一 AI 服务入口
// 内部持有 provider，可动态切换
// ============================================================

import type { AIProvider } from './AIProvider';
import { MockAIProvider } from './MockAIProvider';
import type { UserSettings } from '@/models/types';

class AIService {
  private provider: AIProvider;
  private settings: UserSettings | null = null;

  constructor() {
    // 默认使用 Mock Provider
    this.provider = new MockAIProvider();
  }

  setProvider(provider: AIProvider) {
    this.provider = provider;
  }

  getProviderName(): string {
    return this.provider.name;
  }

  setSettings(settings: UserSettings | null) {
    this.settings = settings;
  }

  get settings_() {
    return this.settings;
  }

  // 代理所有方法
  parseTask(text: string) { return this.provider.parseTask(text); }
  generateCoreIdea(topic: string) { return this.provider.generateCoreIdea(topic, this.settings); }
  generateTitles(topic: string, coreIdea: any) { return this.provider.generateTitles(topic, coreIdea, this.settings); }
  generateArticleOutline(topic: string, coreIdea: any, title: string) {
    return this.provider.generateArticleOutline(topic, coreIdea, title, this.settings);
  }
  generateArticle(outline: string, topic: string, coreIdea: any, title: string) {
    return this.provider.generateArticle(outline, topic, coreIdea, title, this.settings);
  }
  generateVideoOneLiner(topic: string) { return this.provider.generateVideoOneLiner(topic, this.settings); }
  generateVideoHooks(oneLiner: string) { return this.provider.generateVideoHooks(oneLiner, this.settings); }
  generateVideoStructure(oneLiner: string, hook: string) {
    return this.provider.generateVideoStructure(oneLiner, hook, this.settings);
  }
  generateVideoScript(structure: string, oneLiner: string) {
    return this.provider.generateVideoScript(structure, oneLiner, this.settings);
  }
  generateVideoTitles(oneLiner: string, script: string) {
    return this.provider.generateVideoTitles(oneLiner, script, this.settings);
  }
  generateCoverText(oneLiner: string, title: string) {
    return this.provider.generateCoverText(oneLiner, title, this.settings);
  }
  reviewContent(content: string, type: 'article' | 'video') {
    return this.provider.reviewContent(content, type, this.settings);
  }
  optimizeContent(content: string, reviewResult: any) {
    return this.provider.optimizeContent(content, reviewResult, this.settings);
  }
  planToday(tasks: any[], availableHours: number) {
    return this.provider.planToday(tasks, availableHours);
  }
  generateDailyReview(tasks: any[], answers: any) {
    return this.provider.generateDailyReview(tasks, answers);
  }
  generateTopics(inspiration: string, type: 'article' | 'video') {
    return this.provider.generateTopics(inspiration, type, this.settings);
  }
}

export const aiService = new AIService();
