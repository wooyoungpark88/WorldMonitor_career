/**
 * Telegram Webhook Handler — 우하나봇 양방향 명령 처리
 * POST /api/telegram/webhook
 *
 * 지원 명령:
 *   /score      — 현재 Opportunity Score 조회
 *   /news       — 트랙별 최신 뉴스 요약
 *   /news 정책  — 특정 트랙 뉴스 조회
 *   /competitor  — 경쟁사 뉴스 검색
 *   /alert on|off — 알림 켜기/끄기
 *   /threshold N — 알림 임계값 변경
 *   /brief      — Daily Brief 즉시 생성
 *   /procurement — 공공조달 공고 조회
 *   /report     — 주간 리포트
 *   /status     — 시스템 상태
 *   /keyword add|remove|list — 키워드 관리
 *   /help       — 명령어 목록
 */

const BOT_TOKEN = process.env.VITE_TELEGRAM_BOT_TOKEN || '';
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET || '';
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// ─── Server-side settings (persisted in memory per process, reset on deploy) ───
let settings = {
  alertThreshold: 70,
  telegramEnabled: true,
  customKeywords: [],
};

// ─── In-memory score cache (updated by /score command fetching) ───
let cachedScore = null;
let cachedScoreTime = 0;

// ─── Helpers ───────────────────────────────────────────────────────────────────

function escapeHtml(s) {
  if (!s) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function truncate(s, len = 60) {
  if (!s) return '';
  return s.length <= len ? s : s.slice(0, len - 1) + '…';
}

async function sendTelegram(chatId, text, opts = {}) {
  try {
    await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        ...opts,
      }),
    });
  } catch (e) {
    console.error('[Webhook] sendTelegram error:', e);
  }
}

// ─── RSS Fetch (server-side, reuses the proxy) ─────────────────────────────────

const RSS_PROXY_BASE = process.env.VITE_WS_RELAY_URL
  ? process.env.VITE_WS_RELAY_URL.replace('wss://', 'https://').replace('ws://', 'http://').replace(/\/$/, '')
  : '';

const TRACK_FEEDS = {
  policy: [
    { name: '고용노동부', url: 'https://www.moel.go.kr/rss/news.do' },
    { name: 'Google 정책', url: 'https://news.google.com/rss/search?q=AI+돌봄+조달+예산&hl=ko&gl=KR&ceid=KR:ko' },
    { name: 'Google 장애인', url: 'https://news.google.com/rss/search?q=장애인+복지+디지털&hl=ko&gl=KR&ceid=KR:ko' },
  ],
  investment: [
    { name: 'Google 투자', url: 'https://news.google.com/rss/search?q=케어테크+투자+유치+시리즈&hl=ko&gl=KR&ceid=KR:ko' },
    { name: 'Google 헬스케어', url: 'https://news.google.com/rss/search?q=디지털+헬스케어+펀딩&hl=ko&gl=KR&ceid=KR:ko' },
  ],
  competitor: [
    { name: 'Google 네오펙트', url: 'https://news.google.com/rss/search?q=네오펙트+OR+플라이투+OR+루닛+OR+뷰노&hl=ko&gl=KR&ceid=KR:ko' },
  ],
  caretech: [
    { name: 'Google 케어테크', url: 'https://news.google.com/rss/search?q=돌봄+AI+로봇+행동분석&hl=ko&gl=KR&ceid=KR:ko' },
  ],
};

const TRACK_LABELS = {
  policy: '정책/예산',
  investment: '자금유입',
  competitor: '경쟁사',
  caretech: '케어테크',
};

