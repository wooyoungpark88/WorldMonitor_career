/**
 * Daily Brief 요일별 학습 루틴 — PRD Section 5.4.2
 * MON~FRI 아침/점심/퇴근 활동 배정
 */

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type StudyTool = 'financial' | 'pricing' | 'sroi' | 'pitch' | 'weekly';

export interface ScheduleItem {
  id: string;
  label: string;
  duration: string;
  type: 'morning' | 'lunch' | 'evening';
  route?: string;
  /** study 페이지에서 열 도구 (route가 /study일 때) */
  tool?: StudyTool;
  description: string;
}

export interface DailySchedule {
  dayOfWeek: DayOfWeek;
  dayName: string;
  morning: ScheduleItem;
  lunch: ScheduleItem;
  evening: ScheduleItem;
  isFriday: boolean;
}

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'] as const;

const WEEKLY_SCHEDULE: Record<number, Omit<DailySchedule, 'dayOfWeek' | 'dayName' | 'isFriday'>> = {
  1: {
    morning: {
      id: 'mon-morning',
      label: '기업 재무 분석 #1',
      duration: '30분',
      type: 'morning',
      route: '/study',
      tool: 'financial',
      description: 'Financial Gym — 오늘의 기업 카드, 3행 메모 (Revenue/Cost/Moat)',
    },
    lunch: {
      id: 'mon-lunch',
      label: '프라이싱 벤치마크',
      duration: '20분',
      type: 'lunch',
      route: '/study',
      tool: 'pricing',
      description: '경쟁사 가격 모델 비교, CareVia/호시담 가격 인사이트',
    },
    evening: {
      id: 'mon-evening',
      label: 'SROI 환산',
      duration: '10분',
      type: 'evening',
      route: '/study',
      tool: 'sroi',
      description: '오늘 업무 1건을 SROI 계산기로 환산',
    },
  },
  2: {
    morning: {
      id: 'tue-morning',
      label: '기업 재무 분석 #2',
      duration: '30분',
      type: 'morning',
      route: '/study',
      tool: 'financial',
      description: 'Financial Gym — 두 번째 기업 카드',
    },
    lunch: {
      id: 'tue-lunch',
      label: '조달 공고 스캔',
      duration: '20분',
      type: 'lunch',
      route: '/tracking',
      description: '나라장터 AI/돌봄 공고 스캔, 낙찰 분석',
    },
    evening: {
      id: 'tue-evening',
      label: 'SROI 환산',
      duration: '10분',
      type: 'evening',
      route: '/study',
      tool: 'sroi',
      description: '오늘 업무 1건 SROI 환산',
    },
  },
  3: {
    morning: {
      id: 'wed-morning',
      label: '경쟁사 동향 분석',
      duration: '30분',
      type: 'morning',
      route: '/tracking',
      description: 'Market Pulse — 경쟁사 트랙, Ambient.ai, Cogito 등',
    },
    lunch: {
      id: 'wed-lunch',
      label: '피칭 분석',
      duration: '20분',
      type: 'lunch',
      route: '/study',
      tool: 'pitch',
      description: 'YC Demo Day, a16z Bio+Health — 서사 구조/숫자 배치 분석',
    },
    evening: {
      id: 'wed-evening',
      label: '현장 스토리 수집',
      duration: '10분',
      type: 'evening',
      route: '/study',
      tool: 'pitch',
      description: '오늘 현장에서 있었던 일 1건을 스토리로 기록',
    },
  },
  4: {
    morning: {
      id: 'thu-morning',
      label: '투자 라운드 분석',
      duration: '30분',
      type: 'morning',
      route: '/tracking',
      description: 'Market Pulse — 투자/펀딩 트랙, CareVia BM 비교',
    },
    lunch: {
      id: 'thu-lunch',
      label: '정책/예산 모니터링',
      duration: '20분',
      type: 'lunch',
      route: '/tracking',
      description: '복지부, 과기부 보도자료, 예산 사이클',
    },
    evening: {
      id: 'thu-evening',
      label: 'SROI 환산',
      duration: '10분',
      type: 'evening',
      route: '/study',
      tool: 'sroi',
      description: '오늘 업무 1건 SROI 환산',
    },
  },
  5: {
    morning: {
      id: 'fri-morning',
      label: '주간 인사이트 정리',
      duration: '30분',
      type: 'morning',
      route: '/study',
      tool: 'financial',
      description: '이번 주 재무메모, SROI, 시장 시그널 요약',
    },
    lunch: {
      id: 'fri-lunch',
      label: 'CareVia/호시담 적용점 정리',
      duration: '20분',
      type: 'lunch',
      route: '/study',
      tool: 'pricing',
      description: '이번 주 학습을 실무 적용 아이디어로 정리',
    },
    evening: {
      id: 'fri-evening',
      label: '다음 주 학습 계획',
      duration: '10분',
      type: 'evening',
      route: '/study',
      tool: 'weekly',
      description: '금요일 주간 정리 5질문 작성',
    },
  },
};

const DEFAULT_SCHEDULE = WEEKLY_SCHEDULE[1]!;

export function getTodaySchedule(date?: Date): DailySchedule {
  const d = date ?? new Date();
  const dayOfWeek = d.getDay() as DayOfWeek;
  const schedule = WEEKLY_SCHEDULE[dayOfWeek] ?? DEFAULT_SCHEDULE;

  return {
    dayOfWeek,
    dayName: DAY_NAMES[dayOfWeek],
    morning: schedule.morning,
    lunch: schedule.lunch,
    evening: schedule.evening,
    isFriday: dayOfWeek === 5,
  };
}

export function getAllScheduleItems(): ScheduleItem[] {
  return [
    ...Object.values(WEEKLY_SCHEDULE).flatMap((s) => [s.morning, s.lunch, s.evening]),
  ];
}
