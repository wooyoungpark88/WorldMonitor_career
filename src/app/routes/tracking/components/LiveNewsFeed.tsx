import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { newsArticles, categoryFilters, NewsArticle } from '../../../../mocks/newsData';

type VisionStatFilter = 'all' | 'high-impact' | 'procurement';

const typeColorMap: Record<string, string> = {
  policy: 'bg-teal-50 text-teal-600',
  investment: 'bg-amber-50 text-amber-600',
  competitor: 'bg-orange-50 text-orange-600',
  procurement: 'bg-green-50 text-green-600',
};

// ── Impact Bar ─────────────────────────────────────────────────────────────
const IMPACT_COLOR = {
  high: { bar: 'bg-emerald-400', text: 'text-emerald-600', label: 'bg-emerald-50 text-emerald-600' },
  medium: { bar: 'bg-amber-400', text: 'text-amber-600', label: 'bg-amber-50 text-amber-600' },
  low: { bar: 'bg-gray-300', text: 'text-gray-400', label: 'bg-gray-100 text-gray-400' },
};

const ImpactBar = ({
  score,
  level,
}: {
  score: number;
  level: 'high' | 'medium' | 'low';
}) => {
  const c = IMPACT_COLOR[level];
  return (
    <div className="flex items-center gap-2 mt-1.5">
      <span className="text-[10px] font-semibold text-gray-300 uppercase tracking-wider shrink-0 w-10">
        Impact
      </span>
      <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${c.bar}`}
          style={{ width: `${score}%`, transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </div>
      <span className={`text-[10px] font-bold tabular-nums shrink-0 ${c.text}`}>{score}</span>
      <span
        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${c.label} uppercase tracking-wide`}
      >
        {level}
      </span>
    </div>
  );
};

const VISION_FILTER_META: Record<VisionStatFilter, { label: string; color: string; icon: string }> = {
  all: { label: '전체 기사 표시 중', color: 'text-[#2ec4a9]', icon: 'ri-radar-line' },
  'high-impact': { label: 'HIGH 임팩트 기사만 표시', color: 'text-emerald-500', icon: 'ri-focus-3-line' },
  procurement: { label: '정책/조달 기사만 표시', color: 'text-orange-500', icon: 'ri-alarm-line' },
};

interface SuggestionItem {
  text: string;
  type: '키워드' | '태그' | '출처';
  icon: string;
  color: string;
}

const TYPE_STYLE: Record<SuggestionItem['type'], { badge: string; icon: string; color: string }> = {
  키워드: { badge: 'bg-[#edfaf6] text-[#2ec4a9]', icon: 'ri-price-tag-3-line', color: 'text-[#2ec4a9]' },
  태그: { badge: 'bg-gray-100 text-gray-500', icon: 'ri-hashtag', color: 'text-gray-400' },
  출처: { badge: 'bg-amber-50 text-amber-600', icon: 'ri-newspaper-line', color: 'text-amber-500' },
};

// ── Highlight matching text ────────────────────────────────────────────────
const HighlightText = ({ text, query }: { text: string; query: string }) => {
  if (!query) return <span>{text}</span>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <span>{text}</span>;
  return (
    <>
      <span className="text-gray-600">{text.slice(0, idx)}</span>
      <span className="text-[#2ec4a9] font-bold">{text.slice(idx, idx + query.length)}</span>
      <span className="text-gray-600">{text.slice(idx + query.length)}</span>
    </>
  );
};

interface LiveNewsFeedProps {
  onArticleClick: (article: NewsArticle) => void;
  selectedArticleId: number | null;
  bookmarked: number[];
  onToggleBookmark: (id: number) => void;
  visionFilter?: VisionStatFilter | null;
  onClearVisionFilter?: () => void;
}

