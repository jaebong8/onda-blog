export interface TocHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

export function extractHeadings(html: string): TocHeading[] {
  const result: TocHeading[] = [];
  const seen = new Map<string, number>();
  for (const match of html.matchAll(/<h([23])[^>]*>([\s\S]*?)<\/h\1>/gi)) {
    const level = Number(match[1]) as 2 | 3;
    const text = match[2].replace(/<[^>]+>/g, "").trim();
    if (!text) continue;
    const base = text
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9가-힣-]/g, "")
      .slice(0, 60);
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    const id = count === 0 ? base : `${base}-${count}`;
    result.push({ id, text, level });
  }
  return result;
}

export function injectHeadingIds(html: string, headings: TocHeading[]): string {
  let i = 0;
  return html.replace(/<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi, (_, level, attrs, content) => {
    if (i >= headings.length) return _;
    const { id } = headings[i++];
    const cleanAttrs = attrs.replace(/\s*id="[^"]*"/g, "");
    return `<h${level}${cleanAttrs} id="${id}">${content}</h${level}>`;
  });
}
