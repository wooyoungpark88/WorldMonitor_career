import { Brain, ArrowRight, Trash2 } from 'lucide-react';
import { useStudyStore, type CompletedSession } from '../../../stores/studyStore';

const TYPE_LABELS: Record<string, string> = {
  financial: 'Financial Analysis',
  pricing: 'Pricing Lab',
  sroi: 'SROI Calculator',
  pitch: 'Pitch Deck',
};

const TYPE_COLORS: Record<string, string> = {
  financial: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  pricing: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  sroi: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  pitch: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
};

export default function KnowledgeBase() {
  const completedSessions = useStudyStore(state => state.completedSessions);

  const clearAll = () => {
    if (confirm('모든 세션 기록을 삭제하시겠습니까?')) {
      localStorage.removeItem('careradar_sessions');
      useStudyStore.setState({ completedSessions: [] });
    }
  };

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          🧠 Knowledge Base
        </h1>
        {completedSessions.length > 0 && (
          <button onClick={clearAll} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors">
            <Trash2 className="w-3 h-3" /> Clear All
          </button>
        )}
      </div>
      
      <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm flex-1 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-[#1a1f1a]/50">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Timeline — {completedSessions.length} sessions
          </span>
          <button className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1 hover:opacity-80">
            Export <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {completedSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Brain className="w-12 h-12 mb-4 opacity-30" />
              <p className="text-sm font-medium mb-1">아직 완료된 세션이 없습니다</p>
              <p className="text-xs">Study 탭에서 세션을 완료하면 인사이트가 여기에 축적됩니다.</p>
            </div>
          ) : (
            <div className="relative border-l-2 border-gray-100 dark:border-gray-800 ml-3 space-y-8">
              {[...completedSessions].reverse().map((session: CompletedSession) => (
                <div key={session.id} className="relative pl-8">
                  <div className="absolute w-6 h-6 bg-blue-50 dark:bg-blue-900/40 rounded-full border-4 border-white dark:border-[#141414] -left-[13px] flex items-center justify-center">
                    <Brain className="w-3 h-3 text-blue-500" />
                  </div>
                  
                  <div className="mb-2 flex items-center gap-3 text-xs text-gray-500">
                    <span className="font-bold text-gray-900 dark:text-gray-300">
                      {new Date(session.completedAt).toLocaleDateString('ko-KR')}
                    </span>
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${TYPE_COLORS[session.type] || 'bg-gray-100 text-gray-600'}`}>
                      {TYPE_LABELS[session.type] || session.type}
                    </span>
                  </div>
                  
                  {session.data.insight ? (
                    <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-gray-800/60">
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{session.data.insight}</p>
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-gray-800/60">
                      <p className="text-sm text-gray-400 italic">인사이트가 작성되지 않은 세션입니다.</p>
                    </div>
                  )}

                  {session.data.myAnswer && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300">나의 답변 보기</summary>
                      <div className="mt-2 p-3 bg-gray-50 dark:bg-white/3 rounded text-xs text-gray-500 whitespace-pre-wrap">{session.data.myAnswer}</div>
                    </details>
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
