#!/usr/bin/env node
/**
 * Telegram Webhook 설정 스크립트
 *
 * 사용법:
 *   node scripts/setup-telegram-webhook.mjs <DOMAIN>
 *
 * 예시:
 *   node scripts/setup-telegram-webhook.mjs worldmonitor.app
 *   node scripts/setup-telegram-webhook.mjs your-app.up.railway.app
 *
 * 환경변수:
 *   VITE_TELEGRAM_BOT_TOKEN — BotFather에서 받은 토큰
 *   TELEGRAM_WEBHOOK_SECRET — (선택) webhook 검증용 시크릿
 */

const BOT_TOKEN = process.env.VITE_TELEGRAM_BOT_TOKEN;
const SECRET = process.env.TELEGRAM_WEBHOOK_SECRET || '';
const DOMAIN = process.argv[2];

if (!BOT_TOKEN) {
  console.error('❌ VITE_TELEGRAM_BOT_TOKEN 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

if (!DOMAIN) {
  console.error('❌ 도메인을 인수로 전달하세요.');
  console.error('   사용법: node scripts/setup-telegram-webhook.mjs <DOMAIN>');
  console.error('   예시: node scripts/setup-telegram-webhook.mjs worldmonitor.app');
  process.exit(1);
}

const WEBHOOK_URL = `https://${DOMAIN}/api/telegram/webhook`;
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function main() {
  console.log(`\n🤖 우하나봇 Webhook 설정\n`);
  console.log(`   Webhook URL: ${WEBHOOK_URL}`);
  if (SECRET) console.log(`   Secret: ${SECRET.slice(0, 4)}****`);
  console.log();

  // 1. Set webhook
  const params = new URLSearchParams({
    url: WEBHOOK_URL,
    allowed_updates: JSON.stringify(['message', 'edited_message']),
  });
  if (SECRET) params.set('secret_token', SECRET);

  const setRes = await fetch(`${API_URL}/setWebhook?${params}`);
  const setData = await setRes.json();

  if (setData.ok) {
    console.log('✅ Webhook 설정 완료!');
  } else {
    console.error('❌ Webhook 설정 실패:', setData.description);
    process.exit(1);
  }

  // 2. Verify
  const infoRes = await fetch(`${API_URL}/getWebhookInfo`);
  const infoData = await infoRes.json();
  const info = infoData.result;

  console.log(`\n📋 Webhook 정보:`);
  console.log(`   URL: ${info.url}`);
  console.log(`   보류 업데이트: ${info.pending_update_count}`);
  console.log(`   마지막 에러: ${info.last_error_message || '없음'}`);

  // 3. Set bot commands
  const commands = [
    { command: 'score', description: 'Opportunity Score 조회' },
    { command: 'news', description: '트랙별 최신 뉴스 (정책/투자/경쟁사/케어)' },
    { command: 'competitor', description: '경쟁사 뉴스 검색' },
    { command: 'procurement', description: '공공조달 공고 조회' },
    { command: 'brief', description: 'Daily Brief 생성' },
    { command: 'report', description: '주간 리포트' },
    { command: 'alert', description: '알림 on/off' },
    { command: 'threshold', description: '알림 임계값 변경' },
    { command: 'keyword', description: '키워드 추가/삭제/목록' },
    { command: 'status', description: '시스템 상태 확인' },
    { command: 'help', description: '명령어 목록' },
  ];

  const cmdRes = await fetch(`${API_URL}/setMyCommands`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ commands }),
  });
  const cmdData = await cmdRes.json();

  if (cmdData.ok) {
    console.log(`\n✅ 봇 명령어 ${commands.length}개 등록 완료!`);
    console.log('   텔레그램에서 / 를 입력하면 명령어 자동완성이 표시됩니다.');
  } else {
    console.warn('⚠️ 명령어 등록 실패:', cmdData.description);
  }

  console.log(`\n🎉 설정 완료! 텔레그램에서 봇에게 /help 를 보내보세요.\n`);
}

main().catch((e) => {
  console.error('❌ 오류:', e);
  process.exit(1);
});
