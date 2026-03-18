import { useMemo } from 'react';
import { useStudyStore } from '../../stores/studyStore';

const TYPE_LABELS: Record<string, string> = {
  financial: 'Financial',
  pricing: 'Pricing',
  sroi: 'SROI',
  pitch: 'Pitch',
  custom: 'Custom',
  regulation: 'Regulation',
  benchmark: 'Benchmark',
  weekly: 'Weekly',
};

const TYPE_COLORS: Record<string, string> = {
  financial: 'bg-blue-500',
  pricing: 'bg-emerald-500',
  sroi: 'bg-purple-500',
  pitch: 'bg-amber-500',
  custom: 'bg-teal-500',
  regulation: 'bg-red-500',
  benchmark: 'bg-orange-500',
  weekly: 'bg-indigo-500',
};

export default function LearningTimeline() {
  const completedSessions = useStudyStore((s) => s.completedSessions);

  const { grouped, totalDays, streak } = useMemo(() => {
    const byDate: Record<string, typeof completedSessions> = {};
    for (const s of completedSessions) {
      const key = new Date(s.completedAt).toLocaleDateString('ko-KR');
      (byDate[key] ??= []).push(s);
    }

    const sorted = Object.entries(byDate).sort(
      ([a], [b]) => new Date(b).getTime() - new Date(a).getTime()
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let currentStreak = 0;
    const checkDate = new Date(today);
    while (true) {
      const key = checkDate.toLocaleDateString('ko-KR');
      if (byDate[key]) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return { grouped: sorted, totalDays: Object.keys(byDate).length, streak: currentStreak };
  }, [completedSessions]);

  if (completedSessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-400">
        <p className="text-sm">아직 학습 이력이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs">
          <span className="text-gray-500">총 <strong className="text-gray-900 dark:text-white">{completedSessions.length}</strong> 세션</span>
          <span className="text-gray-500">학습일 <strong className="text-gray-900 dark:text-white">{totalDays}</strong>일</span>
          <span className="text-amber-500 font-bold">🔥 {streak}일 연속</span>
        </div>
      </div>

      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
        {grouped.slice(0, 14).map(([date, sessions]) => (
          <div key={date} className="flex gap-3">
            <div className="w-20 flex-shrink-0 text-right">
              <span className="text-xs font-bold text-gray-500">{date}</span>
              <span className="block text-[10px] text-gray-400">{sessions.length}개 세션</span>
            </div>
            <div className="flex-1 flex flex-wrap gap-1.5">
              {sessions.map((s) => (
                <span
                  key={s.id}
                  className={`text-[9px] text-white font-bold px-2 py-0.5 rounded-full ${TYPE_COLORS[s.type] ?? 'bg-gray-500'}`}
                  title={s.data.insight || '(인사이트 없음)'}
                >
                  {TYPE_LABELS[s.type] ?? s.type}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
