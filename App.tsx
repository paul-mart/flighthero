import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { apiFetch, apiUrl } from './api';
import DatePicker from './DatePicker';
import { AirportAutocomplete, PlacesSearchLoader } from './components/AirportAutocomplete';
import { FlightHeroLogo } from './components/FlightHeroLogo';
import { FlightItineraryTimeline, type FlightItinerary } from './components/FlightItineraryTimeline';
import { FlightTimeRange } from './components/FlightTimeRange';
import { TransferPartnerLogo } from './components/TransferPartnerLogo';
import { ContinueSearching } from './components/ContinueSearching';
import { TrendingDeals } from './components/TrendingDeals';
import { TopNavbar } from './components/TopNavbar';
import { SiteFooter } from './components/SiteFooter';
import { useAuth } from './context/AuthContext';
import { HomeSearchResetProvider } from './context/HomeSearchContext';
import {
  calculateCpp,
  GRADE_LABELS,
  rateTransferPartners,
  type RedemptionGrade,
} from './lib/cpp';
import { getDepartureSortMinutes } from './lib/flightTimes';
import {
  getRecentSearches,
  shouldShowContinueSearching,
  recordRecentSearch,
  type RecentSearch,
} from './lib/recentSearches';
import type { TrendingDeal } from './data/trendingDeals';
import { ChevronDownIcon, PlaneArriveIcon, PlaneDepartIcon, CalendarIcon, SwapIcon, SearchIcon, ArrowRightIcon } from './icons';

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
  const menuRef = useRef<HTMLUListElement>(null);
  const [menuPosition, setMenuPosition] = useState<React.CSSProperties>({});

  const selectedLabel = options.find((option) => option.value === value)?.label ?? '';

  const updateMenuPosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const margin = 16;
    const minWidth = rect.width;
    let left = rect.left;
    if (left + minWidth > window.innerWidth - margin) {
      left = window.innerWidth - margin - minWidth;
    }
    left = Math.max(margin, left);
    setMenuPosition({
      position: 'fixed',
      top: rect.bottom + 6,
      left,
      minWidth,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open || disabled) return;
    updateMenuPosition();
    window.addEventListener('scroll', updateMenuPosition, true);
    window.addEventListener('resize', updateMenuPosition);
    return () => {
      window.removeEventListener('scroll', updateMenuPosition, true);
      window.removeEventListener('resize', updateMenuPosition);
    };
  }, [open, disabled, updateMenuPosition]);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  useEffect(() => {
    if (!open || disabled) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
      triggerRef.current?.blur();
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
      {open &&
        createPortal(
          <ul
            ref={menuRef}
            className="filter-menu"
            style={{ ...styles.filterMenu, ...menuPosition }}
            role="listbox"
            aria-label={ariaLabel}
          >
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
          </ul>,
          document.body
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
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState<React.CSSProperties>({});

  const total = adults + childCount;
  const label = `${total} Passenger${total === 1 ? '' : 's'}`;

  const updateMenuPosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const margin = 16;
    const menuWidth = Math.max(280, rect.width);
    let left = rect.left;
    if (left + menuWidth > window.innerWidth - margin) {
      left = window.innerWidth - margin - menuWidth;
    }
    left = Math.max(margin, left);
    setMenuPosition({
      position: 'fixed',
      top: rect.bottom + 6,
      left,
      width: menuWidth,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updateMenuPosition();
    window.addEventListener('scroll', updateMenuPosition, true);
    window.addEventListener('resize', updateMenuPosition);
    return () => {
      window.removeEventListener('scroll', updateMenuPosition, true);
      window.removeEventListener('resize', updateMenuPosition);
    };
  }, [open, updateMenuPosition]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
      triggerRef.current?.blur();
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
      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="passenger-menu"
            style={{ ...styles.passengerMenu, ...menuPosition }}
            role="dialog"
            aria-label="Passenger selection"
          >
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
          </div>,
          document.body
        )}
    </div>
  );
}

function formatRouteLabel(origin: string, destination: string): string {
  return `${origin} – ${destination}`;
}

function HeroCopyBlock() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setVisible(entry.isIntersecting);
        });
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`hero-copy${visible ? ' hero-copy--visible' : ''}`}
    >
      <h1 className="hero-headline">
        <FlightHeroLogo variant="hero" />
      </h1>
      <p className="hero-subheadline">
        Compare award space and cash fares in one search — find the best way to fly.
      </p>
    </div>
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
    <div className="search-mode-bar" role="tablist" aria-label="Search type">
      <button
        type="button"
        role="tab"
        id="search-tab-points"
        aria-selected={value === 'points'}
        aria-controls="search-panel-body"
        className={`search-mode-option${value === 'points' ? ' search-mode-option-active' : ''}`}
        onClick={() => onChange('points')}
      >
        Points Search
      </button>
      <div className="search-mode-separator" aria-hidden="true" />
      <button
        type="button"
        role="tab"
        id="search-tab-cash"
        aria-selected={value === 'cash'}
        aria-controls="search-panel-body"
        className={`search-mode-option${value === 'cash' ? ' search-mode-option-active' : ''}`}
        onClick={() => onChange('cash')}
      >
        Cash Search
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
  return_departure_timezone?: string;
  return_arrival_timezone?: string;
  return_departure_at?: string;
  return_arrival_at?: string;
  return_flight_number: string;
  return_carrier: string;
  return_stops: number;
  return_duration_minutes?: number;
  return_itinerary?: FlightItinerary;
}

