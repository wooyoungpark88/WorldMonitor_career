import SessionStepper from './SessionStepper';
import { useStudyStore } from '../../stores/studyStore';
import { useKnowledgeStore } from '../../stores/knowledgeStore';

export default function CompetitorBenchmark() {
  const updateMyAnswer = useStudyStore((s) => s.updateMyAnswer);
  const updateInsight = useStudyStore((s) => s.updateInsight);
  const endSession = useStudyStore((s) => s.endSession);
  const currentSession = useStudyStore((s) => s.currentSession);
  const addKnowledge = useKnowledgeStore((s) => s.addItem);

  const myAnswer = currentSession?.data.myAnswer ?? '';
  const insight = currentSession?.data.insight ?? '';

  const handleComplete = () => {
    if (insight.trim()) {
      addKnowledge({
        type: 'study_insight',
        title: '경쟁사/기술 벤치마킹 세션',
        content: insight,
        tags: ['경쟁사', '벤치마킹', '기술 트렌드'],
        sourceSession: { id: currentSession!.id, type: 'benchmark' },
      });
    }
    endSession();
  };

  return (
    <SessionStepper
      title="경쟁사/기술 벤치마킹"
      category="Competitor Benchmark"
      renderQuestion={() => (
        <div className="space-y-4">
          <div className="p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800 rounded-lg">
            <h3 className="font-bold text-gray-900 dark:text-white mb-3">벤치마킹 프레임워크</h3>
            <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
              <li><strong>1. 경쟁사 맵핑:</strong> 국내외 주요 케어테크 경쟁사의 현황은?</li>
              <li><strong>2. 기술 비교:</strong> 경쟁사 대비 우리의 기술 우위/열위는?</li>
              <li><strong>3. BM 비교:</strong> 경쟁사의 수익 모델과 가격 전략은?</li>
              <li><strong>4. 시장 전략:</strong> 경쟁사의 시장 확장 전략과 차별화 포인트는?</li>
            </ul>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-lg text-xs text-gray-500">
            참고 경쟁사: Ambient.ai, Cogito, 닥터트루, 호시담, Woebot Health, Ginger.io
          </div>
        </div>
      )}
      renderMyAnswer={() => (
        <div className="space-y-3">
          <h3 className="font-bold text-gray-900 dark:text-white">나의 벤치마킹 분석</h3>
          <textarea
            value={myAnswer}
            onChange={(e) => updateMyAnswer(e.target.value)}
            placeholder="경쟁사 동향, 기술 비교, BM 차이점을 분석하세요..."
            className="w-full p-4 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#0a0f0a] text-gray-900 dark:text-gray-100 resize-none focus:ring-1 focus:ring-blue-500 outline-none min-h-[200px]"
          />
        </div>
      )}
      renderAiReference={() => (
        <div className="space-y-3">
          <h3 className="font-bold text-gray-900 dark:text-white">AI 벤치마킹 참고</h3>
          <div className="p-4 bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800 rounded-lg text-sm text-gray-700 dark:text-gray-300 space-y-3">
            <p><strong>벤치마킹 축:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>기술 성숙도:</strong> AI 모델 정확도, 데이터 파이프라인, 확장성</li>
              <li><strong>시장 침투율:</strong> 고객 수, 매출 규모, 성장률</li>
              <li><strong>자금 현황:</strong> 투자 유치 규모, 런웨이, 번율</li>
              <li><strong>팀 역량:</strong> 핵심 인력 구성, 도메인 전문성</li>
            </ul>
            <p><strong>분석 팁:</strong> 경쟁사의 공개 자료(IR, 보도자료, 특허)를 활용하여 객관적 비교를 수행하세요.</p>
          </div>
        </div>
      )}
      renderGapCheck={() => (
        <div className="space-y-3">
          <h3 className="font-bold text-gray-900 dark:text-white">Gap Check</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
              <h4 className="text-xs font-bold text-blue-600 mb-2">나의 분석</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{myAnswer || '(미작성)'}</p>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
              <h4 className="text-xs font-bold text-purple-600 mb-2">점검 항목</h4>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <li>• 정량적 비교 데이터를 포함했는가?</li>
                <li>• 해외 경쟁사도 포함했는가?</li>
                <li>• 차별화 전략이 구체적인가?</li>
                <li>• SWOT 분석을 적용했는가?</li>
              </ul>
            </div>
          </div>
        </div>
      )}
      renderInsight={() => (
        <div className="space-y-3">
          <h3 className="font-bold text-gray-900 dark:text-white">인사이트 정리</h3>
          <textarea
            value={insight}
            onChange={(e) => updateInsight(e.target.value)}
            placeholder="경쟁사 벤치마킹에서 도출한 핵심 인사이트를 정리하세요..."
            className="w-full p-4 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#0a0f0a] text-gray-900 dark:text-gray-100 resize-none focus:ring-1 focus:ring-blue-500 outline-none min-h-[200px]"
          />
        </div>
      )}
      onComplete={handleComplete}
    />
  );
}
