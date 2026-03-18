import { useEffect } from 'react';
import { useStudyStore } from '../../stores/studyStore';
import SessionStepper from './SessionStepper';

export default function SROICalculator() {
  const startSession = useStudyStore(state => state.startSession);
  const currentSession = useStudyStore(state => state.currentSession);
  const updateMyAnswer = useStudyStore(state => state.updateMyAnswer);
  const updateInsight = useStudyStore(state => state.updateInsight);
  const endSession = useStudyStore(state => state.endSession);
  const myAnswer = currentSession?.data?.myAnswer ?? '';
  const insight = currentSession?.data?.insight ?? '';

  useEffect(() => {
    if (!currentSession) startSession('sroi');
  }, [currentSession, startSession]);

  if (!currentSession) return null;

  return (
    <SessionStepper
      title="SROI 산출: 발달장애인 교사 번아웃 절감"
      category="SROI Calculator"
      renderQuestion={() => (
        <div className="space-y-5">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Q. 아래 시나리오의 SROI를 추정하세요.</h3>
          <div className="bg-gray-100 dark:bg-gray-800 p-5 rounded-lg text-sm space-y-3">
            <p className="font-medium text-gray-700 dark:text-gray-300">📊 [시나리오] CareVia AI 도구 도입 전/후</p>
            <div className="space-y-1.5 mt-3 text-gray-600 dark:text-gray-400">
              <p>• 대상: 서울 소재 특수학교 A (교사 30명)</p>
              <p>• 도입 전(2025): 교사 이직률 25%, 신규 교사 충원 비용 인당 850만원, 평균 온보딩 3.5개월</p>
              <p>• 도입 후(2026 목표): 이직률 12%로 감소, AI 기록 자동화로 교사 행정 시간 40% 절감</p>
              <p>• CareVia 도입 비용: 연 4,500만 원</p>
            </div>
          </div>
        </div>
      )}
      renderMyAnswer={() => (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">SROI 산출 시도</h3>
          <p className="text-sm text-gray-500">이직률 감소로 인한 비용 절감액, 행정시간 절감의 금전적 가치를 추정하고 투자 대비 수익률을 계산하세요.</p>
          <textarea 
            value={myAnswer}
            onChange={(e) => updateMyAnswer(e.target.value)}
            className="w-full h-48 p-4 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1f1a] rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm resize-none"
            placeholder="예: 이직률 25%→12%, 감소분 13% × 30명 = 3.9명. 충원비용 3.9 × 850만원 = 약 3,315만원 절감..."
          />
          <p className="text-xs text-gray-400">{myAnswer.length}자 작성됨</p>
        </div>
      )}
      renderAiReference={() => (
        <div className="space-y-4">
          <h3 className="text-lg font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">AI SROI 분석 리포트</h3>
          <div className="p-5 border border-purple-200 dark:border-purple-900/50 bg-purple-50 dark:bg-purple-900/10 rounded-lg text-sm leading-relaxed text-gray-800 dark:text-gray-200 space-y-3">
            <p><strong>직접 절감액:</strong></p>
            <p>• 이직률 감소: (25%-12%) × 30명 = 3.9명 → 3.9 × 850만원 = <strong>3,315만원/년</strong></p>
            <p>• 온보딩 비용 절감: 3.9명 × 3.5개월 × 인건비프록시(350만/월) = <strong>4,778만원/년</strong></p>
            <p><strong>간접 가치:</strong></p>
            <p>• 행정시간 40% 절감: 30명 × 월 20시간 × 12개월 × 시급(2.5만원) × 40% = <strong>7,200만원/년</strong></p>
            <p><strong>총 산출 가치: 약 1.53억원/년</strong></p>
            <p><strong>SROI = 1.53억 / 4,500만 = <span className="text-purple-600 dark:text-purple-400 font-bold">3.4:1</span></strong></p>
          </div>
        </div>
      )}
      renderGapCheck={() => (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">산출 격차 점검</h3>
          {myAnswer ? (
            <ul className="space-y-3 text-sm">
              <li className="flex gap-3 p-3 rounded bg-red-50 dark:bg-red-900/15 text-red-800 dark:text-red-200">
                <span className="font-bold flex-shrink-0">❌</span>
                <span>"온보딩 비용"을 누락했다면: 신규 교사는 평균 3.5개월간 낮은 생산성을 보이며, 이 기간의 인건비가 사실상 매몰 비용입니다.</span>
              </li>
              <li className="flex gap-3 p-3 rounded bg-emerald-50 dark:bg-emerald-900/15 text-emerald-800 dark:text-emerald-200">
                <span className="font-bold flex-shrink-0">✅</span>
                <span>행정시간 절감의 금전적 환산을 시도했다면 SROI 분석의 핵심을 이해한 것입니다.</span>
              </li>
            </ul>
          ) : (
            <div className="text-center py-10 text-gray-400 text-sm">이전 단계에서 답변을 작성해주세요.</div>
          )}
        </div>
      )}
      renderInsight={() => (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">💡 SROI 인사이트</h3>
          <textarea 
            value={insight}
            onChange={(e) => updateInsight(e.target.value)}
            className="w-full h-40 p-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1a1f1a] rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm resize-none"
            placeholder="SROI 3.4:1이 영업에 어떻게 활용될 수 있는지..."
          />
        </div>
      )}
      onComplete={() => { endSession(); alert('✅ SROI 세션 완료! Knowledge Base에 저장되었습니다.'); }}
    />
  );
}