const LiveNewsFeed = ({
  onArticleClick,
  selectedArticleId,
  bookmarked,
  onToggleBookmark,
  visionFilter,
  onClearVisionFilter,
}: LiveNewsFeedProps) => {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [impactOnly, setImpactOnly] = useState(false);
  const [sortBy, setSortBy] = useState('관련도순');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [flashBanner, setFlashBanner] = useState(false);

  // Autocomplete states
  const [isFocused, setIsFocused] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const searchWrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sortOptions = ['관련도순', '최신순', '오래된순'];

  // ── Build suggestion pool ─────────────────────────────────────────────────
  const allSuggestions = useMemo<SuggestionItem[]>(() => {
    const items: SuggestionItem[] = [];
    const seen = new Set<string>();

    const add = (text: string, type: SuggestionItem['type']) => {
      const key = text.toLowerCase().trim();
      if (!seen.has(key) && text.trim().length > 1) {
        seen.add(key);
        const s = TYPE_STYLE[type];
        items.push({ text: text.trim(), type, icon: s.icon, color: s.color });
      }
    };

    newsArticles.forEach((a) => {
      a.analysis.relatedKeywords.forEach((kw) => add(kw, '키워드'));
    });
    newsArticles.forEach((a) => {
      a.tags.forEach((tag) => {
        const clean = tag.replace(/^\[.*?\]\s*/, '').trim();
        if (clean) add(clean, '태그');
      });
    });
    newsArticles.forEach((a) => add(a.source, '출처'));

    return items;
  }, []);

  // ── Hot tags (shown when focused with no query) ───────────────────────────
  const hotTags = useMemo(() => {
    const freq: Record<string, number> = {};
    newsArticles.forEach((a) => {
      a.analysis.relatedKeywords.forEach((kw) => {
        freq[kw] = (freq[kw] || 0) + 1;
      });
    });
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([text]) => text);
  }, []);

  // ── Filtered suggestions ──────────────────────────────────────────────────
  const suggestions = useMemo<SuggestionItem[]>(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const startsWith = allSuggestions.filter((s) => s.text.toLowerCase().startsWith(q));
    const contains = allSuggestions.filter(
      (s) => !s.text.toLowerCase().startsWith(q) && s.text.toLowerCase().includes(q)
    );
    return [...startsWith, ...contains].slice(0, 8);
  }, [allSuggestions, searchQuery]);

  const showDropdown = isFocused && (searchQuery.length === 0 || suggestions.length > 0);

  // Reset focused index when suggestions change
  useEffect(() => {
    setFocusedIndex(-1);
  }, [suggestions]);

  // ── Sync visionFilter ─────────────────────────────────────────────────────
  useEffect(() => {
    if (visionFilter === null || visionFilter === undefined) {
      setImpactOnly(false);
      return;
    }
    if (visionFilter === 'all') {
      setActiveFilter(null);
      setImpactOnly(false);
      setSearchQuery('');
    } else if (visionFilter === 'high-impact') {
      setActiveFilter(null);
      setImpactOnly(true);
      setSearchQuery('');
    } else if (visionFilter === 'procurement') {
      setActiveFilter('정책/조달');
      setImpactOnly(false);
      setSearchQuery('');
    }
    setFlashBanner(true);
    const t = setTimeout(() => setFlashBanner(false), 800);
    return () => clearTimeout(t);
  }, [visionFilter]);

  // ── Filtered articles ─────────────────────────────────────────────────────
  const filteredArticles = useMemo(() => {
    return newsArticles.filter((article) => {
      const matchesFilter = !activeFilter || article.category === activeFilter;
      const matchesImpact = !impactOnly || article.analysis.impactLevel === 'high';
      const matchesSearch =
        !searchQuery ||
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        article.analysis.relatedKeywords.some((kw) =>
          kw.toLowerCase().includes(searchQuery.toLowerCase())
        );
      return matchesFilter && matchesImpact && matchesSearch;
    });
  }, [activeFilter, impactOnly, searchQuery]);

  const hasVisionFilter = visionFilter !== null && visionFilter !== undefined;
  const showBanner = hasVisionFilter && visionFilter !== 'all';
  const bannerMeta = visionFilter ? VISION_FILTER_META[visionFilter] : null;

  // ── Select suggestion ─────────────────────────────────────────────────────
  const selectSuggestion = useCallback((text: string) => {
    setSearchQuery(text);
    setIsFocused(false);
    setFocusedIndex(-1);
    inputRef.current?.blur();
  }, []);

  // ── Keyboard navigation ───────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) return;

    const listLen = searchQuery.length === 0 ? hotTags.length : suggestions.length;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => Math.min(prev + 1, listLen - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedIndex >= 0) {
        const target =
          searchQuery.length === 0 ? hotTags[focusedIndex] : suggestions[focusedIndex]?.text;
        if (target) selectSuggestion(target);
      }
    } else if (e.key === 'Escape') {
      setIsFocused(false);
      setFocusedIndex(-1);
      inputRef.current?.blur();
    }
  };

  // ── Compute dropdown position ─────────────────────────────────────────────
  let dropTop = 0;
  let dropLeft = 0;
  let dropWidth = 300;
  if (showDropdown && searchWrapperRef.current) {
    const r = searchWrapperRef.current.getBoundingClientRect();
    dropTop = r.bottom + 4;
    dropLeft = r.left;
    dropWidth = r.width;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between border-b border-gray-100 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-5 h-5 flex items-center justify-center shrink-0">
            <i className="ri-newspaper-line text-gray-600 text-base" />
          </span>
          <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">LIVE NEWS FEED</span>
          <span className="text-sm text-gray-400 font-normal hidden sm:inline">
            ({filteredArticles.length}/{newsArticles.length})
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="relative">
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 cursor-pointer whitespace-nowrap"
            >
              <span className="hidden sm:inline">{sortBy}</span>
              <span className="sm:hidden">정렬</span>
              <span className="w-4 h-4 flex items-center justify-center">
                <i className="ri-arrow-down-s-line text-sm" />
              </span>
            </button>
            {showSortDropdown && (
              <div
                className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-lg z-20 overflow-hidden"
                style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
              >
                {sortOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => { setSortBy(opt); setShowSortDropdown(false); }}
                    className={`block w-full text-left px-4 py-2.5 text-xs cursor-pointer whitespace-nowrap ${
                      sortBy === opt ? 'bg-[#e6faf6] text-[#2ec4a9]' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <i className="ri-bookmark-line text-gray-500 text-sm" />
          </button>
          <button className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 cursor-pointer whitespace-nowrap">
            <span className="w-4 h-4 flex items-center justify-center">
              <i className="ri-question-line text-sm" />
            </span>
            분류 기준
          </button>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="border-b border-gray-100">
        <div className="flex items-center gap-2 px-4 sm:px-5 py-3 overflow-x-auto scrollbar-none">
          {categoryFilters.map((cat) => (
            <button
              key={cat.key}
              onClick={() => {
                const next = activeFilter === cat.label ? null : cat.label;
                setActiveFilter(next);
                setImpactOnly(false);
                if (hasVisionFilter) onClearVisionFilter?.();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer whitespace-nowrap transition-colors flex-shrink-0 ${
                activeFilter === cat.label
                  ? 'bg-[#2ec4a9] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.label}
              <span className={`text-xs font-bold ${activeFilter === cat.label ? 'text-white' : 'text-gray-500'}`}>
                {cat.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Search + Autocomplete */}
      <div className="px-4 sm:px-5 py-3 border-b border-gray-100">
        <div
          ref={searchWrapperRef}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-150 ${
            isFocused
              ? 'bg-white border border-[#2ec4a9]/40 ring-2 ring-[#2ec4a9]/10'
              : 'bg-gray-50 border border-transparent'
          }`}
        >
          <span className="w-4 h-4 flex items-center justify-center shrink-0">
            <i className={`ri-search-line text-sm ${isFocused ? 'text-[#2ec4a9]' : 'text-gray-400'}`} />
          </span>
          <input
            ref={inputRef}
            type="text"
            placeholder="기사 검색 또는 태그 입력..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setFocusedIndex(-1); }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => { setIsFocused(false); setFocusedIndex(-1); }, 160)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none min-w-0"
          />
          {searchQuery ? (
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { setSearchQuery(''); inputRef.current?.focus(); }}
              className="w-4 h-4 flex items-center justify-center cursor-pointer shrink-0"
            >
              <i className="ri-close-line text-gray-400 text-sm" />
            </button>
          ) : (
            <span className="text-[10px] text-gray-300 hidden sm:block whitespace-nowrap">
              ↓ 태그 추천
            </span>
          )}
        </div>
      </div>

      {/* VisionBanner active filter banner */}
      {showBanner && bannerMeta && (
        <div
          className={`px-4 sm:px-5 py-2.5 flex items-center justify-between border-b transition-all duration-300 ${
            flashBanner ? 'bg-[#d6f5ec]' : 'bg-[#f0faf8]'
          } border-[#cef0e6]`}
        >
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 flex items-center justify-center">
              <i className={`${bannerMeta.icon} ${bannerMeta.color} text-xs`} />
            </span>
            <span className={`text-xs font-semibold ${bannerMeta.color}`}>{bannerMeta.label}</span>
            <span className="text-xs text-[#2ec4a9]/60">{filteredArticles.length}건</span>
          </div>
          <button
            onClick={() => { onClearVisionFilter?.(); setActiveFilter(null); setImpactOnly(false); }}
            className="flex items-center gap-1 text-[#2ec4a9]/60 hover:text-[#2ec4a9] cursor-pointer transition-colors text-xs"
          >
            <span className="w-4 h-4 flex items-center justify-center">
              <i className="ri-close-line text-sm" />
            </span>
            해제
          </button>
        </div>
      )}

      {/* Articles */}
      <div className="divide-y divide-gray-50">
        {filteredArticles.length === 0 ? (
          <div className="px-5 py-10 text-center text-gray-400 text-sm">검색 결과가 없습니다.</div>
        ) : (
          filteredArticles.map((article) => (
            <div
              key={article.id}
              onClick={() => onArticleClick(article)}
              className={`px-4 sm:px-5 py-4 transition-colors group cursor-pointer ${
                selectedArticleId === article.id
                  ? 'bg-[#f0faf8] border-l-2 border-[#2ec4a9]'
                  : 'hover:bg-gray-50 border-l-2 border-transparent'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColorMap[article.type]}`}>
                  {article.source}
                </span>
                <span className="text-xs text-gray-400 hidden sm:inline">{article.category}</span>
                <span className="text-xs text-gray-300">
                  {article.daysAgo === 0 ? '오늘' : article.daysAgo === 1 ? '1일 전' : `${article.daysAgo}일 전`}
                </span>
                {article.analysis.impactLevel === 'high' && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded font-bold">
                    HIGH
                  </span>
                )}
                <div className="ml-auto flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleBookmark(article.id); }}
                    className="w-7 h-7 flex items-center justify-center cursor-pointer"
                  >
                    <i className={`text-sm ${bookmarked.includes(article.id) ? 'ri-bookmark-fill text-[#2ec4a9]' : 'ri-bookmark-line text-gray-300 group-hover:text-gray-400'}`} />
                  </button>
                  <div className="w-6 h-6 flex items-center justify-center">
                    <i className={`ri-arrow-right-s-line text-base transition-colors ${selectedArticleId === article.id ? 'text-[#2ec4a9]' : 'text-gray-200 group-hover:text-gray-400'}`} />
                  </div>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 mb-1.5 flex-wrap">
                {article.tags.map((tag, i) => (
                  <span key={i} className="text-[11px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
              <p className={`text-sm font-semibold leading-snug mb-1 transition-colors ${selectedArticleId === article.id ? 'text-[#2ec4a9]' : 'text-gray-800'}`}>
                {article.title}
              </p>
              <p className="text-xs text-gray-400 leading-relaxed line-clamp-1">{article.preview}</p>
              <ImpactBar
                score={article.analysis.impactScore}
                level={article.analysis.impactLevel}
              />
            </div>
          ))
        )}
      </div>

      {/* ── Autocomplete Dropdown (position: fixed) ── */}
      {showDropdown && (
        <div
          style={{
            position: 'fixed',
            top: dropTop,
            left: dropLeft,
            width: dropWidth,
            zIndex: 9998,
            animation: 'metricPopupIn 0.12s ease-out',
          }}
          className="bg-white rounded-xl border border-gray-100 overflow-hidden"
          onMouseDown={(e) => e.preventDefault()}
        >
          {searchQuery.length === 0 ? (
            /* Hot Tags */
            <div className="p-3">
              <div className="flex items-center gap-1.5 mb-2.5 px-0.5">
                <span className="w-3.5 h-3.5 flex items-center justify-center">
                  <i className="ri-fire-line text-orange-400 text-xs" />
                </span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  인기 키워드
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {hotTags.map((tag, i) => (
                  <button
                    key={tag}
                    onClick={() => selectSuggestion(tag)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors whitespace-nowrap ${
                      focusedIndex === i
                        ? 'bg-[#2ec4a9] text-white'
                        : 'bg-[#edfaf6] text-[#2ec4a9] hover:bg-[#d6f5ec]'
                    }`}
                  >
                    # {tag}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-gray-300 mt-2.5 px-0.5">
                클릭하거나 키워드를 직접 입력하세요
              </p>
            </div>
          ) : (
            /* Filtered Suggestions */
            <div className="py-1.5">
              <div className="flex items-center justify-between px-3.5 pb-1.5 pt-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  추천 태그
                </span>
                <span className="text-[10px] text-gray-300">{suggestions.length}건</span>
              </div>
              {suggestions.map((s, i) => {
                const style = TYPE_STYLE[s.type];
                const isKeyFocused = focusedIndex === i;
                return (
                  <button
                    key={`${s.type}-${s.text}`}
                    onClick={() => selectSuggestion(s.text)}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-2 cursor-pointer transition-colors text-left ${
                      isKeyFocused ? 'bg-[#f0faf8]' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className={`w-4 h-4 flex items-center justify-center shrink-0 ${style.color}`}>
                      <i className={`${style.icon} text-xs`} />
                    </span>
                    <span className="flex-1 text-sm min-w-0 truncate">
                      <HighlightText text={s.text} query={searchQuery} />
                    </span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${style.badge}`}>
                      {s.type}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LiveNewsFeed;