interface BookingLinks {
  seats_aero: string;
  program: string;
}

interface Flight {
  id: number | string;
  departure_token?: string;
  booking_token?: string;
  booking_links?: BookingLinks;
  origin: string;
  destination: string;
  departure_date: string;
  departure_time?: string;
  arrival_time?: string;
  departure_timezone?: string;
  arrival_timezone?: string;
  departure_at?: string;
  arrival_at?: string;
  carrier: string;
  carrier_logos?: string[];
  flight_number: string;
  duration: string;
  duration_minutes?: number;
  stops: number;
  itinerary?: FlightItinerary;
  cash_price: number;
  cash_price_matched?: boolean;
  return_departure_time?: string;
  return_arrival_time?: string;
  return_departure_timezone?: string;
  return_arrival_timezone?: string;
  return_departure_at?: string;
  return_arrival_at?: string;
  return_flight_number?: string;
  return_carrier?: string;
  return_duration?: string;
  return_stops?: number;
  return_itinerary?: FlightItinerary;
  award_details?: AwardDetails;
}

function applyReturnLeg(flight: Flight, leg: ReturnLegFields): Flight {
  return {
    ...flight,
    return_departure_time: leg.return_departure_time,
    return_arrival_time: leg.return_arrival_time,
    return_departure_timezone: leg.return_departure_timezone,
    return_arrival_timezone: leg.return_arrival_timezone,
    return_departure_at: leg.return_departure_at,
    return_arrival_at: leg.return_arrival_at,
    return_flight_number: leg.return_flight_number,
    return_carrier: leg.return_carrier,
    return_stops: leg.return_stops,
    return_itinerary: leg.return_itinerary,
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
  | 'departure-desc'
  | 'cpp-asc'
  | 'cpp-desc';

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
  return getDepartureSortMinutes(flight);
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
    if (sortOption === 'cpp-asc' || sortOption === 'cpp-desc') {
      const aCpp = getFlightCpp(a);
      const bCpp = getFlightCpp(b);
      if (aCpp == null && bCpp == null) return 0;
      if (aCpp == null) return 1;
      if (bCpp == null) return -1;
      return sortOption === 'cpp-asc' ? aCpp - bCpp : bCpp - aCpp;
    }
    return 0;
  });
  return sorted;
}

