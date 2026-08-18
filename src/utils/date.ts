// ============================================================
// 日期与时间处理工具
// ============================================================

/** 获取今天的日期 YYYY-MM-DD */
export function today(): string {
  return toDateStr(new Date());
}

/** Date → YYYY-MM-DD */
export function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** 判断日期字符串是否是今天 */
export function isToday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return dateStr === today();
}

/** 判断日期字符串是否已过期 */
export function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return dateStr < today();
}

/** 判断日期字符串是否在未来7天内 */
export function isUpcoming(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const now = new Date();
  const future = new Date();
  future.setDate(now.getDate() + 7);
  const d = new Date(dateStr + 'T00:00:00');
  return d > now && d <= future;
}

/** 获取问候语 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return '夜深了';
  if (hour < 12) return '早上好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  if (hour < 22) return '晚上好';
  return '夜深了';
}

/** 格式化日期为中文友好显示 */
export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${month}月${day}日`;
}

/** 格式化日期带星期 */
export function formatDateWithWeekday(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${d.getFullYear()}年${month}月${day}日 ${weekdays[d.getDay()]}`;
}

/** 将分钟转为友好显示 */
export function formatTime(minutes: number): string {
  if (minutes <= 0) return '';
  if (minutes < 60) return `${minutes}分钟`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}小时${m}分钟` : `${h}小时`;
}

/** 相对时间显示 */
export function relativeTime(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}天前`;
  return formatDate(dateStr.slice(0, 10));
}

/** 解析自然语言日期（简化版） */
export function parseDateFromText(text: string): string | null {
  const t = text.toLowerCase();
  const todayStr = today();
  
  if (t.includes('今天')) return todayStr;
  if (t.includes('明天')) {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return toDateStr(d);
  }
  if (t.includes('后天')) {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return toDateStr(d);
  }
  
  // 周X
  const weekMap: Record<string, number> = {
    '周一': 1, '周二': 2, '周三': 3, '周四': 4, '周五': 5, '周六': 6, '周日': 0,
    '星期一': 1, '星期二': 2, '星期三': 3, '星期四': 4, '星期五': 5, '星期六': 6, '星期日': 0,
  };
  for (const [key, val] of Object.entries(weekMap)) {
    if (t.includes(key)) {
      const now = new Date();
      const currentDay = now.getDay();
      let diff = val - currentDay;
      if (diff <= 0) diff += 7;
      now.setDate(now.getDate() + diff);
      return toDateStr(now);
    }
  }
  
  // 下周X
  for (const [key, val] of Object.entries(weekMap)) {
    if (t.includes('下') && t.includes(key)) {
      const now = new Date();
      const currentDay = now.getDay();
      let diff = val - currentDay + 7;
      now.setDate(now.getDate() + diff);
      return toDateStr(now);
    }
  }
  
  // X月X日 / X月X号
  const monthDayMatch = text.match(/(\d{1,2})月(\d{1,2})[日号]/);
  if (monthDayMatch) {
    const month = parseInt(monthDayMatch[1]);
    const day = parseInt(monthDayMatch[2]);
    const year = new Date().getFullYear();
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  
  // 周五之前
  const beforeMatch = text.match(/周([一二三四五六日天])之前/);
  if (beforeMatch) {
    const dayChar = beforeMatch[1];
    const map: Record<string, number> = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '日': 0, '天': 0 };
    const targetDay = map[dayChar];
    if (targetDay !== undefined) {
      const now = new Date();
      const currentDay = now.getDay();
      let diff = targetDay - currentDay;
      if (diff < 0) diff += 7;
      if (diff === 0) diff = 0; // 就是今天
      now.setDate(now.getDate() + diff);
      return toDateStr(now);
    }
  }
  
  return null;
}
