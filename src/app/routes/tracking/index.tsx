import { useState, useEffect } from 'react';
import { fetchAllNews } from '../../../services/rssFeed';
import { filterByKeywords, sortByRelevance, sortByDate, sortByTrack, sortByKeywordCount, KEYWORD_CATEGORY_LABELS, type FilteredRssItem } from '../../../services/keywordFilter';
import { TRACK_META } from '../../../config/trackConfig';
import { calculateOpportunityScore } from '../../../services/scoreCalculator';
import { notifyOpportunityScore } from '../../../services/telegramBot';
import { useTrackingStore } from '../../../stores/trackingStore';
import OpportunityGauge from '../../../components/tracking/OpportunityGauge';
import { ExternalLink, RefreshCw, Loader2, Clock, Newspaper, FileText, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'wouter';
import { fetchProcurementListings, type ProcurementListing } from '../../../services/g2bCrawler';
import ProcurementRow from '../../../components/tracking/ProcurementRow';

export type NewsSortBy = 'date' | 'relevance' | 'track' | 'keywordCount';

export default function TrackingDashboard() {
  const [news, setNews] = useState<FilteredRssItem[]>([]);
  const [procurement, setProcurement] = useState<ProcurementListing[]>([]);
  const [showClassifyHelp, setShowClassifyHelp] = useState(false);
  const [sortBy, setSortBy] = useState<NewsSortBy>('relevance');

  const displayedNews = (() => {
    switch (sortBy) {
      case 'date': return sortByDate(news);
      case 'track': return sortByTrack(news);
      case 'keywordCount': return sortByKeywordCount(news);
      default: return sortByRelevance(news);
    }
  })();
  const setOpportunityScores = useTrackingStore((s) => s.setOpportunityScores);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const loadNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await fetchAllNews();
      const filtered = sortByRelevance(filterByKeywords(items));
      setNews(filtered);

      const scoreResult = calculateOpportunityScore(filtered);
      const scores = {
        total: scoreResult.total,
        s1: scoreResult.s1,
        s2: scoreResult.s2,
        s3: scoreResult.s3,
        shouldAlert: scoreResult.shouldAlert,
      };
      setOpportunityScores(scores);

      if (scoreResult.shouldAlert) {
        notifyOpportunityScore(scores).catch(() => {});
      }

      const proc = await fetchProcurementListings();
      setProcurement(proc);
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
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-[#1a1f1a]/50 flex-wrap gap-2">
              <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <Newspaper className="w-4 h-4 text-blue-500" />
                Live News Feed
                {!loading && <span className="text-xs font-normal lowercase text-gray-400">({news.length} articles)</span>}
              </h2>
              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as NewsSortBy)}
                  className="text-xs px-2 py-1.5 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1f1a] text-gray-700 dark:text-gray-300"
                >
                  <option value="date">최신순</option>
                  <option value="relevance">관련도순</option>
                  <option value="track">Track별</option>
                  <option value="keywordCount">키워드 매칭 수</option>
                </select>
                <button
                  type="button"
                  onClick={() => setShowClassifyHelp((v) => !v)}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  분류 기준 보기
                  {showClassifyHelp ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {showClassifyHelp && (
              <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-[#0a0f0a]/80 text-xs space-y-4">
                <div>
                  <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-2">Track (소스 기반)</h4>
                  <p className="text-gray-500 dark:text-gray-400 mb-2">RSS 피드 출처에 따라 분류됩니다. 기사 내용과 무관하게 피드가 속한 카테고리로 표시됩니다.</p>
                  <ul className="space-y-1">
                    {(['caretech', 'investment', 'competitor', 'policy'] as const).map((track) => (
                      <li key={track} className="flex gap-2">
                        <span className="font-medium text-gray-600 dark:text-gray-400 min-w-[80px]">{TRACK_META[track].label}</span>
                        <span className="text-gray-500 dark:text-gray-500">{TRACK_META[track].tooltip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-2">Keyword (내용 기반)</h4>
                  <p className="text-gray-500 dark:text-gray-400 mb-2">제목·요약에 키워드가 포함된 경우 [카테고리] 키워드 형태로 표시됩니다.</p>
                  <ul className="space-y-1">
                    <li><span className="font-medium text-gray-600 dark:text-gray-400">시장</span> — 케어테크, 돌봄 AI, 행동분석, 멘탈케어 등</li>
                    <li><span className="font-medium text-gray-600 dark:text-gray-400">BM</span> — SROI, 가치 기반, 수가, 과금 모델 등</li>
                    <li><span className="font-medium text-gray-600 dark:text-gray-400">정책</span> — 입찰, 조달, 장애인복지법, 보건복지부 등</li>
                    <li><span className="font-medium text-gray-600 dark:text-gray-400">투자</span> — 펀딩, 투자 유치, 임팩트 투자 등</li>
                  </ul>
                </div>
              </div>
            )}
            
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

              {displayedNews.map((item) => {
                const trackMeta = TRACK_META[item.track];
                const keywordTags = (item.keywordCategories ?? []).slice(0, 5);
                const extraCount = (item.keywordCategories?.length ?? 0) - 5;
                return (
                  <a
                    key={item.id}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-4 p-4 border-b border-gray-50 dark:border-gray-800/60 last:border-0 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                          {item.source}
                        </span>
                        <span
                          className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                          title={trackMeta.tooltip}
                          aria-label={`${trackMeta.label}: ${trackMeta.tooltip}`}
                        >
                          {trackMeta.label}
                        </span>
                        <span className="text-[11px] text-gray-400">{item.timeAgo}</span>
                      </div>
                      {keywordTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1.5">
                          {keywordTags.map((m, i) => (
                            <span
                              key={`${m.keyword}-${i}`}
                              className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-400"
                              aria-label={`키워드 매칭: ${KEYWORD_CATEGORY_LABELS[m.category]} - ${m.keyword}`}
                            >
                              [{KEYWORD_CATEGORY_LABELS[m.category]}] {m.keyword}
                            </span>
                          ))}
                          {extraCount > 0 && (
                            <span className="text-[9px] text-gray-400">+{extraCount}개</span>
                          )}
                        </div>
                      )}
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-xs text-gray-500 line-clamp-2">{item.description}</p>
                      )}
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-blue-500 mt-1 flex-shrink-0 transition-colors" />
                  </a>
                );
              })}
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

          {/* 공공 조달 트래커 */}
          <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2 bg-gray-50/50 dark:bg-[#1a1f1a]/50">
              <FileText className="w-4 h-4 text-emerald-500" />
              <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                공공 조달 트래커
              </h2>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {procurement.length === 0 && !loading && (
                <p className="p-4 text-xs text-gray-400">조달 관련 뉴스가 없습니다.</p>
              )}
              {procurement.slice(0, 5).map((p) => (
                <ProcurementRow
                  key={p.id}
                  id={p.id}
                  title={p.title}
                  budget={p.budget > 0 ? `${(p.budget / 100000000).toFixed(1)}억` : '—'}
                  agency={p.agency}
                  deadlineDisplay={p.deadline || (p.fitness_score === 'high' ? '🔴 HIGH' : p.fitness_score === 'medium' ? '🟡 MED' : '⚪ LOW')}
                  isUrgent={p.fitness_score === 'high'}
                  href={p.source_url}
                />
              ))}
            </div>
          </div>

          {/* Track Summary */}
          <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
            <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Market Pulse Tracks</h2>
            <div className="space-y-2">
              {(['caretech', 'investment', 'competitor', 'policy'] as const).map((track) => {
                const label = TRACK_META[track].label;
                const count = displayedNews.filter((n) => n.track === track).length;
                return (
                  <div key={track} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{label}</span>
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
