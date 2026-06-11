const BASE_URL = "http://openapi.foodsafetykorea.go.kr/api";
const SERVICE_ID = "C004";
export const PAGE_SIZE = 500;

export interface HygieneRow {
  HG_ASGN_NM: string;
  HG_ASGN_LV: string;
  HG_ASGN_NO: string;
  HG_ASGN_YMD: string;
  INDUTY_NM: string;
  LCNS_NO: string;
  BSSH_NM: string;
  PRSDNT_NM: string;
  ADDR: string;
  ASGN_FROM: string;
  ASGN_TO: string;
  TELNO: string;
  WRKR_REG_NO: string;
  ASGN_CANCEL_YMD: string;
  CLSBIZ_DVS_CD_NM: string;
  CLSBIZ_DT: string;
  CHNG_DT: string;
  INSTT_CD_NM: string;
}

interface ApiResponse {
  C004: {
    total_count: string;
    row?: HygieneRow[];
    RESULT: { CODE: string; MSG: string };
  };
}

function parseAddress(addr: string): { siDo: string; siGunGu: string } {
  const parts = addr.trim().split(/\s+/);
  return { siDo: parts[0] ?? "", siGunGu: parts[1] ?? "" };
}

export async function fetchHygienePage(
  apiKey: string,
  start: number,
  end: number,
  changedAfter?: string
): Promise<{ total: number; rows: HygieneRow[] }> {
  const filter = changedAfter ? `/CHNG_DT=${changedAfter}` : "";
  const url = `${BASE_URL}/${apiKey}/${SERVICE_ID}/json/${start}/${end}${filter}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data: ApiResponse = await res.json();
  const c004 = data.C004;

  if (!c004.RESULT.CODE.startsWith("INFO-0")) {
    throw new Error(`API error: ${c004.RESULT.MSG}`);
  }

  return {
    total: parseInt(c004.total_count, 10) || 0,
    rows: c004.row ?? [],
  };
}

export function rowToRecord(row: HygieneRow) {
  const { siDo, siGunGu } = parseAddress(row.ADDR);
  return {
    lcnsNo: row.LCNS_NO,
    bizName: row.BSSH_NM,
    industryName: row.INDUTY_NM,
    grade: row.HG_ASGN_LV,
    assignOrgName: row.HG_ASGN_NM,
    assignNo: row.HG_ASGN_NO || null,
    address: row.ADDR,
    siDo,
    siGunGu,
    phone: row.TELNO || null,
    presidentName: row.PRSDNT_NM || null,
    bizRegNo: row.WRKR_REG_NO || null,
    assignFrom: row.ASGN_FROM || null,
    assignTo: row.ASGN_TO || null,
    assignedAt: row.HG_ASGN_YMD || null,
    canceledAt: row.ASGN_CANCEL_YMD || null,
    bizStatus: row.CLSBIZ_DVS_CD_NM || null,
    closedAt: row.CLSBIZ_DT || null,
    changedAt: row.CHNG_DT || null,
    instituteName: row.INSTT_CD_NM || null,
    syncedAt: new Date(),
  };
}
