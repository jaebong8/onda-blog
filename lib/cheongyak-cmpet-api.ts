const BASE_URL = "https://api.odcloud.kr/api/ApplyhomeInfoCmpetRtSvc/v1";

export interface CmpetRow {
  houseTy: string;
  suplyHshldco: number;
  subscrptRankCode: number;
  resideSecd: string;
  reqCnt: number;
  cmpetRate: string;
}

export interface ScoreRow {
  houseTy: string;
  resideSecd: string;
  lwetScore: string;   // 최저가점
  topScore: string;    // 최고가점
  avrgScore: string;   // 평균가점
}

function condParam(key: string, val: string) {
  return encodeURIComponent(`cond[${key}::EQ]`) + `=${val}`;
}

export async function fetchCmpetRates(
  apiKey: string,
  houseManageNo: string,
  pblancNo: string
): Promise<CmpetRow[]> {
  const params = [
    `serviceKey=${apiKey}`,
    `page=1&perPage=200&returnType=json`,
    condParam("HOUSE_MANAGE_NO", houseManageNo),
    condParam("PBLANC_NO", pblancNo),
  ].join("&");
  const url = `${BASE_URL}/getAPTLttotPblancCmpet?${params}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`경쟁률 API ${res.status}`);
  const data = await res.json();
  const items = (data.data ?? []) as Record<string, unknown>[];

  return items.map((item) => ({
    houseTy: String(item.HOUSE_TY ?? ""),
    suplyHshldco: Number(item.SUPLY_HSHLDCO ?? 0),
    subscrptRankCode: Number(item.SUBSCRPT_RANK_CODE ?? 0),
    resideSecd: String(item.RESIDE_SECD ?? ""),
    reqCnt: Number(item.REQ_CNT ?? 0),
    cmpetRate: String(item.CMPET_RATE ?? ""),
  }));
}

export async function fetchScores(
  apiKey: string,
  houseManageNo: string,
  pblancNo: string
): Promise<ScoreRow[]> {
  const params = [
    `serviceKey=${apiKey}`,
    `page=1&perPage=200&returnType=json`,
    condParam("HOUSE_MANAGE_NO", houseManageNo),
    condParam("PBLANC_NO", pblancNo),
    condParam("RESIDE_SECD", "01"),  // 해당지역만
  ].join("&");
  const url = `${BASE_URL}/getAptLttotPblancScore?${params}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`가점 API ${res.status}`);
  const data = await res.json();
  const items = (data.data ?? []) as Record<string, unknown>[];

  return items.map((item) => ({
    houseTy: String(item.HOUSE_TY ?? ""),
    resideSecd: String(item.RESIDE_SECD ?? ""),
    lwetScore: String(item.LWET_SCORE ?? ""),
    topScore: String(item.TOP_SCORE ?? ""),
    avrgScore: String(item.AVRG_SCORE ?? ""),
  }));
}
