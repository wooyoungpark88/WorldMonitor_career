export interface ArticleAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative';
  sentimentScore: number; // 0~100
  impactScore: number; // 0~100
  impactLevel: 'high' | 'medium' | 'low';
  keyInsights: string[];
  relatedKeywords: string[];
  stakeholders: string[];
  fullContent: string;
  actionTip: string;
}

export interface NewsArticle {
  id: number;
  source: string;
  category: string;
  tags: string[];
  title: string;
  preview: string;
  daysAgo: number;
  type: 'policy' | 'investment' | 'competitor' | 'procurement';
  analysis: ArticleAnalysis;
}

export const newsArticles: NewsArticle[] = [
  {
    id: 1,
    source: '고용노동부',
    category: '정책/조달',
    tags: ['[정책] 고용노동부', '[정책] 장애인'],
    title: '[공고](고용노동부 고시 제2026-18호) 장애인 직업능력개발훈련 지원규정 - 고용노동부',
    preview: '[공고](고용노동부 고시 제2026-18호) 장애인 직업능력개발훈련 지원규정 고용노동부',
    daysAgo: 4,
    type: 'policy',
    analysis: {
      sentiment: 'positive',
      sentimentScore: 72,
      impactScore: 68,
      impactLevel: 'medium',
      keyInsights: [
        '장애인 직업능력개발훈련 지원 예산이 전년 대비 15% 증가',
        '디지털 기술 훈련 분야 신규 과정 12개 신설 예정',
        '민간 훈련기관 참여 요건이 완화되어 시장 진입 기회 확대',
      ],
      relatedKeywords: ['직업훈련', '장애인 고용', '고용노동부 고시', '디지털 전환', '민간 위탁'],
      stakeholders: ['고용노동부', '한국장애인고용공단', '민간 직업훈련기관', '장애인 구직자'],
      fullContent: `고용노동부는 2026년 장애인 직업능력개발훈련 지원규정을 전면 개정하여 고시했습니다. 이번 개정의 핵심은 디지털 전환 시대에 맞는 장애인 훈련 지원 강화입니다.\n\n주요 개정 내용으로는 AI·데이터 분야 훈련 과정 12개 신설, 원격훈련 인정 범위 확대, 훈련 수당 단가 인상 등이 포함되어 있습니다. 특히 민간 훈련기관의 참여 요건을 기존 3년 이상 운영에서 1년 이상으로 완화하여 신생 케어테크 기업들도 훈련 기관으로 등록할 수 있게 됐습니다.\n\n예산 규모는 전년 대비 15% 증가한 약 2,400억 원으로, 디지털 기반 돌봄 서비스 훈련에 집중 배분될 예정입니다.`,
      actionTip: '민간 훈련기관 자격 요건 완화로 CareVia가 훈련기관으로 등록하여 B2G 수익 창출 가능. 고용노동부 담당 부서에 사전 컨설팅 요청 검토.',
    },
  },
  {
    id: 2,
    source: '소풀벤처스',
    category: '투자/펀딩',
    tags: ['[투자] 투자 유치', '[투자] 시리즈A'],
    title: '닥터트루, 40억 규모 시리즈A 투자 유치 - 뉴스투데이',
    preview: '닥터트루, 40억 규모 시리즈A 투자 유치 뉴스투데이',
    daysAgo: 5,
    type: 'investment',
    analysis: {
      sentiment: 'neutral',
      sentimentScore: 55,
      impactScore: 74,
      impactLevel: 'high',
      keyInsights: [
        '헬스케어 SaaS 분야 자금 유입 시그널 — 시장 투자 심리 활발',
        '닥터트루의 주력 서비스가 원격 환자 모니터링으로 직접 경쟁 가능성 존재',
        '소풀벤처스 주도 투자로 케어테크 전문 VC의 관심 증가 확인',
      ],
      relatedKeywords: ['시리즈A', '헬스테크', '원격 모니터링', '디지털 치료제', 'SaaS'],
      stakeholders: ['닥터트루', '소풀벤처스', '한국투자파트너스', '기존 고객사 병원'],
      fullContent: `헬스케어 AI 스타트업 닥터트루가 소풀벤처스 주도로 40억 원 규모의 시리즈A 투자를 유치했다고 밝혔습니다. 한국투자파트너스도 공동으로 참여한 이번 투자는 원격 환자 모니터링 서비스 고도화 및 영업 인력 확충에 사용될 예정입니다.\n\n닥터트루는 현재 전국 30개 요양병원에 원격 활력징후 모니터링 솔루션을 공급하고 있으며, 이번 투자금으로 100개 병원 확장을 목표로 하고 있습니다.\n\n업계 관계자들은 이번 투자가 케어테크 분야 투자 심리 회복의 신호로 해석하고 있으며, 하반기 추가 대형 투자 라운드가 이어질 것으로 전망하고 있습니다.`,
      actionTip: '닥터트루의 서비스 범위 및 병원 확장 전략 모니터링 필요. 직접 경쟁 영역이므로 차별화 포인트 강화 전략 수립 권장.',
    },
  },
  {
    id: 3,
    source: '에이블뉴스',
    category: '케어테크 뉴스',
    tags: ['[정책] 장애인'],
    title: '발달장애인 진로설계 지원전문가 양성과정 8기 모집 안내 - 에이블뉴스',
    preview: '발달장애인 진로설계 지원전문가 양성과정 8기 모집 안내 에이블뉴스',
    daysAgo: 1,
    type: 'policy',
    analysis: {
      sentiment: 'positive',
      sentimentScore: 78,
      impactScore: 45,
      impactLevel: 'low',
      keyInsights: [
        '발달장애인 진로설계 전문 인력 부족 문제 공식 인정 — 수요 시장 확인',
        '8기 모집으로 지속적인 커리큘럼 운영 중 — 안정적 파트너십 대상',
        'B2B 교육 콘텐츠 공급 가능성 탐색 기회',
      ],
      relatedKeywords: ['발달장애인', '진로설계', '전문가 양성', '커리큘럼', '복지관'],
      stakeholders: ['에이블뉴스', '한국발달장애인훈련센터', '복지관 소속 전문가', '발달장애인 가족'],
      fullContent: `발달장애인 진로설계 지원전문가 양성과정 8기 모집이 시작되었습니다. 이 과정은 발달장애인의 진로탐색 및 취업 지원을 전문적으로 수행할 인력을 양성하기 위해 기획되었으며, 매년 꾸준히 운영되고 있습니다.\n\n8기 모집 인원은 30명으로, 오는 4월부터 8주간 온·오프라인 혼합 방식으로 진행됩니다. 수료 후에는 전국 장애인복지관 및 직업재활시설에 취업 연계 지원이 제공됩니다.\n\n지원 자격은 사회복지사 자격증 소지자 또는 관련 전공 재학생이며, 수강료는 전액 국비 지원으로 운영됩니다.`,
      actionTip: '교육 커리큘럼 디지털화 수요 확인. CareVia의 학습 플랫폼을 활용한 B2B 교육 콘텐츠 파트너십 제안 검토.',
    },
  },
  {
    id: 4,
    source: '나라장터 AI/돌봄',
    category: '정책/조달',
    tags: ['[정책] 조달'],
    title: 'WATER KOREA 2026, 디지털 전자조달 \'차세대 나라장터\' 시스템 소개 - 디지털비즈온',
    preview: 'WATER KOREA 2026, 디지털 전자조달 차세대 나라장터 시스템 소개 디지털비즈온',
    daysAgo: 1,
    type: 'procurement',
    analysis: {
      sentiment: 'neutral',
      sentimentScore: 60,
      impactScore: 52,
      impactLevel: 'medium',
      keyInsights: [
        '차세대 나라장터 UI/UX 전면 개편 — 입찰 편의성 향상 예고',
        'AI 기반 입찰 추천 기능 도입 예정 — 관련 기사 조기 모니터링 권장',
        '디지털 조달 확대로 소규모 기업 참여 장벽 낮아질 전망',
      ],
      relatedKeywords: ['나라장터', '전자조달', '공공조달', 'AI 추천', '디지털 전환'],
      stakeholders: ['조달청', '중소기업', '공공기관 구매담당자', '시스템통합(SI) 업체'],
      fullContent: `WATER KOREA 2026 행사에서 조달청이 차세대 나라장터 시스템의 주요 기능을 공개했습니다. 2027년 전면 도입 예정인 차세대 나라장터는 AI 기반 입찰 매칭, 자동화된 서류 검토, 실시간 계약 상태 알림 등 혁신적인 기능을 탑재할 예정입니다.\n\n특히 소규모 기업의 공공 조달 참여를 독려하기 위해 간소화된 입찰 절차와 디지털 서명 지원이 강화됩니다. 복지·돌봄 분야 조달의 경우 전문 카테고리를 신설하여 케어테크 기업들의 참여 기회가 크게 늘어날 것으로 기대됩니다.`,
      actionTip: '차세대 나라장터 베타 테스트 참여 기회 포착. 복지·돌봄 전문 카테고리 신설 시 선점 입찰 전략 수립 필요.',
    },
  },
  {
    id: 5,
    source: '복지타임즈',
    category: '케어테크 뉴스',
    tags: ['[정책] 장애인'],
    title: '신도·인화 라이온스클럽, 인천중구장애인종합복지관에서 \'짜장면 나눔 DAY\' 진행 - 복지타임즈',
    preview: '신도·인화 라이온스클럽, 인천중구장애인종합복지관에서 짜장면 나눔 DAY 진행 복지타임즈',
    daysAgo: 1,
    type: 'policy',
    analysis: {
      sentiment: 'positive',
      sentimentScore: 88,
      impactScore: 20,
      impactLevel: 'low',
      keyInsights: [
        '지역사회 복지관과 민간 단체의 협력 사례 — 커뮤니티 신뢰 구축 참고',
        '인천 지역 복지관 네트워크 현황 파악 기회',
        '브랜드 인지도 관점에서 CSR 활동 연계 가능성',
      ],
      relatedKeywords: ['복지관', '지역사회', '장애인 나눔', '라이온스클럽', '인천'],
      stakeholders: ['신도·인화 라이온스클럽', '인천중구장애인종합복지관', '지역 장애인'],
      fullContent: `신도·인화 라이온스클럽이 인천중구장애인종합복지관을 방문하여 '짜장면 나눔 DAY' 행사를 진행했습니다. 이 행사는 매년 정기적으로 열리는 나눔 행사로, 올해는 약 150명의 복지관 이용자들이 참여했습니다.\n\n복지관 관장은 "이런 민간 후원이 복지관 운영에 큰 힘이 된다"고 밝히며 지속적인 관심과 참여를 요청했습니다. 라이온스클럽은 앞으로도 분기별로 복지관 지원 행사를 이어나갈 계획이라고 전했습니다.`,
      actionTip: '직접적 비즈니스 임팩트는 낮지만, 지역 복지관 네트워크와의 관계 형성 참고자료로 활용 가능.',
    },
  },
  {
    id: 6,
    source: '나라장터 AI/돌봄',
    category: '정책/조달',
    tags: ['[정책] 조달'],
    title: '2026년 장애인 보조기기 품질관리 및 국제표준화 지원 용역 입찰 공고',
    preview: '2026년 장애인 보조기기 품질관리 및 국제표준화 지원 용역 입찰 공고 나라장터',
    daysAgo: 2,
    type: 'procurement',
    analysis: {
      sentiment: 'neutral',
      sentimentScore: 62,
      impactScore: 58,
      impactLevel: 'medium',
      keyInsights: [
        '장애인 보조기기 국제표준화 과제 — ISO/IEC 인증 역량 보유 기업 유리',
        '예상 용역 규모 5억~10억 원 추정 — 소규모 컨소시엄 구성 검토',
        '낙찰 시 정부 레퍼런스 확보로 향후 추가 조달 가능성',
      ],
      relatedKeywords: ['보조기기', '국제표준', 'ISO', '품질관리', '용역 입찰'],
      stakeholders: ['보건복지부', '한국보조기기센터', '보조기기 제조업체', '표준화 전문 기관'],
      fullContent: `보건복지부가 나라장터를 통해 '2026년 장애인 보조기기 품질관리 및 국제표준화 지원' 용역 사업을 공고했습니다. 사업 기간은 2026년 4월부터 12월까지 9개월이며, 예산은 8억 원 규모입니다.\n\n이번 용역의 주요 내용은 보조기기 성능 시험 방법 국제 표준 개발 참여, 국내 품질 인증 체계 고도화, 소비자 안전 가이드라인 마련 등입니다. 컨소시엄 구성이 허용되며, 중소기업 참여 비율에 따른 가점 조항이 포함되어 있습니다.`,
      actionTip: '컨소시엄 파트너사 탐색 권장. ISO 인증 전문 기관과 협력하여 입찰 경쟁력 강화 가능.',
    },
  },
  {
    id: 7,
    source: '케어테크IN',
    category: '케어테크 뉴스',
    tags: ['[케어테크] AI', '[케어테크] 헬스케어'],
    title: 'AI 기반 치매 조기 진단 솔루션 스타트업 메디에이지, Pre-A 투자 유치 완료',
    preview: 'AI 기반 치매 조기 진단 솔루션 스타트업 메디에이지, Pre-A 투자 유치 완료 케어테크IN',
    daysAgo: 2,
    type: 'investment',
    analysis: {
      sentiment: 'positive',
      sentimentScore: 80,
      impactScore: 82,
      impactLevel: 'high',
      keyInsights: [
        'AI 치매 진단 분야 Pre-A 투자 — 초기 시장이지만 VC 관심 급증',
        '비침습적 AI 진단 기술로 병원 외 요양 시설 적용 확대 전망',
        'CareVia 플랫폼과 연동 가능한 API 파트너십 검토 가치 있음',
      ],
      relatedKeywords: ['치매 진단', 'AI 의료', 'Pre-A', '노인 케어', '뇌 건강'],
      stakeholders: ['메디에이지', '투자사 KDB산업은행', '치매안심센터', '요양병원'],
      fullContent: `AI 기반 치매 조기 진단 스타트업 메디에이지가 KDB산업은행 등 투자사로부터 Pre-A 라운드 투자를 유치했다고 밝혔습니다. 투자 규모는 비공개이나 업계에서는 15억~20억 원 수준으로 추정하고 있습니다.\n\n메디에이지의 핵심 기술은 음성 패턴 분석과 안구 추적 데이터를 결합한 비침습적 인지기능 평가 AI입니다. 현재 전국 치매안심센터 12곳에서 파일럿 운영 중이며, 올해 하반기 정식 출시와 함께 요양원·요양병원으로 공급처를 확대할 계획입니다.`,
      actionTip: '메디에이지와의 API 통합 파트너십 조기 논의 권장. 치매 조기 진단 결과를 CareVia 케어 플랜에 연동하면 차별화된 서비스 가치 창출 가능.',
    },
  },
  {
    id: 8,
    source: '복지뉴스',
    category: '케어테크 뉴스',
    tags: ['[케어테크] 돌봄', '[정책] 고령화'],
    title: '초고령사회 진입 한국, 2026년 요양 서비스 혁신 로드맵 발표 - 보건복지부',
    preview: '초고령사회 진입 한국, 2026년 요양 서비스 혁신 로드맵 발표 보건복지부',
    daysAgo: 3,
    type: 'policy',
    analysis: {
      sentiment: 'positive',
      sentimentScore: 75,
      impactScore: 91,
      impactLevel: 'high',
      keyInsights: [
        '정부가 디지털 요양 서비스를 국가 전략으로 공식 채택 — 시장 성장 가속',
        '2028년까지 요양 서비스 디지털화 비율 60% 목표 제시',
        '민관 협력 모델 확대 — 민간 케어테크 기업 참여 적극 장려',
      ],
      relatedKeywords: ['초고령사회', '요양 혁신', '디지털 돌봄', '보건복지부', '장기요양'],
      stakeholders: ['보건복지부', '건강보험공단', '민간 요양 기관', '케어테크 기업'],
      fullContent: `보건복지부가 '2026 요양 서비스 혁신 로드맵'을 공식 발표했습니다. 한국이 UN 기준 초고령사회(65세 이상 인구 20% 초과)에 진입함에 따라, 정부는 지속 가능한 돌봄 체계 구축을 국가 최우선 과제로 삼겠다고 밝혔습니다.\n\n로드맵의 핵심은 세 가지입니다. 첫째, 재가 요양 서비스 디지털 전환 지원금 3,000억 원 투입. 둘째, IoT·AI 기반 원격 모니터링 표준 모델 개발 및 전국 보급. 셋째, 민간 케어테크 기업의 장기요양 급여 서비스 제공자 자격 부여 검토.\n\n이번 로드맵은 2028년까지 요양 서비스 디지털화 비율을 현재 12%에서 60%로 끌어올리는 것을 목표로 합니다.`,
      actionTip: '장기요양 급여 서비스 제공자 자격 검토는 CareVia의 B2G 진출에 결정적 기회. 복지부 정책 TF 참여 및 시범사업 제안 즉시 추진 권장.',
    },
  },
  {
    id: 9,
    source: '스타트업투데이',
    category: '경쟁사',
    tags: ['[경쟁사] 돌봄로봇', '[투자] 시리즈B'],
    title: '케어봇, 시리즈B 80억 조달 완료 - 요양원 AI 돌봄로봇 상용화 본격화',
    preview: '케어봇, 시리즈B 80억 조달 완료 요양원 AI 돌봄로봇 상용화 본격화 스타트업투데이',
    daysAgo: 3,
    type: 'competitor',
    analysis: {
      sentiment: 'negative',
      sentimentScore: 30,
      impactScore: 86,
      impactLevel: 'high',
      keyInsights: [
        '직접 경쟁사 케어봇의 시리즈B 완료 — 영업 자원 대폭 확대 예상',
        '하드웨어+소프트웨어 통합 모델로 CareVia 순수 소프트웨어와 차별화 포인트 상충',
        '케어봇의 요양원 200개소 계약 확보 — 시장 점유율 선점 위협',
      ],
      relatedKeywords: ['돌봄로봇', '시리즈B', '요양원', '하드웨어', 'AI 케어'],
      stakeholders: ['케어봇', 'SoftBank Ventures', '국내 요양원 체인', '복지부'],
      fullContent: `AI 돌봄로봇 스타트업 케어봇이 SoftBank Ventures 주도의 시리즈B 라운드에서 80억 원을 조달했다고 밝혔습니다. 이번 투자로 케어봇의 누적 조달금은 120억 원에 달합니다.\n\n케어봇은 이번 투자금으로 로봇 생산 라인 확장과 함께 전국 요양원 영업 인력을 현재 20명에서 50명으로 늘릴 계획입니다. 현재 전국 200개 요양원과 계약을 체결했으며, 연내 500개 확장을 목표로 하고 있습니다.\n\n케어봇의 주력 제품은 낙상 감지, 복약 알림, 정서 케어 기능이 통합된 이동형 케어로봇으로, 월 구독 방식으로 공급됩니다.`,
      actionTip: '케어봇의 하드웨어 의존 모델 대비 CareVia의 소프트웨어 유연성 차별화 전략 강화 필요. 케어봇 미도입 요양원 타겟 영업 집중 권장.',
    },
  },
  {
    id: 10,
    source: '헬스케어신문',
    category: '경쟁사',
    tags: ['[경쟁사] 재활', '[케어테크] AI'],
    title: '리하빌리, 병원 재활 AI 코칭 플랫폼 출시 - 전국 50개 병원 계약 체결',
    preview: '리하빌리, 병원 재활 AI 코칭 플랫폼 출시 전국 50개 병원 계약 체결 헬스케어신문',
    daysAgo: 4,
    type: 'competitor',
    analysis: {
      sentiment: 'negative',
      sentimentScore: 35,
      impactScore: 70,
      impactLevel: 'high',
      keyInsights: [
        '재활 AI 코칭 분야 신규 경쟁사 출현 — 병원 채널 선점 위협',
        '50개 병원 계약은 빠른 시장 침투 속도 — 6개월 내 100개 병원 전망',
        'AI 운동 처방 + 보험 연계 모델은 수익성 높은 B2B2C 구조',
      ],
      relatedKeywords: ['재활 AI', '코칭 플랫폼', '병원', 'B2B2C', '운동 처방'],
      stakeholders: ['리하빌리', '삼성서울병원', '세브란스병원', '재활의학과'],
      fullContent: `AI 재활 코칭 플랫폼 스타트업 리하빌리가 정식 출시와 함께 전국 50개 병원과의 계약 체결을 발표했습니다. 리하빌리는 재활의학과 처방에 기반한 개인 맞춤형 AI 운동 프로그램을 환자에게 제공하는 플랫폼입니다.\n\n이 플랫폼의 차별점은 운동 보험 연계 모델로, 환자가 처방받은 운동을 수행하면 실손보험료 할인 혜택을 받을 수 있는 구조입니다. 현재 삼성생명과의 보험 연계 파일럿이 진행 중이며, 올해 내 5개 보험사와 협력을 확대할 계획입니다.`,
      actionTip: '병원 재활 채널은 CareVia의 주요 확장 방향 중 하나. 리하빌리와의 차별화를 위해 장기 요양과 재활의 연속성 케어 모델 구축 전략 검토.',
    },
  },
  {
    id: 11,
    source: '나라장터 AI/돌봄',
    category: '정책/조달',
    tags: ['[정책] 조달'],
    title: '2026년 노인 장기요양기관 ICT 인프라 구축 사업 공고 - 건강보험심사평가원',
    preview: '2026년 노인 장기요양기관 ICT 인프라 구축 사업 공고 건강보험심사평가원',
    daysAgo: 1,
    type: 'procurement',
    analysis: {
      sentiment: 'positive',
      sentimentScore: 70,
      impactScore: 88,
      impactLevel: 'high',
      keyInsights: [
        '건강보험심사평가원 발주 — 신뢰도 높은 공공 레퍼런스 확보 기회',
        '예산 규모 약 45억 원 — 대형 수주 가능성',
        'ICT 인프라 구축 후 소프트웨어 납품 연계 기회 탐색 가능',
      ],
      relatedKeywords: ['장기요양기관', 'ICT 인프라', '건강보험', '공공조달', '디지털 전환'],
      stakeholders: ['건강보험심사평가원', '요양기관', 'SI 기업', '소프트웨어 공급사'],
      fullContent: `건강보험심사평가원이 전국 노인 장기요양기관의 ICT 인프라 구축 지원 사업을 공고했습니다. 사업 규모는 45억 원이며, 네트워크 고도화, 태블릿·IoT 기기 보급, 통합 관리 소프트웨어 납품이 포함됩니다.\n\n이번 사업의 핵심은 전국 약 3,000개 요양기관에 표준화된 디지털 인프라를 구축하는 것으로, 향후 원격 모니터링 및 AI 케어 서비스 도입의 기반을 마련하는 포석으로 해석됩니다.\n\n입찰 자격은 중소기업 이상이며, 중소기업 컨소시엄 구성 시 가산점이 부여됩니다. 제안서 제출 마감은 2026년 4월 10일입니다.`,
      actionTip: '4월 10일 마감 — 즉시 제안서 준비 착수 필요. 소프트웨어 납품 항목에 CareVia 솔루션 포함 가능 여부 검토 우선.',
    },
  },
  {
    id: 12,
    source: '메디컬월드',
    category: '케어테크 뉴스',
    tags: ['[케어테크] 원격의료', '[정책] 디지털헬스'],
    title: '원격의료 확대 정책, 2026년 하반기 전국 시행 예정 - 복지부 발표',
    preview: '원격의료 확대 정책, 2026년 하반기 전국 시행 예정 복지부 발표',
    daysAgo: 2,
    type: 'policy',
    analysis: {
      sentiment: 'positive',
      sentimentScore: 82,
      impactScore: 94,
      impactLevel: 'high',
      keyInsights: [
        '원격의료 전국 확대 — 비대면 케어 서비스 수요 폭발적 증가 예상',
        '요양원·재가 서비스 연계 원격 진료 모델 공식화 전망',
        'CareVia 플랫폼에 원격 의료 연동 기능 추가 시 시장 선점 가능',
      ],
      relatedKeywords: ['원격의료', '비대면 진료', '디지털헬스', '재가 서비스', '의료법 개정'],
      stakeholders: ['보건복지부', '의사협회', '원격의료 플랫폼', '요양원'],
      fullContent: `보건복지부는 2026년 하반기부터 원격의료 서비스를 전국적으로 확대 시행한다고 발표했습니다. 2024년 한시적으로 허용된 비대면 진료가 이번에는 상설화되며, 적용 범위도 1차 의료기관에서 요양기관 연계 진료까지 확대됩니다.\n\n특히 재가 요양 수급자를 대상으로 한 원격 진료 모델이 공식 인정되면서, 케어 플랫폼과 원격 의료의 통합 서비스가 가능해질 전망입니다. 이에 따라 케어테크 기업들의 원격 의료 플랫폼 개발 및 연동 수요가 급증할 것으로 보입니다.\n\n의료법 개정안은 국회 보건복지위원회 통과 후 6월 공포, 하반기 시행이 예정되어 있습니다.`,
      actionTip: '원격의료 상설화는 CareVia 최대 성장 기회. 원격 진료 플랫폼과의 API 연동 로드맵 수립 및 의원급 의료기관 파트너십 확보 즉시 착수.',
    },
  },
];

