const BASE_URL = "https://api.odcloud.kr/api/ApplyhomeInfoDetailSvc/v1";

export interface CheongyakListing {
  houseNm: string;
  hssplyAdres: string;
  subscrptAreaCodeNm: string;
  houseDtlSecdNm: string;
  spsplyRceptBgnde: string;
  spsplyRceptEndde: string;
  rceptBgnde: string;
  rceptEndde: string;
  totSuplyHshldco: number;
  przwnerPresnatnDe: string;
  mvnPrearngeYm: string;
  pblancUrl: string;
  publicHouseEarthAt: string;
}

export async function fetchAPTListings(apiKey: string, fromDate: string): Promise<CheongyakListing[]> {
  const url =
    `${BASE_URL}/getAPTLttotPblancDetail` +
    `?serviceKey=${apiKey}&page=1&perPage=100&returnType=json` +
    `&cond%5BRCEPT_ENDDE%3A%3AGTE%5D=${fromDate}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`청약홈 API ${res.status}`);
  const data = await res.json();
  const items = (data.data ?? []) as Record<string, unknown>[];

  return items.map((item) => ({
    houseNm: String(item.HOUSE_NM ?? ""),
    hssplyAdres: String(item.HSSPLY_ADRES ?? ""),
    subscrptAreaCodeNm: String(item.SUBSCRPT_AREA_CODE_NM ?? ""),
    houseDtlSecdNm: String(item.HOUSE_DTL_SECD_NM ?? ""),
    spsplyRceptBgnde: String(item.SPSPLY_RCEPT_BGNDE ?? ""),
    spsplyRceptEndde: String(item.SPSPLY_RCEPT_ENDDE ?? ""),
    rceptBgnde: String(item.RCEPT_BGNDE ?? ""),
    rceptEndde: String(item.RCEPT_ENDDE ?? ""),
    totSuplyHshldco: Number(item.TOT_SUPLY_HSHLDCO ?? 0),
    przwnerPresnatnDe: String(item.PRZWNER_PRESNATN_DE ?? ""),
    mvnPrearngeYm: String(item.MVN_PREARNGE_YM ?? ""),
    pblancUrl: String(item.PBLANC_URL ?? ""),
    publicHouseEarthAt: String(item.PUBLIC_HOUSE_EARTH_AT ?? "N"),
  }));
}

export function overlapsWeek(listing: CheongyakListing, weekStart: Date, weekEnd: Date): boolean {
  const parse = (s: string) => (s ? new Date(s) : null);

  const spsStart = parse(listing.spsplyRceptBgnde);
  const spsEnd = parse(listing.spsplyRceptEndde);
  if (spsStart && spsEnd && spsStart <= weekEnd && spsEnd >= weekStart) return true;

  const gnrlStart = parse(listing.rceptBgnde);
  const gnrlEnd = parse(listing.rceptEndde);
  if (gnrlStart && gnrlEnd && gnrlStart <= weekEnd && gnrlEnd >= weekStart) return true;

  return false;
}