// ─── Source Tier Emoji (mirrors src/config/sourceTiers.ts) ────────────────────
const SOURCE_TIER_MAP = {
  // Tier 1 — Direct RSS
  'Fierce Healthcare': 1, 'MobiHealthNews': 1, 'Healthcare IT News': 1,
  'STAT News': 1, 'Nature Digital Medicine': 1, 'Rock Health': 1,
  'CB Insights': 1, 'Crunchbase News': 1, 'ImpactAlpha': 1,
  'PitchBook News': 1, 'GIIN': 1,
  '고용노동부': 1, '보건복지부': 1, '과기정통부': 1,
  // Tier 2 — Specialized media
  'Digital Health Today': 2, 'IEEE Spectrum Health': 2,
  'TechCrunch Health': 2, 'TechCrunch Startups': 2,
  '메디게이트뉴스': 2, '메디게이트 기업': 2,
  '복지타임즈': 2, '복지타임즈 정책': 2,
  '에이블뉴스': 2, '에이블뉴스 정책': 2,
  '로봇신문': 2, '로봇신문 기업': 2,
  '인공지능신문': 2, '인공지능신문 기업': 2,
  '바이오스펙테이터': 2, '벤처스퀘어': 2, '플래텀': 2,
  '더브이씨': 2, '스타트업엔': 2,
  // Tier 3 — Aggregators
  '돌봄AI 뉴스': 3, '임팩트 투자': 3, 'Digital Health VC': 3,
  '나라장터 AI/돌봄': 3, '디지털치료제 정책': 3, '장애인 복지 정책': 3,
  '네오펙트': 3, '뷰노': 3, '루닛': 3, '플라이투': 3,
  'Woebot Health': 3, 'Ambient.ai': 3, '소풍벤처스': 3,
  'MYSC': 3, 'D3쥬빌리': 3, 'Cogito': 3, 'Nourish Care': 3, 'SimCare AI': 3,
};

function tierEmoji(sourceName) {
  const tier = SOURCE_TIER_MAP[sourceName] || 4;
  return tier === 1 ? '🔵' : tier === 2 ? '🟢' : tier === 3 ? '🟡' : '⚪';
}

const TRACK_ALIAS = {
  '정책': 'policy', '예산': 'policy', 'policy': 'policy', 's1': 'policy',
  '투자': 'investment', '자금': 'investment', '자금유입': 'investment', 'investment': 'investment', 's2': 'investment',
  '경쟁사': 'competitor', '경쟁': 'competitor', 'competitor': 'competitor', 's3': 'competitor',
  '케어': 'caretech', '케어테크': 'caretech', 'caretech': 'caretech', 'care': 'caretech',
};

async function fetchRssItems(feedUrl) {
  try {
    const proxyUrl = RSS_PROXY_BASE
      ? `${RSS_PROXY_BASE}/rss?url=${encodeURIComponent(feedUrl)}`
      : null;
    if (!proxyUrl) return [];

    const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return [];
    const text = await res.text();

    // Simple XML parsing (server-side, no DOMParser)
    const items = [];
    const itemRegex = /<item[\s>]([\s\S]*?)<\/item>/gi;
    let match;
    while ((match = itemRegex.exec(text)) !== null) {
      const block = match[1];
      const title = block.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() || '';
      const link = block.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1]?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() || '';
      const pubDate = block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1]?.trim() || '';
      if (title) items.push({ title, link, pubDate });
    }
    return items.slice(0, 8);
  } catch {
    return [];
  }
}

async function fetchTrackNews(track) {
  const feeds = TRACK_FEEDS[track] || [];
  const results = await Promise.allSettled(feeds.map((f) => fetchRssItems(f.url)));
  const items = [];
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.status === 'fulfilled') {
      for (const item of r.value) {
        item.sourceName = feeds[i].name;
      }
      items.push(...r.value);
    }
  }
  // Deduplicate by title
  const seen = new Set();
  return items.filter((i) => {
    const key = i.title.slice(0, 30);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 10);
}

async function fetchAllTrackNews() {
  const tracks = ['policy', 'investment', 'competitor', 'caretech'];
  const results = {};
  const settled = await Promise.allSettled(tracks.map(async (t) => {
    results[t] = await fetchTrackNews(t);
  }));
  return results;
}

// Score calculation (simplified server-side version)
function calculateScore(newsByTrack) {
  const trackScore = (items) => {
    if (!items || items.length === 0) return 0;
    const countFactor = Math.min(1, items.length / 5);
    return Math.round(50 * 0.6 + countFactor * 40);
  };

  const s1 = trackScore(newsByTrack.policy);
  const s2 = trackScore(newsByTrack.investment);
  const s3 = trackScore(newsByTrack.competitor);
  const total = Math.round(s1 * 0.4 + s2 * 0.3 + s3 * 0.3);

  return { total, s1, s2, s3, shouldAlert: total >= settings.alertThreshold };
}

