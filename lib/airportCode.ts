export function extractAirportCode(value: string): string | null {
  const cleaned = value.trim().toUpperCase();
  const trailing = cleaned.match(/\(([A-Z]{3})\)\s*$/);
  if (trailing) return trailing[1];
  const parenCodes = [...cleaned.matchAll(/\(([A-Z]{3})\)/g)];
  if (parenCodes.length > 0) return parenCodes[parenCodes.length - 1][1];
  if (/^[A-Z]{3}$/.test(cleaned)) return cleaned;
  const wordMatch = cleaned.match(/\b([A-Z]{3})\b/);
  return wordMatch ? wordMatch[1] : null;
}
