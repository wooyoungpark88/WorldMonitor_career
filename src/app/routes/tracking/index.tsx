import { useState, useEffect, useMemo } from 'react';
import { fetchAllNews } from '../../../services/rssFeed';
import { filterByKeywords, sortByRelevance, sortByDate, sortByTrack, sortByKeywordCount, KEYWORD_CATEGORY_LABELS, type FilteredRssItem } from '../../../services/keywordFilter';
import { crossVerify } from '../../../services/crossVerification';
import { TRACK_META } from '../../../config/trackConfig';
import { calculateOpportunityScore } from '../../../services/scoreCalculator';
import { notifyOpportunityScore } from '../../../services/telegramBot';
import { useTrackingStore } from '../../../stores/trackingStore';
import { useArticleStore } from '../../../stores/articleStore';
import OpportunityGauge from '../../../components/tracking/OpportunityGauge';
import ArticleDetailModal from '../../../components/tracking/ArticleDetailModal';
import { ExternalLink, RefreshCw, Loader2, Clock, Newspaper, FileText, HelpCircle, ChevronDown, ChevronUp, Search, Bookmark, BookmarkCheck, Star } from 'lucide-react';
import { Link } from 'wouter';
import { fetchProcurementListings, type ProcurementListing } from '../../../services/g2bCrawler';
import ProcurementRow from '../../../components/tracking/ProcurementRow';

export type NewsSortBy = 'date' | 'relevance' | 'track' | 'keywordCount';
type TrackType = 'caretech' | 'investment' | 'competitor' | 'policy';

