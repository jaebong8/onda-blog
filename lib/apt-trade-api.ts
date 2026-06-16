import { XMLParser } from "fast-xml-parser";

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

// 시도별 시군구 LAWD_CD (법정동코드 앞 5자리) 하드코딩
export const SIDO_LAWD_CODES: Record<string, string[]> = {
  서울특별시: ["11110","11140","11170","11200","11215","11230","11260","11290","11305","11320","11350","11380","11410","11440","11470","11500","11530","11545","11560","11590","11620","11650","11680","11710","11740"],
  부산광역시: ["26110","26140","26170","26200","26230","26260","26290","26320","26350","26380","26410","26440","26470","26500","26530","26710"],
  대구광역시: ["27110","27140","27170","27200","27230","27260","27290","27710","27720"],
  인천광역시: ["28110","28140","28177","28185","28200","28237","28245","28260","28710","28720"],
  광주광역시: ["29110","29140","29155","29170","29200"],
  대전광역시: ["30110","30140","30170","30200","30230"],
  울산광역시: ["31110","31140","31170","31200","31710"],
  세종특별자치시: ["36110"],
  경기도: ["41111","41113","41115","41117","41131","41133","41135","41151","41153","41155","41171","41173","41175","41190","41195","41197","41210","41213","41215","41220","41250","41270","41271","41273","41275","41277","41281","41285","41287","41289","41290","41310","41360","41370","41390","41410","41430","41450","41460","41480","41490","41500"],
  강원특별자치도: ["51110","51130","51150","51170","51190","51210","51230","51720","51730","51750","51760","51770","51780","51790","51800","51810","51820","51830"],
  충청북도: ["43110","43111","43112","43113","43130","43150","43720","43730","43740","43745","43750","43760","43770","43800"],
  충청남도: ["44130","44131","44150","44180","44200","44210","44230","44250","44270","44710","44760","44770","44790","44800","44810","44825"],
  전북특별자치도: ["45110","45111","45130","45140","45180","45190","45210","45710","45720","45730","45740","45750","45770","45790","45800"],
  전라남도: ["46110","46130","46150","46170","46230","46710","46720","46730","46770","46780","46790","46800","46810","46820","46830","46840","46860","46870","46880","46890","46900","46910"],
  경상북도: ["47110","47111","47130","47150","47170","47190","47210","47220","47230","47250","47280","47730","47750","47760","47770","47820","47830","47840","47850","47900","47920","47930","47940"],
  경상남도: ["48120","48121","48123","48125","48127","48170","48220","48240","48250","48270","48310","48330","48720","48730","48740","48820","48840","48850","48860","48870","48880","48890"],
  제주특별자치도: ["50110","50130"],
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
      sggCd: String(item.sggCd ?? ""),
    }))
    .filter((d) => d.dealAmount > 0);
}
