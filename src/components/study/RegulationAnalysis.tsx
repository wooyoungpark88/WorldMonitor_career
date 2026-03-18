import SessionStepper from './SessionStepper';
import { useStudyStore } from '../../stores/studyStore';
import { useKnowledgeStore } from '../../stores/knowledgeStore';

export default function RegulationAnalysis() {
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
        title: '규제 동향 분석 세션',
        content: insight,
        tags: ['규제', '정책', '케어테크'],
        sourceSession: { id: currentSession!.id, type: 'regulation' },
      });
    }
    endSession();
  };

  return (
    <SessionStepper
      title="규제 동향 분석"
      category="Regulation Analysis"
      renderQuestion={() => (
        <div className="space-y-4">
          <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800 rounded-lg">
            <h3 className="font-bold text-gray-900 dark:text-white mb-3">규제 분석 프레임워크</h3>
            <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
              <li><strong>1. 규제 환경 파악:</strong> 케어테크 관련 최신 법률·제도 변화는?</li>
              <li><strong>2. 영향 분석:</strong> 이 규제 변화가 CareVia 사업에 미치는 직접적 영향은?</li>
              <li><strong>3. 기회/위협:</strong> 규제 변화에서 발생하는 사업 기회와 리스크는?</li>
              <li><strong>4. 대응 전략:</strong> 규제 변화에 선제적으로 대응하기 위한 전략은?</li>
            </ul>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-lg text-xs text-gray-500">
            주요 관련 법규: 장애인복지법, 정신건강복지법, 디지털치료기기 수가제, CSAP, 소프트웨어진흥법
          </div>
        </div>
      )}
      renderMyAnswer={() => (
        <div className="space-y-3">
          <h3 className="font-bold text-gray-900 dark:text-white">나의 규제 분석</h3>
          <textarea
            value={myAnswer}
            onChange={(e) => updateMyAnswer(e.target.value)}
            placeholder="현재 케어테크 관련 규제 환경 변화와 그 영향을 분석하세요..."
            className="w-full p-4 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#0a0f0a] text-gray-900 dark:text-gray-100 resize-none focus:ring-1 focus:ring-blue-500 outline-none min-h-[200px]"
          />
        </div>
      )}
      renderAiReference={() => (
        <div className="space-y-3">
          <h3 className="font-bold text-gray-900 dark:text-white">AI 규제 분석 참고</h3>
          <div className="p-4 bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800 rounded-lg text-sm text-gray-700 dark:text-gray-300 space-y-3">
            <p><strong>주요 규제 트렌드:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>디지털치료기기 수가 체계 도입으로 B2G 시장 확대 가능성</li>
              <li>AI 돌봄 시스템 인증 기준 강화 → 진입 장벽 상승</li>
              <li>개인정보보호법 개정으로 영상 데이터 처리 기준 변경</li>
              <li>장애인 돌봄 의무 강화에 따른 지자체 예산 확대</li>
            </ul>
            <p><strong>분석 팁:</strong> 규제 변화의 시행 시기와 실무 적용까지의 갭을 파악하는 것이 핵심입니다.</p>
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
                <li>• 구체적인 법률/조항을 언급했는가?</li>
                <li>• 시행 일정과 대응 타임라인을 설정했는가?</li>
                <li>• 경쟁사의 규제 대응 전략을 비교했는가?</li>
                <li>• 실행 가능한 액션 아이템이 있는가?</li>
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
            placeholder="규제 분석에서 도출한 핵심 인사이트와 대응 전략을 정리하세요..."
            className="w-full p-4 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#0a0f0a] text-gray-900 dark:text-gray-100 resize-none focus:ring-1 focus:ring-blue-500 outline-none min-h-[200px]"
          />
        </div>
      )}
      onComplete={handleComplete}
    />
  );
}
