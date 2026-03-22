import { useEffect, useRef } from 'react';
import { NewsArticle } from '../../../../mocks/newsData';

interface MetricPopupProps {
  anchorRect: DOMRect;
  title: string;
  subtitle?: string;
  articles: NewsArticle[];
  onArticleClick: (article: NewsArticle) => void;
  onClose: () => void;
}

const POPUP_WIDTH = 280;

const impactConfig: Record<string, { label: string; color: string }> = {
  high: { label: 'HIGH', color: 'text-red-500 bg-red-50' },
  medium: { label: 'MED', color: 'text-orange-500 bg-orange-50' },
  low: { label: 'LOW', color: 'text-gray-400 bg-gray-50' },
};

const sentimentIcon = (s: string) => {
  if (s === 'positive') return 'ri-arrow-up-line text-[#2ec4a9]';
  if (s === 'negative') return 'ri-arrow-down-line text-red-400';
  return 'ri-subtract-line text-gray-400';
};

const MetricPopup = ({ anchorRect, title, subtitle, articles, onArticleClick, onClose }: MetricPopupProps) => {
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handle, true);
    return () => document.removeEventListener('mousedown', handle, true);
  }, [onClose]);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [onClose]);

  const vpH = window.innerHeight;
  const estimatedH = 68 + Math.min(articles.length, 3) * 76 + 32;

  let left = anchorRect.left - POPUP_WIDTH - 14;
  if (left < 8) {
    left = anchorRect.right + 14;
    if (left + POPUP_WIDTH > window.innerWidth - 8) {
      left = Math.max(8, anchorRect.left - POPUP_WIDTH);
    }
  }

  const anchorMidY = anchorRect.top + anchorRect.height / 2;
  let top = anchorMidY - estimatedH / 2;
  top = Math.max(8, Math.min(vpH - estimatedH - 8, top));

  const displayArticles = articles.slice(0, 3);

  return (
    <div
      ref={popupRef}
      style={{
        position: 'fixed',
        left,
        top,
        width: POPUP_WIDTH,
        zIndex: 9999,
        animation: 'metricPopupIn 0.15s ease-out',
      }}
      className="bg-white rounded-xl border border-gray-100 overflow-hidden"
    >
      <style>{`
        @keyframes metricPopupIn {
          from { opacity: 0; transform: scale(0.94) translateY(-4px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-start justify-between px-3.5 pt-3 pb-2 border-b border-gray-50">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-gray-800 leading-tight">{title}</p>
          {subtitle && <p className="text-[10px] text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        <button
          onClick={onClose}
          className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 cursor-pointer shrink-0 ml-2"
        >
          <i className="ri-close-line text-xs" />
        </button>
      </div>

      {/* Article List */}
      <div className="py-1">
        {displayArticles.length === 0 ? (
          <p className="text-xs text-gray-400 px-3.5 py-4 text-center">관련 기사가 없습니다</p>
        ) : (
          displayArticles.map((article, idx) => {
            const ic = impactConfig[article.analysis.impactLevel] ?? impactConfig.low;
            return (
              <button
                key={article.id}
                onClick={() => {
                  onArticleClick(article);
                  onClose();
                }}
                className="w-full text-left flex items-start gap-2.5 px-3.5 py-2.5 hover:bg-[#f7fdf9] transition-colors cursor-pointer"
              >
                <span className="text-[10px] font-bold text-[#2ec4a9] w-4 shrink-0 mt-0.5">
                  #{idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-700 leading-tight line-clamp-2 mb-1.5">
                    {article.title.length > 58
                      ? `${article.title.substring(0, 58)}...`
                      : article.title}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${ic?.color}`}>
                      {ic?.label}
                    </span>
                    <span className="w-3.5 h-3.5 flex items-center justify-center">
                      <i className={`${sentimentIcon(article.analysis.sentiment)} text-xs`} />
                    </span>
                    <span className="text-[10px] text-gray-400">{article.analysis.impactScore}점</span>
                    <span className="text-[10px] text-gray-300">·</span>
                    <span className="text-[10px] text-gray-400 truncate">{article.source}</span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Footer */}
      {displayArticles.length > 0 && (
        <div className="px-3.5 py-2 border-t border-gray-50">
          <p className="text-[10px] text-gray-400 text-center">클릭하면 상세 분석 패널이 열립니다</p>
        </div>
      )}
    </div>
  );
};

export default MetricPopup;
