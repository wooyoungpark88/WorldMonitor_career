import { useState, useMemo } from 'react';
import { Brain, Trash2, Search, Plus, Tag, FileText, Download, X } from 'lucide-react';
import { useStudyStore } from '../../../stores/studyStore';
import { useKnowledgeStore, type KnowledgeItem } from '../../../stores/knowledgeStore';

const TYPE_LABELS: Record<string, string> = {
  financial: 'Financial Analysis',
  pricing: 'Pricing Lab',
  sroi: 'SROI Calculator',
  pitch: 'Pitch Deck',
  custom: 'Custom Study',
  regulation: 'Regulation Analysis',
  benchmark: 'Competitor Benchmark',
  study_insight: 'Study 인사이트',
  article_memo: '기사 메모',
  manual_note: '직접 메모',
};

const TYPE_COLORS: Record<string, string> = {
  financial: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  pricing: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  sroi: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  pitch: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  custom: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
  regulation: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  benchmark: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  study_insight: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  article_memo: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
  manual_note: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

type ViewFilter = 'all' | 'study' | 'article' | 'manual';

export default function KnowledgeBase() {
  const completedSessions = useStudyStore(state => state.completedSessions);
  const knowledgeItems = useKnowledgeStore(state => state.items);
  const addKnowledge = useKnowledgeStore(state => state.addItem);
  const removeKnowledge = useKnowledgeStore(state => state.removeItem);
  const clearAllKnowledge = useKnowledgeStore(state => state.clearAll);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [viewFilter, setViewFilter] = useState<ViewFilter>('all');
  const [showNewNote, setShowNewNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteTags, setNewNoteTags] = useState('');
  const [showReport, setShowReport] = useState(false);

  const allItems = useMemo(() => {
    const fromStudy: KnowledgeItem[] = completedSessions
      .filter((s) => s.data.insight?.trim())
      .map((s) => ({
        id: `study-${s.id}`,
        type: 'study_insight' as const,
        title: TYPE_LABELS[s.type] ?? s.type,
        content: s.data.insight,
        tags: [],
        sourceSession: { id: s.id, type: s.type },
        createdAt: s.completedAt,
      }));

    const alreadyLinkedIds = new Set(knowledgeItems.filter((k) => k.sourceSession?.id).map((k) => k.sourceSession!.id));
    const deduped = fromStudy.filter((s) => !alreadyLinkedIds.has(s.sourceSession!.id));

    return [...knowledgeItems, ...deduped].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [completedSessions, knowledgeItems]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    allItems.forEach((i) => i.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [allItems]);

  const filteredItems = useMemo(() => {
    let result = allItems;

    if (viewFilter === 'study') result = result.filter((i) => i.type === 'study_insight');
    else if (viewFilter === 'article') result = result.filter((i) => i.type === 'article_memo');
    else if (viewFilter === 'manual') result = result.filter((i) => i.type === 'manual_note');

    if (filterTag) result = result.filter((i) => i.tags.includes(filterTag));

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((i) =>
        i.title.toLowerCase().includes(q) ||
        i.content.toLowerCase().includes(q) ||
        i.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return result;
  }, [allItems, viewFilter, filterTag, searchQuery]);

  const handleAddNote = () => {
    if (!newNoteTitle.trim()) return;
    addKnowledge({
      type: 'manual_note',
      title: newNoteTitle,
      content: newNoteContent,
      tags: newNoteTags.split(',').map((t) => t.trim()).filter(Boolean),
    });
    setNewNoteTitle('');
    setNewNoteContent('');
    setNewNoteTags('');
    setShowNewNote(false);
  };

  const handleExport = (format: 'json' | 'csv') => {
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(filteredItems, null, 2)], { type: 'application/json' });
      downloadBlob(blob, 'careradar_knowledge.json');
    } else {
      const header = 'type,title,content,tags,createdAt\n';
      const rows = filteredItems.map((i) =>
        [i.type, `"${i.title.replace(/"/g, '""')}"`, `"${i.content.replace(/"/g, '""')}"`, `"${i.tags.join(';')}"`, i.createdAt].join(',')
      );
      const blob = new Blob([header + rows.join('\n')], { type: 'text/csv' });
      downloadBlob(blob, 'careradar_knowledge.csv');
    }
  };

  const monthlyReport = useMemo(() => {
    const now = new Date();
    const thisMonth = allItems.filter((i) => {
      const d = new Date(i.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const byType: Record<string, number> = {};
    thisMonth.forEach((i) => { byType[i.type] = (byType[i.type] ?? 0) + 1; });
    return { total: thisMonth.length, byType, topTags: getTopTags(thisMonth, 5) };
  }, [allItems]);

  const clearAll = () => {
    if (confirm('모든 지식 데이터를 삭제하시겠습니까?')) {
      localStorage.removeItem('careradar_sessions');
      useStudyStore.setState({ completedSessions: [] });
      clearAllKnowledge();
    }
  };

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          🧠 Knowledge Base
        </h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowReport((v) => !v)} className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:opacity-80">
            <FileText className="w-3 h-3" /> 월간 리포트
          </button>
          <button onClick={() => setShowNewNote(true)} className="flex items-center gap-1 text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-md hover:bg-emerald-700 transition-colors">
            <Plus className="w-3 h-3" /> 메모 추가
          </button>
          {allItems.length > 0 && (
            <button onClick={clearAll} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors">
              <Trash2 className="w-3 h-3" /> Clear All
            </button>
          )}
        </div>
      </div>

      {/* Monthly Report */}
      {showReport && (
        <div className="mb-6 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900 dark:text-white">{new Date().getMonth() + 1}월 학습 리포트</h3>
            <button onClick={() => setShowReport(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-3">
            <div className="text-center p-3 bg-white dark:bg-[#141414] rounded-lg">
              <div className="text-2xl font-black text-blue-600">{monthlyReport.total}</div>
              <div className="text-xs text-gray-500">총 인사이트</div>
            </div>
            <div className="text-center p-3 bg-white dark:bg-[#141414] rounded-lg">
              <div className="text-2xl font-black text-emerald-600">{Object.keys(monthlyReport.byType).length}</div>
              <div className="text-xs text-gray-500">활용 영역</div>
            </div>
            <div className="text-center p-3 bg-white dark:bg-[#141414] rounded-lg">
              <div className="text-2xl font-black text-purple-600">{monthlyReport.topTags.length}</div>
              <div className="text-xs text-gray-500">태그 수</div>
            </div>
          </div>
          {Object.keys(monthlyReport.byType).length > 0 && (
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              {Object.entries(monthlyReport.byType).map(([type, count]) => (
                <div key={type} className="flex justify-between">
                  <span>{TYPE_LABELS[type] ?? type}</span>
                  <span className="font-bold">{count}건</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* New Note Modal */}
      {showNewNote && (
        <div className="mb-6 bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">직접 메모 추가</h3>
            <button onClick={() => setShowNewNote(false)}><X className="w-4 h-4 text-gray-400" /></button>
          </div>
          <input
            type="text"
            value={newNoteTitle}
            onChange={(e) => setNewNoteTitle(e.target.value)}
            placeholder="제목"
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-[#0a0f0a] focus:ring-1 focus:ring-emerald-500 outline-none"
          />
          <textarea
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            placeholder="내용"
            rows={4}
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-[#0a0f0a] resize-none focus:ring-1 focus:ring-emerald-500 outline-none"
          />
          <input
            type="text"
            value={newNoteTags}
            onChange={(e) => setNewNoteTags(e.target.value)}
            placeholder="태그 (쉼표 구분)"
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-[#0a0f0a] focus:ring-1 focus:ring-emerald-500 outline-none"
          />
          <button onClick={handleAddNote} className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
            저장
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm flex-1 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#1a1f1a]/50 space-y-3">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Knowledge — {filteredItems.length} items
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => handleExport('json')} className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1 hover:opacity-80">
                <Download className="w-3 h-3" /> JSON
              </button>
              <button onClick={() => handleExport('csv')} className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1 hover:opacity-80">
                <Download className="w-3 h-3" /> CSV
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {(['all', 'study', 'article', 'manual'] as ViewFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setViewFilter(f)}
                className={`text-xs px-2.5 py-1 rounded-full transition-colors ${viewFilter === f ? 'bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'}`}
              >
                {f === 'all' ? '전체' : f === 'study' ? 'Study' : f === 'article' ? '기사 메모' : '직접 메모'}
              </button>
            ))}
            {filterTag && (
              <button onClick={() => setFilterTag(null)} className="text-xs text-gray-400 hover:text-gray-600 underline flex items-center gap-1">
                <Tag className="w-3 h-3" /> {filterTag} <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="제목, 내용, 태그 검색..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#0a0f0a] focus:ring-1 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Tag cloud */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {allTags.slice(0, 15).map((tag) => (
                <button
                  key={tag}
                  onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                  className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${filterTag === tag ? 'bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-emerald-50 hover:text-emerald-600'}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Brain className="w-12 h-12 mb-4 opacity-30" />
              <p className="text-sm font-medium mb-1">인사이트가 없습니다</p>
              <p className="text-xs">Study 세션 완료, 기사 메모 작성, 또는 직접 메모를 추가하세요.</p>
            </div>
          ) : (
            <div className="relative border-l-2 border-gray-100 dark:border-gray-800 ml-3 space-y-6">
              {filteredItems.map((item) => (
                <div key={item.id} className="relative pl-8">
                  <div className="absolute w-6 h-6 bg-blue-50 dark:bg-blue-900/40 rounded-full border-4 border-white dark:border-[#141414] -left-[13px] flex items-center justify-center">
                    <Brain className="w-3 h-3 text-blue-500" />
                  </div>
                  
                  <div className="mb-2 flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                    <span className="font-bold text-gray-900 dark:text-gray-300">
                      {new Date(item.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${TYPE_COLORS[item.type] || 'bg-gray-100 text-gray-600'}`}>
                      {TYPE_LABELS[item.type] || item.type}
                    </span>
                    {item.sourceArticle && (
                      <a href={item.sourceArticle.link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-[10px]">
                        원문
                      </a>
                    )}
                    {item.type !== 'study_insight' && (
                      <button onClick={() => removeKnowledge(item.id)} className="text-gray-300 hover:text-red-400 transition-colors ml-auto">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  
                  <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-gray-800/60">
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-1">{item.title}</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{item.content}</p>
                  </div>

                  {item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.tags.map((tag, i) => (
                        <button
                          key={i}
                          onClick={() => setFilterTag(tag)}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-400 hover:bg-emerald-100 transition-colors"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function getTopTags(items: KnowledgeItem[], limit: number): string[] {
  const counts: Record<string, number> = {};
  items.forEach((i) => i.tags.forEach((t) => { counts[t] = (counts[t] ?? 0) + 1; }));
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag]) => tag);
}
