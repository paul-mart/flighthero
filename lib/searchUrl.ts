export interface FlightSearchRequest {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  tripType: 'one-way' | 'round-trip';
  searchType: 'points';
  cabinClass: string;
  adults: number;
  childrenCount: number;
}

export function buildSearchPageUrl(request: FlightSearchRequest): string {
  const params = new URLSearchParams({
    origin: request.origin.trim(),
    destination: request.destination.trim(),
    departure_date: request.departureDate,
    search_type: request.searchType,
    trip_type: request.tripType,
    cabin_class: request.cabinClass,
    adults: String(request.adults),
    children: String(request.childrenCount),
  });
  if (request.tripType === 'round-trip' && request.returnDate) {
    params.set('return_date', request.returnDate);
  }
  const url = new URL(import.meta.env.BASE_URL, window.location.origin);
  url.search = params.toString();
  return url.href;
}

export function openFlightSearchInNewTab(request: FlightSearchRequest): void {
  window.open(buildSearchPageUrl(request), '_blank', 'noopener,noreferrer');
}

export function parseFlightSearchFromParams(params: URLSearchParams): FlightSearchRequest | null {
  const origin = params.get('origin')?.trim();
  const destination = params.get('destination')?.trim();
  const departureDate = params.get('departure_date')?.trim();
  if (!origin || !destination || !departureDate) return null;

  const tripType = params.get('trip_type') === 'one-way' ? 'one-way' : 'round-trip';
  const returnDate = params.get('return_date')?.trim() ?? '';
  if (tripType === 'round-trip' && !returnDate) return null;

  const searchType = 'points' as const;
  const cabinClass = params.get('cabin_class') || 'economy';
  const adultsRaw = Number(params.get('adults'));
  const childrenRaw = Number(params.get('children'));
  const adults = Number.isFinite(adultsRaw)
    ? Math.min(9, Math.max(1, adultsRaw))
    : 1;
  const childrenCount = Number.isFinite(childrenRaw)
    ? Math.min(8, Math.max(0, childrenRaw))
    : 0;

  return {
    origin,
    destination,
    departureDate,
    returnDate,
    tripType,
    searchType,
    cabinClass,
    adults,
    childrenCount,
  };
}

export function getFlightSearchValidationError(request: FlightSearchRequest): string | null {
  const missing: string[] = [];
  if (!request.origin.trim()) missing.push('From');
  if (!request.destination.trim()) missing.push('To');
  if (!request.departureDate) missing.push('Departure date');
  if (request.tripType === 'round-trip' && !request.returnDate) missing.push('Return date');
  if (missing.length === 0) return null;
  return `Please complete all required fields before searching.\n\nMissing: ${missing.join(', ')}`;
}
