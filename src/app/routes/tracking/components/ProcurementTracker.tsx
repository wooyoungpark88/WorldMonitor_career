import { useState, useMemo, useCallback } from 'react';
import { procurementItems, newsArticles, NewsArticle, ProcurementItem } from '../../../../mocks/newsData';
import MetricPopup from './MetricPopup';

const TODAY = new Date('2026-03-21');

const getDDay = (deadline: string): number => {
  const end = new Date(deadline);
  const diff = Math.ceil((end.getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
};

const getDDayConfig = (dDay: number) => {
  if (dDay < 0) return { label: '마감', badge: 'bg-gray-100 text-gray-400', bar: 'bg-gray-300', ring: 'border-gray-200', dot: 'bg-gray-300' };
  if (dDay <= 3) return { label: `D-${dDay}`, badge: 'bg-red-50 text-red-500', bar: 'bg-red-400', ring: 'border-red-200', dot: 'bg-red-400' };
  if (dDay <= 7) return { label: `D-${dDay}`, badge: 'bg-orange-50 text-orange-500', bar: 'bg-orange-400', ring: 'border-orange-200', dot: 'bg-orange-400' };
  if (dDay <= 21) return { label: `D-${dDay}`, badge: 'bg-yellow-50 text-yellow-600', bar: 'bg-yellow-400', ring: 'border-yellow-200', dot: 'bg-yellow-400' };
  return { label: `D-${dDay}`, badge: 'bg-[#edfaf6] text-[#2ec4a9]', bar: 'bg-[#2ec4a9]', ring: 'border-[#b8f0e4]', dot: 'bg-[#2ec4a9]' };
};

const formatDeadline = (deadline: string): string => {
  const d = new Date(deadline);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

interface ProcurementCardProps {
  item: ProcurementItem;
  dDay: number;
  isNotified: boolean;
  onToggleNotify: (id: number) => void;
  onImpactClick: (e: React.MouseEvent) => void;
}

const ProcurementCard = ({ item, dDay, isNotified, onToggleNotify, onImpactClick }: ProcurementCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const config = getDDayConfig(dDay);
  const isClosed = dDay < 0;

  const progressMax = 60;
  const progressValue = Math.max(0, Math.min(progressMax - dDay, progressMax));
  const progressPct = Math.round((progressValue / progressMax) * 100);

  return (
    <div
      className={`rounded-xl border transition-all duration-200 ${isClosed ? 'opacity-50' : ''} ${config.ring} bg-white mb-2`}
    >
      <button
        className="w-full text-left p-3 sm:p-3.5 cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-start gap-3">
          {/* D-Day Badge */}
          <div
            className={`shrink-0 flex-shrink-0 flex flex-col items-center justify-center rounded-xl ${config.badge} border ${config.ring}`}
            style={{ width: 52, height: 52 }}
          >
            <span className="text-xs font-black leading-none">{config.label}</span>
            <span className="text-[10px] opacity-70 mt-0.5">{formatDeadline(item.deadline)}</span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-1 mb-1.5">
              <p className="text-xs font-semibold text-gray-700 leading-tight line-clamp-2 flex-1">
                {item.title}
              </p>
              <button
                onClick={(e) => { e.stopPropagation(); onToggleNotify(item.id); }}
                className={`shrink-0 w-9 h-9 flex items-center justify-center rounded-full transition-colors cursor-pointer ml-1 ${
                  isNotified ? 'text-[#2ec4a9] bg-[#edfaf6]' : 'text-gray-300 hover:text-gray-400'
                }`}
                title={isNotified ? '알림 해제' : '알림 설정'}
              >
                <i className={`${isNotified ? 'ri-notification-3-fill' : 'ri-notification-3-line'} text-sm`} />
              </button>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] sm:text-xs text-gray-400">{item.organization}</span>
              <span className="text-[11px] sm:text-xs text-gray-300">·</span>
              <span className="px-1.5 py-0.5 bg-gray-50 text-gray-500 text-[10px] sm:text-xs font-medium rounded-full">{item.category}</span>
              <span className="text-[11px] sm:text-xs text-gray-300">·</span>
              <span className="text-[11px] sm:text-xs font-bold text-gray-700">{item.budget}</span>
            </div>

            {!isClosed && (
              <div className="mt-2 w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${config.bar}`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Impact + expand row */}
        <div className="flex items-center justify-between mt-2.5 px-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 flex items-center justify-center">
              <i className="ri-bar-chart-box-line text-[11px] text-gray-400" />
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); onImpactClick(e); }}
              className="text-[11px] sm:text-xs text-gray-400 hover:text-[#2ec4a9] hover:underline cursor-pointer transition-colors whitespace-nowrap px-2 py-1 min-h-[36px] flex items-center"
              title="관련 기사 보기"
            >
              임팩트 {item.impactScore}
            </button>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-gray-400">
            <span>상세보기</span>
            <span className="w-4 h-4 flex items-center justify-center">
              <i className={`${expanded ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} text-sm`} />
            </span>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="mx-3.5 mb-3.5 px-3.5 py-3 bg-[#f7fdf9] rounded-lg border border-[#d6f5ec]">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="w-4 h-4 flex items-center justify-center">
              <i className="ri-lightbulb-line text-[#2ec4a9] text-sm" />
            </span>
            <span className="text-xs font-bold text-[#2ec4a9]">Action Tip</span>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">{item.actionTip}</p>
        </div>
      )}
    </div>
  );
};

