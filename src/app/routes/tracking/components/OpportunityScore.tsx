import { useState, useMemo, useCallback } from 'react';
import { newsArticles, NewsArticle } from '../../../../mocks/newsData';
import MetricPopup from './MetricPopup';

// ── Mock trend data ──────────────────────────────────────────────────────────
const trendData = {
  today: {
    labels: ['09시', '11시', '13시', '15시', '17시', '19시', '지금'],
    overall:  [61, 64, 67, 63, 70, 72, 74],
    policy:   [58, 62, 65, 60, 68, 70, 72],
    invest:   [65, 67, 70, 66, 73, 74, 75],
    compete:  [60, 62, 66, 62, 69, 71, 74],
    prevLabel: '어제',
    prevOverall: 71,
  },
  week: {
    labels: ['월', '화', '수', '목', '금', '토', '오늘'],
    overall:  [55, 58, 62, 65, 68, 71, 74],
    policy:   [52, 56, 60, 63, 67, 70, 72],
    invest:   [60, 62, 65, 68, 71, 73, 75],
    compete:  [53, 57, 62, 66, 67, 70, 74],
    prevLabel: '지난 주',
    prevOverall: 55,
  },
  month: {
    labels: ['1주', '2주', '3주', '4주', '5주', '6주', '이번'],
    overall:  [42, 48, 53, 58, 62, 68, 74],
    policy:   [40, 45, 51, 56, 61, 67, 72],
    invest:   [45, 51, 55, 60, 64, 70, 75],
    compete:  [41, 47, 53, 59, 60, 67, 74],
    prevLabel: '지난 달',
    prevOverall: 42,
  },
};

type Period = 'today' | 'week' | 'month';
const PERIOD_LABELS: Record<Period, string> = { today: '오늘', week: '주간', month: '월간' };

// ── Sparkline ────────────────────────────────────────────────────────────────
interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fillColor?: string;
}
const Sparkline = ({ data, width = 130, height = 48, color = '#2ec4a9', fillColor = '#2ec4a915' }: SparklineProps) => {
  const min = Math.min(...data) - 4;
  const max = Math.max(...data) + 4;
  const range = max - min || 1;
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * (width - 4) + 2,
    y: height - 2 - ((v - min) / range) * (height - 4),
  }));
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const lastPt = pts[pts.length - 1];
  const firstPt = pts[0];
  const areaPath = `${linePath} L${(lastPt?.x ?? 0).toFixed(1)},${height} L${(firstPt?.x ?? 0).toFixed(1)},${height} Z`;
  const last = pts[pts.length - 1];

  return (
    <svg width={width} height={height} className="overflow-visible">
      <path d={areaPath} fill={fillColor} />
      <path d={linePath} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last?.x} cy={last?.y} r={3.5} fill={color} />
      <circle cx={last?.x} cy={last?.y} r={6} fill={color} fillOpacity={0.2} />
    </svg>
  );
};

// ── Signal Bar ────────────────────────────────────────────────────────────────
interface SignalBarProps {
  label: string;
  icon: string;
  value: number;
  prevValue: number;
  color: string;
  bgColor: string;
  description: string;
  sparkData: number[];
  sparkColor: string;
  onValueClick?: (e: React.MouseEvent) => void;
}
const SignalBar = ({ label, icon, value, prevValue, color, bgColor, description, sparkData, sparkColor, onValueClick }: SignalBarProps) => {
  const delta = value - prevValue;
  const deltaStr = delta > 0 ? `+${delta}` : `${delta}`;
  const deltaColor = delta > 0 ? 'text-emerald-500' : delta < 0 ? 'text-red-400' : 'text-gray-400';
  const deltaIcon = delta > 0 ? 'ri-arrow-up-s-fill' : delta < 0 ? 'ri-arrow-down-s-fill' : 'ri-subtract-fill';

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span className={`w-4 h-4 flex items-center justify-center ${color}`}>
            <i className={`${icon} text-sm`} />
          </span>
          <span className="text-xs font-semibold text-gray-600">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-0.5 text-[11px] font-semibold ${deltaColor}`}>
            <i className={`${deltaIcon} text-xs`} />
            <span>{deltaStr}</span>
          </div>
          <button
            onClick={onValueClick}
            className={`text-xs font-bold ${color} hover:underline cursor-pointer transition-opacity hover:opacity-70 whitespace-nowrap`}
            title="관련 기사 보기"
          >
            {value}
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${bgColor}`}
            style={{ width: `${value}%` }}
          />
        </div>
        <div className="shrink-0">
          <Sparkline data={sparkData} width={52} height={20} color={sparkColor} fillColor={`${sparkColor}18`} />
        </div>
      </div>
      <p className="text-[10px] text-gray-400 mt-0.5">{description}</p>
    </div>
  );
};

