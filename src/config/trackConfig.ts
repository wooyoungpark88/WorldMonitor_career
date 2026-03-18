/**
 * Trend Tracking — Track(소스 기반) 메타데이터
 * RSS 피드 출처별 수집 목적, 한글 라벨, 툴팁
 */

export type TrackType = 'caretech' | 'investment' | 'competitor' | 'policy';

export interface TrackMeta {
  label: string;
  tooltip: string;
}

export const TRACK_META: Record<TrackType, TrackMeta> = {
  caretech: {
    label: '케어테크 뉴스',
    tooltip: '케어테크 산업 뉴스 피드에서 수집',
  },
  investment: {
    label: '투자/펀딩',
    tooltip: '투자·펀딩 뉴스 피드에서 수집',
  },
  competitor: {
    label: '경쟁사',
    tooltip: '경쟁사 모니터링 피드에서 수집',
  },
  policy: {
    label: '정책/조달',
    tooltip: '공공 조달·정책 뉴스 피드에서 수집',
  },
};
