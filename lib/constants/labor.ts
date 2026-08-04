/**
 * 노동·고용 관련 법정 상수 단일 출처.
 *
 * 계산기들은 반드시 이 파일만 참조한다. 값이 여러 곳에 흩어지면
 * 매년 갱신할 때 일부만 바뀌어 계산 결과가 어긋난다.
 *
 * 갱신 방법은 상수마다 다르므로 각 항목 주석에 출처를 남긴다.
 */

/** 이 파일의 값들이 적용되는 기준 연도. 화면 표기에도 쓴다. */
export const LABOR_YEAR = 2026;

/**
 * 최저임금 (시간급, 원)
 * 출처: 공공데이터포털 15068774 (고용노동부_연도별 최저임금)
 * 주의: 매년 8월 고시되지만 위 데이터셋 반영은 이듬해 1월이다.
 *       8월~12월 사이에 다음해 값을 넣으려면 고시 원문을 직접 확인해야 한다.
 */
export const MINIMUM_WAGE: Record<number, number> = {
  2025: 10_030,
  2026: 10_320,
};

/**
 * 구직급여(실업급여) 1일 지급액 한도 (원)
 *
 * 상한액: 고용보험법 시행령상 임금일액 상한(113,500원)의 60%
 * 하한액: 최저임금 × 80% × 8시간 — 아래 assert로 검산한다
 *
 * 출처: 고용노동부 고시. 매년 1월 1일 이후 이직자부터 적용.
 */
export const JOB_SEEKING_ALLOWANCE = {
  /** 평균임금 대비 지급률 (고용보험법 §46) */
  RATE: 0.6,
  /** 임금일액 상한 (이 금액의 60%가 1일 상한액) */
  DAILY_WAGE_CAP: 113_500,
  /** 1일 상한액 */
  DAILY_MAX: 68_100,
  /** 1일 하한액 = 최저임금 × 80% × 8시간 */
  DAILY_MIN: 66_048,
} as const;

/**
 * 소정급여일수 (고용보험법 별표1)
 * 연령은 이직 당시 만 나이 기준. 장애인은 50세 이상과 동일하게 본다.
 * 이 표는 2019년 10월 개정 이후 변동이 없다.
 */
export const BENEFIT_DAYS = {
  under50: { lt1: 120, lt3: 150, lt5: 180, lt10: 210, gte10: 240 },
  over50: { lt1: 120, lt3: 180, lt5: 210, lt10: 240, gte10: 270 },
} as const;

export type InsuredPeriod = keyof typeof BENEFIT_DAYS.under50;

export const INSURED_PERIOD_LABELS: Record<InsuredPeriod, string> = {
  lt1: "1년 미만",
  lt3: "1년 이상 ~ 3년 미만",
  lt5: "3년 이상 ~ 5년 미만",
  lt10: "5년 이상 ~ 10년 미만",
  gte10: "10년 이상",
};

/** 수급자격: 이직일 이전 18개월간 필요한 피보험 단위기간 (일) */
export const REQUIRED_INSURED_DAYS = 180;

// ── 검산 ──
// 하한액은 최저임금에서 파생되므로, 둘 중 하나만 갱신하면 즉시 어긋난다.
// 개발 중에 바로 잡히도록 모듈 로드 시점에 확인한다.
if (process.env.NODE_ENV !== "production") {
  const derived = Math.floor(MINIMUM_WAGE[LABOR_YEAR] * 0.8 * 8);
  if (derived !== JOB_SEEKING_ALLOWANCE.DAILY_MIN) {
    console.warn(
      `[labor.ts] 하한액 불일치: 최저임금 ${MINIMUM_WAGE[LABOR_YEAR]}원에서 계산하면 ` +
        `${derived}원인데 DAILY_MIN은 ${JOB_SEEKING_ALLOWANCE.DAILY_MIN}원이다. ` +
        `최저임금이나 하한액 중 한쪽만 갱신했는지 확인하라.`
    );
  }
  if (
    Math.floor(JOB_SEEKING_ALLOWANCE.DAILY_WAGE_CAP * JOB_SEEKING_ALLOWANCE.RATE) !==
    JOB_SEEKING_ALLOWANCE.DAILY_MAX
  ) {
    console.warn("[labor.ts] 상한액이 임금일액 상한의 60%와 맞지 않는다.");
  }
}
