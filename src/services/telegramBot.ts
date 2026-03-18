/**
 * Telegram (WoohanaBot) 알림 — PRD Section 6, Appendix A.3
 * VITE_TELEGRAM_BOT_TOKEN, VITE_TELEGRAM_CHAT_ID 사용
 */

import type { ProcurementListing } from './g2bCrawler';
import type { OpportunityScoreState } from '../stores/trackingStore';

const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '';
const CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID || '';

const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

/** 트랙별 뉴스 아이템 (알림용) */
export interface TrackNewsItem {
  title: string;
  link: string;
}

/** Opportunity 알림 페이로드 — 트랙별 점수 + 해당 뉴스 목록 */
export interface OpportunityAlertPayload extends OpportunityScoreState {
  newsByTrack: {
    policy: TrackNewsItem[];
    investment: TrackNewsItem[];
    competitor: TrackNewsItem[];
  };
}

const MAX_NEWS_PER_TRACK = 5;
const MAX_TITLE_LEN = 60;

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function truncate(s: string, len: number): string {
  return s.length <= len ? s : s.slice(0, len - 1) + '…';
}

function formatTrackNews(items: TrackNewsItem[]): string {
  if (items.length === 0) return '  (해당 트랙 뉴스 없음)';
  return items
    .slice(0, MAX_NEWS_PER_TRACK)
    .map((n) => `  • <a href="${n.link}">${escapeHtml(truncate(n.title, MAX_TITLE_LEN))}</a>`)
    .join('\n');
}

function isConfigured(): boolean {
  return !!BOT_TOKEN && !!CHAT_ID;
}

async function sendMessage(text: string): Promise<boolean> {
  if (!isConfigured()) {
    console.warn('[Telegram] Bot not configured. Set VITE_TELEGRAM_BOT_TOKEN and VITE_TELEGRAM_CHAT_ID.');
    return false;
  }
  try {
    const res = await fetch(TELEGRAM_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
    return res.ok;
  } catch (e) {
    console.error('[Telegram] Send error:', e);
    return false;
  }
}

export const TELEGRAM_TEMPLATES = {
  procurement: (item: ProcurementListing) =>
    `🏛️ [조달 공고] ${item.fitness_score === 'high' ? '🔴' : '🟡'} ${item.fitness_score.toUpperCase()}\n` +
    `${item.title}\n` +
    `💰 ${item.budget > 0 ? (item.budget / 100000000).toFixed(1) + '억원' : '—'} | 📅 ${item.deadline || '—'}\n` +
    `🏢 ${item.agency}\n` +
    `${item.source_url}`,

  opportunity: (payload: OpportunityAlertPayload) => {
    const lines: string[] = [
      `🎯 [Opportunity Alert] Total: <b>${payload.total}</b>`,
      payload.shouldAlert ? '⚠️ ACT NOW' : '📊 Monitor',
      '',
      '📊 <b>트랙별 점수</b>',
      `• S1 정책/예산: ${payload.s1}`,
      `• S2 자금유입: ${payload.s2}`,
      `• S3 경쟁사: ${payload.s3}`,
      '',
      '📰 <b>트랙별 트래킹 뉴스</b>',
      '',
      `📌 <b>정책/예산</b> (S1: ${payload.s1})`,
      formatTrackNews(payload.newsByTrack.policy),
      '',
      `📌 <b>자금유입</b> (S2: ${payload.s2})`,
      formatTrackNews(payload.newsByTrack.investment),
      '',
      `📌 <b>경쟁사</b> (S3: ${payload.s3})`,
      formatTrackNews(payload.newsByTrack.competitor),
    ];
    return lines.join('\n');
  },

  competitor: (title: string, summary: string, url: string) =>
    `👀 [경쟁사 동향]\n${title}\n${summary}\n🔗 ${url}`,

  daily_brief: (items: string[], pending: string[]) =>
    `☀️ [Daily Brief] 오늘의 학습\n` +
    items.map((item, i) => `${i + 1}. ${item}`).join('\n') +
    (pending.length > 0 ? `\n\n⚠️ 어제 미완료: ${pending.join(', ')}` : ''),

  streak_warning: (streak: number) =>
    `⏰ 오늘 학습 아직 미완료!\n🔥 현재 ${streak}일 연속 중. 10분만 투자하세요.`,

  weekly_report: (streakDays: number, financialMemos: number, sroiCount: number, summary?: string) =>
    `📊 [주간 리포트]\n` +
    `완료율: ${streakDays}/5일\n` +
    `📝 재무메모 ${financialMemos}건 | 📈 SROI ${sroiCount}건\n` +
    (summary || ''),
};

export async function notifyProcurement(item: ProcurementListing): Promise<boolean> {
  return sendMessage(TELEGRAM_TEMPLATES.procurement(item));
}

export async function notifyOpportunityScore(payload: OpportunityAlertPayload): Promise<boolean> {
  if (!payload.shouldAlert) return false;
  return sendMessage(TELEGRAM_TEMPLATES.opportunity(payload));
}

export async function notifyCompetitor(title: string, summary: string, url: string): Promise<boolean> {
  return sendMessage(TELEGRAM_TEMPLATES.competitor(title, summary, url));
}

export async function notifyDailyBrief(items: string[], pending: string[]): Promise<boolean> {
  return sendMessage(TELEGRAM_TEMPLATES.daily_brief(items, pending));
}

export async function notifyStreakWarning(streak: number): Promise<boolean> {
  return sendMessage(TELEGRAM_TEMPLATES.streak_warning(streak));
}

export async function notifyWeeklyReport(
  streakDays: number,
  financialMemos: number,
  sroiCount: number,
  summary?: string
): Promise<boolean> {
  return sendMessage(TELEGRAM_TEMPLATES.weekly_report(streakDays, financialMemos, sroiCount, summary));
}

export { isConfigured };