// ─── Command Handlers ──────────────────────────────────────────────────────────

async function handleHelp(chatId) {
  const text = `🤖 <b>우하나봇 명령어</b>

📊 <b>조회</b>
/score — Opportunity Score 조회
/news — 전체 트랙 뉴스 요약
/news 정책 — 특정 트랙 뉴스 (정책/투자/경쟁사/케어)
/competitor 키워드 — 경쟁사 뉴스 검색
/procurement — 공공조달 공고 조회
/status — 시스템 상태 확인

📋 <b>리포트</b>
/brief — Daily Brief 생성
/report — 주간 리포트 요약

⚙️ <b>설정</b>
/alert on|off — 알림 켜기/끄기
/threshold 숫자 — 알림 임계값 (30-95)
/keyword add 키워드 — 키워드 추가
/keyword remove 키워드 — 키워드 제거
/keyword list — 키워드 목록

/help — 이 도움말`;

  await sendTelegram(chatId, text);
}

async function handleScore(chatId) {
  await sendTelegram(chatId, '⏳ 점수를 계산하고 있습니다...');

  const newsByTrack = await fetchAllTrackNews();
  const score = calculateScore(newsByTrack);
  cachedScore = { ...score, newsByTrack, timestamp: Date.now() };
  cachedScoreTime = Date.now();

  const emoji = score.total >= 85 ? '🔴' : score.total >= 70 ? '🟡' : '🟢';
  const alert = score.shouldAlert ? '⚠️ ACT NOW' : '📊 Monitor';

  const text = `🎯 <b>Opportunity Score</b>

${emoji} Total: <b>${score.total}</b>  ${alert}

📊 트랙별 점수
• S1 정책/예산: ${score.s1}
• S2 자금유입: ${score.s2}
• S3 경쟁사: ${score.s3}

⏰ ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`;

  await sendTelegram(chatId, text);
}

async function handleNews(chatId, trackArg) {
  const track = trackArg ? TRACK_ALIAS[trackArg.toLowerCase()] : null;

  if (trackArg && !track) {
    await sendTelegram(chatId, `❌ 알 수 없는 트랙: "${escapeHtml(trackArg)}"\n사용 가능: 정책, 투자, 경쟁사, 케어`);
    return;
  }

  await sendTelegram(chatId, '⏳ 뉴스를 수집하고 있습니다...');

  if (track) {
    const items = await fetchTrackNews(track);
    const label = TRACK_LABELS[track] || track;

    if (items.length === 0) {
      await sendTelegram(chatId, `📰 <b>${escapeHtml(label)}</b> 트랙에 최신 뉴스가 없습니다.`);
      return;
    }

    const lines = items.slice(0, 8).map(
      (n) => `${tierEmoji(n.sourceName)} <a href="${n.link}">${escapeHtml(truncate(n.title))}</a>`
    );
    await sendTelegram(chatId, `📰 <b>${escapeHtml(label)}</b> 최신 뉴스\n\n${lines.join('\n')}\n\n🔵직접 🟢전문 🟡애그리게이터 ⚪기타`);
  } else {
    const allNews = await fetchAllTrackNews();
    const sections = [];

    for (const [t, items] of Object.entries(allNews)) {
      const label = TRACK_LABELS[t] || t;
      if (!items || items.length === 0) {
        sections.push(`📌 <b>${label}</b>\n  (뉴스 없음)`);
        continue;
      }
      const lines = items.slice(0, 5).map(
        (n) => `  ${tierEmoji(n.sourceName)} <a href="${n.link}">${escapeHtml(truncate(n.title))}</a>`
      );
      sections.push(`📌 <b>${label}</b>\n${lines.join('\n')}`);
    }

    await sendTelegram(chatId, `📰 <b>트랙별 최신 뉴스</b>\n\n${sections.join('\n\n')}\n\n🔵직접 🟢전문 🟡애그리게이터 ⚪기타`);
  }
}

