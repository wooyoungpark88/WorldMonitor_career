import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'wouter';
import Sidebar from './Sidebar';
import LiveNewsFeed from './LiveNewsFeed';
import OpportunityScore from './OpportunityScore';
import ProcurementTracker from './ProcurementTracker';
import MarketPulse from './MarketPulse';
import NewsDetailPanel from './NewsDetailPanel';
import VisionBanner from './VisionBanner';
import { NewsArticle } from '../../../../mocks/newsData';

export type VisionStatFilter = 'all' | 'high-impact' | 'procurement';

// ── Insights Panel Header ────────────────────────────────────────────────────
interface InsightsPanelHeaderProps {
  lastUpdate: Date;
  isRefreshing: boolean;
  onRefresh: () => void;
}

const InsightsPanelHeader = ({ lastUpdate, isRefreshing, onRefresh }: InsightsPanelHeaderProps) => {
  const [timeAgo, setTimeAgo] = useState('방금 전');

  useEffect(() => {
    const compute = () => {
      const diff = Math.floor((Date.now() - lastUpdate.getTime()) / 1000);
      if (diff < 60) {
        setTimeAgo('방금 전');
      } else if (diff < 3600) {
        setTimeAgo(`${Math.floor(diff / 60)}분 전`);
      } else {
        const h = lastUpdate.getHours();
        const m = String(lastUpdate.getMinutes()).padStart(2, '0');
        const ampm = h >= 12 ? '오후' : '오전';
        setTimeAgo(`${ampm} ${h > 12 ? h - 12 : h}:${m}`);
      }
    };
    compute();
    const timer = setInterval(compute, 30000);
    return () => clearInterval(timer);
  }, [lastUpdate]);

  const formatted = (() => {
    const h = lastUpdate.getHours();
    const m = String(lastUpdate.getMinutes()).padStart(2, '0');
    const ampm = h >= 12 ? '오후' : '오전';
    return `${ampm} ${h > 12 ? h - 12 : h}:${m}`;
  })();

  return (
    <div className="px-1 mb-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[11px] text-gray-400" title={`${formatted} 기준`}>
            <span className="w-3.5 h-3.5 flex items-center justify-center">
              <i className="ri-time-line text-gray-300 text-xs" />
            </span>
            <span>{isRefreshing ? '업데이트 중' : `${timeAgo} 업데이트`}</span>
          </div>
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className={`w-6 h-6 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
              isRefreshing
                ? 'text-[#2ec4a9] bg-[#edfaf6]'
                : 'hover:bg-gray-100 text-gray-400 hover:text-[#2ec4a9]'
            }`}
            title="새로고침"
          >
            <i className={`ri-refresh-line text-xs ${isRefreshing ? 'animate-spin-loop' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Page ────────────────────────────────────────────────────────────────
type MobileTab = 'news' | 'insights';

const TrackingPage = () => {
  const [_location, navigate] = useLocation();
  const [activeMenu, setActiveMenu] = useState('tracking');
  const [lastUpdate, setLastUpdate] = useState<Date>(() => new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [bookmarked, setBookmarked] = useState<number[]>([]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>('news');
  const [visionFilter, setVisionFilter] = useState<VisionStatFilter | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  const handleMenuChange = (menu: string) => {
    setActiveMenu(menu);
    // Navigate using wouter
    if (menu === 'tracking') navigate('/tracking');
    else if (menu === 'study') navigate('/study');
    else if (menu === 'knowledge') navigate('/knowledge');
    else if (menu === 'settings') navigate('/settings');
  };

  const handleArticleClick = (article: NewsArticle) => {
    setSelectedArticle((prev) => (prev?.id === article.id ? null : article));
    setMobileTab('news');
  };

  const handleClosePanel = () => setSelectedArticle(null);

  const handleToggleBookmark = (id: number) => {
    setBookmarked((prev) => (prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]));
  };

  const handleRefresh = useCallback(() => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setSelectedArticle(null);
    setTimeout(() => {
      setIsRefreshing(false);
      setLastUpdate(new Date());
    }, 1600);
  }, [isRefreshing]);

  const handleStatClick = useCallback((filter: VisionStatFilter) => {
    setVisionFilter((prev) => {
      const next = prev === filter ? null : filter;
      if (next !== null) {
        setTimeout(() => {
          const el = feedRef.current;
          if (el) {
            const top = el.getBoundingClientRect().top + window.scrollY - 72;
            window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
          }
        }, 80);
      }
      return next;
    });
    setMobileTab('news');
  }, []);

  const handleClearVisionFilter = useCallback(() => {
    setVisionFilter(null);
  }, []);

  const RightPanelContent = () => (
    <>
      <InsightsPanelHeader lastUpdate={lastUpdate} isRefreshing={isRefreshing} onRefresh={handleRefresh} />
      <div className={`flex flex-col gap-4 transition-opacity duration-300 ${isRefreshing ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        <OpportunityScore onArticleClick={handleArticleClick} />
        <ProcurementTracker onArticleClick={handleArticleClick} />
        <MarketPulse onArticleClick={handleArticleClick} />
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#f7f9f8]" style={{ fontFamily: "'Inter', 'Noto Sans KR', sans-serif" }}>

      {/* Mobile sidebar backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <Sidebar
        activeMenu={activeMenu}
        onMenuChange={handleMenuChange}
        isMobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <div className="lg:ml-56 flex flex-col min-h-screen">

        {/* Mobile Top Bar */}
        <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-100 bg-white cursor-pointer"
          >
            <i className="ri-menu-line text-gray-600 text-base" />
          </button>
          <span className="text-[#2ec4a9] font-black text-base tracking-tight flex-1">CareRadar</span>
          <div className="flex items-center gap-1 p-0.5 bg-gray-100 rounded-full">
            <button
              onClick={() => setMobileTab('news')}
              className={`px-4 py-2.5 min-h-[44px] rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                mobileTab === 'news' ? 'bg-white text-gray-800' : 'text-gray-500'
              }`}
            >
              뉴스
            </button>
            <button
              onClick={() => setMobileTab('insights')}
              className={`px-4 py-2.5 min-h-[44px] rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                mobileTab === 'insights' ? 'bg-white text-gray-800' : 'text-gray-500'
              }`}
            >
              인사이트
            </button>
          </div>
          <button className="w-10 h-10 flex items-center justify-center bg-white border border-gray-100 rounded-xl relative cursor-pointer">
            <i className="ri-notification-3-line text-gray-500 text-base" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-400 rounded-full" />
          </button>
        </div>

        <div className="flex flex-col xl:flex-row flex-1">

          {/* Center Content */}
          <div className={`flex-1 min-w-0 p-4 md:p-6 ${mobileTab === 'insights' ? 'hidden xl:block' : 'block'}`}>
            <div className="hidden lg:flex items-center justify-between mb-6">
              <div className="flex-1 max-w-md">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-100 rounded-xl">
                  <span className="w-4 h-4 flex items-center justify-center">
                    <i className="ri-search-line text-gray-400 text-sm" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search news, companies, frameworks..."
                    className="flex-1 text-sm text-gray-600 placeholder-gray-400 outline-none bg-transparent"
                  />
                </div>
              </div>
              <button className="ml-4 w-9 h-9 flex items-center justify-center bg-white border border-gray-100 rounded-xl hover:bg-gray-50 cursor-pointer relative">
                <i className="ri-notification-3-line text-gray-500 text-base" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-400 rounded-full" />
              </button>
            </div>

            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="w-6 h-6 flex items-center justify-center">
                  <i className="ri-search-2-line text-gray-700 text-lg" />
                </span>
                Trend Tracking
              </h1>
              <div className="flex items-center gap-3">
                <span className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400">
                  <span className="w-4 h-4 flex items-center justify-center">
                    <i className="ri-time-line text-gray-400 text-sm" />
                  </span>
                  {isRefreshing ? '업데이트 중...' : (() => {
                    const h = lastUpdate.getHours();
                    const m = String(lastUpdate.getMinutes()).padStart(2, '0');
                    const ampm = h >= 12 ? '오후' : '오전';
                    return `${ampm} ${h > 12 ? h - 12 : h}:${m} 업데이트`;
                  })()}
                </span>
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    isRefreshing
                      ? 'text-[#2ec4a9] border-[#2ec4a9] bg-[#edfaf6] opacity-80 cursor-not-allowed'
                      : 'text-[#2ec4a9] border-[#2ec4a9] hover:bg-[#e6faf6]'
                  }`}
                >
                  <span className="w-4 h-4 flex items-center justify-center">
                    <i className={`ri-refresh-line text-sm ${isRefreshing ? 'animate-spin-loop' : ''}`} />
                  </span>
                  {isRefreshing ? '업데이트 중...' : 'REFRESH'}
                </button>
              </div>
            </div>

            <VisionBanner
              activeStatFilter={visionFilter}
              onStatClick={handleStatClick}
            />
            <div ref={feedRef}>
              <LiveNewsFeed
                onArticleClick={handleArticleClick}
                selectedArticleId={selectedArticle?.id ?? null}
                bookmarked={bookmarked}
                onToggleBookmark={handleToggleBookmark}
                visionFilter={visionFilter}
                onClearVisionFilter={handleClearVisionFilter}
              />
            </div>
          </div>

          {/* Right Panel */}
          <div
            className={`xl:w-[360px] xl:min-w-[360px] p-4 md:p-6 xl:pl-0 flex flex-col gap-4 ${
              mobileTab === 'news' ? 'hidden xl:flex' : 'flex'
            }`}
          >
            <RightPanelContent />
          </div>
        </div>
      </div>

      <NewsDetailPanel
        article={selectedArticle}
        onClose={handleClosePanel}
        bookmarked={selectedArticle ? bookmarked.includes(selectedArticle.id) : false}
        onToggleBookmark={handleToggleBookmark}
      />

      {/* Safe area bottom padding for devices with home indicators */}
      <div className="w-full" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} />
    </div>
  );
};

export default TrackingPage;