type FilterType = 'all' | 'urgent' | 'active';

interface ProcurementTrackerProps {
  onArticleClick?: (article: NewsArticle) => void;
}

const ProcurementTracker = ({ onArticleClick }: ProcurementTrackerProps) => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [notified, setNotified] = useState<number[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [popup, setPopup] = useState<{
    rect: DOMRect;
    title: string;
    subtitle: string;
    articles: NewsArticle[];
  } | null>(null);

  const closePopup = useCallback(() => setPopup(null), []);

  const procurementArticles = useMemo(
    () =>
      [...newsArticles]
        .filter((a) => a.type === 'procurement' || a.type === 'policy')
        .sort((a, b) => b.analysis.impactScore - a.analysis.impactScore),
    []
  );

  const toggleNotify = (id: number) => {
    setNotified((prev) => (prev.includes(id) ? prev.filter((n) => n !== id) : [...prev, id]));
  };

  const itemsWithDDay = useMemo(
    () =>
      procurementItems
        .map((item) => ({ item, dDay: getDDay(item.deadline) }))
        .sort((a, b) => a.dDay - b.dDay),
    []
  );

  const filteredItems = useMemo(() => {
    return itemsWithDDay.filter(({ dDay }) => {
      if (filter === 'urgent') return dDay >= 0 && dDay <= 7;
      if (filter === 'active') return dDay > 7;
      return true;
    });
  }, [itemsWithDDay, filter]);

  const urgentCount = itemsWithDDay.filter(({ dDay }) => dDay >= 0 && dDay <= 7).length;
  const displayedItems = showAll ? filteredItems : filteredItems.slice(0, 3);

  const filterTabs: { key: FilterType; label: string; count: number }[] = [
    { key: 'all', label: '전체', count: itemsWithDDay.length },
    { key: 'urgent', label: '마감임박', count: urgentCount },
    { key: 'active', label: '진행중', count: itemsWithDDay.filter(({ dDay }) => dDay > 7).length },
  ];

  const handleImpactClick = useCallback(
    (e: React.MouseEvent, item: ProcurementItem) => {
      e.stopPropagation();
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const related = procurementArticles.filter((a) =>
        a.title.includes(item.organization) ||
        item.title.split(' ').some((word) => word.length > 3 && a.title.includes(word))
      );
      const articles = related.length > 0 ? related : procurementArticles;
      setPopup({
        rect,
        title: `임팩트 점수 ${item.impactScore}`,
        subtitle: `${item.title.substring(0, 24)}... 관련 기사`,
        articles,
      });
    },
    [procurementArticles]
  );

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 flex items-center justify-center">
            <i className="ri-calendar-check-line text-gray-600 text-base" />
          </span>
          <div>
            <span className="text-xs font-bold text-gray-700 tracking-wide uppercase">공공 조달 트래커</span>
            {urgentCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-red-50 text-red-500 text-[10px] font-bold rounded-full">
                {urgentCount}건 긴급
              </span>
            )}
          </div>
        </div>
        <span className="text-[11px] text-gray-400">마감순 정렬</span>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 mb-3 p-1 bg-gray-50 rounded-lg">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setFilter(tab.key); setShowAll(false); }}
            className={`flex-1 flex items-center justify-center gap-1 py-2.5 min-h-[44px] rounded-md text-[11px] sm:text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              filter === tab.key ? 'bg-white text-gray-700' : 'text-gray-400 hover:text-gray-500'
            }`}
          >
            {tab.label}
            <span className={`${filter === tab.key ? (tab.key === 'urgent' ? 'text-red-400' : 'text-[#2ec4a9]') : 'text-gray-300'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <div className="py-6 text-center text-xs text-gray-400">해당 조건의 입찰 건이 없습니다</div>
      ) : (
        <>
          {displayedItems.map(({ item, dDay }) => (
            <ProcurementCard
              key={item.id}
              item={item}
              dDay={dDay}
              isNotified={notified.includes(item.id)}
              onToggleNotify={toggleNotify}
              onImpactClick={(e) => handleImpactClick(e, item)}
            />
          ))}

          {filteredItems.length > 3 && (
            <button
              onClick={() => setShowAll((v) => !v)}
              className="w-full py-2 min-h-[36px] text-xs font-medium text-gray-400 hover:text-[#2ec4a9] transition-colors cursor-pointer flex items-center justify-center gap-1"
            >
              <span className="w-4 h-4 flex items-center justify-center">
                <i className={`${showAll ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} text-sm`} />
              </span>
              {showAll ? '접기' : `${filteredItems.length - 3}건 더 보기`}
            </button>
          )}
        </>
      )}

      {notified.length > 0 && (
        <div className="mt-2 pt-2.5 border-t border-gray-50 flex items-center gap-1.5">
          <span className="w-4 h-4 flex items-center justify-center">
            <i className="ri-notification-3-fill text-[#2ec4a9] text-sm" />
          </span>
          <span className="text-xs text-gray-400">{notified.length}건 알림 설정됨</span>
        </div>
      )}

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

export default ProcurementTracker;
