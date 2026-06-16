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

// 사업연도 기준 국고보조사업 공모(공고) 전체 목록 조회 (페이지네이션 자동 처리)
export async function fetchSubsidyNotices(bsnsyear: string, apiKey: string): Promise<SubsidyNotice[]> {
  const numOfRows = 100;
  const all: Record<string, unknown>[] = [];
  let pageNo = 1;

  while (pageNo <= 50) {
    const url = new URL(SUBSIDY_API);
    url.searchParams.set("serviceKey", apiKey);
    url.searchParams.set("pageNo", String(pageNo));
    url.searchParams.set("numOfRows", String(numOfRows));
    url.searchParams.set("resultType", "json");
    url.searchParams.set("bsnsyear", bsnsyear);

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Subsidy API ${res.status}`);
    const data = await res.json();

    const items = normalizeItems(data);
    all.push(...items);

    if (items.length < numOfRows || all.length >= totalCount(data)) break;
    pageNo++;
  }

  return all.map((item) => ({
    pblancNm: String(item.PBLANC_NM ?? "").trim(),
    dtlbzNm: String(item.DTLBZ_NM ?? "").trim(),
    ddtlbzNm: String(item.DDTLBZ_NM ?? "").trim(),
    jrsdNm: String(item.JRSD_NM ?? "").trim(),
    ctprvnNm: String(item.CTPRVN_NM ?? "").trim(),
    signguNm: String(item.SIGNGU_NM ?? "").trim(),
    pblancBeginDe: String(item.PBLANC_BEGIN_DE ?? "").trim(),
    pblancEndDe: String(item.PBLANC_END_DE ?? "").trim(),
    rceptBeginDe: String(item.RCEPT_BEGIN_DE ?? "").trim(),
    rceptEndDe: String(item.RCEPT_END_DE ?? "").trim(),
    rceptPdDc: String(item.RCEPT_PD_DC ?? "").trim(),
    sportBgamt: String(item.SPORT_BGAMT ?? "").trim(),
    sportTrgetCn: String(item.SPORT_TRGET_CN ?? "").trim(),
    exclTrgetCn: String(item.EXCL_TRGET_CN ?? "").trim(),
    slctnStdrDc: String(item.SLCTN_STDR_DC ?? "").trim(),
    reqstRceptMthCn: String(item.REQST_RCEPT_MTH_CN ?? "").trim(),
    bsnsGuidanceUrl: String(item.BSNS_GUIDANCE_URL ?? "").trim(),
  }));
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
