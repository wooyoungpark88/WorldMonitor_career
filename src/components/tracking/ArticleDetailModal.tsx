import { useState } from 'react';
import { X, ExternalLink, Bookmark, BookmarkCheck, Star, StickyNote, BookOpen } from 'lucide-react';
import { Link } from 'wouter';
import { useArticleStore } from '../../stores/articleStore';
import { useKnowledgeStore } from '../../stores/knowledgeStore';
import { KEYWORD_CATEGORY_LABELS, type FilteredRssItem } from '../../services/keywordFilter';
import { TRACK_META } from '../../config/trackConfig';
import { useStudyStore } from '../../stores/studyStore';

interface ArticleDetailModalProps {
  article: FilteredRssItem;
  relatedArticles: FilteredRssItem[];
  onClose: () => void;
}

export default function ArticleDetailModal({ article, relatedArticles, onClose }: ArticleDetailModalProps) {
  const { annotations, setMemo, toggleBookmark, setRating } = useArticleStore();
  const addKnowledge = useKnowledgeStore((s) => s.addItem);
  const startSession = useStudyStore((s) => s.startSession);
  const ann = annotations[article.id];
  const [memoText, setMemoText] = useState(ann?.memo ?? '');
  const [saved, setSaved] = useState(false);

  const trackMeta = TRACK_META[article.track];

  const handleSaveMemo = () => {
    setMemo(article.id, memoText);
    if (memoText.trim()) {
      addKnowledge({
        type: 'article_memo',
        title: article.title,
        content: memoText,
        tags: (article.keywordCategories ?? []).map((k) => k.keyword),
        sourceArticle: { title: article.title, link: article.link, track: article.track },
      });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleStartStudy = () => {
    (startSession as (type: string, ctx?: unknown) => void)('custom', {
      title: article.title,
      description: article.description,
      link: article.link,
      track: article.track,
      keywords: (article.keywordCategories ?? []).map((k) => k.keyword),
    });
    onClose();
    window.location.hash = '#/study';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                {article.source}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                {trackMeta.label}
              </span>
              <span className="text-[11px] text-gray-400">{article.timeAgo}</span>
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-snug">{article.title}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors flex-shrink-0">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Keywords */}
          {(article.keywordCategories ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {article.keywordCategories.map((m, i) => (
                <span key={`${m.keyword}-${i}`} className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-400">
                  [{KEYWORD_CATEGORY_LABELS[m.category]}] {m.keyword}
                </span>
              ))}
            </div>
          )}

          {/* Description / AI Summary */}
          {article.description && (
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">요약</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{article.description}</p>
            </div>
          )}

          {/* Bookmark + Rating */}
          <div className="flex items-center gap-4">
            <button onClick={() => toggleBookmark(article.id)} className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-amber-500 transition-colors">
              {ann?.isBookmarked ? <BookmarkCheck className="w-4 h-4 text-amber-500 fill-amber-500" /> : <Bookmark className="w-4 h-4" />}
              {ann?.isBookmarked ? '북마크됨' : '북마크'}
            </button>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500 mr-1">중요도</span>
              {[1, 2, 3].map((v) => (
                <button key={v} onClick={() => setRating(article.id, (ann?.rating === v) ? 0 : v)}>
                  <Star className={`w-4 h-4 transition-colors ${(ann?.rating ?? 0) >= v ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Memo */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <StickyNote className="w-3.5 h-3.5" /> 메모
            </h3>
            <textarea
              value={memoText}
              onChange={(e) => setMemoText(e.target.value)}
              placeholder="이 기사가 우리 사업/역량에 어떤 의미가 있는가?"
              className="w-full p-3 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-[#0a0f0a] text-gray-900 dark:text-gray-100 resize-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              rows={3}
            />
            <div className="flex items-center gap-2 mt-2">
              <button onClick={handleSaveMemo} className="px-3 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors">
                {saved ? '저장됨' : '메모 저장'}
              </button>
              {saved && <span className="text-xs text-emerald-500">Knowledge Base에 저장되었습니다</span>}
            </div>
          </div>

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">관련 기사</h3>
              <div className="space-y-2">
                {relatedArticles.map((r) => (
                  <a key={r.id} href={r.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">{TRACK_META[r.track].label}</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate group-hover:text-blue-600">{r.title}</span>
                    <ExternalLink className="w-3 h-3 text-gray-300 flex-shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3">
          <a href={article.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
            <ExternalLink className="w-4 h-4" /> 원문 보기
          </a>
          <Link href="/study" onClick={handleStartStudy} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            <BookOpen className="w-4 h-4" /> 이 기사로 Study 시작
          </Link>
        </div>
      </div>
    </div>
  );
}
