import OpportunityGauge from '../../../components/tracking/OpportunityGauge';
import NewsClusterCard from '../../../components/tracking/NewsClusterCard';
import ProcurementRow from '../../../components/tracking/ProcurementRow';

export default function TrackingDashboard() {
  const mockNews = [
    {
      id: '1',
      title: '보건복지부, 2026년 발달장애인 지원 예산 15% 확충 계획 발표',
      source: '복지부 보도자료',
      time: '2시간 전',
      isBookmarked: false,
      sentiment: 'positive' as const
    },
    {
      id: '2',
      title: 'AI 돌봄로봇 도입 사업 지자체 시범운영 긍정적 평가',
      source: '메디게이트뉴스',
      time: '4시간 전',
      isBookmarked: true,
      sentiment: 'positive' as const
    }
  ];

  const mockProcurements = [
    { id: 'p1', title: '2026년 발달장애인 AI 맞춤형 교육 시스템 구축', agency: '한국지능정보사회진흥원', budget: '15억 원', deadlineDisplay: 'D-3', isUrgent: true },
    { id: 'p2', title: '지역사회 기반 발달장애인 돌봄 혁신 모델 데이터 수집', agency: '보건복지부', budget: '8.5억 원', deadlineDisplay: 'D-14', isUrgent: false },
    { id: 'p3', title: '행동분석 전문가 매칭 중개 플랫폼 기능 고도화', agency: '국민건강보험공단', budget: '3.2억 원', deadlineDisplay: 'D-21', isUrgent: false },
  ];

  return (
    <div className="h-full flex flex-col max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-3">
        🔍 Trend Tracking
      </h1>
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (News & Clusters) - Takes 7/12 */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <NewsClusterCard 
            title="AI 케어테크 & 복지 예산 확충 동향"
            summary="최근 발달장애인 맞춤형 솔루션 및 AI 돌봄 시스템에 대한 정책 지원 방안이 연이어 보도되며, 관련 조달 시장 확대 가능성이 감지됩니다."
            track="policy"
            importanceScore={85}
            items={mockNews}
          />
          <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm flex flex-col">
          <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Competitors</h2>
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm py-10">Under Construction</div>
        </div>
        </div>
        
        {/* Right Column (Opportunity Score & Procurement) - Takes 5/12 */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <OpportunityGauge />
          
          <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm flex flex-col flex-1 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#1a1f1a]/50">
              <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Public Procurement</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {mockProcurements.map(proc => (
                <ProcurementRow key={proc.id} {...proc} />
              ))}
            </div>
            <div className="p-3 border-t border-gray-100 dark:border-gray-800 text-center">
              <button className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider hover:opacity-80">View All (12)</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
