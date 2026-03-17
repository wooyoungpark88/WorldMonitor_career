import { Flame } from 'lucide-react';

export default function StreakCalendar() {
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  // Mock data for the current week where today is Thursday (index 3)
  const currentStreak = 4;
  const status = [true, true, true, false, false, false, false]; 

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-2 mb-4 text-amber-500">
        <Flame className="w-5 h-5 fill-current" />
        <span className="font-bold text-gray-900 dark:text-white">
          {currentStreak} Day Learning Streak
        </span>
      </div>
      
      <div className="flex gap-2">
        {weekDays.map((day, i) => (
          <div key={day} className="flex flex-col items-center gap-1.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{day}</span>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center border-2 transition-colors ${
              status[i] 
                ? 'bg-amber-100 border-amber-300 text-amber-600 dark:bg-amber-900/30 dark:border-amber-600/50 dark:text-amber-400' 
                : i === 3 
                  ? 'border-gray-300 dark:border-gray-600 border-dashed text-gray-400' // Today (not done yet)
                  : 'bg-gray-50 border-gray-100 text-gray-300 dark:bg-[#1a1f1a] dark:border-gray-800 dark:text-gray-600'
            }`}>
              {status[i] ? <Flame className="w-4 h-4 fill-current" /> : <div className="w-1.5 h-1.5 rounded-full bg-current opacity-30"></div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
