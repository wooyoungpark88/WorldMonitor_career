import { useEffect, useRef } from 'react';
import { NewsArticle } from '../../../../mocks/newsData';

interface NewsDetailPanelProps {
  article: NewsArticle | null;
  onClose: () => void;
  bookmarked: boolean;
  onToggleBookmark: (id: number) => void;
}

const typeColorMap: Record<string, { bg: string; text: string; label: string }> = {
  policy: { bg: 'bg-blue-50', text: 'text-blue-600', label: '정책/조달' },
  investment: { bg: 'bg-purple-50', text: 'text-purple-600', label: '투자/펀딩' },
  competitor: { bg: 'bg-orange-50', text: 'text-orange-600', label: '경쟁사' },
  procurement: { bg: 'bg-green-50', text: 'text-green-600', label: '조달' },
};

const sentimentConfig = {
  positive: { label: '긍정', color: 'text-emerald-600', bg: 'bg-emerald-50', bar: 'bg-emerald-400', icon: 'ri-arrow-up-circle-line' },
  neutral: { label: '중립', color: 'text-amber-600', bg: 'bg-amber-50', bar: 'bg-amber-400', icon: 'ri-checkbox-blank-circle-line' },
  negative: { label: '부정', color: 'text-red-500', bg: 'bg-red-50', bar: 'bg-red-400', icon: 'ri-arrow-down-circle-line' },
};

const impactConfig = {
  high: { label: '높음', color: 'text-red-500', dot: 'bg-red-400' },
  medium: { label: '보통', color: 'text-amber-500', dot: 'bg-amber-400' },
  low: { label: '낮음', color: 'text-gray-400', dot: 'bg-gray-300' },
};

