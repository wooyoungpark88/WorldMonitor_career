/**
 * DART 전자공시 API — 경쟁사 공시 정보 조회
 * https://opendart.fss.or.kr/
 *
 * VITE_DART_API_KEY 환경변수 필요
 */

const DART_API_KEY = import.meta.env.VITE_DART_API_KEY || '';
const DART_BASE = 'https://opendart.fss.or.kr/api';

export interface DartDisclosure {
  rcept_no: string;       // 접수번호
  corp_name: string;      // 회사명
  report_nm: string;      // 보고서명
  rcept_dt: string;       // 접수일자
  flr_nm: string;         // 공시 제출인명
  rm: string;             // 비고
  link: string;           // DART 링크
}

// Competitor corp codes (DART에서 조회)
const COMPETITOR_CORPS: Record<string, string> = {
  '네오펙트': '00830628',
  '뷰노': '01117600',
  '루닛': '01431875',
  // Add more as needed - corp codes from DART
};

export function isDartConfigured(): boolean {
  return !!DART_API_KEY;
}

/**
 * 특정 기업의 최근 공시 조회
 */
export async function fetchCompanyDisclosures(
  corpCode: string,
  days = 30
): Promise<DartDisclosure[]> {
  if (!isDartConfigured()) return [];

  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

  const bgn = startDate.toISOString().slice(0, 10).replace(/-/g, '');
  const end = endDate.toISOString().slice(0, 10).replace(/-/g, '');

  try {
    const url = `${DART_BASE}/list.json?crtfc_key=${DART_API_KEY}&corp_code=${corpCode}&bgn_de=${bgn}&end_de=${end}&page_count=20`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return [];

    const data = await res.json();
    if (data.status !== '000' || !data.list) return [];

    return data.list.map((item: Record<string, string>) => ({
      rcept_no: item.rcept_no || '',
      corp_name: item.corp_name || '',
      report_nm: item.report_nm || '',
      rcept_dt: item.rcept_dt || '',
      flr_nm: item.flr_nm || '',
      rm: item.rm || '',
      link: `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${item.rcept_no}`,
    }));
  } catch (e) {
    console.warn('[DART] Fetch failed:', e);
    return [];
  }
}

/**
 * 모든 경쟁사의 최근 공시 일괄 조회
 */
export async function fetchAllCompetitorDisclosures(days = 30): Promise<DartDisclosure[]> {
  if (!isDartConfigured()) return [];

  const results = await Promise.allSettled(
    Object.values(COMPETITOR_CORPS).map(code => fetchCompanyDisclosures(code, days))
  );

  const all: DartDisclosure[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') all.push(...r.value);
  }

  // Sort by date descending
  return all.sort((a, b) => b.rcept_dt.localeCompare(a.rcept_dt));
}

export { COMPETITOR_CORPS };