export const categoryFilters = [
  { label: '케어테크 뉴스', count: 60, key: 'cartech' },
  { label: '투자/펀딩', count: 40, key: 'investment' },
  { label: '경쟁사', count: 19, key: 'competitor' },
  { label: '정책/조달', count: 18, key: 'policy' },
];

export interface ProcurementItem {
  id: number;
  title: string;
  organization: string;
  category: string;
  budget: string;
  deadline: string; // YYYY-MM-DD
  impactScore: number;
  actionTip: string;
  notified?: boolean;
}

export const procurementItems: ProcurementItem[] = [
  {
    id: 1,
    title: '2026년 장애인 직업훈련 디지털 전환 지원 용역',
    organization: '고용노동부',
    category: 'AI/디지털',
    budget: '24억원',
    deadline: '2026-03-24',
    impactScore: 88,
    actionTip: '마감 3일 전! 민간 훈련기관 요건 완화로 CareVia 직접 입찰 가능. 제안서 핵심은 AI 기반 원격 훈련 커리큘럼.',
  },
  {
    id: 2,
    title: '장애인 보조기기 품질관리 및 국제표준화 지원 용역',
    organization: '보건복지부',
    category: '표준화/품질',
    budget: '8억원',
    deadline: '2026-03-28',
    impactScore: 62,
    actionTip: 'ISO 인증 전문 기관과 컨소시엄 구성 권장. 중소기업 가산점 항목 확인 후 전략적 파트너사 선정.',
  },
  {
    id: 3,
    title: '노인 장기요양기관 ICT 인프라 구축 사업',
    organization: '건강보험심사평가원',
    category: 'ICT 인프라',
    budget: '45억원',
    deadline: '2026-04-10',
    impactScore: 94,
    actionTip: '전국 3,000개 요양기관 대상 사업. CareVia 솔루션을 소프트웨어 납품 항목으로 포함할 경우 추가 수익 구조 창출 가능.',
  },
  {
    id: 4,
    title: '2026년 재가요양 ICT 서비스 시범사업 위탁 운영',
    organization: '국민건강보험공단',
    category: '재가요양',
    budget: '32억원',
    deadline: '2026-04-30',
    impactScore: 79,
    actionTip: '재가요양 디지털 전환 시범사업으로 시장 레퍼런스 확보에 최적. 위탁 운영 경험이 향후 전국 확대 시 우선권 부여.',
  },
  {
    id: 5,
    title: '디지털 복지 인프라 구축 및 AI 케어 솔루션 도입 사업',
    organization: '조달청',
    category: 'AI/돌봄',
    budget: '120억원',
    deadline: '2026-05-15',
    impactScore: 85,
    actionTip: '대형 사업으로 컨소시엄 리드사 포지션 목표. AI 케어 솔루션 분야 차별화 기술 증빙 자료 사전 준비 권장.',
  },
  {
    id: 6,
    title: '장애인복지관 통합관리시스템 고도화 사업',
    organization: '한국장애인복지관협회',
    category: '복지 IT',
    budget: '6억원',
    deadline: '2026-06-02',
    impactScore: 55,
    actionTip: '복지관 네트워크와의 관계 형성 기회. 소규모지만 전국 복지관 확산을 위한 레퍼런스 사업으로 전략적 가치 있음.',
  },
];

export const marketPulseTracks = [
  { label: '케어테크 뉴스', count: 60 },
  { label: '투자/펀딩', count: 40 },
  { label: '경쟁사', count: 19 },
  { label: '정책/조달', count: 18 },
];
