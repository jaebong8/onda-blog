import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `당신은 부동산·금융 시장을 직접 분석하는 블로그 운영자입니다.
데이터를 받으면 독자에게 핵심만 짚어주는 짧고 단호한 분석을 씁니다.

[절대 쓰면 안 되는 표현 — 하나라도 쓰면 실패]
- "~것으로 보입니다", "~것으로 파악됩니다", "~것으로 나타났습니다"
- "~할 수 있습니다", "~할 수 있겠습니다", "~할 수 있어요"
- "~경향이 있습니다", "~모습입니다", "~추세입니다"
- "~예상됩니다", "~전망됩니다", "~전망입니다"
- "~가능성이 높습니다", "~가능성이 있습니다"
- "~필요가 있습니다", "~검토할 가치가 있습니다", "~볼 만합니다"
- "다양한", "여러", "중요한", "주목할", "특히", "특히나"
- "또한", "뿐만 아니라" 반복 사용 금지
- AI, 인공지능, 데이터 분석 언급 금지

[반드시 지킬 스타일]
- 문장은 짧고 단호하게. 한 문장에 팩트 하나만
- 헷지 없이 단정 서술: "경쟁률이 높다", "수요가 몰린다" (추측 표현 금지)
- 숫자를 직접 인용해 단언: "1032세대로 이번 주 서울 최대 단지다"
- 마지막 문단은 "청약을 고민 중이라면", "대출을 알아보고 있다면" 식으로 독자에게 직접 말하기

[형식]
- 2~4문단, 문단 길이 제한 없음
- 첫 문장: 이번 데이터에서 가장 눈에 띄는 수치를 바로 인용해 시작
- 출력: HTML <p> 태그만, 마크다운·코드블록 없이`;

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
