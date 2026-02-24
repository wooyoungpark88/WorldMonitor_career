// Care/AI Welfare variant - care.worldmonitor.app
import type { PanelConfig, MapLayers } from '@/types';
import type { VariantConfig } from './base';

// Re-export base config
export * from './base';

// Re-export feeds infrastructure
export {
  SOURCE_TIERS,
  getSourceTier,
  SOURCE_TYPES,
  getSourceType,
  getSourcePropagandaRisk,
  type SourceRiskProfile,
  type SourceType,
} from '../feeds';

// Care-specific FEEDS configuration
import type { Feed } from '@/types';

const rss = (url: string) => `/api/rss-proxy?url=${encodeURIComponent(url)}`;

export const FEEDS: Record<string, Feed[]> = {
  // === Welfare Policy (복지정책) ===
  welfarePolicy: [
    { name: '보건복지부', url: rss('https://news.google.com/rss/search?q=site:mohw.go.kr+보도자료+when:7d&hl=ko&gl=KR&ceid=KR:ko') },
    { name: '경기복지재단', url: rss('https://news.google.com/rss/search?q=site:ggwf.gg.go.kr+when:14d&hl=ko&gl=KR&ceid=KR:ko') },
    { name: 'WHO Digital Health', url: rss('https://news.google.com/rss/search?q=site:who.int+digital+health+when:14d&hl=en-US&gl=US&ceid=US:en') },
    { name: '복지정책 뉴스', url: rss('https://news.google.com/rss/search?q=발달장애+OR+장애인복지+OR+AI돌봄+정책+when:7d&hl=ko&gl=KR&ceid=KR:ko') },
    { name: '국회 복지위', url: rss('https://news.google.com/rss/search?q=국회+보건복지위원회+장애인+when:14d&hl=ko&gl=KR&ceid=KR:ko') },
  ],

  // === AI Care Research (AI 케어 학술) ===
  aiCareResearch: [
    { name: 'Nature Digital Medicine', url: rss('https://www.nature.com/npjdigitalmed.rss') },
    { name: 'MIT Tech Review Healthcare', url: rss('https://www.technologyreview.com/topic/biotechnology/feed') },
    { name: 'AI Healthcare News', url: rss('https://news.google.com/rss/search?q=("AI+healthcare"+OR+"digital+therapeutics"+OR+"behavioral+analysis+AI")+when:7d&hl=en-US&gl=US&ceid=US:en') },
    { name: 'FDA Digital Health', url: rss('https://news.google.com/rss/search?q=site:fda.gov+digital+health+AI+when:14d&hl=en-US&gl=US&ceid=US:en') },
    { name: 'JAMA Digital Health', url: rss('https://news.google.com/rss/search?q=site:jamanetwork.com+digital+health+AI+when:14d&hl=en-US&gl=US&ceid=US:en') },
    { name: 'ArXiv AI Healthcare', url: rss('https://export.arxiv.org/rss/cs.AI') },
  ],

  // === Care Robotics (케어 로보틱스) ===
  careRobotics: [
    { name: 'IEEE Spectrum Robotics', url: rss('https://spectrum.ieee.org/feeds/topic/robotics.rss') },
    { name: 'Care Robot News', url: rss('https://news.google.com/rss/search?q=("care+robot"+OR+"assistive+robot"+OR+"eldercare+robot"+OR+"rehabilitation+robot")+when:7d&hl=en-US&gl=US&ceid=US:en') },
    { name: 'Japan Care Robotics', url: rss('https://news.google.com/rss/search?q=(Japan+care+robot+OR+介護ロボット)+when:14d&hl=en-US&gl=US&ceid=US:en') },
    { name: 'Robotics Business Review', url: rss('https://news.google.com/rss/search?q=site:roboticsbusinessreview.com+when:7d&hl=en-US&gl=US&ceid=US:en') },
    { name: '돌봄 로봇 뉴스', url: rss('https://news.google.com/rss/search?q=돌봄로봇+OR+케어로봇+OR+재활로봇+when:7d&hl=ko&gl=KR&ceid=KR:ko') },
  ],

  // === ABA & Developmental Care (ABA/발달케어) ===
  abaDevelopmental: [
    { name: 'ABA Research', url: rss('https://news.google.com/rss/search?q=("applied+behavior+analysis"+OR+ABA+therapy+OR+"behavioral+intervention")+autism+when:14d&hl=en-US&gl=US&ceid=US:en') },
    { name: 'Autism Research', url: rss('https://news.google.com/rss/search?q=("autism+research"+OR+"developmental+disability"+AI+OR+technology)+when:14d&hl=en-US&gl=US&ceid=US:en') },
    { name: '발달장애 AI', url: rss('https://news.google.com/rss/search?q=발달장애+AI+OR+행동분석+인공지능+when:14d&hl=ko&gl=KR&ceid=KR:ko') },
    { name: 'AAC Technology', url: rss('https://news.google.com/rss/search?q=("augmentative+communication"+OR+AAC+device+OR+"assistive+technology")+when:14d&hl=en-US&gl=US&ceid=US:en') },
  ],

  // === Public Procurement (공공조달) ===
  procurement: [
    { name: 'AI 돌봄 조달', url: rss('https://news.google.com/rss/search?q=나라장터+AI+돌봄+OR+인공지능+복지+입찰+when:7d&hl=ko&gl=KR&ceid=KR:ko') },
    { name: '복지 서비스 입찰', url: rss('https://news.google.com/rss/search?q=공공조달+장애인+서비스+OR+돌봄+서비스+입찰+when:7d&hl=ko&gl=KR&ceid=KR:ko') },
    { name: 'Gov AI Procurement', url: rss('https://news.google.com/rss/search?q=(government+procurement+AI+healthcare+OR+disability+services)+when:14d&hl=en-US&gl=US&ceid=US:en') },
  ],

  // === Competitor Monitoring (경쟁사 모니터링) ===
  competitor: [
    { name: '카카오 헬스케어', url: rss('https://news.google.com/rss/search?q=카카오+헬스케어+AI+when:7d&hl=ko&gl=KR&ceid=KR:ko') },
    { name: '네이버 AI 헬스', url: rss('https://news.google.com/rss/search?q=네이버+AI+헬스+OR+네이버+클로바+헬스+when:7d&hl=ko&gl=KR&ceid=KR:ko') },
    { name: 'Samsung Bot Care', url: rss('https://news.google.com/rss/search?q=("Samsung+Bot+Care"+OR+"Samsung+care+robot")+when:14d&hl=en-US&gl=US&ceid=US:en') },
    { name: 'Xiaomi Care Robot', url: rss('https://news.google.com/rss/search?q=("Xiaomi+CyberDog"+OR+"Xiaomi+care"+robot)+when:14d&hl=en-US&gl=US&ceid=US:en') },
    { name: 'AI 돌봄 스타트업', url: rss('https://news.google.com/rss/search?q=AI+돌봄+스타트업+OR+케어테크+스타트업+when:7d&hl=ko&gl=KR&ceid=KR:ko') },
  ],

  // === Healthcare Industry (헬스케어 산업) ===
  healthcareIndustry: [
    { name: 'Digital Health', url: rss('https://news.google.com/rss/search?q=("digital+health"+OR+healthtech+OR+"health+AI")+when:3d&hl=en-US&gl=US&ceid=US:en') },
    { name: 'MobiHealthNews', url: rss('https://www.mobihealthnews.com/feed') },
    { name: 'Healthcare IT News', url: rss('https://www.healthcareitnews.com/feed') },
    { name: 'Disability Tech VC', url: rss('https://news.google.com/rss/search?q=("disability+tech"+OR+"accessibility+startup"+OR+"assistive+tech")+funding+OR+investment+when:14d&hl=en-US&gl=US&ceid=US:en') },
  ],

  // === Regulation & Standards (규제/기준) ===
  regulation: [
    { name: 'EU AI Act Healthcare', url: rss('https://news.google.com/rss/search?q=("EU+AI+Act"+OR+"AI+regulation")+healthcare+OR+disability+when:14d&hl=en-US&gl=US&ceid=US:en') },
    { name: 'AI 규제 뉴스', url: rss('https://news.google.com/rss/search?q=인공지능+규제+복지+OR+AI+돌봄+법안+when:14d&hl=ko&gl=KR&ceid=KR:ko') },
    { name: 'Medical Device AI', url: rss('https://news.google.com/rss/search?q=("medical+device"+AI+OR+"SaMD"+OR+"software+as+medical+device")+when:14d&hl=en-US&gl=US&ceid=US:en') },
  ],
};