const NewsDetailPanel = ({ article, onClose, bookmarked, onToggleBookmark }: NewsDetailPanelProps) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Prevent body scroll when panel is open
  useEffect(() => {
    if (article) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [article]);

  const isOpen = !!article;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/30 z-30 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Slide Panel — full width on mobile, fixed 480px on sm+ */}
      <div
        ref={panelRef}
        className={`fixed top-0 right-0 h-full max-h-screen w-full sm:w-[480px] bg-white z-40 flex flex-col transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {article && (
          <>
            {/* Header */}
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {/* Mobile back arrow */}
                <button
                  onClick={onClose}
                  className="sm:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors cursor-pointer mr-1 shrink-0"
                >
                  <i className="ri-arrow-left-line text-gray-600 text-lg" />
                </button>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-semibold shrink-0 ${typeColorMap[article.type]?.bg} ${typeColorMap[article.type]?.text}`}
                >
                  {article.source}
                </span>
                <span className="text-xs text-gray-400 truncate hidden sm:block">{article.category}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => onToggleBookmark(article.id)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <i className={`text-base ${bookmarked ? 'ri-bookmark-fill text-[#2ec4a9]' : 'ri-bookmark-line text-gray-400'}`} />
                </button>
                <button className="w-9 h-9 hidden sm:flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                  <i className="ri-external-link-line text-gray-400 text-base" />
                </button>
                {/* Desktop close button */}
                <button
                  onClick={onClose}
                  className="hidden sm:flex w-9 h-9 items-center justify-center rounded-lg hover:bg-gray-100 transition-colors cursor-pointer ml-1"
                >
                  <i className="ri-close-line text-gray-500 text-lg" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-4 sm:px-6 py-4 sm:py-5">
                {/* Sub-tags */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {article.tags.map((tag, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                      {tag}
                    </span>
                  ))}
                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full ml-auto">
                    {article.daysAgo === 0 ? '오늘' : article.daysAgo === 1 ? '1일 전' : `${article.daysAgo}일 전`}
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-base font-bold text-gray-800 leading-snug mb-4">
                  {article.title}
                </h2>

                {/* Score Cards Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 mb-5">
                  {/* Sentiment */}
                  <div className={`rounded-xl p-3.5 ${sentimentConfig[article.analysis.sentiment].bg}`}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className={`w-4 h-4 flex items-center justify-center ${sentimentConfig[article.analysis.sentiment].color}`}>
                        <i className={`${sentimentConfig[article.analysis.sentiment].icon} text-sm`} />
                      </span>
                      <span className={`text-xs font-semibold ${sentimentConfig[article.analysis.sentiment].color}`}>
                        감성 분석
                      </span>
                    </div>
                    <div className="flex items-end gap-1.5 mb-2">
                      <span className="text-2xl font-bold text-gray-800">{article.analysis.sentimentScore}</span>
                      <span className={`text-xs font-medium mb-0.5 ${sentimentConfig[article.analysis.sentiment].color}`}>
                        {sentimentConfig[article.analysis.sentiment].label}
                      </span>
                    </div>
                    <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${sentimentConfig[article.analysis.sentiment].bar}`}
                        style={{ width: `${article.analysis.sentimentScore}%` }}
                      />
                    </div>
                  </div>
                  {/* Impact Score */}
                  <div className="rounded-xl p-3.5 bg-gray-50">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="w-4 h-4 flex items-center justify-center text-gray-500">
                        <i className="ri-flashlight-line text-sm" />
                      </span>
                      <span className="text-xs font-semibold text-gray-600">임팩트 점수</span>
                    </div>
                    <div className="flex items-end gap-1.5 mb-2">
                      <span className="text-2xl font-bold text-gray-800">{article.analysis.impactScore}</span>
                      <span className={`text-xs font-medium mb-0.5 ${impactConfig[article.analysis.impactLevel].color} flex items-center gap-1`}>
                        <span className={`inline-block w-1.5 h-1.5 rounded-full ${impactConfig[article.analysis.impactLevel].dot}`} />
                        {impactConfig[article.analysis.impactLevel].label}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#2ec4a9]"
                        style={{ width: `${article.analysis.impactScore}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 mb-5" />

                {/* Full Content */}
                <div className="mb-5">
                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <span className="w-4 h-4 flex items-center justify-center">
                      <i className="ri-article-line text-gray-500 text-sm" />
                    </span>
                    기사 내용
                  </h3>
                  <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line bg-gray-50 rounded-xl p-4">
                    {article.analysis.fullContent}
                  </div>
                </div>

                {/* Key Insights */}
                <div className="mb-5">
                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <span className="w-4 h-4 flex items-center justify-center">
                      <i className="ri-lightbulb-line text-[#2ec4a9] text-sm" />
                    </span>
                    핵심 인사이트
                  </h3>
                  <div className="space-y-2.5">
                    {article.analysis.keyInsights.map((insight, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <span className="mt-0.5 w-5 h-5 flex items-center justify-center rounded-full bg-[#e6faf6] flex-shrink-0">
                          <span className="text-[10px] font-bold text-[#2ec4a9]">{i + 1}</span>
                        </span>
                        <p className="text-sm text-gray-700 leading-relaxed">{insight}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Keywords */}
                <div className="mb-5">
                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <span className="w-4 h-4 flex items-center justify-center">
                      <i className="ri-price-tag-3-line text-gray-500 text-sm" />
                    </span>
                    관련 키워드
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {article.analysis.relatedKeywords.map((kw, i) => (
                      <span key={i} className="text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-full text-gray-600 font-medium">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Stakeholders */}
                <div className="mb-5">
                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <span className="w-4 h-4 flex items-center justify-center">
                      <i className="ri-team-line text-gray-500 text-sm" />
                    </span>
                    주요 이해관계자
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {article.analysis.stakeholders.map((s, i) => (
                      <span key={i} className="text-xs px-3 py-1.5 bg-gray-100 rounded-full text-gray-600">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Tip */}
                <div className="rounded-xl p-4 border border-[#c5ede6] bg-[#f0faf8] mb-2">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 flex items-center justify-center">
                      <i className="ri-rocket-2-line text-[#2ec4a9] text-base" />
                    </span>
                    <span className="text-xs font-bold text-[#2ec4a9] uppercase tracking-wide">Action Tip</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{article.analysis.actionTip}</p>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-4 sm:px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center gap-2 flex-shrink-0 bg-white pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button className="w-full sm:w-auto sm:flex-1 flex items-center justify-center gap-2 py-3 bg-[#2ec4a9] text-white text-sm font-semibold rounded-xl hover:bg-[#28b09a] transition-colors cursor-pointer whitespace-nowrap">
                <span className="w-4 h-4 flex items-center justify-center">
                  <i className="ri-book-open-line text-sm" />
                </span>
                Study로 보내기
              </button>
              <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap">
                <span className="w-4 h-4 flex items-center justify-center">
                  <i className="ri-share-line text-sm" />
                </span>
                공유
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default NewsDetailPanel;
