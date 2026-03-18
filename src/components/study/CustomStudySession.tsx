import SessionStepper from './SessionStepper';
import { useStudyStore } from '../../stores/studyStore';
import { useKnowledgeStore } from '../../stores/knowledgeStore';
import { ExternalLink } from 'lucide-react';

export default function CustomStudySession() {
  const currentSession = useStudyStore((s) => s.currentSession);
  const updateMyAnswer = useStudyStore((s) => s.updateMyAnswer);
  const updateInsight = useStudyStore((s) => s.updateInsight);
  const endSession = useStudyStore((s) => s.endSession);
  const addKnowledge = useKnowledgeStore((s) => s.addItem);

  const ctx = currentSession?.articleContext;
  const myAnswer = currentSession?.data.myAnswer ?? '';
  const insight = currentSession?.data.insight ?? '';

  const handleComplete = () => {
    if (insight.trim() && ctx) {
      addKnowledge({
        type: 'study_insight',
        title: ctx.title,
        content: insight,
        tags: ctx.keywords,
        sourceArticle: { title: ctx.title, link: ctx.link, track: ctx.track },
        sourceSession: { id: currentSession!.id, type: 'custom' },
      });
    }
    endSession();
  };

  return (
    <SessionStepper
      title={ctx?.title ?? '자유 주제 학습'}
      category="Custom Study"
      renderQuestion={() => (
        <div className="space-y-4">
          {ctx ? (
            <>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg">
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">{ctx.title}</h3>
                {ctx.description && <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{ctx.description}</p>}
                {ctx.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {ctx.keywords.map((kw, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-400">{kw}</span>
                    ))}
                  </div>
                )}
                <a href={ctx.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                  원문 보기 <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800 rounded-lg">
                <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200 mb-2">분석 질문</h4>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li>1. 이 뉴스가 케어테크 시장에 미치는 영향은?</li>
                  <li>2. CareVia/호시담 사업에 적용 가능한 인사이트는?</li>
                  <li>3. 경쟁사 대비 우리의 포지셔닝은 어떻게 달라지는가?</li>
                </ul>
              </div>
            </>
          ) : (
            <div className="p-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                자유 주제 학습 세션입니다. 아래 My Answer 단계에서 원하는 주제에 대해 직접 분석을 작성하세요.
              </p>
            </div>
          )}
        </div>
      )}
      renderMyAnswer={() => (
        <div className="space-y-3">
          <h3 className="font-bold text-gray-900 dark:text-white">나의 분석</h3>
          <p className="text-sm text-gray-500">위 뉴스/주제에 대한 자신의 분석을 작성하세요.</p>
          <textarea
            value={myAnswer}
            onChange={(e) => updateMyAnswer(e.target.value)}
            placeholder="이 뉴스의 핵심 시사점, 사업 적용 가능성, 예상 영향 등을 작성하세요..."
            className="w-full p-4 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#0a0f0a] text-gray-900 dark:text-gray-100 resize-none focus:ring-1 focus:ring-blue-500 outline-none min-h-[200px]"
          />
        </div>
      )}
      renderAiReference={() => (
        <div className="space-y-3">
          <h3 className="font-bold text-gray-900 dark:text-white">AI 참고 분석</h3>
          <div className="p-4 bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800 rounded-lg text-sm text-gray-700 dark:text-gray-300 space-y-3">
            {ctx ? (
              <>
                <p><strong>시장 맥락:</strong> {ctx.track === 'investment' ? '투자/펀딩 흐름 관점에서 분석 필요' : ctx.track === 'policy' ? '정책·제도 변화 관점에서 분석 필요' : ctx.track === 'competitor' ? '경쟁사 전략 변화 관점에서 분석 필요' : '케어테크 산업 전반 트렌드 관점에서 분석 필요'}</p>
                <p><strong>핵심 키워드:</strong> {ctx.keywords.length > 0 ? ctx.keywords.join(', ') : '매칭 키워드 없음'}</p>
                <p><strong>분석 프레임워크:</strong> 이 뉴스의 영향을 (1) 시장 기회, (2) 경쟁 구도, (3) 규제 환경, (4) 기술 트렌드 4가지 축으로 평가해 보세요.</p>
              </>
            ) : (
              <p>자유 주제 세션: AI 참고 분석 없이 자기 분석에 집중하는 세션입니다.</p>
            )}
          </div>
        </div>
      )}
      renderGapCheck={() => (
        <div className="space-y-3">
          <h3 className="font-bold text-gray-900 dark:text-white">Gap Check</h3>
          <p className="text-sm text-gray-500">나의 분석과 AI 참고 분석을 비교하여 놓친 관점이나 부족한 부분을 점검하세요.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
              <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-2">나의 분석 요약</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{myAnswer || '(아직 작성하지 않음)'}</p>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
              <h4 className="text-xs font-bold text-purple-600 dark:text-purple-400 mb-2">점검 포인트</h4>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <li>• 재무적 영향을 정량적으로 분석했는가?</li>
                <li>• 경쟁사 비교를 구체적으로 했는가?</li>
                <li>• 실행 가능한 액션 아이템이 있는가?</li>
                <li>• 리스크 요인을 고려했는가?</li>
              </ul>
            </div>
          </div>
        </div>
      )}
      renderInsight={() => (
        <div className="space-y-3">
          <h3 className="font-bold text-gray-900 dark:text-white">인사이트 정리</h3>
          <p className="text-sm text-gray-500">이 세션에서 얻은 핵심 인사이트를 정리하세요. Knowledge Base에 자동 저장됩니다.</p>
          <textarea
            value={insight}
            onChange={(e) => updateInsight(e.target.value)}
            placeholder="핵심 인사이트, 액션 아이템, 후속 학습 계획 등을 정리하세요..."
            className="w-full p-4 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#0a0f0a] text-gray-900 dark:text-gray-100 resize-none focus:ring-1 focus:ring-blue-500 outline-none min-h-[200px]"
          />
        </div>
      )}
      onComplete={handleComplete}
    />
  );
}
