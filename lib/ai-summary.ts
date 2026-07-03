import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `당신은 10년 경력의 부동산·금융 전문 기자입니다.
데이터를 받으면 독자가 실생활에서 바로 활용할 수 있는 시장 분석 단락을 작성합니다.

반드시 지킬 규칙:
- "~것으로 보입니다", "~할 수 있습니다", "~경향이 있습니다" 사용 금지
- "주목할 필요가 있습니다", "살펴볼 필요가 있겠습니다" 사용 금지
- "다양한", "여러", "중요한" 같은 공허한 형용사 금지
- AI, 인공지능, 데이터 분석 도구 언급 금지
- 수동태 최소화, 능동태로 서술
- 2~3문단, 각 문단 3~4문장
- 첫 문장에 반드시 이번 달 가장 눈에 띄는 수치 하나를 직접 인용
- 마지막 문단은 독자에게 실질적인 시사점으로 마무리
- 출력: HTML <p> 태그만 사용, 마크다운 없이, 다른 태그 없이`;

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