// Panel configuration for care/welfare intelligence
export const DEFAULT_PANELS: Record<string, PanelConfig> = {
  map: { name: 'Care Intelligence Map', enabled: true, priority: 1 },
  'live-news': { name: 'Care Headlines', enabled: true, priority: 1 },
  insights: { name: 'AI Care Insights', enabled: true, priority: 1 },
  welfarePolicy: { name: 'Welfare Policy', enabled: true, priority: 1 },
  aiCareResearch: { name: 'AI Care Research', enabled: true, priority: 1 },
  careRobotics: { name: 'Care Robotics', enabled: true, priority: 1 },
  abaDevelopmental: { name: 'ABA & Development', enabled: true, priority: 1 },
  procurement: { name: 'Public Procurement', enabled: true, priority: 1 },
  competitor: { name: 'Competitor Watch', enabled: true, priority: 1 },
  healthcareIndustry: { name: 'Healthcare Industry', enabled: true, priority: 2 },
  regulation: { name: 'Care AI Regulation', enabled: true, priority: 2 },
  monitors: { name: 'My Monitors', enabled: true, priority: 2 },
};

// Care-focused map layers
export const DEFAULT_MAP_LAYERS: MapLayers = {
  conflicts: false,
  bases: false,
  cables: false,
  pipelines: false,
  hotspots: false,
  ais: false,
  nuclear: false,
  irradiators: false,
  sanctions: false,
  weather: false,
  economic: false,
  waterways: false,
  outages: false,
  cyberThreats: false,
  datacenters: false,
  protests: false,
  flights: false,
  military: false,
  natural: false,
  spaceports: false,
  minerals: false,
  fires: false,
  ucdpEvents: false,
  displacement: false,
  climate: false,
  // Tech layers (disabled in care variant)
  startupHubs: false,
  cloudRegions: false,
  accelerators: false,
  techHQs: false,
  techEvents: false,
  // Finance layers (disabled in care variant)
  stockExchanges: false,
  financialCenters: false,
  centralBanks: false,
  commodityHubs: false,
  gulfInvestments: false,
  // Care-specific layers
  careFacilities: true,
  roboticsLabs: true,
  policyEvents: true,
  careStartups: true,
};

