import { useState, useCallback, useMemo } from 'react';
import { marketPulseTracks, newsArticles, NewsArticle } from '../../../../mocks/newsData';
import MetricPopup from './MetricPopup';

interface MarketPulseProps {
  onArticleClick?: (article: NewsArticle) => void;
}

const trackArticleMap: Record<string, string[]> = {
  '케어테크 뉴스': ['cartech'],
  '투자/펀딩': ['investment'],
  '경쟁사': ['competitor'],
  '정책/조달': ['policy', 'procurement'],
};

const MarketPulse = ({ onArticleClick }: MarketPulseProps) => {
  const total = marketPulseTracks.reduce((sum, t) => sum + t.count, 0);
  const colors = ['bg-[#2ec4a9]', 'bg-orange-400', 'bg-indigo-400', 'bg-rose-400'];
  const textColors = ['text-[#2ec4a9]', 'text-orange-400', 'text-indigo-400', 'text-rose-400'];

  const [popup, setPopup] = useState<{
    rect: DOMRect;
    title: string;
    subtitle: string;
    articles: NewsArticle[];
  } | null>(null);

  const closePopup = useCallback(() => setPopup(null), []);

  const articlesByTrack = useMemo(() => {
    const map: Record<string, NewsArticle[]> = {};
    marketPulseTracks.forEach((track) => {
      const types = trackArticleMap[track.label] ?? [];
      map[track.label] = [...newsArticles]
        .filter((a) => {
          if (types.includes('cartech')) return a.category === '케어테크 뉴스';
          return types.includes(a.type);
        })
        .sort((a, b) => b.analysis.impactScore - a.analysis.impactScore);
    });
    return map;
  }, []);

  const handleCountClick = useCallback(
    (e: React.MouseEvent, track: { label: string; count: number }) => {
      e.stopPropagation();
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setPopup({
        rect,
        title: `${track.label} ${track.count}건`,
        subtitle: '영향도 순 주요 기사',
        articles: articlesByTrack[track.label] ?? [],
      });
    },
    [articlesByTrack]
  );

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-bold text-gray-700 tracking-wide uppercase">Market Pulse Tracks</p>
        <span className="text-xs text-gray-400">총 {total}건</span>
      </div>
      <div className="space-y-4">
        {marketPulseTracks.map((track, i) => {
          const pct = Math.round((track.count / total) * 100);
          return (
            <div key={track.label}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${colors[i]} inline-block`} />
                  <span className="text-xs text-gray-600 font-medium truncate">{track.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleCountClick(e, track)}
                    className={`px-2 py-1.5 min-h-[36px] rounded text-xs font-bold ${textColors[i]} hover:underline cursor-pointer transition-opacity hover:opacity-70 whitespace-nowrap flex items-center`}
                    title="관련 기사 보기"
                  >
                    {track.count}
                  </button>
                  <span className="text-[11px] text-gray-300">{pct}%</span>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden min-w-0">
                <div
                  className={`h-full rounded-full ${colors[i]}`}
                  style={{ width: `${pct}%`, transition: 'width 0.6s ease' }}
                />
              </div>
            </div>
          );
        })}
      </div>

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

export default MarketPulse;
