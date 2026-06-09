import React, { useEffect, useMemo, useRef, useState } from 'react';

interface AwardDetails {
  points_required: number;
  taxes_and_fees: number;
  transfer_partners: string[];
}

function ChevronDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

interface FilterDropdownProps<T extends string | number> {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  ariaLabel: string;
  minTriggerWidth?: number;
  disabled?: boolean;
}

function FilterDropdown<T extends string | number>({
  value,
  onChange,
  options,
  ariaLabel,
  minTriggerWidth,
  disabled = false,
}: FilterDropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const [hoveredOption, setHoveredOption] = useState<T | null>(null);
  const [triggerHovered, setTriggerHovered] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selectedLabel = options.find((option) => option.value === value)?.label ?? '';

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  useEffect(() => {
    if (!open || disabled) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
        triggerRef.current?.blur();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.blur();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const selectOption = (next: T) => {
    onChange(next);
    setOpen(false);
    setHoveredOption(null);
    triggerRef.current?.blur();
  };

  return (
    <div ref={rootRef} style={styles.filterDropdown}>
      <button
        ref={triggerRef}
        type="button"
        className="filter-trigger"
        style={{
          ...styles.filterTrigger,
          ...(disabled ? styles.filterTriggerDisabled : {}),
          ...(open && !disabled ? styles.filterTriggerOpen : triggerHovered && !disabled ? styles.filterTriggerHover : {}),
          ...(minTriggerWidth ? { minWidth: minTriggerWidth } : {}),
        }}
        onMouseEnter={() => !disabled && setTriggerHovered(true)}
        onMouseLeave={() => setTriggerHovered(false)}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          if (disabled) return;
          setOpen((prev) => {
            if (prev) setHoveredOption(null);
            return !prev;
          });
        }}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-disabled={disabled}
      >
        <span style={styles.filterTriggerLabel}>{selectedLabel}</span>
        <span style={{ ...styles.filterChevron, ...(open ? styles.filterChevronOpen : triggerHovered ? styles.filterChevronHover : {}) }}>
          <ChevronDownIcon />
        </span>
      </button>
      {open && (
        <ul style={styles.filterMenu} role="listbox" aria-label={ariaLabel}>
          {options.map((option) => (
            <li key={String(option.value)} role="none">
              <button
                type="button"
                role="option"
                className="filter-option"
                aria-selected={option.value === value}
                style={{
                  ...styles.filterOption,
                  ...(hoveredOption === option.value ? styles.filterOptionHover : {}),
                }}
                onMouseEnter={() => setHoveredOption(option.value)}
                onMouseLeave={() => setHoveredOption(null)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectOption(option.value)}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface PassengerDropdownProps {
  adults: number;
  childCount: number;
  onChange: (adults: number, childCount: number) => void;
}

function PassengerDropdown({ adults, childCount, onChange }: PassengerDropdownProps) {
  const [open, setOpen] = useState(false);
  const [triggerHovered, setTriggerHovered] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const total = adults + childCount;
  const label = `${total} Passenger${total === 1 ? '' : 's'}`;

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
        triggerRef.current?.blur();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.blur();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const adjustAdults = (delta: number) => {
    const nextAdults = adults + delta;
    if (nextAdults < 1 || nextAdults > 9 || nextAdults + childCount > 9) return;
    onChange(nextAdults, childCount);
  };

  const adjustChildren = (delta: number) => {
    const nextChildren = childCount + delta;
    if (nextChildren < 0 || nextChildren > 8 || adults + nextChildren > 9) return;
    onChange(adults, nextChildren);
  };

  return (
    <div ref={rootRef} style={styles.filterDropdown}>
      <button
        ref={triggerRef}
        type="button"
        className="filter-trigger"
        style={{
          ...styles.filterTrigger,
          ...styles.passengerTrigger,
          ...(open ? styles.filterTriggerOpen : triggerHovered ? styles.filterTriggerHover : {}),
        }}
        onMouseEnter={() => setTriggerHovered(true)}
        onMouseLeave={() => setTriggerHovered(false)}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Passengers"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <span style={styles.filterTriggerLabel}>{label}</span>
        <span style={{ ...styles.filterChevron, ...(open ? styles.filterChevronOpen : triggerHovered ? styles.filterChevronHover : {}) }}>
          <ChevronDownIcon />
        </span>
      </button>
      {open && (
        <div style={styles.passengerMenu} role="dialog" aria-label="Passenger selection">
          <div style={styles.passengerRow}>
            <div style={styles.passengerRowLabel}>
              <span style={styles.passengerLabel}>Adults:</span>
            </div>
            <div style={styles.stepper}>
              <button
                type="button"
                className="stepper-btn"
                style={{
                  ...styles.stepperBtn,
                  ...(adults <= 1 ? styles.stepperBtnDisabled : {}),
                }}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => adjustAdults(-1)}
                disabled={adults <= 1}
                aria-label="Decrease adults"
              >
                −
              </button>
              <span style={styles.stepperValue}>{adults}</span>
              <button
                type="button"
                className="stepper-btn"
                style={{
                  ...styles.stepperBtn,
                  ...(adults + childCount >= 9 ? styles.stepperBtnDisabled : {}),
                }}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => adjustAdults(1)}
                disabled={adults + childCount >= 9}
                aria-label="Increase adults"
              >
                +
              </button>
            </div>
          </div>
          <div style={{ ...styles.passengerRow, ...styles.passengerRowLast }}>
            <div style={styles.passengerRowLabel}>
              <span style={styles.passengerLabel}>Children:</span>
              <span style={styles.passengerSublabel}>(Aged 2-11)</span>
            </div>
            <div style={styles.stepper}>
              <button
                type="button"
                className="stepper-btn"
                style={{
                  ...styles.stepperBtn,
                  ...(childCount <= 0 ? styles.stepperBtnDisabled : {}),
                }}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => adjustChildren(-1)}
                disabled={childCount <= 0}
                aria-label="Decrease children"
              >
                −
              </button>
              <span style={styles.stepperValue}>{childCount}</span>
              <button
                type="button"
                className="stepper-btn"
                style={{
                  ...styles.stepperBtn,
                  ...(childCount >= 8 || adults + childCount >= 9 ? styles.stepperBtnDisabled : {}),
                }}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => adjustChildren(1)}
                disabled={childCount >= 8 || adults + childCount >= 9}
                aria-label="Increase children"
              >
                +
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DepartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
    </svg>
  );
}

function ArriveIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M2 16v-2l8-5V3.5a1.5 1.5 0 013 0V9l8 5v2l-8-2.5V19l2 1.5V22l-3.5-1-3.5 1v-1.5L11 19v-5.5L2 16z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zm0 16H5V10h14v10z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

function SwapIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <path d="M7 16V4M7 4L3 8M7 4l4 4M17 8v12M17 20l4-4M17 20l-4-4" />
    </svg>
  );
}

interface Flight {
  id: number | string;
  origin: string;
  destination: string;
  departure_date: string;
  departure_time?: string;
  arrival_time?: string;
  carrier: string;
  flight_number: string;
  duration: string;
  duration_minutes?: number;
  stops: number;
  cash_price: number;
  award_details?: AwardDetails;
}

type StopsFilter = 'nonstop' | '1-or-fewer' | '2-or-fewer';
type SortOption = 'price-asc' | 'price-desc' | 'duration-asc' | 'duration-desc';

function matchesStopsFilter(stops: number, filter: StopsFilter): boolean {
  if (filter === 'nonstop') return stops === 0;
  if (filter === '1-or-fewer') return stops <= 1;
  return stops <= 2;
}

function getSortPrice(flight: Flight, searchType: 'cash' | 'points'): number {
  if (searchType === 'points' && flight.award_details) {
    return flight.award_details.points_required;
  }
  return flight.cash_price;
}

function getDurationMinutes(flight: Flight): number {
  if (flight.duration_minutes != null) return flight.duration_minutes;
  const match = flight.duration.match(/(?:(\d+)h)?\s*(?:(\d+)m)?/i);
  if (!match) return 0;
  return parseInt(match[1] || '0', 10) * 60 + parseInt(match[2] || '0', 10);
}

function sortFlights(flights: Flight[], sortOption: SortOption, searchType: 'cash' | 'points'): Flight[] {
  const sorted = [...flights];
  sorted.sort((a, b) => {
    if (sortOption === 'price-asc') {
      return getSortPrice(a, searchType) - getSortPrice(b, searchType);
    }
    if (sortOption === 'price-desc') {
      return getSortPrice(b, searchType) - getSortPrice(a, searchType);
    }
    if (sortOption === 'duration-asc') {
      return getDurationMinutes(a) - getDurationMinutes(b);
    }
    return getDurationMinutes(b) - getDurationMinutes(a);
  });
  return sorted;
}

function formatPrice(amount: number): string {
  return `$${Math.round(amount).toLocaleString()}`;
}

export default function App() {
  const [adults, setAdults] = useState(1);
  const [childrenCount, setChildrenCount] = useState(0);
  const passengers = adults + childrenCount;
  const [tripType, setTripType] = useState<'one-way' | 'round-trip'>('round-trip');
  const [cabinClass, setCabinClass] = useState('economy');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [searchType, setSearchType] = useState<'cash' | 'points'>('cash');
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [stopsFilter, setStopsFilter] = useState<StopsFilter>('2-or-fewer');
  const [sortOption, setSortOption] = useState<SortOption>('price-asc');
  const [advancedEnabled, setAdvancedEnabled] = useState(false);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState('Missing information');

  const showDialog = (title: string, message: string) => {
    setModalTitle(title);
    setValidationWarning(message);
  };

  const displayedFlights = useMemo(() => {
    if (!advancedEnabled) {
      return sortFlights(flights, 'price-asc', searchType);
    }
    const filtered = flights.filter((flight) => matchesStopsFilter(flight.stops, stopsFilter));
    return sortFlights(filtered, sortOption, searchType);
  }, [flights, stopsFilter, sortOption, searchType, advancedEnabled]);

  const swapRoute = () => {
    setOrigin(destination);
    setDestination(origin);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedOrigin = origin.trim();
    const trimmedDestination = destination.trim();
    const missing: string[] = [];
    if (!trimmedOrigin) missing.push('From');
    if (!trimmedDestination) missing.push('To');
    if (!date) missing.push('Departure date');
    if (tripType === 'round-trip' && !returnDate) missing.push('Return date');

    if (missing.length > 0) {
      showDialog(
        'Missing information',
        `Please complete all required fields before searching.\n\nMissing: ${missing.join(', ')}`
      );
      return;
    }

    setLoading(true);
    setFlights([]);
    try {
      const params = new URLSearchParams({
        origin: trimmedOrigin,
        destination: trimmedDestination,
        departure_date: date,
        search_type: searchType,
        passengers: String(passengers),
        adults: String(adults),
        children: String(childrenCount),
        trip_type: tripType,
        cabin_class: cabinClass,
      });
      if (tripType === 'round-trip') {
        params.set('return_date', returnDate);
      }
      const response = await fetch(`http://localhost:8000/api/search?${params}`);
      const data = await response.json();
      if (!response.ok) {
        const detail = typeof data.detail === 'string'
          ? data.detail
          : Array.isArray(data.detail)
            ? data.detail.map((item: { msg?: string }) => item.msg).filter(Boolean).join(', ')
            : 'Flight search failed.';
        showDialog('Search error', detail);
        return;
      }
      setFlights(data);
      if (Array.isArray(data) && data.length === 0) {
        showDialog(
          'No flights found',
          'No flights were found for your search. Try different dates or airports.'
        );
      }
    } catch (error) {
      console.error("Error fetching flights:", error);
      showDialog(
        'Connection error',
        'Could not reach the flight search server. Make sure the Python backend is running.'
      );
    } finally {
      setHasSearched(true);
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>✈️ FlightHero</h1>
        <p>Find the best routes using cash or credit card transfer points</p>
      </header>

      {/* Search Panel */}
      <div style={styles.searchPanel}>
        <form onSubmit={handleSearch} style={styles.form}>
          <div style={styles.filterBar}>
            <FilterDropdown
              value={tripType}
              onChange={(value) => {
                setTripType(value);
                if (value === 'one-way') setReturnDate('');
              }}
              options={[
                { value: 'round-trip', label: 'Round trip' },
                { value: 'one-way', label: 'One way' },
              ]}
              ariaLabel="Trip type"
              minTriggerWidth={120}
            />

            <PassengerDropdown
              adults={adults}
              childCount={childrenCount}
              onChange={(nextAdults, nextChildren) => {
                setAdults(nextAdults);
                setChildrenCount(nextChildren);
              }}
            />

            <FilterDropdown
              value={cabinClass}
              onChange={setCabinClass}
              options={[
                { value: 'economy', label: 'Economy' },
                { value: 'premium-economy', label: 'Premium economy' },
                { value: 'business', label: 'Business' },
                { value: 'first', label: 'First class' },
              ]}
              ariaLabel="Cabin class"
              minTriggerWidth={168}
            />

            <FilterDropdown
              value={searchType}
              onChange={setSearchType}
              options={[
                { value: 'cash', label: 'Cash fares' },
                { value: 'points', label: 'Points' },
              ]}
              ariaLabel="Search mode"
              minTriggerWidth={88}
            />
          </div>

          <div style={styles.mainBar}>
            <div style={styles.routeBlock}>
              <div style={styles.routeField}>
                <span style={styles.fieldIcon}><DepartIcon /></span>
                <input
                  type="text"
                  placeholder="From (e.g. JFK)"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  style={styles.routeInput}
                  aria-label="Origin"
                />
              </div>

              <button
                type="button"
                onClick={swapRoute}
                style={styles.swapBtn}
                aria-label="Swap origin and destination"
                title="Swap airports"
              >
                <SwapIcon />
              </button>

              <div style={styles.routeField}>
                <span style={styles.fieldIcon}><ArriveIcon /></span>
                <input
                  type="text"
                  placeholder="To (e.g. LAX)"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  style={styles.routeInput}
                  aria-label="Destination"
                />
              </div>
            </div>

            <div style={styles.dateBlock}>
              <span style={styles.fieldIcon}><CalendarIcon /></span>
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  if (returnDate && e.target.value && returnDate < e.target.value) {
                    setReturnDate('');
                  }
                }}
                style={styles.dateInput}
                aria-label="Departure date"
              />
              <span style={{ ...styles.dateArrow, ...(tripType === 'one-way' ? styles.dateHidden : {}) }}>→</span>
              <input
                type="date"
                value={returnDate}
                min={date || undefined}
                onChange={(e) => setReturnDate(e.target.value)}
                style={{ ...styles.dateInput, ...(tripType === 'one-way' ? styles.dateHidden : {}) }}
                disabled={tripType === 'one-way'}
                tabIndex={tripType === 'one-way' ? -1 : 0}
                aria-label="Return date"
                aria-hidden={tripType === 'one-way'}
              />
            </div>

            <button type="submit" style={styles.searchBtn} disabled={loading}>
              <SearchIcon />
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {hasSearched && (
          <div style={styles.advancedSection}>
            <label style={styles.advancedToggle}>
              <input
                type="checkbox"
                checked={advancedEnabled}
                onChange={(e) => setAdvancedEnabled(e.target.checked)}
                style={styles.advancedCheckbox}
              />
              <span>Advanced settings</span>
            </label>

            <div style={styles.advancedControlsRow}>
              <div style={styles.advancedControlItem}>
                <span style={{
                  ...styles.advancedControlLabel,
                  ...(advancedEnabled ? {} : styles.advancedControlLabelDisabled),
                }}>
                  Stops:
                </span>
                <FilterDropdown
                  value={stopsFilter}
                  onChange={setStopsFilter}
                  options={[
                    { value: 'nonstop', label: 'Nonstop' },
                    { value: '1-or-fewer', label: '1 stop or fewer' },
                    { value: '2-or-fewer', label: '2 stops or fewer' },
                  ]}
                  ariaLabel="Stops"
                  disabled={!advancedEnabled}
                />
              </div>

              <div style={styles.advancedControlItem}>
                <span style={{
                  ...styles.advancedControlLabel,
                  ...(advancedEnabled ? {} : styles.advancedControlLabelDisabled),
                }}>
                  Sort by:
                </span>
                <FilterDropdown
                  value={sortOption}
                  onChange={setSortOption}
                  options={[
                    { value: 'price-asc', label: 'Price: low to high' },
                    { value: 'price-desc', label: 'Price: high to low' },
                    { value: 'duration-asc', label: 'Duration: shortest first' },
                    { value: 'duration-desc', label: 'Duration: longest first' },
                  ]}
                  ariaLabel="Sort by"
                  disabled={!advancedEnabled}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Section */}
      <main style={styles.resultsContainer}>
        {hasSearched && flights.length > 0 && (
          <p style={styles.resultsCount}>
            Showing {displayedFlights.length} of {flights.length} flight{flights.length === 1 ? '' : 's'}
          </p>
        )}
        {displayedFlights.length > 0 ? (
          displayedFlights.map((flight) => (
            <div key={flight.id} style={styles.flightCard}>
              <div style={styles.flightInfo}>
                <div style={styles.carrierBadge}>{flight.carrier}</div>
                <div style={styles.routeDetails}>
                  <strong>{flight.origin} → {flight.destination}</strong>
                  {flight.departure_time && flight.arrival_time && (
                    <span style={styles.timeText}>
                      {flight.departure_time} – {flight.arrival_time}
                    </span>
                  )}
                  <span style={styles.subtext}>
                    {flight.flight_number} • {flight.duration} • {flight.stops === 0 ? 'Nonstop' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
                  </span>
                </div>
              </div>

              <div style={styles.pricingSection}>
                {searchType === 'cash' ? (
                  <div style={styles.priceText}>{formatPrice(flight.cash_price)}</div>
                ) : (
                  flight.award_details && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={styles.pointsText}>
                        {flight.award_details.points_required.toLocaleString()} pts
                      </div>
                      <div style={styles.subtext}>+ {formatPrice(flight.award_details.taxes_and_fees)} fees</div>
                      <div style={styles.partnerContainer}>
                        {flight.award_details.transfer_partners.map((p, i) => (
                          <span key={i} style={styles.partnerTag}>{p}</span>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          ))
        ) : loading ? null : hasSearched && flights.length === 0 ? (
          <div style={styles.emptyState}>No flights were found for your search. Try different dates or airports.</div>
        ) : hasSearched && flights.length > 0 ? (
          <div style={styles.emptyState}>No flights match your advanced filters. Try allowing more stops.</div>
        ) : (
          !hasSearched && <div style={styles.emptyState}>Enter your route details above to explore options.</div>
        )}
      </main>

      {validationWarning && (
        <div
          style={styles.modalOverlay}
          onClick={() => setValidationWarning(null)}
          role="presentation"
        >
          <div
            style={styles.modal}
            role="alertdialog"
            aria-labelledby="validation-title"
            aria-describedby="validation-message"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="validation-title" style={styles.modalTitle}>{modalTitle}</h2>
            <p id="validation-message" style={styles.modalMessage}>
              {validationWarning.split('\n\n').map((part, i) => (
                <span key={i}>
                  {i > 0 && <br />}
                  {part}
                </span>
              ))}
            </p>
            <button
              type="button"
              style={styles.modalBtn}
              onClick={() => setValidationWarning(null)}
              autoFocus
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const fieldFont: React.CSSProperties = {
  fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontSize: '16px',
  fontWeight: 400,
  color: '#3c4043',
  letterSpacing: '0.01em',
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '20px',
    color: '#3c4043',
  },
  header: { textAlign: 'center', marginBottom: '32px' },
  searchPanel: {
    background: '#fff',
    borderRadius: '14px',
    border: '1px solid #c7d2fe',
    boxShadow: '0 4px 20px rgba(99, 102, 241, 0.12), 0 1px 4px rgba(60, 64, 67, 0.06)',
  },
  advancedSection: {
    borderTop: '1px solid #f0f0f0',
    padding: '16px 24px 20px',
  },
  advancedToggle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '14px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: 500,
    color: '#3c4043',
    userSelect: 'none',
  },
  advancedCheckbox: {
    width: '16px',
    height: '16px',
    cursor: 'pointer',
    accentColor: '#6366f1',
  },
  advancedControlsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '56px',
    flexWrap: 'wrap',
  },
  advancedControlItem: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
  },
  advancedControlLabel: {
    fontSize: '16px',
    fontWeight: 500,
    color: '#3c4043',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  },
  advancedControlLabelDisabled: {
    color: '#b0b0b0',
  },
  form: { display: 'flex', flexDirection: 'column', width: '100%' },
  filterBar: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '6px 28px',
    padding: '14px 24px 6px',
    borderBottom: '1px solid #f0f0f0',
  },
  filterDropdown: {
    position: 'relative',
  },
  filterTrigger: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    border: 'none',
    background: 'transparent',
    padding: '8px 4px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 500,
    color: '#3c4043',
    outline: 'none',
    boxShadow: 'none',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
    transition: 'color 0.12s ease',
  },
  filterTriggerLabel: {
    whiteSpace: 'nowrap',
  },
  filterTriggerHover: {
    color: '#6b7280',
  },
  passengerTrigger: {
    minWidth: 132,
  },
  filterTriggerOpen: {
    color: '#6366f1',
  },
  filterTriggerDisabled: {
    color: '#b0b0b0',
    cursor: 'not-allowed',
  },
  filterChevron: {
    display: 'flex',
    color: '#9ca3af',
    transition: 'transform 0.15s ease, color 0.15s ease',
  },
  filterChevronHover: {
    color: '#b8bcc4',
  },
  filterChevronOpen: {
    transform: 'rotate(180deg)',
    color: '#6366f1',
  },
  filterMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: '6px',
    minWidth: '100%',
    width: 'max-content',
    background: '#fff',
    borderRadius: '8px',
    boxShadow: '0 8px 30px rgba(99, 102, 241, 0.14), 0 2px 8px rgba(0, 0, 0, 0.06)',
    padding: 0,
    listStyle: 'none',
    margin: 0,
    zIndex: 20,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  },
  filterOption: {
    display: 'block',
    width: '100%',
    border: 'none',
    background: '#fff',
    textAlign: 'left',
    padding: '12px 16px',
    borderRadius: 0,
    cursor: 'pointer',
    fontSize: '15px',
    color: '#3c4043',
    fontFamily: 'inherit',
    outline: 'none',
    boxShadow: 'none',
    whiteSpace: 'nowrap',
    transition: 'background-color 0.12s ease',
  },
  filterOptionHover: {
    background: '#ececec',
  },
  passengerMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: '6px',
    minWidth: '280px',
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 8px 30px rgba(99, 102, 241, 0.14), 0 2px 8px rgba(0, 0, 0, 0.06)',
    padding: '18px 20px',
    zIndex: 20,
  },
  passengerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '20px',
    marginBottom: '14px',
  },
  passengerRowLast: {
    marginBottom: 0,
  },
  passengerRowLabel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  passengerLabel: {
    fontSize: '15px',
    fontWeight: 500,
    color: '#3c4043',
    whiteSpace: 'nowrap',
  },
  passengerSublabel: {
    fontSize: '13px',
    color: '#888',
    whiteSpace: 'nowrap',
  },
  stepper: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexShrink: 0,
  },
  stepperBtn: {
    width: '34px',
    height: '34px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    background: '#f5f5f5',
    color: '#666',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    lineHeight: 1,
    padding: 0,
    outline: 'none',
    boxShadow: 'none',
  },
  stepperBtnDisabled: {
    opacity: 0.35,
    cursor: 'not-allowed',
  },
  stepperValue: {
    minWidth: '24px',
    textAlign: 'center',
    fontSize: '15px',
    fontWeight: 500,
    color: '#3c4043',
  },
  mainBar: {
    display: 'flex',
    alignItems: 'stretch',
    gap: '12px',
    padding: '8px 24px 20px',
    flexWrap: 'wrap',
  },
  routeBlock: {
    display: 'flex',
    alignItems: 'center',
    flex: '2 1 300px',
    minWidth: '260px',
    background: '#f5f5f5',
    borderRadius: '10px',
    padding: '6px 8px',
    gap: '4px',
  },
  routeField: {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    gap: '8px',
    padding: '0 8px',
  },
  fieldIcon: {
    display: 'flex',
    alignItems: 'center',
    color: '#888',
    flexShrink: 0,
  },
  routeInput: {
    ...fieldFont,
    flex: 1,
    minWidth: 0,
    border: 'none',
    background: 'transparent',
    padding: '12px 0',
    outline: 'none',
    height: '48px',
  },
  swapBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: '1px solid #ddd',
    background: '#fff',
    color: '#666',
    cursor: 'pointer',
    flexShrink: 0,
    padding: 0,
  },
  dateBlock: {
    display: 'flex',
    alignItems: 'center',
    flex: '1 1 300px',
    minWidth: '300px',
    background: '#f5f5f5',
    borderRadius: '10px',
    padding: '6px 14px',
    gap: '10px',
  },
  dateInput: {
    ...fieldFont,
    border: 'none',
    background: 'transparent',
    padding: '12px 0',
    outline: 'none',
    height: '48px',
    flex: 1,
    minWidth: 0,
    colorScheme: 'light',
  },
  dateArrow: {
    color: '#999',
    fontSize: '16px',
    flexShrink: 0,
  },
  dateHidden: {
    visibility: 'hidden',
    pointerEvents: 'none',
  },
  searchBtn: {
    ...fieldFont,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)',
    color: '#fff',
    border: 'none',
    padding: '0 36px',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: 500,
    cursor: 'pointer',
    minHeight: '56px',
    minWidth: '148px',
    flexShrink: 0,
    alignSelf: 'stretch',
    marginLeft: 'auto',
  },
  resultsContainer: { marginTop: '30px' },
  resultsCount: {
    margin: '0 0 12px',
    fontSize: '14px',
    color: '#666',
    fontWeight: 500,
  },
  flightCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(255, 255, 255, 0.92)',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid rgba(218, 220, 224, 0.8)',
    marginBottom: '12px',
    boxShadow: '0 2px 12px rgba(99, 102, 241, 0.08)',
  },
  flightInfo: { display: 'flex', gap: '20px', alignItems: 'center' },
  carrierBadge: { background: '#eef2f7', padding: '8px 12px', borderRadius: '6px', fontWeight: 600, fontSize: '14px' },
  routeDetails: { display: 'flex', flexDirection: 'column', gap: '4px' },
  timeText: { fontSize: '15px', fontWeight: 500, color: '#1f2937' },
  subtext: { fontSize: '13px', color: '#666' },
  pricingSection: { display: 'flex', alignItems: 'center' },
  priceText: { fontSize: '24px', fontWeight: 500, color: '#2e7d32' },
  pointsText: { fontSize: '22px', fontWeight: 500, color: '#6366f1' },
  partnerContainer: { display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px', justifyContent: 'flex-end' },
  partnerTag: { fontSize: '10px', background: '#ede9fe', color: '#6d28d9', padding: '2px 6px', borderRadius: '4px', fontWeight: 500 },
  emptyState: { textAlign: 'center', padding: '40px', color: '#888' },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modal: {
    background: '#fff',
    borderRadius: '12px',
    padding: '24px',
    maxWidth: '400px',
    width: '100%',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
  },
  modalTitle: { margin: '0 0 12px', fontSize: '20px', color: '#c62828' },
  modalMessage: { margin: '0 0 20px', lineHeight: 1.5, color: '#444' },
  modalBtn: {
    ...fieldFont,
    background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)',
    color: '#fff',
    border: 'none',
    padding: '10px 24px',
    borderRadius: '6px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    width: '100%',
  },
};