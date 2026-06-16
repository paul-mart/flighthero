export interface FlightTimeParts {
  time?: string;
  timezone?: string;
  at?: string;
}

export interface FormattedFlightTime {
  time: string;
  timezone: string;
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

  return `${hours.toString().padStart(2, '0')}:${minutes}`;
}

function formatMilitaryFromIso(at: string): string {
  const match = at.match(/T(\d{2}):(\d{2})/);
  if (!match) return '';
  return `${match[1]}:${match[2]}`;
}

function extractIsoDate(at: string): string | null {
  const match = at.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

export function isNextDayArrival(departureAt?: string, arrivalAt?: string): boolean {
  if (!departureAt || !arrivalAt) return false;
  const departureDate = extractIsoDate(departureAt);
  const arrivalDate = extractIsoDate(arrivalAt);
  if (!departureDate || !arrivalDate) return false;
  return arrivalDate > departureDate;
}

export function formatSingleFlightTimeParts(
  { time, timezone, at }: FlightTimeParts,
  militaryTime: boolean,
): FormattedFlightTime {
  const label = time?.trim() ?? '';
  const tz = timezone?.trim() ?? '';

  if (!label) {
    return { time: '', timezone: tz };
  }

  const displayTime = militaryTime
    ? ((at ? formatMilitaryFromIso(at) : '') || convert12ToMilitary(label))
    : label;

  return { time: displayTime, timezone: tz };
}

export function formatSingleFlightTime(
  parts: FlightTimeParts,
  militaryTime: boolean,
): string {
  const { time, timezone } = formatSingleFlightTimeParts(parts, militaryTime);
  if (!time) return '';
  return timezone ? `${time} ${timezone}` : time;
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