// Mobile defaults for care variant
export const MOBILE_DEFAULT_MAP_LAYERS: MapLayers = {
  conflicts: false,
  bases: false,
  cables: false,
  pipelines: false,
  hotspots: false,
  ais: false,
  nuclear: false,
  irradiators: false,
  sanctions: false,
  weather: false,
  economic: false,
  waterways: false,
  outages: false,
  cyberThreats: false,
  datacenters: false,
  protests: false,
  flights: false,
  military: false,
  natural: false,
  spaceports: false,
  minerals: false,
  fires: false,
  ucdpEvents: false,
  displacement: false,
  climate: false,
  // Tech layers (disabled)
  startupHubs: false,
  cloudRegions: false,
  accelerators: false,
  techHQs: false,
  techEvents: false,
  // Finance layers (disabled)
  stockExchanges: false,
  financialCenters: false,
  centralBanks: false,
  commodityHubs: false,
  gulfInvestments: false,
  // Care layers (limited on mobile)
  careFacilities: true,
  roboticsLabs: false,
  policyEvents: true,
  careStartups: false,
};

export const VARIANT_CONFIG: VariantConfig = {
  name: 'care',
  description: 'AI care, developmental disability, and care robotics intelligence dashboard',
  panels: DEFAULT_PANELS,
  mapLayers: DEFAULT_MAP_LAYERS,
  mobileMapLayers: MOBILE_DEFAULT_MAP_LAYERS,
};
