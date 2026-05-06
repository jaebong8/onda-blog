export function extractHashtags(html: string): string[] {
  const text = html.replace(/<[^>]+>/g, " ");
  const matches = text.match(/#([가-힣a-zA-Z0-9_]+)/g) ?? [];
  return [...new Set(matches.map((m) => m.slice(1)))];
}
