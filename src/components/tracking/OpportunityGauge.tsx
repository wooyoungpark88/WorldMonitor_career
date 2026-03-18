import { useEffect, useState } from 'react';
import { useTrackingStore } from '../../stores/trackingStore';
import { ShieldAlert, TrendingUp, Users, ChevronDown, ChevronUp, ExternalLink, BookOpen } from 'lucide-react';
import { Link } from 'wouter';

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const h = 32;
  const w = 120;
  const step = w / (data.length - 1);
  const points = data.map((v, i) => `${i * step},${h - ((v - min) / range) * (h - 4) - 2}`).join(' ');
  const last = data[data.length - 1] ?? 0;
  const prev = data[data.length - 2] ?? 0;
  const color = last >= prev ? '#34d399' : '#f97316';

  return (
    <svg width={w} height={h} className="flex-shrink-0">
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
      <circle cx={(data.length - 1) * step} cy={h - (((last) - min) / range) * (h - 4) - 2} r="3" fill={color} />
    </svg>
  );
}

export default function OpportunityGauge() {
  const { s1, s2, s3 } = useTrackingStore((s) => s.opportunityScores);
  const score = useTrackingStore((s) => s.opportunityScore);
  const scoreHistory = useTrackingStore((s) => s.scoreHistory);
  const topNews = useTrackingStore((s) => s.topContributingNews);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  const getScoreColor = (value: number) => {
    if (value >= 70) return 'text-emerald-500';
    if (value >= 40) return 'text-amber-500';
    return 'text-gray-400';
  };

  const cValue = 2 * Math.PI * 45;
  const strokeDashoffset = cValue - (animatedScore / 100) * cValue;
  const historyTotals = scoreHistory.map((h) => h.total);

  const trackSections = [
    { key: 'policy', label: '정책/예산', score: s1, icon: ShieldAlert, news: topNews.policy },
    { key: 'investment', label: '자금유입', score: s2, icon: TrendingUp, news: topNews.investment },
    { key: 'competitor', label: '경쟁사', score: s3, icon: Users, news: topNews.competitor },
  ] as const;

  return (
    <div className="flex bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm flex-col">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Opportunity Score</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500">3-시그널 수렴 지수</p>
        </div>
        <button
          onClick={() => setShowDetail((v) => !v)}
          className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold transition-colors ${
            animatedScore >= 70
              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 hover:bg-emerald-100'
              : 'bg-gray-100 text-gray-500 dark:bg-gray-800 hover:bg-gray-200'
          }`}
        >
          {animatedScore >= 70 ? 'ACT NOW' : 'MONITOR'}
          {showDetail ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-shrink-0">
          <svg width="120" height="120" viewBox="0 0 100 100" className="rotate-[-90deg] drop-shadow-md">
            <circle cx="50" cy="50" r="45" fill="none" className="stroke-gray-100 dark:stroke-gray-800" strokeWidth="8" />
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
                  <><stop offset="0%" stopColor="#34d399" /><stop offset="100%" stopColor="#14b8a6" /></>
                ) : (
                  <><stop offset="0%" stopColor="#fbbf24" /><stop offset="100%" stopColor="#f97316" /></>
                )}
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-black ${getScoreColor(animatedScore)} transition-colors duration-500`}>
              {animatedScore}
            </span>
            <span className="text-[9px] text-gray-400 font-medium uppercase tracking-widest">/ 100</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 flex-1 min-w-0">
          {historyTotals.length >= 2 && (
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider">추이</span>
              <Sparkline data={historyTotals.slice(-7)} />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-2">
        {trackSections.map(({ key, label, score: trackScore, icon: Icon }) => (
          <div key={key} className="flex flex-col items-center p-2 rounded-lg bg-gray-50 dark:bg-white/5">
            <Icon className="w-4 h-4 text-emerald-500 mb-1" />
            <span className="text-[10px] text-gray-500 dark:text-gray-400">{label}</span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">{trackScore}</span>
          </div>
        ))}
      </div>

      {/* ACT NOW detail dropdown */}
      {showDetail && (
        <div className="mt-3 border-t border-gray-100 dark:border-gray-800 pt-3 space-y-3">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">점수 기여 뉴스</h3>
          {trackSections.map(({ key, label, score: trackScore, news }) => (
            <div key={key}>
              <div className="text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">{label} (S: {trackScore})</div>
              {news.length === 0 ? (
                <p className="text-[10px] text-gray-400 pl-2">해당 트랙 뉴스 없음</p>
              ) : (
                <ul className="space-y-1">
                  {news.map((n) => (
                    <li key={n.id} className="flex items-center gap-1.5 pl-2">
                      <span className="w-1 h-1 rounded-full bg-emerald-400 flex-shrink-0" />
                      <a href={n.link} target="_blank" rel="noopener noreferrer" className="text-[11px] text-gray-600 dark:text-gray-300 hover:text-blue-600 truncate flex-1">
                        {n.title}
                      </a>
                      <ExternalLink className="w-3 h-3 text-gray-300 flex-shrink-0" />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          <Link href="/study" className="flex items-center justify-center gap-1.5 mt-2 px-3 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            <BookOpen className="w-3.5 h-3.5" /> 기여 뉴스 기반 Study 시작
          </Link>
        </div>
      )}
    </div>
  );
}
