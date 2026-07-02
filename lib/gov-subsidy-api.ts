const SUBSIDY_API = "https://apis.data.go.kr/1051000/MoefOpenAPI2025/T_OPD_ASBS_PBNS_UNITY";

export interface SubsidyNotice {
  pblancNm: string;
  dtlbzNm: string;
  ddtlbzNm: string;
  jrsdNm: string;
  ctprvnNm: string;
  signguNm: string;
  pblancBeginDe: string;
  pblancEndDe: string;
  rceptBeginDe: string;
  rceptEndDe: string;
  rceptPdDc: string;
  sportBgamt: string;
  sportTrgetCn: string;
  exclTrgetCn: string;
  slctnStdrDc: string;
  reqstRceptMthCn: string;
  bsnsGuidanceUrl: string;
}

// JSON 응답에 남아있는 XML CDATA 래퍼 제거
function stripCdata(s: string): string {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
}

function str(v: unknown): string {
  return stripCdata(String(v ?? "").trim());
}

function normalizeItems(data: unknown): Record<string, unknown>[] {
  const body = (data as { response?: { body?: unknown } })?.response?.body;
  const items = (body as { items?: unknown })?.items;

  if (Array.isArray(items)) return items as Record<string, unknown>[];
  const nested = (items as { item?: unknown } | undefined)?.item;
  if (Array.isArray(nested)) return nested as Record<string, unknown>[];
  if (nested && typeof nested === "object") return [nested as Record<string, unknown>];
  return [];
}

function totalCount(data: unknown): number {
  const body = (data as { response?: { body?: { totalCount?: number | string } } })?.response?.body;
  return Number(body?.totalCount ?? 0);
}

function makeUrl(bsnsyear: string, apiKey: string, pageNo: number, numOfRows: number): string {
  const url = new URL(SUBSIDY_API);
  url.searchParams.set("serviceKey", apiKey);
  url.searchParams.set("pageNo", String(pageNo));
  url.searchParams.set("numOfRows", String(numOfRows));
  url.searchParams.set("resultType", "json");
  url.searchParams.set("bsnsyear", bsnsyear);
  return url.toString();
}

// 사업연도 기준 국고보조사업 공모(공고) 목록 조회
// 1페이지를 먼저 받아 totalCount 확인 후 나머지를 병렬로 요청
export async function fetchSubsidyNotices(bsnsyear: string, apiKey: string): Promise<SubsidyNotice[]> {
  const numOfRows = 100;
  const MAX_PAGES = 10;

  const firstRes = await fetch(makeUrl(bsnsyear, apiKey, 1, numOfRows));
  if (!firstRes.ok) throw new Error(`Subsidy API ${firstRes.status}`);
  const firstData = await firstRes.json();

  const firstItems = normalizeItems(firstData);
  const total = totalCount(firstData);
  const maxPage = Math.min(Math.ceil(total / numOfRows), MAX_PAGES);

  const rest = maxPage > 1
    ? await Promise.all(
        Array.from({ length: maxPage - 1 }, (_, i) =>
          fetch(makeUrl(bsnsyear, apiKey, i + 2, numOfRows))
            .then((r) => r.json())
            .then((d) => normalizeItems(d))
            .catch(() => [] as Record<string, unknown>[])
        )
      )
    : [];

  const all = [...firstItems, ...rest.flat()];

  return all
    .map((item) => ({
      pblancNm: str(item.PBLANC_NM),
      dtlbzNm: str(item.DTLBZ_NM),
      ddtlbzNm: str(item.DDTLBZ_NM),
      jrsdNm: str(item.JRSD_NM),
      ctprvnNm: str(item.CTPRVN_NM),
      signguNm: str(item.SIGNGU_NM),
      pblancBeginDe: str(item.PBLANC_BEGIN_DE),
      pblancEndDe: str(item.PBLANC_END_DE),
      rceptBeginDe: str(item.RCEPT_BEGIN_DE),
      rceptEndDe: str(item.RCEPT_END_DE),
      rceptPdDc: str(item.RCEPT_PD_DC),
      sportBgamt: str(item.SPORT_BGAMT),
      sportTrgetCn: str(item.SPORT_TRGET_CN),
      exclTrgetCn: str(item.EXCL_TRGET_CN),
      slctnStdrDc: str(item.SLCTN_STDR_DC),
      reqstRceptMthCn: str(item.REQST_RCEPT_MTH_CN),
      bsnsGuidanceUrl: str(item.BSNS_GUIDANCE_URL),
    }))
    // 공모 공고가 있는 레코드만 (PBLANC_NM 또는 RCEPT 날짜 중 하나라도 있는 것)
    .filter((n) => n.pblancNm || n.rceptEndDe || n.pblancEndDe);
}

export function parseYmd(s: string): Date | null {
  const digits = s.replace(/[^0-9]/g, "");
  if (digits.length !== 8) return null;
  const y = digits.slice(0, 4);
  const m = digits.slice(4, 6);
  const d = digits.slice(6, 8);
  const date = new Date(`${y}-${m}-${d}T00:00:00+09:00`);
  return isNaN(date.getTime()) ? null : date;
}
