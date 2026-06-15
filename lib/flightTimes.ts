export interface FlightTimeParts {
  time?: string;
  timezone?: string;
  at?: string;
}

function convert12ToMilitary(time: string): string {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return time.trim();

  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const period = match[3].toUpperCase();

  if (period === 'AM') {
    if (hours === 12) hours = 0;
  } else if (hours !== 12) {
    hours += 12;
  }

  return `${hours.toString().padStart(2, '0')}${minutes}`;
}

function formatZuluFromIso(at: string): string {
  const parsed = new Date(at);
  if (Number.isNaN(parsed.getTime())) return '';
  const hours = parsed.getUTCHours().toString().padStart(2, '0');
  const minutes = parsed.getUTCMinutes().toString().padStart(2, '0');
  return `${hours}${minutes}Z`;
}

function formatMilitaryFromIso(at: string): string {
  const match = at.match(/T(\d{2}):(\d{2})/);
  if (!match) return '';
  return `${match[1]}${match[2]}`;
}

export function formatSingleFlightTime(
  { time, timezone, at }: FlightTimeParts,
  militaryZulu: boolean,
): string {
  const label = time?.trim();
  if (!label) return '';

  const tz = timezone?.trim() ?? '';

  if (!militaryZulu) {
    return tz ? `${label} ${tz}` : label;
  }

  const military = (at ? formatMilitaryFromIso(at) : '') || convert12ToMilitary(label);
  const zulu = at ? formatZuluFromIso(at) : '';

  if (zulu && tz) return `${military} ${tz} (${zulu})`;
  if (tz) return `${military} ${tz}`;
  if (zulu) return `${military} (${zulu})`;
  return military;
}

export function formatFlightTimeRange(
  departure: FlightTimeParts,
  arrival: FlightTimeParts,
  militaryZulu: boolean,
): string {
  if (!departure.time?.trim() || !arrival.time?.trim()) return '';

  return `${formatSingleFlightTime(departure, militaryZulu)} – ${formatSingleFlightTime(arrival, militaryZulu)}`;
}

export function getDepartureSortMinutes(flight: {
  departure_time?: string;
  departure_at?: string;
}): number | null {
  if (flight.departure_at) {
    const wallClock = flight.departure_at.match(/T(\d{2}):(\d{2})/);
    if (wallClock) {
      return parseInt(wallClock[1], 10) * 60 + parseInt(wallClock[2], 10);
    }
  }

  const time = flight.departure_time?.trim();
  if (!time) return null;

  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();

  if (period === 'AM') {
    if (hours === 12) hours = 0;
  } else if (hours !== 12) {
    hours += 12;
  }

  return hours * 60 + minutes;
}
