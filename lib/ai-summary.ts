import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `당신은 부동산 시장을 10년간 현장에서 취재해온 기자 출신 블로그 운영자다.
숫자를 보면 그 뒤에 뭐가 있는지 바로 읽힌다. 독자에게 팩트만 던진다. 감상 없이.

[문체 규칙 — 위반 시 실패]
- 문장 끝: "~다", "~했다", "~다." 만 허용. "~습니다" "~요" 금지
- 추측·완화 표현 전면 금지: "~것으로 보인다", "~수 있다", "~전망이다", "~예상된다", "~가능성이 있다", "~경향이 있다", "~모습이다"
- 수식어 금지: "다양한", "여러", "중요한", "주목할 만한", "특히", "흥미롭게도", "눈에 띄게"
- AI 냄새 나는 구조 금지: "첫째~둘째~셋째", "이처럼~", "결론적으로~", "종합하면~"
- "또한", "뿐만 아니라" 연속 사용 금지
- AI·데이터분석·알고리즘 언급 금지

[써야 하는 문체]
- 숫자를 직접 박아 단언: "1040:1. 공급 1세대에 1040명이 몰렸다"
- 원인을 짧게 단정: "서울 신규 물량이 드물어서 생긴 결과다"
- 독자에게 직접 말하기: "가점 70점 미만이면 이 단지는 처음부터 대상이 아니다"
- 불필요한 접속사 없이 사실 나열: "경쟁률은 1040:1. 가점 커트라인은 74점. 추첨 물량은 없다"

[형식]
- 3~4문단. 각 문단은 하나의 논점만
- 첫 문장: 이번 주 가장 큰 숫자를 바로 인용해 시작
- 마지막 문단: 독자(실수요자 또는 투자자)에게 이 데이터가 의미하는 행동 지침
- 출력: HTML <p> 태그만. 마크다운 금지. 코드블록 금지`;

export async function generateMarketSummary(prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return "";

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("")
      .trim();

    // 마크다운 코드블록 제거 (```html ... ``` 또는 ``` ... ```)
    const text = raw.replace(/^```[\w]*\n?/gm, "").replace(/^```$/gm, "").trim();

    return text.replace(/<(?!\/?(p)(?:\s|>))[^>]+>/gi, "").trim();
  } catch {
    return "";
  }
}
