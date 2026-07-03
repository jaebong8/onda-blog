export const CITY_NAMES: Record<string, string> = {
  seoul: "서울",
  busan: "부산",
  daegu: "대구",
  incheon: "인천",
  gwangju: "광주",
  daejeon: "대전",
  ulsan: "울산",
  sejong: "세종",
  suwon: "수원",
  goyang: "고양",
  yongin: "용인",
  seongnam: "성남",
  hwaseong: "화성",
  bucheon: "부천",
  namyangju: "남양주",
  ansan: "안산",
  anyang: "안양",
  pyeongtaek: "평택",
  gimpo: "김포",
  uijeongbu: "의정부",
  siheung: "시흥",
  changwon: "창원",
  gimhae: "김해",
  yangsan: "양산",
  jinju: "진주",
  cheonan: "천안",
  asan: "아산",
  cheongju: "청주",
  jeonju: "전주",
  pohang: "포항",
  gumi: "구미",
  wonju: "원주",
  chuncheon: "춘천",
  jeju: "제주",
};

export const REGIONS: { name: string; cities: string[] }[] = [
  {
    name: "수도권",
    cities: ["seoul", "incheon", "suwon", "goyang", "yongin", "seongnam", "hwaseong", "bucheon", "namyangju", "ansan", "anyang", "pyeongtaek", "gimpo", "uijeongbu", "siheung"],
  },
  { name: "광역시", cities: ["busan", "daegu", "gwangju", "daejeon", "ulsan"] },
  { name: "충청·세종", cities: ["sejong", "cheonan", "asan", "cheongju"] },
  { name: "전라", cities: ["jeonju"] },
  { name: "경상", cities: ["changwon", "gimhae", "yangsan", "jinju", "pohang", "gumi"] },
  { name: "강원", cities: ["wonju", "chuncheon"] },
  { name: "제주", cities: ["jeju"] },
];

export function extractCity(slug: string): string | null {
  const m = slug.match(/^apt-(?:rent-)?top10-([a-z]+)-/);
  return m ? m[1] : null;
}
