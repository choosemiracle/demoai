// ============================================================
// Mock AI Provider - 模拟 AI 能力
// 所有方法返回模拟数据，带模拟延迟
// 可替换为真实 AI Provider
// ============================================================

import type { AIProvider } from './AIProvider';
import type {
  ParsedTask,
  CoreIdeaResult,
  ContentReviewResult,
  TodayPlan,
  Task,
  UserSettings,
} from '@/models/types';
import { parseDateFromText, today } from '@/utils/date';

function delay(ms: number = 800): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export class MockAIProvider implements AIProvider {
  name = 'mock';

  async parseTask(text: string): Promise<ParsedTask> {
    await delay(600);

    const dueDate = parseDateFromText(text);
    
    // 尝试识别项目
    let project = '';
    const projectMap: Record<string, string> = {
      '公众号': '公众号运营',
      '视频': '短视频',
      'AI': 'AI个人工作助手',
      '助手': 'AI个人工作助手',
      '文章': '内容创作',
    };
    for (const [key, val] of Object.entries(projectMap)) {
      if (text.includes(key)) {
        project = val;
        break;
      }
    }

    // 尝试识别优先级
    let priority: ParsedTask['priority'] | null = null;
    if (text.includes('紧急') || text.includes('必须') || text.includes('P1')) priority = 'P1';
    else if (text.includes('重要') || text.includes('尽快')) priority = 'P2';
    else if (text.includes('有空') || text.includes('不急')) priority = 'P4';

    // 尝试识别时间
    let estimatedTime: number | null = null;
    if (text.includes('半小时') || text.includes('30分钟')) estimatedTime = 30;
    else if (text.includes('一小时') || text.includes('1小时') || text.includes('一个小时')) estimatedTime = 60;
    else if (text.includes('两小时') || text.includes('2小时') || text.includes('半天')) estimatedTime = text.includes('半天') ? 240 : 120;
    else if (text.includes('全天') || text.includes('一天')) estimatedTime = 480;

    // 清理标题
    let title = text
      .replace(/明天|今天|后天|周[一二三四五六日天]|下周|之前|之前完成/g, '')
      .replace(/大概需要.*?[$。，.]/g, '')
      .replace(/紧急|重要|尽快|不急|有空/g, '')
      .replace(/半小时|一小时|两小时|半天|全天|30分钟|1小时|2小时/g, '')
      .trim();
    if (title.length > 40) title = title.slice(0, 40);
    if (!title) title = text.slice(0, 30);

    return {
      title,
      description: text,
      project,
      priority,
      dueDate,
      estimatedTime,
      tags: [],
    };
  }

  async generateCoreIdea(topic: string): Promise<CoreIdeaResult> {
    await delay(1000);
    return {
      targetReader: '25-40岁的职场人士，关注效率提升和个人成长',
      coreProblem: `${topic}是很多人关心但缺乏系统认知的领域，信息碎片化严重`,
      coreIdea: `${topic}的关键不在于工具本身，而在于如何建立一套适合自己的工作体系`,
      contentValue: '帮助读者建立清晰的认知框架，提供可落地的行动建议',
    };
  }

  async generateTitles(topic: string, coreIdea: CoreIdeaResult): Promise<string[]> {
    await delay(1000);
    return [
      `${topic}，可能是你今年最该认真对待的事`,
      `为什么90%的人都在用错${topic}？`,
      `做了3年${topic}，我总结了5条铁律`,
      `别再误解${topic}了，真相可能和你想的完全不同`,
      `${topic}到底值不值得做？看完这篇你就明白了`,
    ];
  }

  async generateArticleOutline(topic: string, coreIdea: CoreIdeaResult): Promise<string> {
    await delay(1200);
    return `## 一、开头：打破认知

用一个常见的误解引入${topic}，让读者意识到自己可能一直在用错误的方式。

## 二、核心问题

${coreIdea.coreProblem}

## 三、核心观点

${coreIdea.coreIdea}

## 四、方法拆解

### 1. 第一步：认清现状
分析当前存在的问题和误区。

### 2. 第二步：建立框架
提供一套可操作的方法论。

### 3. 第三步：落地执行
给出具体的执行建议和注意事项。

## 五、案例佐证

用2-3个真实案例说明方法的有效性。

## 六、结尾：行动召唤

总结核心观点，鼓励读者立刻行动。`;
  }

  async generateArticle(
    outline: string,
    topic: string,
    coreIdea: CoreIdeaResult,
    _title: string
  ): Promise<string> {
    await delay(2000);
    return `## 打破认知：你可能一直在用错${topic}

我见过太多人，提到${topic}就想到工具和效率，却忽略了最重要的一点：体系。

说实话，我以前也是这样的人。收藏了几百个工具教程，买了一堆课程，但真正用起来的不到10%。后来我才明白，${topic}的核心从来不在于工具，而在于认知。

## ${coreIdea.coreProblem}

这是大多数人面临的困境。每天被信息淹没，却始终没有建立起自己的工作体系。

## ${coreIdea.coreIdea}

关键在于，你需要一套适合自己的方法。

### 1. 认清现状

首先，诚实地审视你现在的状态。你的时间花在哪里了？哪些是真正有价值的？

### 2. 建立框架

不要追求大而全。从最小的可执行单元开始，逐步构建你的工作体系。

### 3. 落地执行

知道和做到之间，隔着一个太平洋。最好的方法就是——现在就开始。

## 几个真实案例

小李是一名内容创作者，之前每天花3小时在各个工具之间切换。建立体系之后，同样的工作只需要1小时。

老张是程序员，通过${topic}系统化管理，把每周的会议时间从8小时压缩到了3小时。

## 写在最后

${topic}不是终点，而是起点。真正改变你生活的，不是某个工具或方法，而是你开始行动的那一刻。

今天就开始吧。`;
  }

  async generateVideoOneLiner(topic: string): Promise<string> {
    await delay(800);
    return `关于${topic}，大多数人都做错了——真正有效的方法，和你想的完全不一样。`;
  }

  async generateVideoHooks(_oneLiner: string): Promise<string[]> {
    await delay(1000);
    return [
      `停！如果你正在做这件事，可能你已经浪费了很多时间。`,
      `3年前我也踩过这个坑，今天用1分钟帮你避掉。`,
      `这个视频可能会颠覆你对这件事的认知，但30秒后你会感谢我。`,
    ];
  }

  async generateVideoStructure(_oneLiner: string, _hook: string): Promise<string> {
    await delay(1000);
    return `## 视频结构

**0-3秒**：开头钩子
快速抓住注意力，制造悬念。

**3-15秒**：抛出问题
描述观众可能正在面临的困境。

**15-40秒**：给出观点
亮出你的核心观点，简洁有力。

**40-90秒**：案例论证
用1-2个真实案例支撑观点。

**90-120秒**：总结收尾
一句话总结，引导行动。`;
  }

  async generateVideoScript(structure: string, oneLiner: string): Promise<string> {
    await delay(1800);
    return `（开头钩子）
停！如果你正在做这件事，先别急，听我说完。

（抛出问题）
你有没有发现，明明每天都很忙，但回头看好像什么也没做成？这不是你的问题，而是方法的问题。

（给出观点）
${oneLiner}

（案例论证）
我有个朋友，之前也是这样。后来他做了一件事——每天只专注做3件最重要的事。一个月后，效率翻了一倍。

不是他变得更厉害了，而是他学会了做减法。

（总结收尾）
记住，少即是多。今天就开始，从你的Top 3开始。`;
  }

  async generateVideoTitles(_oneLiner: string, _script: string): Promise<string[]> {
    await delay(800);
    return [
      '每天都很忙却没产出？这个方法改变了我',
      '我用了3年才明白的效率真相',
      '别再假装高效了！这才是正确的方式',
      '为什么你越忙越穷？答案在这里',
      '看完这个视频，你的工作效率至少翻一倍',
    ];
  }

  async generateCoverText(_oneLiner: string, _title: string): Promise<string> {
    await delay(600);
    return pickRandom([
      '效率翻倍的秘密',
      '别再做无用功了',
      '每天只需3件事',
    ]);
  }

  async reviewContent(content: string): Promise<ContentReviewResult> {
    await delay(2000);
    const score = Math.floor(Math.random() * 20) + 70;
    return {
      score,
      dimensions: [
        { name: '开头吸引力', score: 75, comment: '开头有引入，但缺乏足够的冲击力，可以在第一句更直接地提出痛点。' },
        { name: '核心观点明确性', score: 82, comment: '核心观点在第三段才完全浮现，建议提前到开头。' },
        { name: '内容逻辑', score: 80, comment: '整体逻辑清晰，但案例部分与前文衔接稍显生硬。' },
        { name: '信息密度', score: 78, comment: '部分段落有重复表述，可以精简。' },
        { name: 'AI套话', score: 70, comment: '检测到部分AI常见表达，如"说真的""老实讲"，建议替换为更个人化的表达。' },
        { name: '案例与细节', score: 73, comment: '案例较为简略，建议增加具体数字和细节。' },
        { name: '结尾力度', score: 76, comment: '结尾的号召力可以更强，建议用一个更有力的金句收尾。' },
      ],
      topIssues: [
        {
          issue: '开头冲击力不足',
          reason: '第一段以平铺直叙开始，没有在3秒内抓住读者注意力',
          suggestion: '尝试用一个反问或数据开头，直接抛出读者的痛点',
          suggestedSentence: '你有没有想过，为什么你每天都在努力，却始终看不到突破？',
        },
        {
          issue: 'AI套话较多',
          reason: '"说真的""老实讲"等表达让文章显得像AI生成',
          suggestion: '替换为更个人化的口语表达，或者直接删掉',
          suggestedSentence: '（建议删除"说真的"，直接进入正题）',
        },
        {
          issue: '结尾号召力偏弱',
          reason: '"今天就开始吧"过于普通，缺乏记忆点',
          suggestion: '用一个更有力的金句收尾，让读者有立刻行动的冲动',
          suggestedSentence: '种一棵树最好的时间是十年前，其次是现在。${content.slice(0, 10)}... 也不例外。',
        },
      ],
      suggestedOpening: '我收藏了几百个效率工具，但真正用起来的不到10%。直到有一天，我删掉了它们。',
      suggestedEnding: '真正的改变，从来不是从下载一个新工具开始的。而是从你关掉这个页面，开始做第一件事的那一刻。',
      createdAt: new Date().toISOString(),
    };
  }

  async optimizeContent(content: string, reviewResult: ContentReviewResult): Promise<string> {
    await delay(1500);
    // 模拟优化：替换开头和结尾
    let optimized = content;
    if (reviewResult.suggestedOpening) {
      const lines = optimized.split('\n');
      if (lines.length > 2) {
        lines[0] = reviewResult.suggestedOpening;
        optimized = lines.join('\n');
      }
    }
    if (reviewResult.suggestedEnding) {
      optimized = optimized.trim() + '\n\n' + reviewResult.suggestedEnding;
    }
    return optimized;
  }

  async planToday(tasks: Task[], availableHours: number): Promise<TodayPlan> {
    await delay(1200);

    const todayTasks = tasks.filter(
      (t) => t.status !== 'done' && (t.planDate === today() || t.dueDate === today() || t.priority === 'P1')
    );

    // 按优先级排序
    const sorted = [...todayTasks].sort((a, b) => {
      const priorityOrder = { P1: 0, P2: 1, P3: 2, P4: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    const top3 = sorted.slice(0, 3);
    const deepWork = sorted.filter((t) => t.estimatedTime >= 60).slice(0, 3);
    const quickTasks = sorted.filter((t) => t.estimatedTime > 0 && t.estimatedTime < 30).slice(0, 5);
    const canDefer = sorted.filter((t) => t.priority === 'P3' || t.priority === 'P4');

    const totalMinutes = todayTasks.reduce((sum, t) => sum + (t.estimatedTime || 0), 0);
    const totalHours = totalMinutes / 60;
    const warning = totalHours > availableHours
      ? `今天计划约需要 ${Math.round(totalHours)} 小时，但你的可用时间只有 ${availableHours} 小时。建议推迟 P3/P4 任务。`
      : null;

    return { top3, deepWork, quickTasks, canDefer, totalEstimatedHours: Math.round(totalHours * 10) / 10, warning };
  }

  async generateDailyReview(
    tasks: Task[],
    answers: { completed: string; incomplete: string; blocker: string }
  ) {
    await delay(1200);
    const doneTasks = tasks.filter((t) => t.status === 'done');
    const incomplete = tasks.filter((t) => t.status !== 'done');

    return {
      keyAchievements: doneTasks.slice(0, 5).map((t) => t.title),
      incompleteTasks: incomplete.map((t) => t.title),
      blockers: answers.blocker || '暂无明确阻碍',
      tomorrowTop3: incomplete.slice(0, 3).map((t) => t.title),
    };
  }

  async generateTopics(inspiration: string, type: 'article' | 'video'): Promise<string[]> {
    await delay(1000);
    if (type === 'article') {
      return [
        `从灵感「${inspiration.slice(0, 12)}...」出发：如何把这个想法变成一篇好文章`,
        `关于这个想法，你可能忽略的3个角度`,
        `${inspiration.slice(0, 8)}：写给想改变但不知从何开始的人`,
        `这个灵感背后，藏着一个更大的趋势`,
      ];
    }
    return [
      `用60秒讲清楚「${inspiration.slice(0, 10)}」`,
      `这个想法，值得拍一条视频`,
      `${inspiration.slice(0, 8)}——你一定也有过这样的感受`,
    ];
  }
}
