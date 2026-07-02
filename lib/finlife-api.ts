const MORTGAGE_API = "http://finlife.fss.or.kr/finlifeapi/mortgageLoanProductsSearch.json";
const RENT_LOAN_API = "http://finlife.fss.or.kr/finlifeapi/rentHouseLoanProductsSearch.json";

export interface LoanProduct {
  korCoNm: string;       // 은행명
  finPrdtNm: string;     // 상품명
  lendRateMin: number;   // 최저금리
  lendRateMax: number;   // 최고금리
  lendRateAvg: number;   // 평균금리
  rpayTypeNm: string;    // 상환방식
  lendRateTypeNm: string; // 금리유형 (고정/변동/혼합)
  mrtgTypeNm: string;    // 담보유형 (주담대만)
  loanLmt: string;       // 대출한도
  dclsMonth: string;     // 공시월 (YYYYMM)
}

interface BaseInfo {
  fin_co_no: string;
  fin_prdt_cd: string;
  kor_co_nm: string;
  fin_prdt_nm: string;
  loan_lmt: string;
  dcls_month: string;
}

interface OptionInfo {
  fin_co_no: string;
  fin_prdt_cd: string;
  mrtg_type_nm?: string;
  rpay_type_nm: string;
  lend_rate_type_nm: string;
  lend_rate_min: string | null;
  lend_rate_max: string | null;
  lend_rate_avg: string | null;
}

function parseResult(data: unknown): { baseList: BaseInfo[]; optionList: OptionInfo[]; maxPageNo: number } {
  const result = (data as { result?: Record<string, unknown> })?.result ?? {};
  const baseList = Array.isArray(result.baseList) ? (result.baseList as BaseInfo[]) : [];
  const optionList = Array.isArray(result.optionList) ? (result.optionList as OptionInfo[]) : [];
  const maxPageNo = Number(result.max_page_no ?? 1);
  return { baseList, optionList, maxPageNo };
}

async function fetchAllPages(apiUrl: string, apiKey: string): Promise<{ baseList: BaseInfo[]; optionList: OptionInfo[] }> {
  const allBase: BaseInfo[] = [];
  const allOptions: OptionInfo[] = [];
  let pageNo = 1;

  while (pageNo <= 20) {
    const url = new URL(apiUrl);
    url.searchParams.set("auth", apiKey);
    url.searchParams.set("topFinGrpNo", "020000"); // 은행권
    url.searchParams.set("pageNo", String(pageNo));

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Finlife API ${res.status} (page ${pageNo})`);
    const data = await res.json();

    const { baseList, optionList, maxPageNo } = parseResult(data);
    allBase.push(...baseList);
    allOptions.push(...optionList);

    if (pageNo >= maxPageNo) break;
    pageNo++;
  }

  return { baseList: allBase, optionList: allOptions };
}

function buildProducts(baseList: BaseInfo[], optionList: OptionInfo[], mrtgDefault = ""): LoanProduct[] {
  // baseList와 optionList를 fin_co_no + fin_prdt_cd 기준으로 조인
  const baseMap = new Map<string, BaseInfo>();
  for (const b of baseList) {
    baseMap.set(`${b.fin_co_no}|${b.fin_prdt_cd}`, b);
  }

  const products: LoanProduct[] = [];
  for (const opt of optionList) {
    const rateMin = parseFloat(opt.lend_rate_min ?? "");
    const rateMax = parseFloat(opt.lend_rate_max ?? "");
    const rateAvg = parseFloat(opt.lend_rate_avg ?? "");
    if (isNaN(rateMin) || rateMin <= 0) continue;

    const base = baseMap.get(`${opt.fin_co_no}|${opt.fin_prdt_cd}`);
    if (!base) continue;

    products.push({
      korCoNm: base.kor_co_nm,
      finPrdtNm: base.fin_prdt_nm,
      lendRateMin: rateMin,
      lendRateMax: isNaN(rateMax) ? rateMin : rateMax,
      lendRateAvg: isNaN(rateAvg) ? rateMin : rateAvg,
      rpayTypeNm: opt.rpay_type_nm || "-",
      lendRateTypeNm: opt.lend_rate_type_nm || "-",
      mrtgTypeNm: opt.mrtg_type_nm || mrtgDefault,
      loanLmt: base.loan_lmt || "-",
      dclsMonth: base.dcls_month,
    });
  }

  return products;
}

// 은행별 최저금리 상품 1건씩만 추려서 TOP 10 반환
function topByBank(products: LoanProduct[], limit = 10): LoanProduct[] {
  const bankMap = new Map<string, LoanProduct>();
  for (const p of products) {
    const existing = bankMap.get(p.korCoNm);
    if (!existing || p.lendRateMin < existing.lendRateMin) {
      bankMap.set(p.korCoNm, p);
    }
  }
  return Array.from(bankMap.values())
    .sort((a, b) => a.lendRateMin - b.lendRateMin)
    .slice(0, limit);
}

export async function fetchMortgageRateTop10(apiKey: string): Promise<LoanProduct[]> {
  const { baseList, optionList } = await fetchAllPages(MORTGAGE_API, apiKey);
  const products = buildProducts(baseList, optionList);
  return topByBank(products);
}

export async function fetchRentLoanRateTop10(apiKey: string): Promise<LoanProduct[]> {
  const { baseList, optionList } = await fetchAllPages(RENT_LOAN_API, apiKey);
  const products = buildProducts(baseList, optionList, "전세");
  return topByBank(products);
}
