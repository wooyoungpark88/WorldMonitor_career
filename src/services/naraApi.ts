/**
 * 나라장터 조달 API — 공공조달 입찰 공고 직접 조회
 * https://www.g2b.go.kr/
 *
 * VITE_G2B_API_KEY 환경변수 필요
 */

const G2B_API_KEY = import.meta.env.VITE_G2B_API_KEY || '';
const G2B_BASE = 'https://apis.data.go.kr/1230000/BidPublicInfoService04';

export interface NaraProcurement {
  bidNtceNo: string;       // 입찰공고번호
  bidNtceNm: string;       // 입찰공고명
  ntceInsttNm: string;     // 공고기관명
  dminsttNm: string;       // 수요기관명
  presmptPrce: number;     // 추정가격
  bidNtceDt: string;       // 입찰공고일시
  bidClseDt: string;       // 입찰마감일시
  link: string;            // 나라장터 링크
  rgstDt: string;          // 등록일시
}

// AI/돌봄 관련 검색 키워드
const SEARCH_KEYWORDS = [
  '인공지능',
  'AI',
  '돌봄',
  '장애인',
  '행동분석',
  '정신건강',
  '디지털치료',
  '원격의료',
  '케어',
  '복지',
];

export function isNaraConfigured(): boolean {
  return !!G2B_API_KEY;
}

/**
 * 키워드별 입찰 공고 조회
 */
async function searchBids(keyword: string): Promise<NaraProcurement[]> {
  if (!isNaraConfigured()) return [];

  try {
    const url = `${G2B_BASE}/getBidPblancListInfoThngPPSSrch?serviceKey=${G2B_API_KEY}&numOfRows=10&pageNo=1&inqryDiv=1&inqryBgnDt=${getDateStr(-30)}&inqryEndDt=${getDateStr(0)}&bidNtceNm=${encodeURIComponent(keyword)}&type=json`;

    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return [];

    const data = await res.json();
    const items = data?.response?.body?.items ?? [];
    if (!Array.isArray(items)) return [];

    return items.map((item: Record<string, unknown>) => ({
      bidNtceNo: String(item.bidNtceNo || ''),
      bidNtceNm: String(item.bidNtceNm || ''),
      ntceInsttNm: String(item.ntceInsttNm || ''),
      dminsttNm: String(item.dminsttNm || ''),
      presmptPrce: Number(item.presmptPrce || 0),
      bidNtceDt: String(item.bidNtceDt || ''),
      bidClseDt: String(item.bidClseDt || ''),
      link: `https://www.g2b.go.kr/pt/menu/selectSubFrame.do?framesrc=/pt/menu/frameTgong.do?bidNtceNo=${item.bidNtceNo}`,
      rgstDt: String(item.rgstDt || ''),
    }));
  } catch (e) {
    console.warn(`[나라장터] Search failed for "${keyword}":`, e);
    return [];
  }
}

function getDateStr(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

/**
 * AI/돌봄 관련 입찰 공고 일괄 조회
 */
export async function fetchNaraProcurements(): Promise<NaraProcurement[]> {
  if (!isNaraConfigured()) return [];

  const results = await Promise.allSettled(
    SEARCH_KEYWORDS.map(kw => searchBids(kw))
  );

  const all: NaraProcurement[] = [];
  const seen = new Set<string>();

  for (const r of results) {
    if (r.status === 'fulfilled') {
      for (const item of r.value) {
        if (!seen.has(item.bidNtceNo)) {
          seen.add(item.bidNtceNo);
          all.push(item);
        }
      }
    }
  }

  // Sort by registration date descending
  return all.sort((a, b) => b.bidNtceDt.localeCompare(a.bidNtceDt));
}