export default function TrackingDashboard() {
  const [news, setNews] = useState<FilteredRssItem[]>([]);
  const [procurement, setProcurement] = useState<ProcurementListing[]>([]);
  const [showClassifyHelp, setShowClassifyHelp] = useState(false);
  const [sortBy, setSortBy] = useState<NewsSortBy>('relevance');
  const [trackFilter, setTrackFilter] = useState<TrackType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [bookmarkOnly, setBookmarkOnly] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<FilteredRssItem | null>(null);
  const annotations = useArticleStore((s) => s.annotations);

  const sortedNews = (() => {
    switch (sortBy) {
      case 'date': return sortByDate(news);
      case 'track': return sortByTrack(news);
      case 'keywordCount': return sortByKeywordCount(news);
      default: return sortByRelevance(news);
    }
  })();

  const displayedNews = useMemo(() => {
    let result = trackFilter ? sortedNews.filter((n) => n.track === trackFilter) : sortedNews;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((n) => n.title.toLowerCase().includes(q) || n.description.toLowerCase().includes(q));
    }
    if (bookmarkOnly) {
      result = result.filter((n) => annotations[n.id]?.isBookmarked);
    }
    return result;
  }, [sortedNews, trackFilter, searchQuery, bookmarkOnly, annotations]);

  const relatedArticles = useMemo(() => {
    if (!selectedArticle) return [];
    const selectedKeywords = new Set((selectedArticle.keywordCategories ?? []).map((k) => k.keyword));
    if (selectedKeywords.size === 0) return [];
    return news
      .filter((n) => n.id !== selectedArticle.id && (n.keywordCategories ?? []).some((k) => selectedKeywords.has(k.keyword)))
      .slice(0, 5);
  }, [selectedArticle, news]);

  const setOpportunityScores = useTrackingStore((s) => s.setOpportunityScores);
  const addScoreHistory = useTrackingStore((s) => s.addScoreHistory);
  const setTopNews = useTrackingStore((s) => s.setTopContributingNews);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const loadNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await fetchAllNews();
      const filtered = sortByRelevance(crossVerify(filterByKeywords(items)));
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
      addScoreHistory({ timestamp: new Date().toISOString(), total: scores.total, s1: scores.s1, s2: scores.s2, s3: scores.s3 });

      const topPolicy = sortByRelevance(filtered.filter((n) => n.track === 'policy')).slice(0, 3);
      const topInvestment = sortByRelevance(filtered.filter((n) => n.track === 'investment')).slice(0, 3);
      const topCompetitor = sortByRelevance(filtered.filter((n) => n.track === 'competitor')).slice(0, 3);
      setTopNews({
        policy: topPolicy.map((n) => ({ id: n.id, title: n.title, link: n.link })),
        investment: topInvestment.map((n) => ({ id: n.id, title: n.title, link: n.link })),
        competitor: topCompetitor.map((n) => ({ id: n.id, title: n.title, link: n.link })),
      });

      if (scoreResult.shouldAlert) {
        const toTrackNews = (items: FilteredRssItem[]) =>
          items.map((i) => ({ title: i.title, link: i.link }));
        const newsByTrack = {
          policy: toTrackNews(sortByRelevance(filtered.filter((n) => n.track === 'policy'))),
          investment: toTrackNews(sortByRelevance(filtered.filter((n) => n.track === 'investment'))),
          competitor: toTrackNews(sortByRelevance(filtered.filter((n) => n.track === 'competitor'))),
        };
        notifyOpportunityScore({ ...scores, newsByTrack }).catch(() => {});
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
    const interval = setInterval(loadNews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const q = (e as CustomEvent).detail;
      if (typeof q === 'string') setSearchQuery(q);
    };
    window.addEventListener('careradar:search', handler);
    return () => window.removeEventListener('careradar:search', handler);
  }, []);

  const policyCount = news.filter((n) => n.track === 'policy').length;

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
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#1a1f1a]/50 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
                  <Newspaper className="w-4 h-4 text-blue-500" />
                  Live News Feed
                  {trackFilter && (
                    <span className="text-xs font-normal text-emerald-600 dark:text-emerald-400">
                      — {TRACK_META[trackFilter].label}만 보기
                    </span>
                  )}
                  {!loading && (
                    <span className="text-xs font-normal lowercase text-gray-400">
                      ({displayedNews.length}{trackFilter || searchQuery || bookmarkOnly ? ` / ${news.length}` : ''} articles)
                    </span>
                  )}
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
                    onClick={() => setBookmarkOnly((v) => !v)}
                    className={`flex items-center gap-1 text-xs px-2 py-1.5 rounded border transition-colors ${bookmarkOnly ? 'border-amber-400 bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:border-amber-600 dark:text-amber-400' : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:text-amber-500'}`}
                    title="북마크만 보기"
                  >
                    {bookmarkOnly ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                  </button>
                  <div className="flex items-center gap-2">
                    {trackFilter && (
                      <button type="button" onClick={() => setTrackFilter(null)} className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline">
                        전체 보기
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowClassifyHelp((v) => !v)}
                      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      분류 기준
                      {showClassifyHelp ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
              {/* Track filter buttons */}
              <div className="flex items-center gap-2">
                {(['caretech', 'investment', 'competitor', 'policy'] as const).map((track) => {
                  const isActive = trackFilter === track;
                  const count = news.filter((n) => n.track === track).length;
                  return (
                    <button
                      key={track}
                      type="button"
                      onClick={() => setTrackFilter(isActive ? null : track)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                        isActive
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-500 dark:text-emerald-400 ring-1 ring-emerald-500/30'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-emerald-300 hover:text-emerald-600 dark:hover:border-emerald-700 dark:hover:text-emerald-400'
                      }`}
                    >
                      {TRACK_META[track].label}
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
              {/* Search bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="기사 검색 (예: 돌봄 AI, 장애인복지법)"
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#0a0f0a] text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none placeholder:text-gray-400"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600">
                    초기화
                  </button>
                )}
              </div>
            </div>

            {showClassifyHelp && (
              <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-[#0a0f0a]/80 text-xs space-y-4">
                <div>
                  <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-2">Track (소스 기반)</h4>
                  <p className="text-gray-500 dark:text-gray-400 mb-2">RSS 피드 출처에 따라 분류됩니다.</p>
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
                  <p className="text-gray-500 dark:text-gray-400 mb-2">제목·요약에 키워드가 포함된 경우 표시됩니다.</p>
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

              {!loading && displayedNews.length === 0 && news.length > 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <Search className="w-8 h-8 mb-3 opacity-30" />
                  <p className="text-sm">검색 결과가 없습니다</p>
                  <button onClick={() => { setSearchQuery(''); setBookmarkOnly(false); setTrackFilter(null); }} className="text-xs text-blue-500 underline mt-2">필터 초기화</button>
                </div>
              )}

              {displayedNews.map((item) => {
                const trackMeta = TRACK_META[item.track];
                const keywordTags = (item.keywordCategories ?? []).slice(0, 5);
                const extraCount = (item.keywordCategories?.length ?? 0) - 5;
                const itemAnn = annotations[item.id];
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedArticle(item)}
                    className="w-full flex items-start gap-4 p-4 border-b border-gray-50 dark:border-gray-800/60 last:border-0 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                          {item.source}
                        </span>
                        <span
                          className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                          title={trackMeta.tooltip}
                        >
                          {trackMeta.label}
                        </span>
                        <span className="text-[11px] text-gray-400">{item.timeAgo}</span>
                        {itemAnn?.isBookmarked && <BookmarkCheck className="w-3 h-3 text-amber-500" />}
                        {(itemAnn?.rating ?? 0) > 0 && (
                          <span className="flex items-center">
                            {Array.from({ length: itemAnn!.rating }, (_, i) => (
                              <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                            ))}
                          </span>
                        )}
                      </div>
                      {keywordTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1.5">
                          {keywordTags.map((m, i) => (
                            <span
                              key={`${m.keyword}-${i}`}
                              className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-400"
                            >
                              [{KEYWORD_CATEGORY_LABELS[m.category]}] {m.keyword}
                            </span>
                          ))}
                          {extraCount > 0 && <span className="text-[9px] text-gray-400">+{extraCount}개</span>}
                        </div>
                      )}
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                        {searchQuery ? highlightText(item.title, searchQuery) : item.title}
                      </h3>
                      {item.description && (
                        <p className="text-xs text-gray-500 line-clamp-2">
                          {searchQuery ? highlightText(item.description, searchQuery) : item.description}
                        </p>
                      )}
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-blue-500 mt-1 flex-shrink-0 transition-colors" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column — Score + Actions */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <OpportunityGauge />

          <Link
            href="/study"
            className="block bg-gradient-to-r from-blue-600 to-emerald-500 text-white p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow"
          >
            <h3 className="font-bold text-lg mb-1">📖 Study Session 시작하기</h3>
            <p className="text-sm text-white/80">뉴스에서 발견한 인사이트를 5단계 학습 루프로 분석하세요.</p>
          </Link>

          {/* 공공 조달 트래커 */}
          <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-[#1a1f1a]/50">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-500" />
                <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  공공 조달 트래커
                </h2>
              </div>
              {policyCount > 0 && procurement.length === 0 && !loading && (
                <span className="text-[10px] text-gray-400">정책 트랙 {policyCount}건 분석 중 적합 공고 없음</span>
              )}
            </div>
            <div className="max-h-48 overflow-y-auto">
              {procurement.length === 0 && !loading && (
                <div className="p-4 text-xs text-gray-400 space-y-1">
                  <p>조달 적합도 high/medium 뉴스가 없습니다.</p>
                  {policyCount > 0 && (
                    <p className="text-[10px]">정책/조달 트랙 뉴스 {policyCount}건이 있지만, 현재 적합도 기준(AI 돌봄, 행동분석 등)에 부합하지 않습니다.</p>
                  )}
                </div>
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
                const count = news.filter((n) => n.track === track).length;
                const isActive = trackFilter === track;
                return (
                  <div key={track} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{label}</span>
                    <button
                      type="button"
                      onClick={() => setTrackFilter(count > 0 ? (isActive ? null : track) : null)}
                      disabled={count === 0}
                      className={`font-bold text-xs px-2 py-0.5 rounded transition-colors ${
                        count > 0
                          ? isActive
                            ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-gray-900 ring-2 ring-emerald-400'
                            : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 cursor-pointer'
                          : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed'
                      }`}
                      title={count > 0 ? `${label} 기사만 보기` : '해당 트랙 기사 없음'}
                    >
                      {count}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {selectedArticle && (
        <ArticleDetailModal
          article={selectedArticle}
          relatedArticles={relatedArticles}
          onClose={() => setSelectedArticle(null)}
        />
      )}
    </div>
  );
}

function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-800/50 text-inherit rounded px-0.5">{part}</mark>
      : part
  );
}
