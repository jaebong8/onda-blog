// 아파트 매매/전월세 TOP10 포스트 대상 지역 — 특별시/광역시 + 인구가 많은 주요 시
export const SIDO_LIST = [
  // 특별시 / 광역시
  "서울특별시", "부산광역시", "대구광역시", "인천광역시",
  "광주광역시", "대전광역시", "울산광역시", "세종특별자치시",
  // 경기 주요 시
  "수원시", "고양시", "용인시", "성남시", "화성시",
  "부천시", "남양주시", "안산시", "안양시", "평택시", "김포시", "의정부시", "시흥시",
  // 경남 주요 시
  "창원시", "김해시", "양산시", "진주시",
  // 충남 / 충북
  "천안시", "아산시", "청주시",
  // 전북
  "전주시",
  // 경북
  "포항시", "구미시",
  // 강원
  "원주시", "춘천시",
  // 제주
  "제주시",
];

export const SIDO_SLUG: Record<string, string> = {
  서울특별시: "seoul", 부산광역시: "busan", 대구광역시: "daegu", 인천광역시: "incheon",
  광주광역시: "gwangju", 대전광역시: "daejeon", 울산광역시: "ulsan", 세종특별자치시: "sejong",
  수원시: "suwon", 고양시: "goyang", 용인시: "yongin", 성남시: "seongnam",
  화성시: "hwaseong", 부천시: "bucheon", 남양주시: "namyangju", 안산시: "ansan",
  안양시: "anyang", 평택시: "pyeongtaek", 김포시: "gimpo", 의정부시: "uijeongbu", 시흥시: "siheung",
  창원시: "changwon", 김해시: "gimhae", 양산시: "yangsan", 진주시: "jinju",
  천안시: "cheonan", 아산시: "asan", 청주시: "cheongju",
  전주시: "jeonju",
  포항시: "pohang", 구미시: "gumi",
  원주시: "wonju", 춘천시: "chuncheon",
  제주시: "jeju",
};
