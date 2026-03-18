import { useEffect, useState } from 'react';
import { useTrackingStore } from '../../stores/trackingStore';
import { ShieldAlert, TrendingUp, Users } from 'lucide-react';

export default function OpportunityGauge() {
  const { s1, s2, s3 } = useTrackingStore((s) => s.opportunityScores);
  const score = useTrackingStore((s) => s.opportunityScore);
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(score);
    }, 100);
    return () => clearTimeout(timer);
  }, [score]);

  const getScoreColor = (value: number) => {
    if (value >= 70) return 'text-emerald-500';
    if (value >= 40) return 'text-amber-500';
    return 'text-gray-400';
  };
  


  const cValue = 2 * Math.PI * 45; // Circumference
  const strokeDashoffset = cValue - (animatedScore / 100) * cValue;

  return (
    <div className="flex bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm flex-col">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Opportunity Score</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500">Aggregated market signal index</p>
        </div>
        <div className={`px-2 py-1 rounded-md text-xs font-bold ${animatedScore >= 70 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>
          {animatedScore >= 70 ? 'ACT NOW' : 'MONITOR'}
        </div>
      </div>
      
      <div className="flex flex-1 items-center justify-center relative mb-6">
        <svg width="140" height="140" viewBox="0 0 100 100" className="rotate-[-90deg] drop-shadow-md">
          {/* Background circle */}
          <circle cx="50" cy="50" r="45" fill="none" className="stroke-gray-100 dark:stroke-gray-800" strokeWidth="8" />
          
          {/* Progress circle */}
          <circle 
            cx="50" cy="50" r="45" fill="none" 
            stroke="url(#gradient)" 
            strokeWidth="8" 
            strokeLinecap="round"
            strokeDasharray={cValue}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              {animatedScore >= 70 ? (
                <>
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#14b8a6" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#f97316" />
                </>
              )}
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center mt-2">
          <span className={`text-4xl font-black ${getScoreColor(animatedScore)} transition-colors duration-500`}>
            {animatedScore}
          </span>
          <span className="text-[10px] text-gray-400 font-medium uppercase tracking-widest mt-1">/ 100</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col items-center p-2 rounded-lg bg-gray-50 dark:bg-white/5">
          <ShieldAlert className="w-4 h-4 text-emerald-500 mb-1" />
          <span className="text-xs text-gray-500 dark:text-gray-400">Policy (S1)</span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">{s1}</span>
        </div>
        <div className="flex flex-col items-center p-2 rounded-lg bg-gray-50 dark:bg-white/5">
          <TrendingUp className="w-4 h-4 text-emerald-500 mb-1" />
          <span className="text-xs text-gray-500 dark:text-gray-400">Funding (S2)</span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">{s2}</span>
        </div>
        <div className="flex flex-col items-center p-2 rounded-lg bg-gray-50 dark:bg-white/5">
          <Users className="w-4 h-4 text-amber-500 mb-1" />
          <span className="text-xs text-gray-500 dark:text-gray-400">Competitor (S3)</span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">{s3}</span>
        </div>
      </div>
    </div>
  );
}
