import { useEffect } from 'react';
import { useStudyStore } from '../../stores/studyStore';
import SessionStepper from './SessionStepper';

export default function PitchDeck() {
  const startSession = useStudyStore(state => state.startSession);
  const currentSession = useStudyStore(state => state.currentSession);
  const updateMyAnswer = useStudyStore(state => state.updateMyAnswer);
  const updateInsight = useStudyStore(state => state.updateInsight);
  const endSession = useStudyStore(state => state.endSession);
  const myAnswer = currentSession?.data?.myAnswer ?? '';
  const insight = currentSession?.data?.insight ?? '';

  useEffect(() => {
    if (!currentSession) startSession('pitch');
  }, [currentSession, startSession]);

  if (!currentSession) return null;

  return (
    <SessionStepper
      title="Pitch Deck: CareVia Impact Story"
      category="Pitch & Field Story"
      renderQuestion={() => (
        <div className="space-y-5">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Q. 60초 오프닝 훅을 구성하세요.</h3>
          <div className="bg-gray-100 dark:bg-gray-800 p-5 rounded-lg text-sm text-gray-700 dark:text-gray-300 space-y-2">
            <p className="font-medium">🎤 [IR / Field Pitch 시나리오]</p>
            <p>당신은 AI 도구가 교사 업무를 늘릴 것이라고 회의적인 Tier 2 복지재단 이사장과 미팅 중입니다.</p>
            <p>이 반대 의견을 최대한 빨리 무력화하는 오프닝 훅을 작성하세요.</p>
          </div>
        </div>
      )}
      renderMyAnswer={() => (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">나의 스크립팅</h3>
          <textarea 
            value={myAnswer}
            onChange={(e) => updateMyAnswer(e.target.value)}
            className="w-full h-48 p-4 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1f1a] rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-sm resize-none"
            placeholder="이사장님, 저희는 교사에게 새 화면을 추가하려고 온 것이 아닙니다..."
          />
          <p className="text-xs text-gray-400">{myAnswer.length}자 작성됨</p>
        </div>
      )}
      renderAiReference={() => (
        <div className="space-y-4">
          <h3 className="text-lg font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">AI 피치 코치 분석</h3>
          <div className="p-5 border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/10 rounded-lg text-sm leading-relaxed text-gray-800 dark:text-gray-200 space-y-3">
            <p><strong>추천 훅:</strong> "이사장님, 저희는 교사에게 또 하나의 화면을 추가하려고 온 것이 아닙니다. <strong>클립보드를 없애러</strong> 왔습니다."</p>
            <p><strong>원리:</strong> '새로운 도구의 부담'이라는 반대 의견을 인정한 뒤, 핵심 가치를 '제거'로 프레이밍하면 이사장의 보호 본능과 즉시 정렬됩니다.</p>
            <p><strong>팔로업:</strong> 이후 실제 현장 사진을 보여주며 "이 클립보드가 교사 퇴직률 25%의 원인입니다"로 데이터 연결.</p>
          </div>
        </div>
      )}
      renderGapCheck={() => (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">스크립트 진단</h3>
          {myAnswer ? (
            <ul className="space-y-3 text-sm">
              <li className="flex gap-3 p-3 rounded bg-amber-50 dark:bg-amber-900/15 text-amber-800 dark:text-amber-200">
                <span className="font-bold flex-shrink-0">⚡</span>
                <span>방어적 톤으로 시작했다면: "AI가 쉽습니다"는 약한 시작입니다. 반대 의견을 리프레이밍해서 공격하세요.</span>
              </li>
              <li className="flex gap-3 p-3 rounded bg-emerald-50 dark:bg-emerald-900/15 text-emerald-800 dark:text-emerald-200">
                <span className="font-bold flex-shrink-0">✅</span>
                <span>"제거" 또는 "없앤다"는 키워드를 사용했다면 올바른 방향입니다.</span>
              </li>
            </ul>
          ) : (
            <div className="text-center py-10 text-gray-400 text-sm">이전 단계에서 스크립트를 작성해주세요.</div>
          )}
        </div>
      )}
      renderInsight={() => (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">💡 최종 스크립트</h3>
          <textarea 
            value={insight}
            onChange={(e) => updateInsight(e.target.value)}
            className="w-full h-40 p-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1a1f1a] rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-sm resize-none"
            placeholder="최종 정리한 60초 오프닝 훅..."
          />
        </div>
      )}
      onComplete={() => { endSession(); alert('✅ Pitch Deck 세션 완료! Knowledge Base에 저장되었습니다.'); }}
    />
  );
}