function formatDisplayDate(iso: string): string {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return iso;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function buildGoogleFlightsUrl(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate?: string,
): string {
  const query = returnDate
    ? `Flights from ${origin} to ${destination} on ${departureDate} returning ${returnDate}`
    : `Flights from ${origin} to ${destination} on ${departureDate}`;
  return `https://www.google.com/travel/flights?q=${encodeURIComponent(query)}`;
}

function buildCashBookingUrl(
  flight: Flight,
  tripType: 'one-way' | 'round-trip',
  returnDate: string,
): string {
  if (flight.booking_token) {
    const params = new URLSearchParams({
      booking_token: flight.booking_token,
      origin: flight.origin,
      destination: flight.destination,
      departure_date: flight.departure_date,
    });
    if (tripType === 'round-trip' && returnDate) {
      params.set('return_date', returnDate);
    }
    return apiUrl(`/api/booking-redirect?${params}`);
  }
  return buildGoogleFlightsUrl(
    flight.origin,
    flight.destination,
    flight.departure_date,
    tripType === 'round-trip' ? returnDate : undefined,
  );
}

function RedemptionGradeBadge({ grade, compact = false }: { grade: RedemptionGrade; compact?: boolean }) {
  return (
    <span className={`redemption-grade redemption-grade--${grade}${compact ? ' redemption-grade--compact' : ''}`}>
      {GRADE_LABELS[grade]}
    </span>
  );
}

function getFlightCpp(flight: Flight): number | null {
  if (!flight.award_details || flight.cash_price <= 0) return null;
  return calculateCpp(
    flight.cash_price,
    flight.award_details.points_required,
    flight.award_details.taxes_and_fees,
  );
}

function FlightDetailModal({
  flight,
  searchType,
  tripType,
  returnDate,
  militaryZuluTime,
  onClose,
}: {
  flight: Flight;
  searchType: 'cash' | 'points';
  tripType: 'one-way' | 'round-trip';
  returnDate: string;
  militaryZuluTime: boolean;
  onClose: () => void;
}) {
  const { profile } = useAuth();
  const cppValuations = profile?.preferences?.cppValuations;

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const googleFlightsUrl = buildGoogleFlightsUrl(
    flight.origin,
    flight.destination,
    flight.departure_date,
    tripType === 'round-trip' ? returnDate : undefined,
  );
  const cashBookingUrl = buildCashBookingUrl(flight, tripType, returnDate);
  const programName = flight.award_details?.mileage_program ?? 'mileage program';
  const flightCpp = getFlightCpp(flight);
  const partnerRatings = flight.award_details
    ? rateTransferPartners(flight.award_details.transfer_partners, flightCpp, cppValuations)
    : [];
  const hasReturn = tripType === 'round-trip'
    && (flight.return_flight_number || flight.return_departure_time);

  return (
    <div
      className="modal-overlay"
      style={styles.modalOverlay}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flight-detail-modal"
        style={styles.flightDetailModal}
        role="dialog"
        aria-labelledby="flight-detail-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div style={styles.flightDetailHeader}>
          <div style={styles.flightDetailTitleRow}>
            <CarrierBadge carrier={flight.carrier} logos={flight.carrier_logos} />
            <div>
              <h2 id="flight-detail-title" style={styles.flightDetailTitle}>
                {flight.origin} → {flight.destination}
              </h2>
              <p style={styles.flightDetailSubtitle}>
                {formatDisplayDate(flight.departure_date)}
                {tripType === 'round-trip' && returnDate ? ` – ${formatDisplayDate(returnDate)}` : ''}
              </p>
            </div>
          </div>
          <button type="button" style={styles.flightDetailClose} onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div style={styles.flightDetailSection}>
          <h3 style={styles.flightDetailSectionTitle}>Outbound</h3>
          <p style={styles.flightDetailLine}>
            {flight.departure_time && flight.arrival_time ? (
              <FlightTimeRange
                departure={{
                  time: flight.departure_time,
                  timezone: flight.departure_timezone,
                  at: flight.departure_at,
                }}
                arrival={{
                  time: flight.arrival_time,
                  timezone: flight.arrival_timezone,
                  at: flight.arrival_at,
                }}
                militaryTime={militaryZuluTime}
              />
            ) : 'Times unavailable'}
          </p>
          <p style={styles.flightDetailMeta}>
            {flightDetailLine(flight.carrier, flight.flight_number, flight.duration, flight.stops)}
          </p>
          {flight.itinerary ? <FlightItineraryTimeline itinerary={flight.itinerary} /> : null}
        </div>

        {hasReturn && (
          <div style={styles.flightDetailSection}>
            <h3 style={styles.flightDetailSectionTitle}>Return</h3>
            <p style={styles.flightDetailLine}>
              {flight.return_departure_time && flight.return_arrival_time ? (
                <FlightTimeRange
                  departure={{
                    time: flight.return_departure_time,
                    timezone: flight.return_departure_timezone,
                    at: flight.return_departure_at,
                  }}
                  arrival={{
                    time: flight.return_arrival_time,
                    timezone: flight.return_arrival_timezone,
                    at: flight.return_arrival_at,
                  }}
                  militaryTime={militaryZuluTime}
                />
              ) : 'Times unavailable'}
            </p>
            <p style={styles.flightDetailMeta}>
              {flightDetailLine(
                flight.return_carrier ?? flight.carrier,
                flight.return_flight_number ?? '',
                flight.return_duration ?? '—',
                flight.return_stops ?? 0,
              )}
            </p>
            {flight.return_itinerary ? (
              <FlightItineraryTimeline itinerary={flight.return_itinerary} />
            ) : null}
          </div>
        )}

        <div style={styles.flightDetailSection}>
          <h3 style={styles.flightDetailSectionTitle}>Price</h3>
          {searchType === 'cash' ? (
            <p style={styles.flightDetailPrice}>{formatPrice(flight.cash_price)}</p>
          ) : flight.award_details ? (
            <>
              <div className="flight-price-core">
                <div className="flight-price-primary">
                  <div className="flight-price-cost">
                    <span className="flight-price-points">
                      {flight.award_details.points_required.toLocaleString()} points
                    </span>
                    <span className="flight-price-taxes">
                      + {formatPrice(flight.award_details.taxes_and_fees)} taxes &amp; fees
                    </span>
                  </div>
                  {flightCpp != null && (
                    <div className="flight-value-badge" aria-label={`Flight value ${flightCpp.toFixed(2)} cents per point`}>
                      <span className="flight-value-badge__label">Flight Value</span>
                      <span className="flight-value-badge__value">{flightCpp.toFixed(2)}¢/pt</span>
                    </div>
                  )}
                </div>
                {flight.cash_price_matched && flight.cash_price > 0 && (
                  <p className="flight-price-cash-comparison">
                    Comparable cash fare: {formatPrice(flight.cash_price)}
                  </p>
                )}
                {flight.award_details.mileage_program && (
                  <p className="flight-price-meta">{flight.award_details.mileage_program}</p>
                )}
                {flight.award_details.seats_remaining != null && flight.award_details.seats_remaining > 0 && (
                  <p className="flight-price-meta">
                    {flight.award_details.seats_remaining} seat{flight.award_details.seats_remaining === 1 ? '' : 's'} left
                  </p>
                )}
              </div>
              {partnerRatings.length > 0 && (
                <div className="redemption-partners-module">
                  <div className="redemption-partners-module-header">
                    <span className="redemption-partners-module-title">Transfer partners</span>
                    <Link
                      to="/faq#custom-cent-per-point"
                      className="redemption-cpp-help"
                      aria-label="What is custom cent-per-point?"
                      title="What is custom cent-per-point?"
                      onClick={onClose}
                    >
                      ?
                    </Link>
                  </div>
                  <ul className="redemption-partners-list">
                    {partnerRatings.map((rating) => (
                      <li key={rating.partner} className="redemption-partner-row">
                        <div className="redemption-partner-info">
                          <TransferPartnerLogo partner={rating.partner} size={36} />
                          <div className="redemption-partner-copy">
                            <span className="redemption-partner-name">{rating.partner}</span>
                            {rating.benchmarkCpp != null ? (
                              <span className="redemption-partner-baseline">
                                (Your Baseline: {rating.benchmarkCpp.toFixed(2)}¢/pt)
                              </span>
                            ) : null}
                          </div>
                        </div>
                        {rating.grade ? (
                          <RedemptionGradeBadge grade={rating.grade} compact />
                        ) : (
                          <span className="redemption-partner-unrated">Grade unavailable</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : null}
        </div>

        <div style={styles.flightDetailActions}>
          {searchType === 'cash' ? (
            <>
              <a
                href={cashBookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.flightDetailPrimaryLink}
              >
                {flight.booking_token ? 'Book this flight' : 'View on Google Flights'}
              </a>
              {flight.booking_token && (
                <a
                  href={googleFlightsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.flightDetailSecondaryLink}
                >
                  View on Google Flights
                </a>
              )}
            </>
          ) : (
            <>
              {flight.booking_links?.program && (
                <a
                  href={flight.booking_links.program}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.flightDetailPrimaryLink}
                >
                  Book with {programName}
                </a>
              )}
              {flight.booking_links?.seats_aero && (
                <a
                  href={flight.booking_links.seats_aero}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.flightDetailSecondaryLink}
                >
                  View on Seats.aero
                </a>
              )}
            </>
          )}
        </div>
        <p style={styles.flightDetailDisclaimer}>
          {searchType === 'cash'
            ? 'Booking opens the airline or partner site via Google Flights. Prices may change.'
            : 'Award space is from Seats.aero cached data. Always verify availability before booking.'}
        </p>
      </div>
    </div>
  );
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
  const { user, profile, loading: authLoading } = useAuth();
  const militaryZuluTime = profile?.preferences?.militaryZuluTime ?? false;
  const homeAirportLabel = profile?.preferences?.homeAirportLabel ?? '';
  const [adults, setAdults] = useState(1);
  const [childrenCount, setChildrenCount] = useState(0);
  const passengers = adults + childrenCount;
  const [tripType, setTripType] = useState<'one-way' | 'round-trip'>('round-trip');
  const [cabinClass, setCabinClass] = useState('economy');
  const [route, setRoute] = useState({ origin: '', destination: '' });
  const origin = route.origin;
  const destination = route.destination;
  const setOrigin = (value: string) => {
    setRoute((prev) => ({ ...prev, origin: value }));
  };
  const setDestination = (value: string) => {
    setRoute((prev) => ({ ...prev, destination: value }));
  };
  const [date, setDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [searchType, setSearchType] = useState<'cash' | 'points'>('points');
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
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [routeSwapGeneration, setRouteSwapGeneration] = useState(0);
  const searchSeqRef = useRef(0);
  const originPrefillRef = useRef<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const showContinueSearching = !hasSearched && shouldShowContinueSearching(user?.uid);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setRecentSearches([]);
      originPrefillRef.current = null;
      return;
    }
    setRecentSearches(getRecentSearches(user.uid));
  }, [authLoading, user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      originPrefillRef.current = null;
      return;
    }
    if (!homeAirportLabel) return;
    if (originPrefillRef.current === user.uid) return;

    setRoute((prev) => {
      originPrefillRef.current = user.uid;
      if (prev.origin.trim()) return prev;
      return { ...prev, origin: homeAirportLabel };
    });
  }, [authLoading, user, homeAirportLabel]);

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
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setRoute((prev) => ({
      origin: prev.destination,
      destination: prev.origin,
    }));
    setRouteSwapGeneration((generation) => generation + 1);
  };

  const hasSearchInput = Boolean(
    origin.trim() || destination.trim() || date || returnDate,
  );

  const clearSearchForm = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setRoute({ origin: '', destination: '' });
    setDate('');
    setReturnDate('');
    setTripType('round-trip');
    setAdults(1);
    setChildrenCount(0);
    setCabinClass('economy');
    setRouteSwapGeneration((generation) => generation + 1);
    setFlights([]);
    setHasSearched(false);
    setLoading(false);
    setLoadingReturnDetails(false);
    setSelectedFlight(null);
    setValidationWarning(null);
  };

  const resetHomePage = useCallback(() => {
    searchSeqRef.current += 1;
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setDate('');
    setReturnDate('');
    setTripType('round-trip');
    setAdults(1);
    setChildrenCount(0);
    setCabinClass('economy');
    setSearchType('points');
    setFlights([]);
    setHasSearched(false);
    setLoading(false);
    setLoadingReturnDetails(false);
    setSelectedFlight(null);
    setValidationWarning(null);
    setAdvancedEnabled(false);
    setStopsFilter('2-or-fewer');
    setSortOption('price-asc');
    setMaxTaxes(150);
    setRouteSwapGeneration((generation) => generation + 1);
    originPrefillRef.current = null;
    const nextOrigin = user && homeAirportLabel ? homeAirportLabel : '';
    if (user && homeAirportLabel) {
      originPrefillRef.current = user.uid;
    }
    setRoute({ origin: nextOrigin, destination: '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [user, homeAirportLabel]);

  const handleSearchTypeChange = (next: 'cash' | 'points') => {
    if (next === searchType) return;
    setSearchType(next);
    setFlights([]);
    setHasSearched(false);
    setLoadingReturnDetails(false);
    if (next === 'cash' && (sortOption === 'cpp-asc' || sortOption === 'cpp-desc')) {
      setSortOption('price-asc');
    }
  };

  const runFlightSearch = async (request: {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate: string;
    tripType: 'one-way' | 'round-trip';
    searchType: 'cash' | 'points';
    cabinClass: string;
    adults: number;
    childrenCount: number;
  }) => {
    const trimmedOrigin = request.origin.trim();
    const trimmedDestination = request.destination.trim();
    const passengersTotal = request.adults + request.childrenCount;
    const searchSeq = ++searchSeqRef.current;

    setLoading(true);
    setLoadingReturnDetails(false);
    setFlights([]);

    if (user) {
      const recorded = recordRecentSearch(user.uid, {
        origin: trimmedOrigin,
        destination: trimmedDestination,
        departureDate: request.departureDate,
        returnDate: request.returnDate,
        tripType: request.tripType,
        searchType: request.searchType,
        cabinClass: request.cabinClass,
        adults: request.adults,
        childrenCount: request.childrenCount,
      });
      setRecentSearches(recorded.recent);
    }

    try {
      const params = new URLSearchParams({
        origin: trimmedOrigin,
        destination: trimmedDestination,
        departure_date: request.departureDate,
        search_type: request.searchType,
        passengers: String(passengersTotal),
        adults: String(request.adults),
        children: String(request.childrenCount),
        trip_type: request.tripType,
        cabin_class: request.cabinClass,
      });
      if (request.tripType === 'round-trip') {
        params.set('return_date', request.returnDate);
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
      } else if (request.tripType === 'round-trip' && request.searchType === 'cash') {
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
                  departureDate: request.departureDate,
                  returnDate: request.returnDate,
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
      console.error('Error fetching flights:', error);
      showDialog(
        'Connection error',
        'Could not reach the flight search server. Make sure the Python backend is running.'
      );
    } finally {
      setHasSearched(true);
      setLoading(false);
    }
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

    await runFlightSearch({
      origin: trimmedOrigin,
      destination: trimmedDestination,
      departureDate: date,
      returnDate,
      tripType,
      searchType,
      cabinClass,
      adults,
      childrenCount,
    });
  };

  const handleResumeSearch = async (search: RecentSearch) => {
    setRoute({ origin: search.origin, destination: search.destination });
    setDate(search.departureDate);
    setReturnDate(search.returnDate);
    setTripType(search.tripType);
    setSearchType(search.searchType);
    setCabinClass(search.cabinClass);
    setAdults(search.adults);
    setChildrenCount(search.childrenCount);
    setRouteSwapGeneration((generation) => generation + 1);

    window.scrollTo({ top: 0, behavior: 'smooth' });

    await runFlightSearch({
      origin: search.origin,
      destination: search.destination,
      departureDate: search.departureDate,
      returnDate: search.returnDate,
      tripType: search.tripType,
      searchType: search.searchType,
      cabinClass: search.cabinClass,
      adults: search.adults,
      childrenCount: search.childrenCount,
    });
  };

  const handleTrendingDealSelect = async (deal: TrendingDeal) => {
    setRoute({ origin: deal.origin, destination: deal.destination });
    setDate(deal.departureDate);
    setReturnDate(deal.returnDate);
    setTripType(deal.tripType);
    setSearchType(deal.searchType);
    setCabinClass(deal.cabinClass);
    setAdults(1);
    setChildrenCount(0);
    setRouteSwapGeneration((generation) => generation + 1);

    window.scrollTo({ top: 0, behavior: 'smooth' });

    await runFlightSearch({
      origin: deal.origin,
      destination: deal.destination,
      departureDate: deal.departureDate,
      returnDate: deal.returnDate,
      tripType: deal.tripType,
      searchType: deal.searchType,
      cabinClass: deal.cabinClass,
      adults: 1,
      childrenCount: 0,
    });
  };

  return (
    <HomeSearchResetProvider value={resetHomePage}>
    <div className="app-page">
      <TopNavbar />

      <section className={`hero-section hero-section--landing${hasSearched ? ' hero-section--searched' : ''}`} aria-label="Flight search">
        <div className="hero-backdrop" aria-hidden />
        <div className="hero-inner">
          <HeroCopyBlock />

          <div className="hero-search">
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
            <div className="filter-bar-options">
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
            <button
              type="button"
              className="search-clear-link"
              onClick={clearSearchForm}
              disabled={!hasSearchInput || loading}
              aria-label="Clear search form"
            >
              Clear
            </button>
          </div>

          <div className="main-bar" style={styles.mainBar}>
            <div className="route-block" style={styles.routeBlock}>
              <div style={styles.routeField} className="route-field">
                <span className="form-field-icon" style={styles.fieldIcon}><PlaneDepartIcon /></span>
                <AirportAutocomplete
                  value={origin}
                  onChange={setOrigin}
                  placeholder="From (city or airport)"
                  ariaLabel="Origin"
                  swapGeneration={routeSwapGeneration}
                />
              </div>

              <div className="route-swap-slot" style={styles.routeSwapSlot}>
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
              </div>

              <div style={styles.routeField} className="route-field">
                <span className="form-field-icon" style={styles.fieldIcon}><PlaneArriveIcon /></span>
                <AirportAutocomplete
                  value={destination}
                  onChange={setDestination}
                  placeholder="To (city or airport)"
                  ariaLabel="Destination"
                  swapGeneration={routeSwapGeneration}
                />
              </div>
            </div>

            <div className="date-block" style={styles.dateBlock}>
              <span className="form-field-icon" style={styles.fieldIcon}><CalendarIcon /></span>
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
                    ...(searchType === 'points'
                      ? [
                          { value: 'cpp-desc' as const, label: 'CPP: high to low' },
                          { value: 'cpp-asc' as const, label: 'CPP: low to high' },
                        ]
                      : []),
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

            {loading && (
              <div className="flight-search-loader" style={styles.flightSearchLoader} role="status" aria-live="polite">
                <PlacesSearchLoader size={112} />
                <span style={styles.flightSearchLoaderText}>Searching flights...</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {showContinueSearching && (
        <ContinueSearching searches={recentSearches} onSelect={handleResumeSearch} />
      )}

      {!hasSearched && <TrendingDeals onSelectDeal={handleTrendingDealSelect} />}

      <div className="app-content" style={styles.container}>
      {/* Results Section */}
      <main className="results-container" style={styles.resultsContainer}>
        {hasSearched && flights.length > 0 && (
          <p style={styles.resultsCount}>
            Showing {displayedFlights.length} of {flights.length} flight{flights.length === 1 ? '' : 's'}
          </p>
        )}
        {!loading && displayedFlights.length > 0 ? (
          displayedFlights.map((flight) => (
            <div key={flight.id} className="flight-card" style={styles.flightCard}>
              <div className="flight-card-body" style={styles.flightCardBody}>
                <div className="flight-info" style={styles.flightInfo}>
                  <div className="flight-route-row" style={styles.flightRouteRow}>
                    <CarrierBadge carrier={flight.carrier} logos={flight.carrier_logos} />
                    <strong className="flight-route-label" style={styles.routeLabel}>
                      {formatRouteLabel(flight.origin, flight.destination)}
                    </strong>
                  </div>
                  <div className="flight-meta-block" style={styles.flightMetaBlock}>
                    {flight.departure_time && flight.arrival_time && (
                      <FlightTimeRange
                        style={styles.timeText}
                        departure={{
                          time: flight.departure_time,
                          timezone: flight.departure_timezone,
                          at: flight.departure_at,
                        }}
                        arrival={{
                          time: flight.arrival_time,
                          timezone: flight.arrival_timezone,
                          at: flight.arrival_at,
                        }}
                        militaryTime={militaryZuluTime}
                      />
                    )}
                    <span style={styles.subtext}>
                      {flightDetailLine(flight.carrier, flight.flight_number, flight.duration, flight.stops)}
                    </span>
                  </div>
                  {tripType === 'round-trip' && (
                    searchType === 'points' ? (
                      (flight.return_flight_number || flight.return_departure_time) ? (
                        <>
                          <div className="flight-return-route-row" style={styles.flightReturnRouteRow}>
                            <strong className="flight-route-label" style={styles.returnRouteLabel}>
                              {formatRouteLabel(flight.destination, flight.origin)}
                            </strong>
                          </div>
                          <div className="flight-meta-block" style={styles.flightMetaBlock}>
                            {flight.return_departure_time && flight.return_arrival_time && (
                              <FlightTimeRange
                                style={styles.timeText}
                                departure={{
                                  time: flight.return_departure_time,
                                  timezone: flight.return_departure_timezone,
                                  at: flight.return_departure_at,
                                }}
                                arrival={{
                                  time: flight.return_arrival_time,
                                  timezone: flight.return_arrival_timezone,
                                  at: flight.return_arrival_at,
                                }}
                                militaryTime={militaryZuluTime}
                              />
                            )}
                            <span style={styles.subtext}>
                              {flightDetailLine(
                                flight.return_carrier ?? flight.carrier,
                                flight.return_flight_number ?? '',
                                flight.return_duration ?? '—',
                                flight.return_stops ?? 0,
                              )}
                            </span>
                          </div>
                        </>
                      ) : null
                    ) : (
                    <>
                      <div className="flight-return-route-row" style={styles.flightReturnRouteRow}>
                        <strong className="flight-route-label" style={styles.returnRouteLabel}>
                          {formatRouteLabel(flight.destination, flight.origin)}
                        </strong>
                      </div>
                      {flight.return_flight_number ? (
                        <div className="flight-meta-block" style={styles.flightMetaBlock}>
                          {flight.return_departure_time && flight.return_arrival_time && (
                            <FlightTimeRange
                              style={styles.timeText}
                              departure={{
                                time: flight.return_departure_time,
                                timezone: flight.return_departure_timezone,
                                at: flight.return_departure_at,
                              }}
                              arrival={{
                                time: flight.return_arrival_time,
                                timezone: flight.return_arrival_timezone,
                                at: flight.return_arrival_at,
                              }}
                              militaryTime={militaryZuluTime}
                            />
                          )}
                          <span style={styles.subtext}>
                            {flightDetailLine(
                              flight.return_carrier ?? flight.carrier,
                              flight.return_flight_number ?? '',
                              flight.return_duration ?? '—',
                              flight.return_stops ?? 0,
                            )}
                          </span>
                        </div>
                      ) : loadingReturnDetails && flight.departure_token ? (
                        <span style={styles.returnLoading}>Loading return flight…</span>
                      ) : flight.departure_token ? (
                        <span style={styles.returnLoading}>Return details unavailable</span>
                      ) : null}
                    </>
                    )
                  )}
                </div>

              <div className="flight-card-actions" style={styles.flightCardActions}>
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
                        {flight.cash_price_matched && flight.cash_price > 0 && (
                          <div style={styles.subtext}>~{formatPrice(flight.cash_price)} cash</div>
                        )}
                        {getFlightCpp(flight) != null && (
                          <div style={styles.cppText}>{getFlightCpp(flight)!.toFixed(2)} cents/pt</div>
                        )}
                        {flight.award_details.mileage_program && (
                          <div style={styles.programTag}>{flight.award_details.mileage_program}</div>
                        )}
                        <div className="partner-container" style={styles.partnerContainer}>
                          {flight.award_details.transfer_partners.map((p, i) => (
                            <span key={i} className="partner-tag" style={styles.partnerTag} title={p}>
                              <TransferPartnerLogo partner={p} size={25} />
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
                <button
                  type="button"
                  className="view-flight-btn"
                  style={styles.viewFlightBtn}
                  onClick={() => setSelectedFlight(flight)}
                >
                  View flight
                  <ArrowRightIcon size={14} />
                </button>
              </div>
              </div>
            </div>
          ))
        ) : !loading && hasSearched && flights.length === 0 ? (
          <div style={styles.emptyState}>No flights were found for your search. Try different dates or airports.</div>
        ) : !loading && hasSearched && flights.length > 0 ? (
          <div style={styles.emptyState}>No flights match your advanced filters. Try allowing more stops.</div>
        ) : (
          !hasSearched && <div style={styles.emptyState}>Enter your route details above to explore options.</div>
        )}
      </main>
      </div>

      {selectedFlight && (
        <FlightDetailModal
          flight={selectedFlight}
          searchType={searchType}
          tripType={tripType}
          returnDate={returnDate}
          militaryZuluTime={militaryZuluTime}
          onClose={() => setSelectedFlight(null)}
        />
      )}

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
      <SiteFooter />
    </div>
    </HomeSearchResetProvider>
  );
}

const FONT_FAMILY = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const fieldFont: React.CSSProperties = {
  fontFamily: FONT_FAMILY,
  fontSize: '16px',
  fontWeight: 400,
  color: '#111827',
  letterSpacing: '-0.01em',
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    fontFamily: FONT_FAMILY,
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '24px 16px 48px',
    color: '#111827',
  },
  searchPanelWrap: {
    width: '100%',
    maxWidth: '1000px',
  },
  searchPanel: {
    background: '#fff',
    border: 'none',
    borderRadius: '0 0 12px 12px',
    boxShadow: 'none',
    overflow: 'visible',
  },
  advancedSection: {
    borderTop: '1px solid #f0f0f0',
    padding: '12px 20px 16px',
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
    justifyContent: 'space-between',
    gap: '8px 12px',
    padding: '10px 20px 4px',
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
    padding: '6px 4px',
    cursor: 'pointer',
    fontSize: '15px',
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
    width: 'max-content',
    background: '#fff',
    borderRadius: '8px',
    boxShadow: '0 8px 30px rgba(99, 102, 241, 0.14), 0 2px 8px rgba(0, 0, 0, 0.06)',
    padding: 0,
    listStyle: 'none',
    margin: 0,
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
    minWidth: '280px',
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 8px 30px rgba(99, 102, 241, 0.14), 0 2px 8px rgba(0, 0, 0, 0.06)',
    padding: '18px 20px',
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
    gap: '10px',
    padding: '6px 20px 24px',
    flexWrap: 'wrap',
    overflow: 'visible',
  },
  routeBlock: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)',
    alignItems: 'center',
    flex: '2 1 300px',
    minWidth: '260px',
    background: '#f5f5f5',
    borderRadius: '10px',
    padding: '6px 8px',
    columnGap: '4px',
    overflow: 'visible',
  },
  routeSwapSlot: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 2,
    flexShrink: 0,
    width: '44px',
  },
  routeField: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    minWidth: 0,
    gap: '8px',
    padding: '0 8px',
    overflow: 'visible',
  },
  airportAutocomplete: {
    position: 'relative',
    flex: 1,
    minWidth: 0,
    overflow: 'visible',
  },
  suggestionMenu: {
    margin: 0,
    padding: '6px 0',
    listStyle: 'none',
    background: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: '10px',
    boxShadow: '0 8px 24px rgba(60, 64, 67, 0.18)',
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
    color: '#6b7280',
    flexShrink: 0,
  },
  routeInput: {
    ...fieldFont,
    flex: 1,
    minWidth: 0,
    width: '100%',
    border: 'none',
    background: 'transparent',
    padding: '12px 0',
    outline: 'none',
    height: '48px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  routeInputLoading: {
    paddingRight: '34px',
  },
  swapBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    border: '1px solid #d1d5db',
    background: '#fff',
    color: '#4b5563',
    cursor: 'pointer',
    flexShrink: 0,
    padding: 0,
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
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
    gap: '8px',
    color: '#fff',
    border: 'none',
    padding: '0 28px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    minHeight: '48px',
    minWidth: '132px',
    flexShrink: 0,
    alignSelf: 'stretch',
    marginLeft: 'auto',
  },
  resultsContainer: { marginTop: '0' },
  resultsCount: {
    margin: '0 0 10px',
    fontSize: '13px',
    color: '#6b7280',
    fontWeight: 500,
  },
  flightSearchLoader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    padding: '24px 24px 8px',
    marginTop: '8px',
    textAlign: 'center',
  },
  flightSearchLoaderText: {
    fontSize: '16px',
    fontWeight: 500,
    color: 'rgba(255, 255, 255, 0.88)',
  },
  flightCard: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '16px',
    background: '#fff',
    padding: '16px 20px',
    borderRadius: '10px',
    border: '1px solid #e5e7eb',
    marginBottom: '10px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
  },
  flightCardBody: {
    display: 'flex',
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    minWidth: 0,
    width: '100%',
  },
  flightCardActions: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: '8px',
    flexShrink: 0,
    minWidth: '132px',
  },
  viewFlightBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '9px 16px',
    minWidth: '124px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  },
  flightDetailModal: {
    background: '#fff',
    borderRadius: '16px',
    padding: '24px',
    maxWidth: '520px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 16px 48px rgba(0, 0, 0, 0.2)',
  },
  flightDetailHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '20px',
  },
  flightDetailTitleRow: {
    display: 'flex',
    gap: '14px',
    alignItems: 'center',
  },
  flightDetailTitle: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 600,
    color: '#1f2937',
  },
  flightDetailSubtitle: {
    margin: '4px 0 0',
    fontSize: '14px',
    color: '#6b7280',
  },
  flightDetailClose: {
    border: 'none',
    background: '#f3f4f6',
    color: '#6b7280',
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    fontSize: '24px',
    lineHeight: 1,
    cursor: 'pointer',
    flexShrink: 0,
  },
  flightDetailSection: {
    marginBottom: '18px',
    paddingBottom: '18px',
    borderBottom: '1px solid #f0f0f0',
  },
  flightDetailSectionTitle: {
    margin: '0 0 8px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#6366f1',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  flightDetailLine: {
    margin: '0 0 4px',
    fontSize: '16px',
    fontWeight: 500,
    color: '#1f2937',
  },
  flightDetailMeta: {
    margin: '0 0 4px',
    fontSize: '14px',
    color: '#6b7280',
  },
  flightDetailPrice: {
    margin: 0,
    fontSize: '28px',
    fontWeight: 600,
    color: '#2e7d32',
  },
  flightDetailPoints: {
    margin: 0,
    fontSize: '26px',
    fontWeight: 600,
    color: '#6366f1',
  },
  flightDetailPartners: {
    marginTop: '8px',
    fontSize: '13px',
    color: '#6b7280',
    lineHeight: 1.5,
  },
  flightDetailActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: '8px',
  },
  flightDetailPrimaryLink: {
    display: 'block',
    textAlign: 'center',
    background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)',
    color: '#fff',
    textDecoration: 'none',
    padding: '12px 16px',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: 600,
  },
  flightDetailSecondaryLink: {
    display: 'block',
    textAlign: 'center',
    background: '#eef2ff',
    color: '#4338ca',
    textDecoration: 'none',
    padding: '12px 16px',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: 600,
  },
  flightDetailDisclaimer: {
    margin: '14px 0 0',
    fontSize: '12px',
    color: '#9ca3af',
    lineHeight: 1.45,
  },
  flightInfo: { display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0 },
  flightRouteRow: { display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 },
  flightMetaBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
    paddingLeft: '52px',
  },
  flightReturnRouteRow: {
    paddingLeft: '52px',
    marginTop: '6px',
  },
  carrierLogoGroup: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    flexShrink: 0,
    minWidth: '40px',
  },
  carrierBadge: {
    background: '#f3f4f6',
    padding: '10px 12px',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '12px',
    lineHeight: 1.2,
    minHeight: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    color: '#374151',
  },
  carrierLogo: { height: '40px', width: 'auto', maxWidth: '72px', objectFit: 'contain', display: 'block' },
  carrierLogoOverflow: { fontSize: '12px', color: '#6b7280', fontWeight: 500 },
  routeLabel: { fontSize: '16px', fontWeight: 600, color: '#111827', lineHeight: 1.25 },
  returnRouteLabel: { fontSize: '15px', fontWeight: 600, color: '#111827', lineHeight: 1.25 },
  returnLoading: { fontSize: '13px', color: '#6b7280', fontStyle: 'italic', paddingLeft: '52px' },
  timeText: { fontSize: '14px', fontWeight: 500, color: '#374151', lineHeight: 1.35 },
  subtext: { fontSize: '13px', color: '#6b7280', lineHeight: 1.35, fontWeight: 400 },
  pricingSection: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' },
  priceText: { fontSize: '28px', fontWeight: 700, color: '#15803d', letterSpacing: '-0.02em' },
  priceHint: { fontSize: '11px', color: '#6b7280', marginBottom: '2px', textAlign: 'right', fontWeight: 500 },
  pointsText: { fontSize: '26px', fontWeight: 700, color: '#4338ca', letterSpacing: '-0.02em' },
  cppText: { fontSize: '14px', fontWeight: 600, color: '#059669', marginTop: 2 },
  programTag: {
    fontSize: '12px',
    color: '#4338ca',
    fontWeight: 600,
    marginTop: '4px',
    textAlign: 'right',
  },
  partnerContainer: { display: 'flex', gap: '7px', flexWrap: 'wrap', marginTop: '6px', justifyContent: 'flex-end' },
  partnerTag: { display: 'inline-flex', alignItems: 'center', padding: 0, background: 'transparent' },
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