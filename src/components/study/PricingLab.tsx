import { useEffect } from 'react';
import { useStudyStore } from '../../stores/studyStore';
import SessionStepper from './SessionStepper';

export default function PricingLab() {
  const startSession = useStudyStore(state => state.startSession);
  const currentSession = useStudyStore(state => state.currentSession);
  const updateMyAnswer = useStudyStore(state => state.updateMyAnswer);
  const updateInsight = useStudyStore(state => state.updateInsight);
  const endSession = useStudyStore(state => state.endSession);
  const myAnswer = currentSession?.data?.myAnswer ?? '';
  const insight = currentSession?.data?.insight ?? '';

  useEffect(() => {
    if (!currentSession) startSession('pricing');
  }, [currentSession, startSession]);

  if (!currentSession) return null;

  return (
    <SessionStepper
      title="조달 가격 설계: AI 돌봄 시스템 입찰 전략"
      category="Pricing Lab"
      renderQuestion={() => (
        <div className="space-y-5">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Q. 다음 조달 공고에 대한 가격 전략을 수립하세요.</h3>
          <div className="bg-gray-100 dark:bg-gray-800 p-5 rounded-lg text-sm space-y-3">
            <p className="font-medium text-gray-700 dark:text-gray-300">📋 [공고] 2026년 발달장애인 AI 맞춤형 교육 시스템 구축</p>
            <div className="mt-3 space-y-1.5 text-gray-600 dark:text-gray-400">
              <p>• 발주기관: 한국지능정보사회진흥원 (NIA)</p>
              <p>• 예정가격: 15억 원</p>
              <p>• 기초금액 산정: 4개사 가격 조사서 기반</p>
              <p>• 평가방식: 기술평가 70점 + 가격평가 30점</p>
              <p>• 납품기한: 12개월 (2027년 3월)</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 italic">가격 설계 시 고려해야 할 핵심 변수와 전략을 다음 단계에서 작성하세요.</p>
        </div>
      )}
      renderMyAnswer={() => (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">가격 전략 제안</h3>
          <p className="text-sm text-gray-500">기술평가 70점 + 가격평가 30점 구조에서 최적의 입찰 전략은?</p>
          <textarea 
            value={myAnswer}
            onChange={(e) => updateMyAnswer(e.target.value)}
            className="w-full h-48 p-4 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1f1a] rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm resize-none"
            placeholder="예: 기술평가 비중이 70%로 높으므로, 가격을 예정가 대비 95%로 설정하고..."
          />
          <p className="text-xs text-gray-400">{myAnswer.length}자 작성됨</p>
        </div>
      )}
      renderAiReference={() => (
        <div className="space-y-4">
          <h3 className="text-lg font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">AI 입찰 전략 가이드</h3>
          <div className="p-5 border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg text-sm leading-relaxed text-gray-800 dark:text-gray-200 space-y-3">
            <p><strong>핵심 전략:</strong> 기술평가 비중이 70%로 매우 높습니다. "가격으로 이기는 게임"이 아닙니다. 예정가 대비 88~92% 수준으로 입찰하되 기술제안서에 전력을 쏟으세요.</p>
            <p><strong>차별화 포인트:</strong> "AI 행동 데이터 자동 수집 → 교사 리포트 생성"은 경쟁사가 갖추지 못한 기능입니다. 이것을 기술 제안서 첫 페이지에 배치하세요.</p>
            <p><strong>가격 설계:</strong> 인건비(12명×12개월) 약 10.8억, SW 라이선스 2억, 인프라/클라우드 1.5억, 관리비 0.7억 → 합계 약 15억 → 예정가 거의 맞춤, 투찰 88~90%.</p>
          </div>
        </div>
      )}
      renderGapCheck={() => (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">입찰 전략 점검</h3>
          {myAnswer ? (
            <ul className="space-y-3 text-sm">
              <li className="flex gap-3 p-3 rounded bg-red-50 dark:bg-red-900/15 text-red-800 dark:text-red-200">
                <span className="font-bold flex-shrink-0">❌</span>
                <span>"인건비 구조"를 언급하지 않았다면: B2G 입찰에서 인건비는 총 비용의 60~70%를 차지합니다. 이를 무시한 가격은 실현 불가능합니다.</span>
              </li>
              <li className="flex gap-3 p-3 rounded bg-emerald-50 dark:bg-emerald-900/15 text-emerald-800 dark:text-emerald-200">
                <span className="font-bold flex-shrink-0">✅</span>
                <span>기술평가 우위를 활용한 "적정 가격" 전략을 언급했다면 올바른 방향입니다.</span>
              </li>
            </ul>
          ) : (
            <div className="text-center py-10 text-gray-400 text-sm">이전 단계에서 답변을 작성해주세요.</div>
          )}
        </div>
      )}
      renderInsight={() => (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">💡 최종 인사이트</h3>
          <textarea 
            value={insight}
            onChange={(e) => updateInsight(e.target.value)}
            className="w-full h-40 p-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1a1f1a] rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm resize-none"
            placeholder="이 세션에서 배운 핵심을 정리하세요..."
          />
        </div>
      )}
      onComplete={() => { endSession(); alert('✅ Pricing Lab 세션 완료! Knowledge Base에 저장되었습니다.'); }}
    />
  );
}
