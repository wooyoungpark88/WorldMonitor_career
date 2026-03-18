import { useState, useEffect } from 'react';
import { fetchAllNews, type RssItem } from '../../../services/rssFeed';
import OpportunityGauge from '../../../components/tracking/OpportunityGauge';
import { ExternalLink, RefreshCw, Loader2, Clock, Newspaper } from 'lucide-react';
import { Link } from 'wouter';

export default function TrackingDashboard() {
  const [news, setNews] = useState<RssItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const loadNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await fetchAllNews();
      setNews(items);
      setLastRefresh(new Date());
    } catch (e) {
      setError('뉴스를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
    // 5분마다 자동 새로고침
    const interval = setInterval(loadNews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full flex flex-col max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          🔍 Trend Tracking
        </h1>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {lastRefresh.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 업데이트
            </span>
          )}
          <button
            onClick={loadNews}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column — Live News Feed */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm flex flex-col overflow-hidden flex-1">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-[#1a1f1a]/50">
              <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <Newspaper className="w-4 h-4 text-blue-500" />
                Live News Feed
                {!loading && <span className="text-xs font-normal lowercase text-gray-400">({news.length} articles)</span>}
              </h2>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {loading && news.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-4" />
                  <p className="text-sm">뉴스 피드를 불러오고 있습니다...</p>
                </div>
              )}

              {error && news.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-red-400">
                  <p className="text-sm mb-2">{error}</p>
                  <button onClick={loadNews} className="text-xs text-blue-500 underline">다시 시도</button>
                </div>
              )}

              {news.map((item) => (
                <a
                  key={item.id}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-4 p-4 border-b border-gray-50 dark:border-gray-800/60 last:border-0 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                        {item.source}
                      </span>
                      <span className="text-[11px] text-gray-400">{item.timeAgo}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-xs text-gray-500 line-clamp-2">{item.description}</p>
                    )}
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-blue-500 mt-1 flex-shrink-0 transition-colors" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column — Score + Actions */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <OpportunityGauge />

          {/* Quick Action: Study로 이동 */}
          <Link
            href="/study"
            className="block bg-gradient-to-r from-blue-600 to-emerald-500 text-white p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow"
          >
            <h3 className="font-bold text-lg mb-1">📖 Study Session 시작하기</h3>
            <p className="text-sm text-white/80">뉴스에서 발견한 인사이트를 5단계 학습 루프로 분석하세요.</p>
          </Link>

          {/* Sources Summary */}
          <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
            <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Feed Sources</h2>
            <div className="space-y-2">
              {['The Guardian', 'BBC Health', 'CNBC Healthcare', 'TechCrunch', 'Hacker News'].map(src => {
                const count = news.filter(n => n.source === src).length;
                return (
                  <div key={src} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{src}</span>
                    <span className={`font-bold text-xs px-2 py-0.5 rounded ${count > 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600'}`}>
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