async function handleCompetitor(chatId, query) {
  if (!query) {
    await sendTelegram(chatId, '❌ 검색어를 입력하세요.\n예: /competitor 네오펙트');
    return;
  }

  await sendTelegram(chatId, `⏳ "${escapeHtml(query)}" 관련 뉴스를 검색합니다...`);

  const searchUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ko&gl=KR&ceid=KR:ko`;
  const items = await fetchRssItems(searchUrl);

  if (items.length === 0) {
    await sendTelegram(chatId, `🔍 "${escapeHtml(query)}" 관련 뉴스를 찾을 수 없습니다.`);
    return;
  }

  const lines = items.slice(0, 8).map(
    (n) => `• <a href="${n.link}">${escapeHtml(truncate(n.title))}</a>`
  );
  await sendTelegram(chatId, `🔍 <b>"${escapeHtml(query)}" 검색 결과</b>\n\n${lines.join('\n')}`);
}

async function handleAlert(chatId, arg) {
  if (!arg || (arg !== 'on' && arg !== 'off')) {
    const current = settings.telegramEnabled ? '✅ ON' : '❌ OFF';
    await sendTelegram(chatId, `📢 현재 알림 상태: ${current}\n\n사용법: /alert on 또는 /alert off`);
    return;
  }

  settings.telegramEnabled = arg === 'on';
  const status = settings.telegramEnabled ? '✅ 켜짐' : '❌ 꺼짐';
  await sendTelegram(chatId, `📢 알림이 ${status}으로 변경되었습니다.`);
}

async function handleThreshold(chatId, arg) {
  const num = parseInt(arg, 10);
  if (!arg || isNaN(num) || num < 30 || num > 95) {
    await sendTelegram(chatId, `⚙️ 현재 임계값: <b>${settings.alertThreshold}</b>\n\n사용법: /threshold 30~95\n예: /threshold 80`);
    return;
  }

  settings.alertThreshold = num;
  await sendTelegram(chatId, `⚙️ 알림 임계값이 <b>${num}</b>으로 변경되었습니다.`);
}

async function handleBrief(chatId) {
  await sendTelegram(chatId, '⏳ Daily Brief를 생성합니다...');

  const allNews = await fetchAllTrackNews();
  const score = calculateScore(allNews);

  const highlights = [];
  for (const [t, items] of Object.entries(allNews)) {
    const label = TRACK_LABELS[t] || t;
    if (items && items.length > 0) {
      highlights.push(`${label}: ${escapeHtml(truncate(items[0].title, 50))}`);
    }
  }

  const emoji = score.total >= 85 ? '🔴' : score.total >= 70 ? '🟡' : '🟢';
  const date = new Date().toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

  const text = `☀️ <b>Daily Brief</b> — ${date}

${emoji} Opportunity Score: <b>${score.total}</b>
• S1 정책/예산: ${score.s1}
• S2 자금유입: ${score.s2}
• S3 경쟁사: ${score.s3}

📌 <b>오늘의 핵심 뉴스</b>
${highlights.map((h, i) => `${i + 1}. ${h}`).join('\n')}

💡 상세 보기: /news
📊 점수 추이: /score`;

  await sendTelegram(chatId, text);
}

async function handleProcurement(chatId) {
  await sendTelegram(chatId, '⏳ 공공조달 공고를 조회합니다...');

  const items = await fetchTrackNews('policy');

  const FITNESS_HIGH = ['AI 돌봄', 'Vision AI', '영상분석', '발달장애', 'ABA', '행동분석', '디지털치료제', '특수교육'];
  const FITNESS_MED = ['CCTV 지능형', 'AI 모니터링', '돌봄 로봇', '돌봄', '장애인', '케어테크'];

  const listings = [];
  for (const item of items) {
    const lower = (item.title || '').toLowerCase();
    let fitness = 'low';
    let matchedKw = [];

    for (const kw of FITNESS_HIGH) {
      if (lower.includes(kw.toLowerCase())) { fitness = 'high'; matchedKw.push(kw); }
    }
    if (fitness === 'low') {
      for (const kw of FITNESS_MED) {
        if (lower.includes(kw.toLowerCase())) { fitness = 'medium'; matchedKw.push(kw); }
      }
    }

    const icon = fitness === 'high' ? '🔴' : fitness === 'medium' ? '🟡' : '⚪';
    listings.push(`${icon} <a href="${item.link}">${escapeHtml(truncate(item.title))}</a>${matchedKw.length > 0 ? `\n   키워드: ${matchedKw.join(', ')}` : ''}`);
  }

  if (listings.length === 0) {
    await sendTelegram(chatId, '🏛️ 현재 관련 공공조달 공고가 없습니다.');
    return;
  }

  await sendTelegram(chatId, `🏛️ <b>공공조달 관련 뉴스</b>\n\n${listings.slice(0, 10).join('\n\n')}\n\n🔴 HIGH  🟡 MEDIUM  ⚪ LOW`);
}

async function handleReport(chatId) {
  await sendTelegram(chatId, '⏳ 주간 리포트를 생성합니다...');

  const allNews = await fetchAllTrackNews();
  const score = calculateScore(allNews);

  const trackCounts = {};
  let totalCount = 0;
  for (const [t, items] of Object.entries(allNews)) {
    trackCounts[t] = (items || []).length;
    totalCount += trackCounts[t];
  }

  const date = new Date().toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' });

  const text = `📊 <b>주간 리포트</b> — ${date}

🎯 Opportunity Score: <b>${score.total}</b>
• S1 정책/예산: ${score.s1}
• S2 자금유입: ${score.s2}
• S3 경쟁사: ${score.s3}

📰 수집된 뉴스: 총 <b>${totalCount}</b>건
• 정책/예산: ${trackCounts.policy || 0}건
• 자금유입: ${trackCounts.investment || 0}건
• 경쟁사: ${trackCounts.competitor || 0}건
• 케어테크: ${trackCounts.caretech || 0}건

⚙️ 알림 임계값: ${settings.alertThreshold}
📢 알림 상태: ${settings.telegramEnabled ? '✅ ON' : '❌ OFF'}
🔑 커스텀 키워드: ${settings.customKeywords.length > 0 ? settings.customKeywords.join(', ') : '(없음)'}`;

  await sendTelegram(chatId, text);
}

async function handleStatus(chatId) {
  const checks = {};

  // Check RSS proxy
  try {
    if (RSS_PROXY_BASE) {
      const res = await fetch(`${RSS_PROXY_BASE}/api/version`, { signal: AbortSignal.timeout(5000) });
      checks.rssProxy = res.ok ? '✅ 정상' : `⚠️ ${res.status}`;
    } else {
      checks.rssProxy = '❌ 미설정';
    }
  } catch {
    checks.rssProxy = '❌ 연결 실패';
  }

  // Check Telegram API
  try {
    const res = await fetch(`${TELEGRAM_API}/getMe`, { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    checks.telegram = data.ok ? `✅ @${data.result.username}` : '⚠️ 응답 오류';
  } catch {
    checks.telegram = '❌ 연결 실패';
  }

  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const mins = Math.floor((uptime % 3600) / 60);

  const text = `🔧 <b>시스템 상태</b>

🤖 봇: ${checks.telegram}
📡 RSS Proxy: ${checks.rssProxy}
⏱️ 서버 Uptime: ${hours}h ${mins}m
📢 알림: ${settings.telegramEnabled ? '✅ ON' : '❌ OFF'}
⚙️ 임계값: ${settings.alertThreshold}
🔑 키워드: ${settings.customKeywords.length}개

🕐 ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`;

  await sendTelegram(chatId, text);
}

async function handleKeyword(chatId, action, value) {
  if (!action || action === 'list') {
    if (settings.customKeywords.length === 0) {
      await sendTelegram(chatId, '🔑 등록된 커스텀 키워드가 없습니다.\n\n추가: /keyword add 키워드');
      return;
    }
    const list = settings.customKeywords.map((k, i) => `${i + 1}. ${escapeHtml(k)}`).join('\n');
    await sendTelegram(chatId, `🔑 <b>커스텀 키워드 목록</b>\n\n${list}\n\n추가: /keyword add 키워드\n삭제: /keyword remove 키워드`);
    return;
  }

  if (action === 'add') {
    if (!value) {
      await sendTelegram(chatId, '❌ 키워드를 입력하세요.\n예: /keyword add 로봇');
      return;
    }
    if (settings.customKeywords.includes(value)) {
      await sendTelegram(chatId, `⚠️ "${escapeHtml(value)}" 키워드가 이미 존재합니다.`);
      return;
    }
    settings.customKeywords.push(value);
    await sendTelegram(chatId, `✅ 키워드 추가: <b>${escapeHtml(value)}</b>\n현재 ${settings.customKeywords.length}개`);
    return;
  }

  if (action === 'remove' || action === 'delete' || action === 'del') {
    if (!value) {
      await sendTelegram(chatId, '❌ 삭제할 키워드를 입력하세요.\n예: /keyword remove 로봇');
      return;
    }
    const idx = settings.customKeywords.indexOf(value);
    if (idx === -1) {
      await sendTelegram(chatId, `⚠️ "${escapeHtml(value)}" 키워드를 찾을 수 없습니다.`);
      return;
    }
    settings.customKeywords.splice(idx, 1);
    await sendTelegram(chatId, `🗑️ 키워드 삭제: <b>${escapeHtml(value)}</b>\n현재 ${settings.customKeywords.length}개`);
    return;
  }

  await sendTelegram(chatId, '❌ 알 수 없는 동작입니다.\n사용법: /keyword add|remove|list 키워드');
}

// ─── Command Router ────────────────────────────────────────────────────────────

async function routeCommand(chatId, text) {
  const trimmed = (text || '').trim();
  if (!trimmed.startsWith('/')) {
    // Not a command — echo help hint
    await sendTelegram(chatId, '💬 명령어를 입력하세요. /help 로 목록을 확인할 수 있습니다.');
    return;
  }

  // Parse: /command@botname arg1 arg2 ...
  const withoutMention = trimmed.replace(/@\S+/, '');
  const parts = withoutMention.split(/\s+/);
  const command = parts[0].toLowerCase();
  const args = parts.slice(1);

  switch (command) {
    case '/help':
    case '/start':
      return handleHelp(chatId);

    case '/score':
      return handleScore(chatId);

    case '/news':
      return handleNews(chatId, args[0]);

    case '/competitor':
    case '/comp':
      return handleCompetitor(chatId, args.join(' '));

    case '/alert':
      return handleAlert(chatId, args[0]?.toLowerCase());

    case '/threshold':
      return handleThreshold(chatId, args[0]);

    case '/brief':
    case '/daily':
      return handleBrief(chatId);

    case '/procurement':
    case '/proc':
    case '/조달':
      return handleProcurement(chatId);

    case '/report':
      return handleReport(chatId);

    case '/status':
      return handleStatus(chatId);

    case '/keyword':
    case '/kw':
      return handleKeyword(chatId, args[0]?.toLowerCase(), args.slice(1).join(' '));

    default:
      await sendTelegram(chatId, `❓ 알 수 없는 명령: ${escapeHtml(command)}\n/help 로 사용 가능한 명령을 확인하세요.`);
  }
}

// ─── Webhook Entry Point ───────────────────────────────────────────────────────

export default async function handler(request) {
  // Only accept POST
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Validate webhook secret (if configured)
  if (WEBHOOK_SECRET) {
    const token = request.headers.get('x-telegram-bot-api-secret-token') || '';
    if (token !== WEBHOOK_SECRET) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  try {
    const update = await request.json();

    // Handle message updates
    const message = update.message || update.edited_message;
    if (message && message.text) {
      const chatId = message.chat.id;
      // Process asynchronously, return 200 immediately to Telegram
      routeCommand(chatId, message.text).catch((e) => {
        console.error('[Webhook] Command error:', e);
        sendTelegram(chatId, '❌ 명령 처리 중 오류가 발생했습니다.').catch(() => {});
      });
    }

    // Always return 200 to Telegram
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[Webhook] Parse error:', e);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