// ── Action Alert ─────────────────────────────────────────────────────────────
interface ActionAlertProps {
  article: NewsArticle;
  rank: number;
  onClick: () => void;
}
const ActionAlert = ({ article, rank, onClick }: ActionAlertProps) => {
  const impactColor =
    article.analysis.impactLevel === 'high'
      ? 'text-red-500 bg-red-50'
      : article.analysis.impactLevel === 'medium'
      ? 'text-orange-500 bg-orange-50'
      : 'text-gray-400 bg-gray-50';
  const sentimentIcon =
    article.analysis.sentiment === 'positive'
      ? 'ri-arrow-up-line text-[#2ec4a9]'
      : article.analysis.sentiment === 'negative'
      ? 'ri-arrow-down-line text-red-400'
      : 'ri-subtract-line text-gray-400';

  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-start gap-2.5 p-2.5 rounded-lg bg-[#f7fdf9] hover:bg-[#edf9f4] border border-[#d6f5ec] transition-colors cursor-pointer mb-2"
    >
      <span className="text-xs font-bold text-[#2ec4a9] w-4 shrink-0 mt-0.5">#{rank}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-700 leading-tight line-clamp-2 mb-1">
          {article.title.length > 52 ? article.title.substring(0, 52) + '...' : article.title}
        </p>
        <div className="flex items-center gap-2">
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${impactColor}`}>
            {article.analysis.impactLevel === 'high' ? 'HIGH' : article.analysis.impactLevel === 'medium' ? 'MED' : 'LOW'}
          </span>
          <span className="w-3.5 h-3.5 flex items-center justify-center">
            <i className={`${sentimentIcon} text-xs`} />
          </span>
          <span className="text-[10px] text-gray-400">{article.analysis.impactScore}점</span>
        </div>
      </div>
    </button>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
interface OpportunityScoreProps {
  onArticleClick?: (article: NewsArticle) => void;
}

const OpportunityScore = ({ onArticleClick }: OpportunityScoreProps) => {
  const [period, setPeriod] = useState<Period>('today');
  const [showActions, setShowActions] = useState(false);
  const [popup, setPopup] = useState<{
    rect: DOMRect;
    title: string;
    subtitle: string;
    articles: NewsArticle[];
  } | null>(null);

  const closePopup = useCallback(() => setPopup(null), []);

  const openPopup = useCallback(
    (e: React.MouseEvent, title: string, subtitle: string, articles: NewsArticle[]) => {
      e.stopPropagation();
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setPopup({ rect, title, subtitle, articles });
    },
    []
  );

  const trend = trendData[period];
  const currentOverall = trend.overall[trend.overall.length - 1] ?? 0;
  const deltaOverall = currentOverall - trend.prevOverall;
  const deltaStr = deltaOverall > 0 ? `+${deltaOverall}` : `${deltaOverall}`;

  const actionLevel = useMemo(() => {
    if (currentOverall >= 80) return { label: '최적 진입 타이밍', color: 'text-[#2ec4a9]', bg: 'bg-[#edfaf6]', dot: 'bg-[#2ec4a9]', icon: 'ri-fire-line' };
    if (currentOverall >= 65) return { label: '기회 창 열림', color: 'text-emerald-600', bg: 'bg-emerald-50', dot: 'bg-emerald-500', icon: 'ri-checkbox-circle-line' };
    if (currentOverall >= 45) return { label: '관망 권장', color: 'text-orange-500', bg: 'bg-orange-50', dot: 'bg-orange-400', icon: 'ri-time-line' };
    return { label: '방어적 전략', color: 'text-red-500', bg: 'bg-red-50', dot: 'bg-red-400', icon: 'ri-shield-line' };
  }, [currentOverall]);

  const topActionArticles = useMemo(
    () => [...newsArticles].sort((a, b) => b.analysis.impactScore - a.analysis.impactScore).slice(0, 3),
    []
  );

  const policyArticlesSorted = useMemo(
    () => [...newsArticles].filter((a) => a.type === 'policy').sort((a, b) => b.analysis.impactScore - a.analysis.impactScore),
    []
  );
  const investArticlesSorted = useMemo(
    () => [...newsArticles].filter((a) => a.type === 'investment').sort((a, b) => b.analysis.impactScore - a.analysis.impactScore),
    []
  );
  const competeArticlesSorted = useMemo(
    () => [...newsArticles].filter((a) => a.type === 'competitor').sort((a, b) => b.analysis.impactScore - a.analysis.impactScore),
    []
  );

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (currentOverall / 100) * circumference;

  const prevPolicy  = trend.policy[trend.policy.length - 2] ?? 0;
  const prevInvest  = trend.invest[trend.invest.length - 2] ?? 0;
  const prevCompete = trend.compete[trend.compete.length - 2] ?? 0;
  const curPolicy   = trend.policy[trend.policy.length - 1] ?? 0;
  const curInvest   = trend.invest[trend.invest.length - 1] ?? 0;
  const curCompete  = trend.compete[trend.compete.length - 1] ?? 0;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-bold text-gray-700 tracking-wide uppercase leading-none">Market Window Score</p>
          <p className="text-[10px] text-gray-400 mt-0.5">시장이 지금 우리에게 얼마나 유리한가</p>
        </div>
        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${actionLevel.color} ${actionLevel.bg}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${actionLevel.dot} inline-block`} />
          {actionLevel.label}
        </span>
      </div>

      {/* Period Tabs */}
      <div className="flex items-center gap-1 mb-3 bg-gray-50 rounded-lg p-0.5 w-fit">
        {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
              period === p ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {/* Score + Sparkline */}
      <div className="flex items-center gap-3 mb-4">
        {/* Ring — clickable */}
        <button
          onClick={(e) =>
            openPopup(e, `Market Window Score ${currentOverall}`, '전체 시장 기회 점수 기반 주요 기사', topActionArticles)
          }
          className="relative flex items-center justify-center shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
          style={{ width: 96, height: 96 }}
          title="관련 기사 보기"
        >
          <svg width={96} height={96} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={48} cy={48} r={radius} fill="none" stroke="#f0faf8" strokeWidth={9} />
            <circle
              cx={48} cy={48} r={radius}
              fill="none" stroke="#2ec4a9" strokeWidth={9}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-gray-800 leading-none">{currentOverall}</span>
            <span className="text-[10px] text-gray-400">/ 100</span>
          </div>
        </button>

        {/* Right: trend + delta */}
        <div className="flex-1 min-w-0">
          <div className="mb-1.5">
            <Sparkline data={trend.overall} width={130} height={44} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-gray-400">{trend.prevLabel} 대비</span>
              <span className={`text-[11px] font-bold ${deltaOverall >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                {deltaStr}
              </span>
            </div>
          </div>
          <div className="flex justify-between mt-0.5">
            <span className="text-[9px] text-gray-300">{trend.labels[0]}</span>
            <span className="text-[9px] text-gray-300">{trend.labels[Math.floor(trend.labels.length / 2)]}</span>
            <span className="text-[9px] text-gray-500 font-semibold">{trend.labels[trend.labels.length - 1]}</span>
          </div>
        </div>
      </div>

      {/* Signal Bars */}
      <div className="border-t border-gray-50 pt-3 mb-1">
        <SignalBar
          label="정책 모멘텀"
          icon="ri-government-line"
          value={curPolicy}
          prevValue={prevPolicy}
          color="text-[#2ec4a9]"
          bgColor="bg-[#2ec4a9]"
          description={`긍정 정책 ${newsArticles.filter(a => a.type === 'policy' && a.analysis.sentiment === 'positive').length}건 감지`}
          sparkData={trend.policy}
          sparkColor="#2ec4a9"
          onValueClick={(e) =>
            openPopup(e, `정책 모멘텀 ${curPolicy}`, '정책 관련 기사 영향도 순', policyArticlesSorted)
          }
        />
        <SignalBar
          label="투자 심리"
          icon="ri-funds-line"
          value={curInvest}
          prevValue={prevInvest}
          color="text-orange-400"
          bgColor="bg-orange-400"
          description={`펀딩 뉴스 ${newsArticles.filter(a => a.type === 'investment').length}건 분석`}
          sparkData={trend.invest}
          sparkColor="#fb923c"
          onValueClick={(e) =>
            openPopup(e, `투자 심리 ${curInvest}`, '투자·펀딩 기사 영향도 순', investArticlesSorted)
          }
        />
        <SignalBar
          label="경쟁 압박 여유"
          icon="ri-shield-check-line"
          value={curCompete}
          prevValue={prevCompete}
          color="text-indigo-400"
          bgColor="bg-indigo-400"
          description={`경쟁사 위협 ${newsArticles.filter(a => a.type === 'competitor').length}건 — 역지수`}
          sparkData={trend.compete}
          sparkColor="#818cf8"
          onValueClick={(e) =>
            openPopup(e, `경쟁 압박 여유 ${curCompete}`, '경쟁사 관련 기사 영향도 순', competeArticlesSorted)
          }
        />
      </div>

      {/* Act Now Toggle */}
      <div className="border-t border-gray-100 pt-2">
        <button
          onClick={() => setShowActions(!showActions)}
          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-colors cursor-pointer ${
            showActions ? 'bg-[#edfaf6]' : 'hover:bg-gray-50'
          }`}
        >
          <span className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
            <span className="w-4 h-4 flex items-center justify-center">
              <i className={`${actionLevel.icon} ${actionLevel.color} text-sm`} />
            </span>
            지금 행동할 기사 Top 3
          </span>
          <span className="w-4 h-4 flex items-center justify-center">
            <i className={`${showActions ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} text-gray-400 text-base`} />
          </span>
        </button>

        {showActions && (
          <div className="mt-2">
            {topActionArticles.map((article, idx) => (
              <ActionAlert
                key={article.id}
                article={article}
                rank={idx + 1}
                onClick={() => onArticleClick?.(article)}
              />
            ))}
            <p className="text-[10px] text-gray-400 text-center mt-1">기사 클릭 시 상세 분석 패널 오픈</p>
          </div>
        )}
      </div>

      {/* Floating Popup */}
      {popup && (
        <MetricPopup
          anchorRect={popup.rect}
          title={popup.title}
          subtitle={popup.subtitle}
          articles={popup.articles}
          onArticleClick={(article) => onArticleClick?.(article)}
          onClose={closePopup}
        />
      )}
    </div>
  );
};

export default OpportunityScore;
