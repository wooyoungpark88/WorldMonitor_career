// Care variant geographic data
// Facilities, robotics labs, and care startups

export interface CareFacility {
  id: string;
  name: string;
  lat: number;
  lon: number;
  country: string;
  type: 'development_center' | 'welfare_center' | 'forensic_hospital' | 'rehabilitation' | 'research';
  operator: string;
  capacity?: number;
  services: string[];
  aiEnabled: boolean;
}

export interface RoboticsLab {
  id: string;
  name: string;
  lat: number;
  lon: number;
  country: string;
  region: string;
  focus: string[];
  products?: string[];
}

export interface CareStartup {
  id: string;
  name: string;
  lat: number;
  lon: number;
  country: string;
  domain: string;
  fundingStage: 'seed' | 'seriesA' | 'seriesB' | 'seriesC' | 'later';
  fundingAmountM?: number;
  description: string;
}

export const CARE_FACILITIES: CareFacility[] = [
  // Korea (한국)
  {
    id: 'gg-dev-center',
    name: '경기도 발달장애인 지원센터',
    lat: 37.2636,
    lon: 127.0286,
    country: 'KR',
    type: 'development_center',
    operator: '경기도',
    capacity: 200,
    services: ['behavioral_analysis', 'therapy', 'vocational'],
    aiEnabled: true,
  },
  {
    id: 'natl-forensic',
    name: '국립법무병원',
    lat: 34.9506,
    lon: 128.0667,
    country: 'KR',
    type: 'forensic_hospital',
    operator: '법무부',
    capacity: 1100,
    services: ['forensic_care', 'behavioral_monitoring'],
    aiEnabled: true,
  },
  {
    id: 'seoul-rehab',
    name: '서울재활병원',
    lat: 37.5665,
    lon: 126.9780,
    country: 'KR',
    type: 'rehabilitation',
    operator: '서울시',
    capacity: 300,
    services: ['physical_therapy', 'occupational_therapy', 'ai_rehab'],
    aiEnabled: true,
  },
  {
    id: 'incheon-welfare',
    name: '인천광역시 장애인종합복지관',
    lat: 37.4563,
    lon: 126.7052,
    country: 'KR',
    type: 'welfare_center',
    operator: '인천시',
    capacity: 150,
    services: ['counseling', 'vocational_training', 'day_care'],
    aiEnabled: false,
  },
  {
    id: 'busan-dev-center',
    name: '부산 발달장애인 지원센터',
    lat: 35.1796,
    lon: 129.0756,
    country: 'KR',
    type: 'development_center',
    operator: '부산시',
    capacity: 120,
    services: ['behavioral_analysis', 'early_intervention'],
    aiEnabled: false,
  },
  {
    id: 'daegu-welfare',
    name: '대구 장애인복지관',
    lat: 35.8714,
    lon: 128.6014,
    country: 'KR',
    type: 'welfare_center',
    operator: '대구시',
    capacity: 100,
    services: ['day_care', 'therapy', 'vocational'],
    aiEnabled: false,
  },
  {
    id: 'gwangju-rehab',
    name: '광주 재활센터',
    lat: 35.1595,
    lon: 126.8526,
    country: 'KR',
    type: 'rehabilitation',
    operator: '광주시',
    capacity: 80,
    services: ['physical_therapy', 'speech_therapy'],
    aiEnabled: false,
  },
  // Japan (일본)
  {
    id: 'tokyo-care-center',
    name: 'National Rehabilitation Center',
    lat: 35.7825,
    lon: 139.3915,
    country: 'JP',
    type: 'rehabilitation',
    operator: 'MHLW Japan',
    capacity: 500,
    services: ['rehabilitation', 'assistive_tech', 'research'],
    aiEnabled: true,
  },
  {
    id: 'osaka-welfare',
    name: 'Osaka Welfare Technology Center',
    lat: 34.6937,
    lon: 135.5023,
    country: 'JP',
    type: 'welfare_center',
    operator: 'Osaka Prefecture',
    capacity: 200,
    services: ['care_robotics_demo', 'welfare_equipment'],
    aiEnabled: true,
  },
  // EU
  {
    id: 'berlin-inclusion',
    name: 'Berlin Inclusion Technology Lab',
    lat: 52.5200,
    lon: 13.4050,
    country: 'DE',
    type: 'research',
    operator: 'Charité',
    services: ['digital_inclusion', 'assistive_ai', 'research'],
    aiEnabled: true,
  },
  {
    id: 'amsterdam-care',
    name: 'Amsterdam Care Innovation Hub',
    lat: 52.3676,
    lon: 4.9041,
    country: 'NL',
    type: 'research',
    operator: 'VU Amsterdam',
    services: ['dementia_care', 'social_robotics', 'research'],
    aiEnabled: true,
  },
  // USA
  {
    id: 'boston-aba',
    name: 'New England Center for Children',
    lat: 42.2373,
    lon: -71.8279,
    country: 'US',
    type: 'development_center',
    operator: 'NECC',
    capacity: 250,
    services: ['aba_therapy', 'research', 'training'],
    aiEnabled: true,
  },
  {
    id: 'baltimore-kennedy',
    name: 'Kennedy Krieger Institute',
    lat: 39.2984,
    lon: -76.5928,
    country: 'US',
    type: 'research',
    operator: 'Johns Hopkins',
    capacity: 300,
    services: ['neurodevelopmental', 'behavioral_research', 'therapy'],
    aiEnabled: true,
  },
];

