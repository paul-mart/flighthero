import React, { useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch, apiUrl } from './api';
import DatePicker from './DatePicker';

interface AwardDetails {
  points_required: number;
  taxes_and_fees: number;
  transfer_partners: string[];
  mileage_program?: string;
  mileage_program_slug?: string;
  seats_remaining?: number;
  is_direct?: boolean;
  return_points?: number;
  return_taxes_and_fees?: number;
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
    <div ref={rootRef} className="filter-dropdown" style={styles.filterDropdown}>
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
        <ul className="filter-menu" style={styles.filterMenu} role="listbox" aria-label={ariaLabel}>
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

interface PlaceSuggestion {
  id: string;
  code: string;
  name: string;
  subtitle: string;
  type: 'airport' | 'city';
}

interface AirportAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
}

function formatPlaceLabel(suggestion: PlaceSuggestion): string {
  return `${suggestion.name} (${suggestion.code})`;
}

function PlacesSearchLoader({ size = 32 }: { size?: number }) {
  return (
    <svg
      className="places-search-loader"
      width={size}
      height={size}
      viewBox="0 0 56 56"
      overflow="visible"
      aria-hidden
    >
      <circle
        cx="28"
        cy="28"
        r="15"
        fill="none"
        stroke="#c7d2fe"
        strokeWidth="2"
        strokeDasharray="2.5 4.5"
        strokeLinecap="round"
      />
      <g className="places-search-loader__orbit">
        <g transform="translate(28, 28)">
          <g transform="translate(0, -15) rotate(90)">
            <g transform="translate(-12, -12) scale(0.54)">
              <path
                d="M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
                fill="#6366f1"
              />
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
}

function getCachedSuggestions(
  query: string,
  cache: Map<string, PlaceSuggestion[]>
): PlaceSuggestion[] | null {
  const normalized = query.toLowerCase();
  const exact = cache.get(normalized);
  if (exact) return exact;

  for (let length = normalized.length - 1; length >= 2; length -= 1) {
    const prefix = cache.get(normalized.slice(0, length));
    if (prefix) return prefix;
  }

  return null;
}

function AirportAutocomplete({ value, onChange, placeholder, ariaLabel }: AirportAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suppressFetchRef = useRef(false);
  const cacheRef = useRef<Map<string, PlaceSuggestion[]>>(new Map());
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
        setHighlightIndex(-1);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        setHighlightIndex(-1);
        inputRef.current?.blur();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  useEffect(() => {
    const query = value.trim();
    if (suppressFetchRef.current) {
      suppressFetchRef.current = false;
      return;
    }

    if (query.length < 2) {
      abortRef.current?.abort();
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    const normalizedQuery = query.toLowerCase();
    const cached = getCachedSuggestions(normalizedQuery, cacheRef.current);
    if (cached) {
      setSuggestions(cached);
      setOpen(cached.length > 0);
      setHighlightIndex(-1);
    }

    const timer = window.setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const requestId = ++requestIdRef.current;

      if (!cached) {
        setLoading(true);
        setOpen(true);
      }

      try {
        const response = await apiFetch(
          apiUrl(`/api/places/suggestions?q=${encodeURIComponent(query)}`),
          { signal: controller.signal }
        );
        const data = await response.json();
        if (requestId !== requestIdRef.current) return;
        if (!response.ok) {
          if (!cached) {
            setSuggestions([]);
            setOpen(false);
          }
          return;
        }
        const nextSuggestions = Array.isArray(data) ? data : [];
        cacheRef.current.set(normalizedQuery, nextSuggestions);
        setSuggestions(nextSuggestions);
        setOpen(nextSuggestions.length > 0);
        setHighlightIndex(-1);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        if (!cached) {
          setSuggestions([]);
          setOpen(false);
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    }, 120);

    return () => {
      window.clearTimeout(timer);
    };
  }, [value]);

  const selectSuggestion = (suggestion: PlaceSuggestion) => {
    suppressFetchRef.current = true;
    onChange(formatPlaceLabel(suggestion));
    setOpen(false);
    setSuggestions([]);
    setHighlightIndex(-1);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightIndex((prev) => (prev + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
    } else if (event.key === 'Enter' && highlightIndex >= 0) {
      event.preventDefault();
      selectSuggestion(suggestions[highlightIndex]);
    }
  };

  return (
    <div ref={rootRef} style={styles.airportAutocomplete}>
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          if (suggestions.length > 0 || loading) setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        style={{
          ...styles.routeInput,
          ...(loading ? styles.routeInputLoading : {}),
        }}
        aria-label={ariaLabel}
        aria-autocomplete="list"
        aria-expanded={open}
        aria-busy={loading}
        aria-controls={open ? `${ariaLabel}-suggestions` : undefined}
        role="combobox"
        autoComplete="off"
      />
      {loading && (
        <div style={styles.suggestionInputLoader} aria-hidden>
          <PlacesSearchLoader size={26} />
        </div>
      )}
      {(open || loading) && (
        <ul
          id={`${ariaLabel}-suggestions`}
          style={styles.suggestionMenu}
          role="listbox"
          aria-label={`${ariaLabel} suggestions`}
        >
          {loading && suggestions.length === 0 ? (
            <li style={styles.suggestionLoaderRow} role="presentation">
              <PlacesSearchLoader size={40} />
              <span style={styles.suggestionLoaderText}>Searching places...</span>
            </li>
          ) : (
            suggestions.map((suggestion, index) => {
              const highlighted = highlightIndex === index || hoveredIndex === index;
              return (
                <li key={suggestion.id} role="none">
                  <button
                    type="button"
                    role="option"
                    aria-selected={highlightIndex === index}
                    style={{
                      ...styles.suggestionOption,
                      ...(highlighted ? styles.suggestionOptionHover : {}),
                    }}
                    onMouseEnter={() => {
                      setHoveredIndex(index);
                      setHighlightIndex(index);
                    }}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectSuggestion(suggestion)}
                  >
                    <span style={styles.suggestionText}>
                      <span style={styles.suggestionName}>{formatPlaceLabel(suggestion)}</span>
                      {suggestion.subtitle && (
                        <span style={styles.suggestionSubtitle}>{suggestion.subtitle}</span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })
          )}
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
    <div ref={rootRef} className="filter-dropdown" style={styles.filterDropdown}>
      <button
        ref={triggerRef}
        type="button"
        className="filter-trigger passenger-trigger"
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
        <div className="passenger-menu" style={styles.passengerMenu} role="dialog" aria-label="Passenger selection">
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

function SearchModeTabs({
  value,
  onChange,
}: {
  value: 'cash' | 'points';
  onChange: (next: 'cash' | 'points') => void;
}) {
  return (
    <div className="search-mode-tabs" role="tablist" aria-label="Search type">
      <button
        type="button"
        role="tab"
        id="search-tab-points"
        aria-selected={value === 'points'}
        aria-controls="search-panel-body"
        className={`search-mode-tab search-mode-tab-left${value === 'points' ? ' search-mode-tab-active' : ''}`}
        onClick={() => onChange('points')}
      >
        Points
      </button>
      <button
        type="button"
        role="tab"
        id="search-tab-cash"
        aria-selected={value === 'cash'}
        aria-controls="search-panel-body"
        className={`search-mode-tab search-mode-tab-right${value === 'cash' ? ' search-mode-tab-active' : ''}`}
        onClick={() => onChange('cash')}
      >
        Cash fares
      </button>
    </div>
  );
}

function CarrierBadge({ carrier, logos }: { carrier: string; logos?: string[] }) {
  const [failed, setFailed] = useState(false);
  const visibleLogos = (logos ?? []).filter(Boolean).slice(0, 2);

  if (!failed && visibleLogos.length > 0) {
    return (
      <div style={styles.carrierLogoGroup} aria-label={carrier} title={carrier}>
        {visibleLogos.map((logo) => (
          <img
            key={logo}
            src={logo}
            alt=""
            style={styles.carrierLogo}
            className="carrier-logo"
            onError={() => setFailed(true)}
          />
        ))}
        {(logos?.length ?? 0) > 2 && (
          <span style={styles.carrierLogoOverflow}>+{(logos?.length ?? 0) - 2}</span>
        )}
      </div>
    );
  }

  return (
    <div style={styles.carrierBadge} aria-label={carrier} title={carrier}>
      {carrier}
    </div>
  );
}

interface ReturnLegFields {
  return_departure_time: string;
  return_arrival_time: string;
  return_flight_number: string;
  return_carrier: string;
  return_stops: number;
  return_duration_minutes?: number;
}

interface Flight {
  id: number | string;
  departure_token?: string;
  origin: string;
  destination: string;
  departure_date: string;
  departure_time?: string;
  arrival_time?: string;
  carrier: string;
  carrier_logos?: string[];
  flight_number: string;
  duration: string;
  duration_minutes?: number;
  stops: number;
  cash_price: number;
  return_departure_time?: string;
  return_arrival_time?: string;
  return_flight_number?: string;
  return_carrier?: string;
  return_duration?: string;
  return_stops?: number;
  award_details?: AwardDetails;
}

function applyReturnLeg(flight: Flight, leg: ReturnLegFields): Flight {
  return {
    ...flight,
    return_departure_time: leg.return_departure_time,
    return_arrival_time: leg.return_arrival_time,
    return_flight_number: leg.return_flight_number,
    return_carrier: leg.return_carrier,
    return_stops: leg.return_stops,
    duration_minutes: (flight.duration_minutes ?? 0) + (leg.return_duration_minutes ?? 0),
  };
}

type StopsFilter = 'nonstop' | '1-or-fewer' | '2-or-fewer';
type SortOption =
  | 'price-asc'
  | 'price-desc'
  | 'duration-asc'
  | 'duration-desc'
  | 'departure-asc'
  | 'departure-desc';

function matchesStopsFilter(stops: number, filter: StopsFilter): boolean {
  if (filter === 'nonstop') return stops === 0;
  if (filter === '1-or-fewer') return stops <= 1;
  return stops <= 2;
}

const POINTS_TAXES_SLIDER_CAP = 500;

function getFlightTaxes(flight: Flight): number {
  return flight.award_details?.taxes_and_fees ?? 0;
}

function computeTaxesSliderMax(flights: Flight[]): number {
  const taxes = flights.map(getFlightTaxes).filter((amount) => amount > 0);
  if (taxes.length === 0) return 150;
  const peak = Math.max(...taxes);
  return Math.min(POINTS_TAXES_SLIDER_CAP, Math.max(50, Math.ceil(peak / 25) * 25));
}

function MaxTaxesSlider({
  value,
  max,
  disabled,
  onChange,
}: {
  value: number;
  max: number;
  disabled: boolean;
  onChange: (next: number) => void;
}) {
  return (
    <div className={`max-taxes-slider${disabled ? ' max-taxes-slider-disabled' : ''}`}>
      <input
        type="range"
        className="max-taxes-slider-input"
        min={0}
        max={max}
        step={5}
        value={value}
        disabled={disabled}
        style={{ '--taxes-fill': `${max > 0 ? (value / max) * 100 : 0}%` } as React.CSSProperties}
        aria-label="Maximum taxes and fees"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`Up to ${formatPrice(value)} in taxes and fees`}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <span className="max-taxes-slider-value">{formatPrice(value)}</span>
    </div>
  );
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

function getDepartureMinutes(flight: Flight): number | null {
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
    if (sortOption === 'duration-desc') {
      return getDurationMinutes(b) - getDurationMinutes(a);
    }
    if (sortOption === 'departure-asc' || sortOption === 'departure-desc') {
      const aMinutes = getDepartureMinutes(a);
      const bMinutes = getDepartureMinutes(b);
      if (aMinutes == null && bMinutes == null) return 0;
      if (aMinutes == null) return 1;
      if (bMinutes == null) return -1;
      return sortOption === 'departure-asc' ? aMinutes - bMinutes : bMinutes - aMinutes;
    }
    return 0;
  });
  return sorted;
}

function formatPrice(amount: number): string {
  return `$${Math.round(amount).toLocaleString()}`;
}

function flightDetailLine(
  carrier: string,
  flightNumber: string,
  duration: string,
  stops: number,
): string {
  const number = flightNumber.trim();
  const hasNumber = number && number !== 'Award seat' && /\d/.test(number);
  const flightLabel = hasNumber ? number : carrier;
  const stopLabel = stops === 0 ? 'Nonstop' : `${stops} stop${stops > 1 ? 's' : ''}`;
  return `${flightLabel} • ${duration} • ${stopLabel}`;
}

const RETURN_LEG_BATCH_SIZE = 12;

async function fetchReturnLegBatches(
  tokens: string[],
  route: {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate: string;
  },
  onBatch: (returnData: Record<string, ReturnLegFields>) => void,
  isCancelled: () => boolean,
): Promise<void> {
  for (let index = 0; index < tokens.length; index += RETURN_LEG_BATCH_SIZE) {
    if (isCancelled()) return;

    const batch = tokens.slice(index, index + RETURN_LEG_BATCH_SIZE);
    const response = await apiFetch(apiUrl('/api/search/return-legs'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin: route.origin,
        destination: route.destination,
        departure_date: route.departureDate,
        return_date: route.returnDate,
        departure_tokens: batch,
      }),
    });
    const returnData = await response.json();
    if (!response.ok || isCancelled()) return;

    onBatch(returnData as Record<string, ReturnLegFields>);
  }
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
  const [maxTaxes, setMaxTaxes] = useState(150);
  const [advancedEnabled, setAdvancedEnabled] = useState(false);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState('Missing information');
  const [loadingReturnDetails, setLoadingReturnDetails] = useState(false);
  const searchSeqRef = useRef(0);

  const showDialog = (title: string, message: string) => {
    setModalTitle(title);
    setValidationWarning(message);
  };

  const taxesSliderMax = useMemo(
    () => (searchType === 'points' ? computeTaxesSliderMax(flights) : 150),
    [flights, searchType],
  );

  useEffect(() => {
    if (searchType === 'points' && flights.length > 0) {
      setMaxTaxes(computeTaxesSliderMax(flights));
    }
  }, [flights, searchType]);

  const displayedFlights = useMemo(() => {
    if (!advancedEnabled) {
      return sortFlights(flights, 'price-asc', searchType);
    }
    let filtered = flights.filter((flight) => matchesStopsFilter(flight.stops, stopsFilter));
    if (searchType === 'points') {
      filtered = filtered.filter((flight) => getFlightTaxes(flight) <= maxTaxes);
    }
    return sortFlights(filtered, sortOption, searchType);
  }, [flights, stopsFilter, sortOption, searchType, advancedEnabled, maxTaxes]);

  const swapRoute = () => {
    setOrigin(destination);
    setDestination(origin);
  };

  const handleSearchTypeChange = (next: 'cash' | 'points') => {
    if (next === searchType) return;
    setSearchType(next);
    setFlights([]);
    setHasSearched(false);
    setLoadingReturnDetails(false);
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

    const searchSeq = ++searchSeqRef.current;
    setLoading(true);
    setLoadingReturnDetails(false);
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
      const response = await apiFetch(apiUrl(`/api/search?${params}`));
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
      const results: Flight[] = Array.isArray(data) ? data : [];
      setFlights(results);
      if (results.length === 0) {
        showDialog(
          'No flights found',
          'No flights were found for your search. Try different dates or airports.'
        );
      } else if (tripType === 'round-trip' && searchType === 'cash') {
        const tokens = [...new Set(
          results.map((flight) => flight.departure_token).filter((token): token is string => Boolean(token))
        )];
        if (tokens.length > 0) {
          setLoadingReturnDetails(true);
          void (async () => {
            try {
              await fetchReturnLegBatches(
                tokens,
                {
                  origin: trimmedOrigin,
                  destination: trimmedDestination,
                  departureDate: date,
                  returnDate,
                },
                (returnData) => {
                  setFlights((prev) =>
                    prev.map((flight) => {
                      const token = flight.departure_token;
                      if (!token || !returnData[token]) {
                        return flight;
                      }
                      return applyReturnLeg(flight, returnData[token]);
                    })
                  );
                },
                () => searchSeq !== searchSeqRef.current,
              );
            } catch (returnError) {
              console.error('Error loading return legs:', returnError);
            } finally {
              if (searchSeq === searchSeqRef.current) {
                setLoadingReturnDetails(false);
              }
            }
          })();
        }
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
    <div className="app-container" style={styles.container}>
      <header className="app-header" style={styles.header}>
        <h1>✈️ FlightHero</h1>
        <p>Find the best routes using cash or credit card transfer points</p>
      </header>

      {/* Search Panel */}
      <div className="search-panel-wrap" style={styles.searchPanelWrap}>
        <SearchModeTabs value={searchType} onChange={handleSearchTypeChange} />
        <div
          id="search-panel-body"
          className="search-panel"
          style={styles.searchPanel}
          role="tabpanel"
          aria-labelledby={searchType === 'cash' ? 'search-tab-cash' : 'search-tab-points'}
        >
        <form onSubmit={handleSearch} style={styles.form}>
          <div className="filter-bar" style={styles.filterBar}>
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
          </div>

          <div className="main-bar" style={styles.mainBar}>
            <div className="route-block" style={styles.routeBlock}>
              <div style={styles.routeField} className="route-field">
                <span style={styles.fieldIcon}><DepartIcon /></span>
                <AirportAutocomplete
                  value={origin}
                  onChange={setOrigin}
                  placeholder="From (city or airport)"
                  ariaLabel="Origin"
                />
              </div>

              <button
                type="button"
                onClick={swapRoute}
                className="swap-btn"
                style={styles.swapBtn}
                aria-label="Swap origin and destination"
                title="Swap airports"
              >
                <SwapIcon />
              </button>

              <div style={styles.routeField} className="route-field">
                <span style={styles.fieldIcon}><ArriveIcon /></span>
                <AirportAutocomplete
                  value={destination}
                  onChange={setDestination}
                  placeholder="To (city or airport)"
                  ariaLabel="Destination"
                />
              </div>
            </div>

            <div className="date-block" style={styles.dateBlock}>
              <span style={styles.fieldIcon}><CalendarIcon /></span>
              <DatePicker
                value={date}
                onChange={(nextDate) => {
                  setDate(nextDate);
                  if (returnDate && nextDate && returnDate < nextDate) {
                    setReturnDate('');
                  }
                }}
                placeholder="Departure"
                ariaLabel="Departure date"
              />
              <span style={{ ...styles.dateArrow, ...(tripType === 'one-way' ? styles.dateHidden : {}) }}>→</span>
              <DatePicker
                value={returnDate}
                onChange={setReturnDate}
                placeholder="Return"
                ariaLabel="Return date"
                minDate={date || undefined}
                disabled={tripType === 'one-way'}
                hidden={tripType === 'one-way'}
              />
            </div>

            <button type="submit" className="search-btn" style={styles.searchBtn} disabled={loading}>
              <SearchIcon />
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {hasSearched && (
          <div className="advanced-section" style={styles.advancedSection}>
            <label style={styles.advancedToggle}>
              <input
                type="checkbox"
                checked={advancedEnabled}
                onChange={(e) => setAdvancedEnabled(e.target.checked)}
                style={styles.advancedCheckbox}
              />
              <span>Advanced settings</span>
            </label>

            <div className="advanced-controls-row" style={styles.advancedControlsRow}>
              <div className="advanced-control-item" style={styles.advancedControlItem}>
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

              <div className="advanced-control-item" style={styles.advancedControlItem}>
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
                    { value: 'departure-asc', label: 'Departure: earliest first' },
                    { value: 'departure-desc', label: 'Departure: latest first' },
                    { value: 'duration-asc', label: 'Duration: shortest first' },
                    { value: 'duration-desc', label: 'Duration: longest first' },
                  ]}
                  ariaLabel="Sort by"
                  disabled={!advancedEnabled}
                />
              </div>

              {searchType === 'points' && (
                <div className="advanced-control-item max-taxes-control" style={styles.advancedControlItem}>
                  <span style={{
                    ...styles.advancedControlLabel,
                    ...(advancedEnabled ? {} : styles.advancedControlLabelDisabled),
                  }}>
                    Max taxes:
                  </span>
                  <MaxTaxesSlider
                    value={Math.min(maxTaxes, taxesSliderMax)}
                    max={taxesSliderMax}
                    disabled={!advancedEnabled}
                    onChange={setMaxTaxes}
                  />
                </div>
              )}
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Results Section */}
      <main className="results-container" style={styles.resultsContainer}>
        {hasSearched && flights.length > 0 && (
          <p style={styles.resultsCount}>
            Showing {displayedFlights.length} of {flights.length} flight{flights.length === 1 ? '' : 's'}
          </p>
        )}
        {displayedFlights.length > 0 ? (
          displayedFlights.map((flight) => (
            <div key={flight.id} className="flight-card" style={styles.flightCard}>
              <div className="flight-info" style={styles.flightInfo}>
                <CarrierBadge carrier={flight.carrier} logos={flight.carrier_logos} />
                <div className="route-details" style={styles.routeDetails}>
                  <strong>{flight.origin} → {flight.destination}</strong>
                  {flight.departure_time && flight.arrival_time && (
                    <span style={styles.timeText}>
                      {flight.departure_time} – {flight.arrival_time}
                    </span>
                  )}
                  <span style={styles.subtext}>
                    {flightDetailLine(flight.carrier, flight.flight_number, flight.duration, flight.stops)}
                  </span>
                  {tripType === 'round-trip' && (
                    searchType === 'points' ? (
                      (flight.return_flight_number || flight.return_departure_time) ? (
                        <>
                          <strong style={styles.returnLabel}>{flight.destination} → {flight.origin}</strong>
                          {flight.return_departure_time && flight.return_arrival_time && (
                            <span style={styles.timeText}>
                              {flight.return_departure_time} – {flight.return_arrival_time}
                            </span>
                          )}
                          <span style={styles.subtext}>
                            {flightDetailLine(
                              flight.return_carrier ?? flight.carrier,
                              flight.return_flight_number ?? '',
                              flight.return_duration ?? '—',
                              flight.return_stops ?? 0,
                            )}
                          </span>
                        </>
                      ) : null
                    ) : (
                    <>
                      <strong style={styles.returnLabel}>{flight.destination} → {flight.origin}</strong>
                      {flight.return_flight_number ? (
                        <>
                          {flight.return_departure_time && flight.return_arrival_time && (
                            <span style={styles.timeText}>
                              {flight.return_departure_time} – {flight.return_arrival_time}
                            </span>
                          )}
                          <span style={styles.subtext}>
                            {flightDetailLine(
                              flight.return_carrier ?? flight.carrier,
                              flight.return_flight_number ?? '',
                              flight.return_duration ?? '—',
                              flight.return_stops ?? 0,
                            )}
                          </span>
                        </>
                      ) : loadingReturnDetails && flight.departure_token ? (
                        <span style={styles.returnLoading}>Loading return flight…</span>
                      ) : flight.departure_token ? (
                        <span style={styles.returnLoading}>Return details unavailable</span>
                      ) : null}
                    </>
                    )
                  )}
                </div>
              </div>

              <div className="pricing-section" style={styles.pricingSection}>
                {searchType === 'cash' ? (
                  <>
                    {tripType === 'round-trip' && (
                      <div className="price-hint" style={styles.priceHint}>Round trip</div>
                    )}
                    <div className="price-text" style={styles.priceText}>{formatPrice(flight.cash_price)}</div>
                  </>
                ) : (
                  flight.award_details && (
                    <div style={{ textAlign: 'right' }}>
                      {tripType === 'round-trip' && (
                        <div className="price-hint" style={styles.priceHint}>Round trip</div>
                      )}
                      <div style={styles.pointsText}>
                        {flight.award_details.points_required.toLocaleString()} pts
                      </div>
                      <div style={styles.subtext}>+ {formatPrice(flight.award_details.taxes_and_fees)} fees</div>
                      {flight.award_details.mileage_program && (
                        <div style={styles.programTag}>{flight.award_details.mileage_program}</div>
                      )}
                      <div className="partner-container" style={styles.partnerContainer}>
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
        ) : loading ? (
          <div style={styles.flightSearchLoader} role="status" aria-live="polite">
            <PlacesSearchLoader size={112} />
            <span style={styles.flightSearchLoaderText}>Searching flights...</span>
          </div>
        ) : hasSearched && flights.length === 0 ? (
          <div style={styles.emptyState}>No flights were found for your search. Try different dates or airports.</div>
        ) : hasSearched && flights.length > 0 ? (
          <div style={styles.emptyState}>No flights match your advanced filters. Try allowing more stops.</div>
        ) : (
          !hasSearched && <div style={styles.emptyState}>Enter your route details above to explore options.</div>
        )}
      </main>

      {validationWarning && (
        <div
          className="modal-overlay"
          style={styles.modalOverlay}
          onClick={() => setValidationWarning(null)}
          role="presentation"
        >
          <div
            className="app-modal"
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
  searchPanelWrap: {
    width: '100%',
  },
  searchPanel: {
    background: '#fff',
    borderRadius: '0 0 14px 14px',
    border: '1px solid #c7d2fe',
    borderTop: 'none',
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
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    gap: '8px',
    padding: '0 8px',
  },
  airportAutocomplete: {
    position: 'relative',
    flex: 1,
    minWidth: 0,
  },
  suggestionMenu: {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    left: '-8px',
    right: '-8px',
    margin: 0,
    padding: '6px 0',
    listStyle: 'none',
    background: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: '10px',
    boxShadow: '0 8px 24px rgba(60, 64, 67, 0.18)',
    zIndex: 30,
    maxHeight: '320px',
    overflowY: 'auto',
  },
  suggestionOption: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    width: '100%',
    border: 'none',
    background: 'transparent',
    padding: '10px 14px',
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: 'inherit',
  },
  suggestionOptionHover: {
    background: '#f3f4ff',
  },
  suggestionText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: 0,
  },
  suggestionName: {
    fontSize: '15px',
    fontWeight: 500,
    color: '#3c4043',
  },
  suggestionSubtitle: {
    fontSize: '13px',
    color: '#80868b',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  suggestionCode: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#6366f1',
    flexShrink: 0,
  },
  suggestionInputLoader: {
    position: 'absolute',
    right: '4px',
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  suggestionLoaderRow: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '18px 14px',
  },
  suggestionLoaderText: {
    fontSize: '14px',
    color: '#80868b',
  },
  suggestionStatus: {
    padding: '10px 14px',
    fontSize: '14px',
    color: '#80868b',
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
  routeInputLoading: {
    paddingRight: '34px',
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
    position: 'relative',
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
  flightSearchLoader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    padding: '56px 24px',
    textAlign: 'center',
  },
  flightSearchLoaderText: {
    fontSize: '16px',
    fontWeight: 500,
    color: '#5f6368',
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
  carrierLogoGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
  },
  carrierBadge: {
    background: '#eef2f7',
    padding: '8px 12px',
    borderRadius: '6px',
    fontWeight: 600,
    fontSize: '14px',
  },
  carrierLogo: { height: '32px', width: 'auto', maxWidth: '80px', objectFit: 'contain', display: 'block' },
  carrierLogoOverflow: { fontSize: '12px', color: '#666', fontWeight: 500 },
  routeDetails: { display: 'flex', flexDirection: 'column', gap: '4px' },
  returnLabel: { fontSize: '14px', marginTop: '8px' },
  returnLoading: { fontSize: '13px', color: '#6b7280', fontStyle: 'italic' },
  timeText: { fontSize: '15px', fontWeight: 500, color: '#1f2937' },
  subtext: { fontSize: '13px', color: '#666' },
  pricingSection: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' },
  priceText: { fontSize: '24px', fontWeight: 500, color: '#2e7d32' },
  priceHint: { fontSize: '12px', color: '#6b7280', marginBottom: '2px', textAlign: 'right' },
  pointsText: { fontSize: '22px', fontWeight: 500, color: '#6366f1' },
  programTag: {
    fontSize: '12px',
    color: '#4338ca',
    fontWeight: 600,
    marginTop: '4px',
    textAlign: 'right',
  },
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