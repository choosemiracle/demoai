// ============================================================
// Demo 数据 - 首次运行时加载
// ============================================================

import type { Task, Inspiration, Content, UserSettings, DailyReview } from '@/models/types';
import { generateId } from '@/utils/id';
import { today } from '@/utils/date';

export function createDemoTasks(): Task[] {
  const now = new Date().toISOString();
  const t = today();

  // 计算明天
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

  return [
    {
      id: generateId('task'),
      title: '完成 AI 个人工作助手 MVP',
      description: '完成今日工作台、任务管理、灵感库、公众号创作、视频创作、内容检查、每日复盘等核心功能',
      project: 'AI个人工作助手',
      tags: ['开发', 'AI'],
      status: 'in_progress',
      priority: 'P1',
      dueDate: t,
      planDate: t,
      estimatedTime: 240,
      actualTime: 120,
      createdAt: now,
      completedAt: null,
      source: 'manual',
      contentId: null,
    },
    {
      id: generateId('task'),
      title: '修改公众号文章《为什么每个人都需要自己的AI工作助手》',
      description: '根据内容检查结果优化文章开头和结尾',
      project: '公众号运营',
      tags: ['内容', '公众号'],
      status: 'todo',
      priority: 'P1',
      dueDate: t,
      planDate: t,
      estimatedTime: 90,
      actualTime: 0,
      createdAt: now,
      completedAt: null,
      source: 'content',
      contentId: null,
    },
    {
      id: generateId('task'),
      title: '回复合作邮件',
      description: '回复上周收到的合作邀约邮件',
      project: '日常事务',
      tags: ['邮件'],
      status: 'todo',
      priority: 'P2',
      dueDate: t,
      planDate: t,
      estimatedTime: 30,
      actualTime: 0,
      createdAt: now,
      completedAt: null,
      source: 'manual',
      contentId: null,
    },
    {
      id: generateId('task'),
      title: '准备下周视频拍摄脚本',
      description: '完成短视频口播稿的初稿',
      project: '短视频',
      tags: ['视频', '内容'],
      status: 'inbox',
      priority: 'P3',
      dueDate: tomorrowStr,
      planDate: null,
      estimatedTime: 120,
      actualTime: 0,
      createdAt: now,
      completedAt: null,
      source: 'manual',
      contentId: null,
    },
  ];
}

export function createDemoInspirations(): Inspiration[] {
  const now = new Date().toISOString();
  return [
    {
      id: generateId('insp'),
      content: 'AI真正改变的不是效率，而是一个人的能力边界。',
      createdAt: now,
      tags: ['AI', '思考'],
      status: 'ready',
      recommendedType: 'article',
      topicId: null,
    },
    {
      id: generateId('insp'),
      content: '所有的高效，本质上都是在做减法。',
      createdAt: now,
      tags: ['效率', '方法论'],
      status: 'pending',
      recommendedType: 'any',
      topicId: null,
    },
    {
      id: generateId('insp'),
      content: '一个人最大的竞争力，不是知道多少，而是能多快把知道的东西变成行动。',
      createdAt: now,
      tags: ['成长', '行动'],
      status: 'ready',
      recommendedType: 'video',
      topicId: null,
    },
  ];
}

export function createDemoContents(): Content[] {
  const now = new Date().toISOString();
  return [
    {
      id: generateId('content'),
      type: 'article',
      title: '为什么每个人都需要自己的AI工作助手',
      stage: 'draft',
      articleData: {
        topic: 'AI个人工作助手',
        targetReader: '25-40岁职场人士',
        coreProblem: '信息过载时代，个人如何高效管理自己的工作和创作',
        coreIdea: 'AI工作助手的核心价值不在于替代人，而在于放大人的能力',
        contentValue: '帮助读者理解AI如何改变个人工作方式',
        titles: [
          '为什么每个人都需要自己的AI工作助手',
          'AI时代，你的工作方式该升级了',
          '一个人也能做到一个团队的产出？AI让这成为可能',
        ],
        selectedTitle: '为什么每个人都需要自己的AI工作助手',
        outline: '## 一、开头\n## 二、核心问题\n## 三、核心观点\n## 四、方法\n## 五、案例\n## 六、结尾',
        draft: '',
        finalContent: '',
      },
      videoData: null,
      createdAt: now,
      updatedAt: now,
      publishDate: null,
      status: 'in_progress',
      taskIds: [],
      reviewResult: null,
      originalDraft: null,
    },
  ];
}

export function createDefaultSettings(): UserSettings {
  return {
    workType: '内容创作',
    mainProjects: ['公众号运营', '短视频', 'AI个人工作助手'],
    workHoursPerDay: 8,
    deepWorkHours: 4,
    contentPlatforms: ['微信公众号'],
    contentField: 'AI / 效率 / 个人成长',
    targetReader: '25-40岁关注效率提升的职场人士',
    contentStyle: '简洁、有观点、接地气',
    dislikedExpressions: '说真的、老实讲、不得不说',
    articleLength: '1500-2500字',
    videoLength: '1-2分钟',
    aiProvider: 'mock',
    aiApiKey: '',
    aiModel: '',
  };
}