export const ROBOTICS_LABS: RoboticsLab[] = [
  {
    id: 'pollen-robotics',
    name: 'Pollen Robotics (Reachy)',
    lat: 44.8378,
    lon: -0.5792,
    country: 'FR',
    region: 'EU',
    focus: ['assistive_robotics', 'open_source', 'teleoperation'],
    products: ['Reachy'],
  },
  {
    id: 'toyota-hsr',
    name: 'Toyota Human Support Robot Lab',
    lat: 35.0421,
    lon: 137.1682,
    country: 'JP',
    region: 'JP',
    focus: ['home_assistance', 'care_robot', 'mobility'],
    products: ['HSR', 'T-HR3'],
  },
  {
    id: 'softbank-robotics',
    name: 'SoftBank Robotics',
    lat: 35.6762,
    lon: 139.6503,
    country: 'JP',
    region: 'JP',
    focus: ['social_robotics', 'care', 'education'],
    products: ['Pepper', 'Whiz'],
  },
  {
    id: 'fujisoft-palro',
    name: 'Fujisoft PALRO Lab',
    lat: 35.4437,
    lon: 139.6380,
    country: 'JP',
    region: 'JP',
    focus: ['elderly_care', 'communication', 'exercise'],
    products: ['PALRO'],
  },
  {
    id: 'intuition-robotics',
    name: 'Intuition Robotics (ElliQ)',
    lat: 32.0853,
    lon: 34.7818,
    country: 'IL',
    region: 'IL',
    focus: ['elderly_companionship', 'cognitive_engagement'],
    products: ['ElliQ'],
  },
  {
    id: 'samsung-bot',
    name: 'Samsung Bot Care Lab',
    lat: 37.3825,
    lon: 127.1197,
    country: 'KR',
    region: 'KR',
    focus: ['home_care', 'health_monitoring', 'assistance'],
    products: ['Bot Care', 'Bot Handy'],
  },
  {
    id: 'xiaomi-cyberdog',
    name: 'Xiaomi CyberDog Lab',
    lat: 39.9042,
    lon: 116.4074,
    country: 'CN',
    region: 'CN',
    focus: ['companion_robot', 'quadruped', 'care'],
    products: ['CyberDog', 'CyberDog 2'],
  },
  {
    id: 'ubtech-walker',
    name: 'UBTECH Robotics',
    lat: 22.5431,
    lon: 114.0579,
    country: 'CN',
    region: 'CN',
    focus: ['humanoid', 'education', 'service'],
    products: ['Walker X'],
  },
  {
    id: 'mit-csail',
    name: 'MIT CSAIL Assistive Robotics',
    lat: 42.3616,
    lon: -71.0909,
    country: 'US',
    region: 'US',
    focus: ['assistive_robotics', 'ai', 'human_robot_interaction'],
  },
  {
    id: 'cmu-ri',
    name: 'CMU Robotics Institute',
    lat: 40.4443,
    lon: -79.9457,
    country: 'US',
    region: 'US',
    focus: ['rehabilitation_robotics', 'assistive_tech', 'ai'],
  },
];

export const CARE_STARTUPS: CareStartup[] = [
  {
    id: 'carevia',
    name: 'CareVia',
    lat: 37.4013,
    lon: 127.1068,
    country: 'KR',
    domain: 'developmental_care_ai',
    fundingStage: 'seed',
    description: 'AI behavioral analysis platform for developmental disability care',
  },
  {
    id: 'brain-power',
    name: 'Brain Power',
    lat: 42.3601,
    lon: -71.0589,
    country: 'US',
    domain: 'autism_assistive_tech',
    fundingStage: 'seriesA',
    fundingAmountM: 12,
    description: 'AI-powered smart glasses for autism spectrum support',
  },
  {
    id: 'cognoa',
    name: 'Cognoa',
    lat: 37.4419,
    lon: -122.1430,
    country: 'US',
    domain: 'developmental_screening',
    fundingStage: 'seriesB',
    fundingAmountM: 43,
    description: 'FDA-cleared AI diagnostic for developmental delays',
  },
  {
    id: 'embodied',
    name: 'Embodied Inc.',
    lat: 33.9804,
    lon: -118.4658,
    country: 'US',
    domain: 'social_robotics',
    fundingStage: 'seriesA',
    fundingAmountM: 22,
    description: 'Moxie companion robot for child development',
  },
  {
    id: 'kebbi-nuwa',
    name: 'NUWA Robotics',
    lat: 25.0330,
    lon: 121.5654,
    country: 'TW',
    domain: 'education_care_robot',
    fundingStage: 'seriesA',
    fundingAmountM: 8,
    description: 'Kebbi robot for special education and therapy',
  },
  {
    id: 'birdie',
    name: 'Birdie',
    lat: 51.5074,
    lon: -0.1278,
    country: 'GB',
    domain: 'home_care_platform',
    fundingStage: 'seriesB',
    fundingAmountM: 30,
    description: 'AI-powered home care management platform',
  },
  {
    id: 'curai',
    name: 'Curai Health',
    lat: 37.7749,
    lon: -122.4194,
    country: 'US',
    domain: 'ai_primary_care',
    fundingStage: 'seriesB',
    fundingAmountM: 27,
    description: 'AI-assisted primary care with focus on underserved populations',
  },
  {
    id: 'exseed-health',
    name: 'ExSeed Health',
    lat: 55.6761,
    lon: 12.5683,
    country: 'DK',
    domain: 'digital_therapeutics',
    fundingStage: 'seriesA',
    fundingAmountM: 5,
    description: 'AI-powered reproductive health diagnostics',
  },
];
