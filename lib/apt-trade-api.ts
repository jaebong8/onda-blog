import { XMLParser } from "fast-xml-parser";

const REGION_API = "http://apis.data.go.kr/1741000/StanReginCd/getStanReginCdList";
const APT_API = "https://apis.data.go.kr/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade";

const xmlParser = new XMLParser({ ignoreAttributes: false, parseTagValue: true });

export interface AptDeal {
  aptNm: string;
  dealAmount: number; // 만원
  excluUseAr: string;
  floor: string;
  umdNm: string;
  sigunguNm: string; // 시군구명 (estateAgentSggNm)
  sggCd: string;
  buildYear: string; // 건축년도
}

// 시도/시명 → 시군구 LAWD_CD (5자리) 동적 조회
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

  if (Array.isArray(data?.StanReginCd)) {
    const rowSection = data.StanReginCd.find(
      (x: unknown) => typeof x === "object" && x !== null && "row" in x
    ) as { row?: unknown } | undefined;
    const raw = rowSection?.row;
    rows = Array.isArray(raw) ? raw : raw ? [raw as Record<string, unknown>] : [];
  } else if (data?.response?.body?.items?.item) {
    const item = data.response.body.items.item;
    rows = Array.isArray(item) ? item : [item];
  }

  // 시군구 레벨: 3-5번째 자리 ≠ 000, 6-10번째 자리 = 00000
  const codes = rows
    .map((r) => String(r.region_cd ?? ""))
    .filter((cd) => cd.length === 10 && cd.slice(5) === "00000" && cd.slice(2, 5) !== "000")
    .map((cd) => cd.slice(0, 5));

  return codes.length > 0 ? codes : (SIDO_LAWD_CODES[sidoNm] ?? []);
}

// 폴백용 LAWD_CD 맵 — 특별시/광역시 + 인구 많은 주요 시 단위
export const SIDO_LAWD_CODES: Record<string, string[]> = {
  // 특별시 / 광역시
  서울특별시:    ["11110","11140","11170","11200","11215","11230","11260","11290","11305","11320","11350","11380","11410","11440","11470","11500","11530","11545","11560","11590","11620","11650","11680","11710","11740"],
  부산광역시:    ["26110","26140","26170","26200","26230","26260","26290","26320","26350","26380","26410","26440","26470","26500","26530","26710"],
  대구광역시:    ["27110","27140","27170","27200","27230","27260","27290","27710","27720"],
  인천광역시:    ["28110","28140","28177","28185","28200","28237","28245","28260","28710","28720"],
  광주광역시:    ["29110","29140","29155","29170","29200"],
  대전광역시:    ["30110","30140","30170","30200","30230"],
  울산광역시:    ["31110","31140","31170","31200","31710"],
  세종특별자치시: ["36110"],
  // 경기 주요 시
  수원시: ["41111","41113","41115","41117"],
  고양시: ["41210","41213","41215"],
  용인시: ["41285","41287","41289"],
  성남시: ["41131","41133","41135"],
  화성시: ["41390"],
  부천시: ["41171"],
  남양주시: ["41270"],
  안산시: ["41195","41197"],
  안양시: ["41153","41155"],
  평택시: ["41175"],
  김포시: ["41370"],
  의정부시: ["41151"],
  시흥시: ["41273"],
  // 경남 주요 시
  창원시: ["48120","48121","48123","48125","48127"],
  김해시: ["48250"],
  양산시: ["48330"],
  진주시: ["48170"],
  // 충남 주요 시
  천안시: ["44130","44131"],
  아산시: ["44200"],
  // 충북 주요 시
  청주시: ["43110","43111","43112","43113"],
  // 전북 주요 시
  전주시: ["45110","45111"],
  // 경북 주요 시
  포항시: ["47110","47111"],
  구미시: ["47190"],
  // 강원 주요 시
  원주시: ["51130"],
  춘천시: ["51110"],
  // 제주
  제주시: ["50110"],
};

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
      sigunguNm: String(item.estateAgentSggNm ?? "").trim(),
      sggCd: String(item.sggCd ?? ""),
      buildYear: String(item.buildYear ?? "").trim(),
    }))
    .filter((d) => d.dealAmount > 0);
}
