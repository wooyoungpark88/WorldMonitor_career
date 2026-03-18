import { Flame } from 'lucide-react';
import { useStudyStore } from '../../stores/studyStore';

/** Mon=0, Tue=1, ..., Sun=6 */
function getWeekDates(): Date[] {
  const today = new Date();
  const day = today.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function StreakCalendar() {
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const completedSessions = useStudyStore((s) => s.completedSessions);

  const weekDates = getWeekDates();
  const todayKey = toDateKey(new Date());

  const completedDates = new Set(
    completedSessions.map((s) => toDateKey(new Date(s.completedAt)))
  );

  const status = weekDates.map((d) => completedDates.has(toDateKey(d)));
  const todayIndex = weekDates.findIndex((d) => toDateKey(d) === todayKey);

  let currentStreak = 0;
  for (let i = todayIndex; i >= 0; i--) {
    if (status[i]) currentStreak++;
    else break;
  }

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-2 mb-4 text-amber-500">
        <Flame className="w-5 h-5 fill-current" />
        <span className="font-bold text-gray-900 dark:text-white">
          {currentStreak} Day Learning Streak
        </span>
      </div>

      <div className="flex gap-2">
        {weekDays.map((day, i) => {
          const isCompleted = status[i];
          const isToday = i === todayIndex;
          return (
            <div key={day} className="flex flex-col items-center gap-1.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{day}</span>
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center border-2 transition-colors ${
                  isCompleted
                    ? 'bg-amber-100 border-amber-300 text-amber-600 dark:bg-amber-900/30 dark:border-amber-600/50 dark:text-amber-400'
                    : isToday
                      ? 'border-gray-300 dark:border-gray-600 border-dashed text-gray-400'
                      : 'bg-gray-50 border-gray-100 text-gray-300 dark:bg-[#1a1f1a] dark:border-gray-800 dark:text-gray-600'
                }`}
              >
                {isCompleted ? (
                  <Flame className="w-4 h-4 fill-current" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-current opacity-30" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
