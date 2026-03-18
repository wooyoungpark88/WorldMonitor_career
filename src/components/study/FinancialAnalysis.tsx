import { useEffect } from 'react';
import { useStudyStore } from '../../stores/studyStore';
import SessionStepper from './SessionStepper';

export default function FinancialAnalysis() {
  const startSession = useStudyStore(state => state.startSession);
  const currentSession = useStudyStore(state => state.currentSession);
  const updateMyAnswer = useStudyStore(state => state.updateMyAnswer);
  const updateInsight = useStudyStore(state => state.updateInsight);
  const endSession = useStudyStore(state => state.endSession);
  const myAnswer = currentSession?.data?.myAnswer ?? '';
  const insight = currentSession?.data?.insight ?? '';
  
  useEffect(() => {
    if (!currentSession) startSession('financial');
  }, [currentSession, startSession]);

  if (!currentSession) return null;

  return (
    <SessionStepper
      title="재무제표 분석: CareVia 사업 환경 이해"
      category="Financial Analysis"
      renderQuestion={() => (
        <div className="space-y-5">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Q. 다음 재무 데이터를 보고 핵심 인사이트를 도출하세요.</h3>
          <div className="bg-gray-100 dark:bg-gray-800 p-5 rounded-lg text-sm space-y-3">
            <p className="font-medium text-gray-700 dark:text-gray-300">🏢 [비교 대상] 국내 기업 '우리아이들' (발달장애인 특수교육) — 2025년 사업보고서</p>
            <table className="w-full text-sm mt-3">
              <thead><tr className="border-b border-gray-300 dark:border-gray-700">
                <th className="text-left py-2 text-gray-600 dark:text-gray-400">항목</th>
                <th className="text-right py-2 text-gray-600 dark:text-gray-400">2024</th>
                <th className="text-right py-2 text-gray-600 dark:text-gray-400">2025</th>
              </tr></thead>
              <tbody className="text-gray-800 dark:text-gray-200">
                <tr className="border-b border-gray-200 dark:border-gray-800"><td className="py-2">매출액</td><td className="text-right">82억</td><td className="text-right">97억</td></tr>
                <tr className="border-b border-gray-200 dark:border-gray-800"><td className="py-2">영업이익</td><td className="text-right">-3.1억</td><td className="text-right">1.2억</td></tr>
                <tr className="border-b border-gray-200 dark:border-gray-800"><td className="py-2">R&D비</td><td className="text-right">4.0억</td><td className="text-right">7.5억</td></tr>
                <tr><td className="py-2">R&D 비중</td><td className="text-right">4.9%</td><td className="text-right">7.7%</td></tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">위 데이터를 바탕으로 다음 단계에서 당신의 분석을 작성하세요.</p>
        </div>
      )}
      renderMyAnswer={() => (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">나의 분석 작성</h3>
          <p className="text-sm text-gray-500">위 재무 데이터에서 어떤 전략적 인사이트를 읽을 수 있나요? 경쟁사 대비 CareVia의 포지셔닝은?</p>
          <textarea 
            value={myAnswer}
            onChange={(e) => updateMyAnswer(e.target.value)}
            className="w-full h-48 p-4 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1f1a] rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
            placeholder="예: R&D 비중이 4.9%→7.7%로 급증한 것은 특수교육 분야의 기술 개발 가속화를 의미합니다..."
          />
          <p className="text-xs text-gray-400">{myAnswer.length}자 작성됨</p>
        </div>
      )}
      renderAiReference={() => (
        <div className="space-y-4">
          <h3 className="text-lg font-bold bg-gradient-to-r from-blue-500 to-emerald-500 bg-clip-text text-transparent">AI 전문가 분석 리포트</h3>
          <div className="p-5 border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/10 rounded-lg text-sm leading-relaxed text-gray-800 dark:text-gray-200 space-y-3">
            <p><strong>핵심 분석:</strong> R&D 비중 7.7%는 일반 교육 서비스업 평균(1~3%) 대비 매우 공격적인 투자입니다. 이는 발달장애인 AI 맞춤형 솔루션에 대한 시장 확신을 의미합니다.</p>
            <p><strong>영업이익 턴어라운드:</strong> -3.1억 → +1.2억 의 흑자 전환은 규모의 경제(매출 18% 성장)와 정부 바우처 단가 인상 효과가 복합적으로 작용한 결과입니다.</p>
            <p><strong>CareVia 관점:</strong> 이 기업이 B2G 시장에서 빠르게 성장하고 있으므로, CareVia는 차별화를 위해 "AI 행동데이터 자동 기록"이라는 고유 기능을 전면에 내세워야 합니다.</p>
          </div>
        </div>
      )}
      renderGapCheck={() => (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">분석 격차(Gap) 검토</h3>
          {myAnswer ? (
            <div className="space-y-3">
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm font-bold text-amber-800 dark:text-amber-200 mb-1">🔍 당신이 작성한 주요 키워드</p>
                <p className="text-sm text-amber-700 dark:text-amber-300">{myAnswer.slice(0, 100)}...</p>
              </div>
              <ul className="space-y-3 text-sm">
                <li className="flex gap-3 p-3 rounded bg-red-50 dark:bg-red-900/15 text-red-800 dark:text-red-200">
                  <span className="font-bold flex-shrink-0">❌ 놓친 포인트:</span>
                  <span>정부 바우처 단가 인상이라는 매크로 요인을 언급했는지 확인하세요. 매출 성장의 상당 부분은 자체 역량이 아닌 정책 변화에 기인합니다.</span>
                </li>
                <li className="flex gap-3 p-3 rounded bg-emerald-50 dark:bg-emerald-900/15 text-emerald-800 dark:text-emerald-200">
                  <span className="font-bold flex-shrink-0">✅ 좋은 포인트:</span>
                  <span>R&D 비중 증가를 포착했다면, AI 기반 교육 솔루션에 대한 투자 트렌드를 잘 읽은 것입니다.</span>
                </li>
              </ul>
            </div>
          ) : (
            <div className="text-center py-10 text-gray-400">
              <p className="text-sm">이전 단계에서 분석을 작성하지 않아 Gap 분석을 생성할 수 없습니다.</p>
              <p className="text-xs mt-1">뒤로 가서 "나의 분석"을 작성해주세요.</p>
            </div>
          )}
        </div>
      )}
      renderInsight={() => (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">💡 최종 인사이트 정리</h3>
          <p className="text-sm text-gray-500">AI 분석과 Gap Check를 종합해서, 실제로 업무에 적용할 수 있는 핵심 인사이트를 정리하세요.</p>
          <textarea 
            value={insight}
            onChange={(e) => updateInsight(e.target.value)}
            className="w-full h-40 p-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1a1f1a] rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm resize-none"
            placeholder="예: CareVia가 이 시장에서 차별화하려면..."
          />
          <p className="text-xs text-gray-400">{insight.length}자 작성됨 — Complete Session을 누르면 Knowledge Base에 저장됩니다.</p>
        </div>
      )}
      onComplete={() => {
        endSession();
        alert('✅ 세션이 완료되어 Knowledge Base에 저장되었습니다!');
      }}
    />
  );
}
