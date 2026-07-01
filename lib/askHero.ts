import { apiFetch, apiUrl } from '../api';
import type { CppValuations } from './cpp';

export interface HeroFlightResult {
  origin: string;
  destination: string;
  cabinClass: string;
  airline: string;
  program: string;
  pointsCost: number;
  taxesAndFees?: number;
  cashPrice?: number;
  cpp?: number;
  departureDate?: string;
  returnDate?: string;
  tripType?: 'one-way' | 'round-trip';
}

export interface AskHeroUserContext {
  homeAirport?: string;
  homeAirportLabel?: string;
  cppValuations?: CppValuations;
}

export interface AskHeroMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AskHeroResponse {
  content: string;
  title?: string | null;
}

const RESULTS_REGEX = /<results>([\s\S]*?)<\/results>/gi;

export function parseHeroResults(content: string): HeroFlightResult[] {
  const results: HeroFlightResult[] = [];
  let match: RegExpExecArray | null;
  const regex = new RegExp(RESULTS_REGEX.source, 'gi');
  while ((match = regex.exec(content)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item && typeof item === 'object' && item.origin && item.destination) {
            results.push(item as HeroFlightResult);
          }
        }
      }
    } catch {
      // ignore malformed blocks
    }
  }
  return results;
}

export function stripResultsBlocks(content: string): string {
  return content.replace(RESULTS_REGEX, '').trim();
}

export function splitMessageParts(content: string): Array<{ type: 'text'; text: string } | { type: 'results'; results: HeroFlightResult[] }> {
  const parts: Array<{ type: 'text'; text: string } | { type: 'results'; results: HeroFlightResult[] }> = [];
  let lastIndex = 0;
  const regex = new RegExp(RESULTS_REGEX.source, 'gi');
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    const before = content.slice(lastIndex, match.index).trim();
    if (before) parts.push({ type: 'text', text: before });
    const results = parseHeroResults(match[0]);
    if (results.length > 0) parts.push({ type: 'results', results });
    lastIndex = match.index + match[0].length;
  }

  const remaining = content.slice(lastIndex).trim();
  if (remaining) parts.push({ type: 'text', text: remaining });
  if (parts.length === 0 && content.trim()) {
    parts.push({ type: 'text', text: content.trim() });
  }
  return parts;
}

export type QualityBadge = 'Excellent' | 'Good' | 'Fair';

export function qualityFromCpp(cpp: number | undefined): QualityBadge {
  if (cpp == null || !Number.isFinite(cpp)) return 'Fair';
  if (cpp >= 2) return 'Excellent';
  if (cpp >= 1.4) return 'Good';
  return 'Fair';
}

export async function sendAskHeroMessage(
  messages: AskHeroMessage[],
  userContext: AskHeroUserContext,
): Promise<AskHeroResponse> {
  const response = await apiFetch(apiUrl('/api/ask-hero'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, userContext }),
  });
  const data = await response.json();
  if (!response.ok) {
    const detail = typeof data.detail === 'string'
      ? data.detail
      : 'Ask Hero is temporarily unavailable.';
    throw new Error(detail);
  }
  return data as AskHeroResponse;
}
