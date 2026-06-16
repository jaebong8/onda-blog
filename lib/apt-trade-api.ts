import { XMLParser } from "fast-xml-parser";

const REGION_API = "https://apis.data.go.kr/1741000/StanReginCd/StanReginCdList";
const APT_API = "https://apis.data.go.kr/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade";

const xmlParser = new XMLParser({ ignoreAttributes: false, parseTagValue: true });

export interface AptDeal {
  aptNm: string;
  dealAmount: number; // 만원
  excluUseAr: string;
  floor: string;
  umdNm: string;
  sggCd: string;
}

// 시도명 → 시군구 LAWD_CD 5자리 목록
export async function fetchSiGunGuCodes(sidoNm: string, apiKey: string): Promise<string[]> {
  const url = new URL(REGION_API);
  url.searchParams.set("ServiceKey", apiKey);
  url.searchParams.set("pageNo", "1");
  url.searchParams.set("numOfRows", "500");
  url.searchParams.set("type", "json");
  url.searchParams.set("locatadd_nm", sidoNm);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`StanReginCd API ${res.status}`);

  const data = await res.json();

  let rows: Record<string, unknown>[] = [];

  // 행정표준코드 API JSON 구조: { StanReginCd: [ { head: [...] }, { row: [...] } ] }
  if (Array.isArray(data?.StanReginCd)) {
    const rowSection = data.StanReginCd.find((x: unknown) => {
      return typeof x === "object" && x !== null && "row" in x;
    }) as { row?: unknown } | undefined;
    const raw = rowSection?.row;
    rows = Array.isArray(raw) ? raw : raw ? [raw as Record<string, unknown>] : [];
  } else if (data?.response?.body?.items?.item) {
    const item = data.response.body.items.item;
    rows = Array.isArray(item) ? item : [item];
  }

  // 시군구 레벨: region_cd 6-10번째 자리 = 00000, 3-5번째 자리 ≠ 000
  return rows
    .map((r) => String(r.region_cd ?? ""))
    .filter((cd) => cd.length === 10 && cd.slice(5) === "00000" && cd.slice(2, 5) !== "000")
    .map((cd) => cd.slice(0, 5));
}

// 특정 시군구 + 계약월 실거래가 목록
export async function fetchAptDeals(lawdCd: string, dealYmd: string, apiKey: string): Promise<AptDeal[]> {
  const url = new URL(APT_API);
  url.searchParams.set("serviceKey", apiKey);
  url.searchParams.set("LAWD_CD", lawdCd);
  url.searchParams.set("DEAL_YMD", dealYmd);
  url.searchParams.set("numOfRows", "1000");
  url.searchParams.set("pageNo", "1");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`AptTrade API ${res.status} for ${lawdCd}`);

  const xml = await res.text();
  const parsed = xmlParser.parse(xml);

  const resultCode = parsed?.response?.header?.resultCode;
  if (resultCode && resultCode !== "00" && resultCode !== 0) return [];

  const items = parsed?.response?.body?.items?.item;
  if (!items) return [];

  const arr: Record<string, unknown>[] = Array.isArray(items) ? items : [items];
  return arr
    .map((item) => ({
      aptNm: String(item.aptNm ?? "").trim(),
      dealAmount: parseInt(String(item.dealAmount ?? "0").replace(/,/g, ""), 10),
      excluUseAr: String(item.excluUseAr ?? "").trim(),
      floor: String(item.floor ?? "").trim(),
      umdNm: String(item.umdNm ?? "").trim(),
      sggCd: String(item.sggCd ?? ""),
    }))
    .filter((d) => d.dealAmount > 0);
}
