import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { apiFetch, apiUrl } from './api';
import DatePicker from './DatePicker';
import { AirportAutocomplete, PlacesSearchLoader } from './components/AirportAutocomplete';
import { FlightHeroLogo } from './components/FlightHeroLogo';
import { FlightItineraryTimeline, type FlightItinerary } from './components/FlightItineraryTimeline';
import { FlightTimeRange } from './components/FlightTimeRange';
import { TransferPartnerLogo } from './components/TransferPartnerLogo';
import { TransferBonusBadge, TransferBonusMath, TransferBonusPartnerChip } from './components/TransferBonusBadge';
import { TrackedDealsSection } from './components/TrackedDealsSection';
import { ContinueSearching } from './components/ContinueSearching';
import { NeedHelpSection } from './components/NeedHelpSection';
import { EcosystemBanner } from './components/EcosystemBanner';
import { HowItWorksSection, type WorkspaceStepId } from './components/HowItWorksSection';
import { TrendingDeals } from './components/TrendingDeals';
import { TrackDealButton } from './components/TrackDealButton';
import { TopNavbar } from './components/TopNavbar';
import { SiteFooter } from './components/SiteFooter';
import { useAuth } from './context/AuthContext';
import { useTrackedDeals } from './context/TrackedDealsContext';
import { HomeSearchResetProvider } from './context/HomeSearchContext';
import {
  calculateCpp,
  GRADE_LABELS,
  partnerLabelToKey,
  rateTransferPartners,
  TRANSFER_PARTNER_OPTIONS,
  type RedemptionGrade,
} from './lib/cpp';
import { getDepartureSortMinutes } from './lib/flightTimes';
import {
  getFlightSearchValidationError,
  openFlightSearchInNewTab,
  parseFlightSearchFromParams,
  type FlightSearchRequest,
} from './lib/searchUrl';
import {
  loadRecentSearchState,
  MIN_SEARCHES_TO_SHOW_CONTINUE,
  recordRecentSearch,
  updateRecentSearchPricing,
  type RecentSearch,
} from './lib/recentSearches';
import {
  trackedDealToSearchInput,
  type TrackedDeal,
  type TrackedDealInput,
} from './lib/trackedDeals';
import { HOME_TRENDING_DEALS, type TrendingDeal } from './data/trendingDeals';
import {
  getApplicableTransferBonuses,
  getTransferBonusForPartner,
} from './data/transferBonuses';
import { ChevronDownIcon, PlaneArriveIcon, PlaneDepartIcon, CalendarIcon, SwapIcon, SearchIcon, ArrowRightIcon, UserIcon } from './icons';

const ALL_BANK_KEYS = TRANSFER_PARTNER_OPTIONS.map((partner) => partner.key);

const BANK_SHORT_NAMES: Record<string, string> = {
  amex: 'Amex',
  chase: 'Chase',
  citi: 'Citi',
  capital_one: 'Cap One',
  bilt: 'Bilt',
};

type StopsFilter = 'nonstop' | '1-or-fewer' | '2-or-fewer';

function getStopsTriggerLabel(filter: StopsFilter): string {
  if (filter === 'nonstop') return 'Nonstop';
  if (filter === '1-or-fewer') return '≤1 stop';
  return 'Any stops';
}

function isStopsFilterActive(filter: StopsFilter): boolean {
  return filter !== '2-or-fewer';
}

function getBankTriggerMeta(selectedKeys: readonly string[]): { label: string; active: boolean } {
  if (selectedKeys.length >= ALL_BANK_KEYS.length) {
    return { label: 'All Banks', active: false };
  }
  if (selectedKeys.length === 1) {
    const key = selectedKeys[0];
    return {
      label: BANK_SHORT_NAMES[key] ?? '1 Bank',
      active: true,
    };
  }
  return { label: `${selectedKeys.length} Banks`, active: true };
}

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
  triggerLabel?: string;
  chipActive?: boolean;
}

function FilterDropdown<T extends string | number>({
  value,
  onChange,
  options,
  ariaLabel,
  minTriggerWidth,
  disabled = false,
  triggerLabel,
  chipActive = false,
}: FilterDropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const [hoveredOption, setHoveredOption] = useState<T | null>(null);
  const [triggerHovered, setTriggerHovered] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const [menuPosition, setMenuPosition] = useState<React.CSSProperties>({});

  const selectedLabel = triggerLabel ?? options.find((option) => option.value === value)?.label ?? '';

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
        className={`filter-trigger filter-chip-trigger${chipActive ? ' filter-chip-trigger--active' : ''}${open ? ' filter-chip-trigger--open' : ''}`}
        style={{
          ...(disabled ? styles.filterTriggerDisabled : {}),
          ...(!chipActive && open && !disabled ? styles.filterTriggerOpen : {}),
          ...(!chipActive && triggerHovered && !disabled ? styles.filterTriggerHover : {}),
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
        <span className="filter-chip-label">{selectedLabel}</span>
        <span className="filter-chevron" style={{ ...styles.filterChevron, ...(open ? styles.filterChevronOpen : triggerHovered ? styles.filterChevronHover : {}) }}>
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

function BankProgramsDropdown({
  selectedKeys,
  onToggleKey,
}: {
  selectedKeys: string[];
  onToggleKey: (key: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [triggerHovered, setTriggerHovered] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState<React.CSSProperties>({});
  const selectedKeySet = new Set(selectedKeys);

  const { label: triggerLabel, active: chipActive } = getBankTriggerMeta(selectedKeys);

  const updateMenuPosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const margin = 16;
    const menuWidth = Math.max(300, rect.width);
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

  return (
    <div ref={rootRef} className="filter-dropdown" style={styles.filterDropdown}>
      <button
        ref={triggerRef}
        type="button"
        className={`filter-trigger filter-chip-trigger${chipActive ? ' filter-chip-trigger--active' : ''}${open ? ' filter-chip-trigger--open' : ''}`}
        style={{
          ...(open && !chipActive ? styles.filterTriggerOpen : triggerHovered && !chipActive ? styles.filterTriggerHover : {}),
        }}
        onMouseEnter={() => setTriggerHovered(true)}
        onMouseLeave={() => setTriggerHovered(false)}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Bank programs"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="filter-chip-label">{triggerLabel}</span>
        <span className="filter-chevron" style={{ ...styles.filterChevron, ...(open ? styles.filterChevronOpen : triggerHovered ? styles.filterChevronHover : {}) }}>
          <ChevronDownIcon />
        </span>
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="filter-menu bank-programs-menu"
            style={{ ...styles.filterMenu, ...menuPosition }}
            role="listbox"
            aria-label="Bank programs"
            aria-multiselectable="true"
          >
            {TRANSFER_PARTNER_OPTIONS.map((partner) => {
              const isSelected = selectedKeySet.has(partner.key);
              return (
                <label
                  key={partner.key}
                  className={`bank-programs-option${isSelected ? '' : ' bank-programs-option--inactive'}`}
                  role="option"
                  aria-selected={isSelected}
                >
                  <input
                    type="checkbox"
                    className="bank-programs-checkbox"
                    checked={isSelected}
                    onChange={() => onToggleKey(partner.key)}
                  />
                  <TransferPartnerLogo partner={partner.label} size={20} className="bank-programs-logo" />
                  <span className="bank-programs-label">{partner.label}</span>
                </label>
              );
            })}
          </div>,
          document.body,
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
    <div ref={rootRef} className="filter-dropdown filter-dropdown--passengers" style={styles.filterDropdown}>
      <button
        ref={triggerRef}
        type="button"
        className="filter-trigger passenger-trigger"
        style={{
          ...styles.filterTrigger,
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
        <span className="passenger-trigger-compact" aria-hidden="true">
          <UserIcon size={16} />
          <span className="passenger-trigger-count">{total}</span>
        </span>
        <span className="passenger-trigger-label">{label}</span>
        <span className="filter-chevron" style={{ ...styles.filterChevron, ...(open ? styles.filterChevronOpen : triggerHovered ? styles.filterChevronHover : {}) }}>
          <ChevronDownIcon size={12} />
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

function HeroCopyBlock({ immediate = false }: { immediate?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(immediate);

  useEffect(() => {
    if (immediate) return undefined;

    const el = ref.current;
    if (!el) return undefined;

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
  }, [immediate]);

  return (
    <div
      ref={ref}
      className={`hero-copy${visible ? ' hero-copy--visible' : ''}`}
    >
      <h1 className="hero-headline">
        <FlightHeroLogo variant="hero" />
      </h1>
      <p className="hero-subheadline">
        Search real-time award seats, track transfer partners, and uncover hidden point valuations.
      </p>
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

const STOPS_FILTER_OPTIONS: { value: StopsFilter; label: string }[] = [
  { value: 'nonstop', label: 'Nonstop' },
  { value: '1-or-fewer', label: '1 stop or fewer' },
  { value: '2-or-fewer', label: '2 stops or fewer' },
];

type SortOption =
  | 'price-asc'
  | 'price-desc'
  | 'duration-asc'
  | 'departure-asc'
  | 'departure-desc'
  | 'cpp-desc';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'price-asc', label: 'Points: low to high' },
  { value: 'price-desc', label: 'Points: high to low' },
  { value: 'departure-asc', label: 'Departure: earliest first' },
  { value: 'departure-desc', label: 'Departure: latest first' },
  { value: 'duration-asc', label: 'Duration: shortest first' },
  { value: 'cpp-desc', label: 'CPP: high to low' },
];

function ResultsFiltersPanel({
  stopsFilter,
  onStopsFilterChange,
  maxTaxes,
  taxesSliderMax,
  onMaxTaxesChange,
  selectedBankKeys,
  onToggleBankKey,
}: {
  stopsFilter: StopsFilter;
  onStopsFilterChange: (value: StopsFilter) => void;
  maxTaxes: number;
  taxesSliderMax: number;
  onMaxTaxesChange: (value: number) => void;
  selectedBankKeys: string[];
  onToggleBankKey: (key: string) => void;
}) {
  return (
    <div className="search-filters-bar">
      <div className="search-filters-chips">
        <FilterDropdown
          value={stopsFilter}
          onChange={onStopsFilterChange}
          options={STOPS_FILTER_OPTIONS}
          ariaLabel="Stops"
          triggerLabel={getStopsTriggerLabel(stopsFilter)}
          chipActive={isStopsFilterActive(stopsFilter)}
        />
        <BankProgramsDropdown
          selectedKeys={selectedBankKeys}
          onToggleKey={onToggleBankKey}
        />
      </div>
      <div className="search-filters-taxes">
        <span className="search-filters-taxes-label">Max taxes</span>
        <MaxTaxesSlider
          value={Math.min(maxTaxes, taxesSliderMax)}
          max={taxesSliderMax}
          disabled={false}
          onChange={onMaxTaxesChange}
        />
      </div>
    </div>
  );
}

function matchesBankFilter(flight: Flight, selectedBankKeys: readonly string[]): boolean {
  if (selectedBankKeys.length >= ALL_BANK_KEYS.length) {
    return true;
  }
  const partners = flight.award_details?.transfer_partners ?? [];
  return partners.some((label) => {
    const key = partnerLabelToKey(label);
    return key != null && selectedBankKeys.includes(key);
  });
}

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

function computeLowestSearchPricing(flights: Flight[]): {
  lowestPoints?: number;
  lowestCash?: number;
} {
  let lowestPoints: number | undefined;
  let lowestCash: number | undefined;

  for (const flight of flights) {
    const points = flight.award_details?.points_required;
    if (points != null && points > 0) {
      lowestPoints = lowestPoints == null ? points : Math.min(lowestPoints, points);
    }
    if (flight.cash_price > 0) {
      lowestCash = lowestCash == null ? flight.cash_price : Math.min(lowestCash, flight.cash_price);
    }
  }

  return { lowestPoints, lowestCash };
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
    if (sortOption === 'departure-asc' || sortOption === 'departure-desc') {
      const aMinutes = getDepartureMinutes(a);
      const bMinutes = getDepartureMinutes(b);
      if (aMinutes == null && bMinutes == null) return 0;
      if (aMinutes == null) return 1;
      if (bMinutes == null) return -1;
      return sortOption === 'departure-asc' ? aMinutes - bMinutes : bMinutes - aMinutes;
    }
    if (sortOption === 'cpp-desc') {
      const aCpp = getFlightCpp(a);
      const bCpp = getFlightCpp(b);
      if (aCpp == null && bCpp == null) return 0;
      if (aCpp == null) return 1;
      if (bCpp == null) return -1;
      return bCpp - aCpp;
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
  searchContext,
  militaryZuluTime,
  onClose,
}: {
  flight: Flight;
  searchType: 'cash' | 'points';
  tripType: 'one-way' | 'round-trip';
  returnDate: string;
  searchContext: TrackedDealInput;
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
  const transferBonuses = flight.award_details?.mileage_program
    ? getApplicableTransferBonuses(
      flight.award_details.transfer_partners,
      flight.award_details.mileage_program,
      flight.award_details.points_required,
    )
    : [];
  const bestTransferBonus = transferBonuses[0] ?? null;
  const hasReturn = tripType === 'round-trip'
    && (flight.return_flight_number || flight.return_departure_time);
  const trackDealInput: TrackedDealInput = {
    ...searchContext,
    departureDate: flight.departure_date,
    snapshot: flight.award_details
      ? {
        pointsRequired: flight.award_details.points_required,
        taxesAndFees: flight.award_details.taxes_and_fees,
        mileageProgram: flight.award_details.mileage_program,
        carrier: flight.carrier,
        flightNumber: flight.flight_number,
      }
      : undefined,
  };

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
          {flight.award_details ? (
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
              {bestTransferBonus && (
                <div className="transfer-bonus-callout">
                  <div className="transfer-bonus-callout-header">
                    <span className="transfer-bonus-callout-title">Transfer bonus</span>
                    <TransferBonusBadge percent={bestTransferBonus.bonus.bonusPercent} />
                  </div>
                  <TransferBonusMath
                    awardPoints={bestTransferBonus.awardPoints}
                    transferPointsNeeded={bestTransferBonus.transferPointsNeeded}
                  />
                  <p className="transfer-bonus-callout-meta">
                    Transfer {bestTransferBonus.transferPointsNeeded.toLocaleString()} via{' '}
                    {bestTransferBonus.partner} to book {bestTransferBonus.awardPoints.toLocaleString()} miles
                  </p>
                  <Link to="/points-news" className="transfer-bonus-callout-link" onClick={onClose}>
                    View all current bonuses
                  </Link>
                </div>
              )}
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
                    {partnerRatings.map((rating) => {
                      const partnerBonus = getTransferBonusForPartner(transferBonuses, rating.partner);
                      return (
                      <li key={rating.partner} className="redemption-partner-row">
                        <div className="redemption-partner-info">
                          {partnerBonus ? (
                            <TransferBonusPartnerChip
                              partner={rating.partner}
                              percent={partnerBonus.bonus.bonusPercent}
                              logoSize={36}
                            />
                          ) : (
                            <TransferPartnerLogo partner={rating.partner} size={36} />
                          )}
                          <div className="redemption-partner-copy">
                            <span className="redemption-partner-name">{rating.partner}</span>
                            {partnerBonus ? (
                              <span className="redemption-partner-bonus-line">
                                <TransferBonusMath
                                  awardPoints={partnerBonus.awardPoints}
                                  transferPointsNeeded={partnerBonus.transferPointsNeeded}
                                  compact
                                />
                              </span>
                            ) : null}
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
                      );
                    })}
                  </ul>
                </div>
              )}
            </>
          ) : null}
        </div>

        <div style={styles.flightDetailActions}>
          <TrackDealButton dealInput={trackDealInput} />
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
          {flight.cash_price_matched && flight.cash_price > 0 && (
            <a
              href={cashBookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.flightDetailCashLink}
            >
              Book with cash instead (~{formatPrice(flight.cash_price)})
            </a>
          )}
        </div>
        <p style={styles.flightDetailDisclaimer}>
          Award space is from Seats.aero cached data. Always verify availability before booking.
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
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile, loading: authLoading } = useAuth();
  const { deals: trackedDeals, removeDeal: removeTrackedDeal } = useTrackedDeals();
  const militaryZuluTime = profile?.preferences?.militaryZuluTime ?? false;
  const homeAirportLabel = profile?.preferences?.homeAirportLabel ?? '';
  const [adults, setAdults] = useState(1);
  const [childrenCount, setChildrenCount] = useState(0);
  const passengers = adults + childrenCount;
  const [tripType, setTripType] = useState<'one-way' | 'round-trip'>('one-way');
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
  const searchType = 'points' as const;
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [stopsFilter, setStopsFilter] = useState<StopsFilter>('2-or-fewer');
  const [sortOption, setSortOption] = useState<SortOption>('price-asc');
  const [maxTaxes, setMaxTaxes] = useState(150);
  const [selectedBankKeys, setSelectedBankKeys] = useState<string[]>(() => [...ALL_BANK_KEYS]);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState('Missing information');
  const [loadingReturnDetails, setLoadingReturnDetails] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [routeSwapGeneration, setRouteSwapGeneration] = useState(0);
  const searchSeqRef = useRef(0);
  const originPrefillRef = useRef<string | null>(null);
  const initialUrlSearchRanRef = useRef(false);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [searchCount, setSearchCount] = useState(0);
  const showContinueSearching = Boolean(
    !hasSearched
    && user?.uid
    && searchCount >= MIN_SEARCHES_TO_SHOW_CONTINUE
    && recentSearches.length > 0,
  );
  const resumeTrackedDealRef = useRef<string | null>(null);

  const syncRecentSearchState = useCallback((uid: string) => {
    const { recent, searchCount: count } = loadRecentSearchState(uid);
    setRecentSearches(recent);
    setSearchCount(count);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setRecentSearches([]);
      setSearchCount(0);
      originPrefillRef.current = null;
      return;
    }
    syncRecentSearchState(user.uid);
  }, [authLoading, user, hasSearched, syncRecentSearchState]);

  useEffect(() => {
    if (!user?.uid) return undefined;

    const sync = () => syncRecentSearchState(user.uid);

    window.addEventListener('focus', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('focus', sync);
      window.removeEventListener('storage', sync);
    };
  }, [user?.uid, syncRecentSearchState]);

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
    () => computeTaxesSliderMax(flights),
    [flights],
  );

  useEffect(() => {
    if (flights.length > 0) {
      setMaxTaxes(computeTaxesSliderMax(flights));
    }
  }, [flights]);

  const toggleBankKey = useCallback((key: string) => {
    setSelectedBankKeys((current) => {
      if (current.includes(key)) {
        if (current.length <= 1) {
          return current;
        }
        return current.filter((item) => item !== key);
      }
      return [...current, key];
    });
  }, []);

  const displayedFlights = useMemo(() => {
    let filtered = flights.filter((flight) => matchesStopsFilter(flight.stops, stopsFilter));
    filtered = filtered.filter((flight) => getFlightTaxes(flight) <= maxTaxes);
    filtered = filtered.filter((flight) => matchesBankFilter(flight, selectedBankKeys));
    return sortFlights(filtered, sortOption, searchType);
  }, [flights, stopsFilter, sortOption, maxTaxes, selectedBankKeys, searchType]);

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

  const resetHomePage = useCallback(() => {
    searchSeqRef.current += 1;
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setDate('');
    setReturnDate('');
    setTripType('one-way');
    setAdults(1);
    setChildrenCount(0);
    setCabinClass('economy');
    setFlights([]);
    setHasSearched(false);
    setLoading(false);
    setLoadingReturnDetails(false);
    setSelectedFlight(null);
    setValidationWarning(null);
    setSelectedBankKeys([...ALL_BANK_KEYS]);
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
    if (user) {
      syncRecentSearchState(user.uid);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [user, homeAirportLabel, syncRecentSearchState]);

  const applyFormFromSearch = useCallback((request: FlightSearchRequest) => {
    setRoute({ origin: request.origin, destination: request.destination });
    setDate(request.departureDate);
    setReturnDate(request.returnDate);
    setTripType(request.tripType);
    setCabinClass(request.cabinClass);
    setAdults(request.adults);
    setChildrenCount(request.childrenCount);
    setRouteSwapGeneration((generation) => generation + 1);
  }, []);

  const runFlightSearch = async (request: FlightSearchRequest) => {
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
      setSearchCount(recorded.searchCount);
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
      if (user) {
        const pricing = computeLowestSearchPricing(results);
        if (pricing.lowestPoints != null || pricing.lowestCash != null) {
          const updated = updateRecentSearchPricing(user.uid, {
            origin: trimmedOrigin,
            destination: trimmedDestination,
            departureDate: request.departureDate,
            returnDate: request.returnDate,
            tripType: request.tripType,
            searchType: request.searchType,
            cabinClass: request.cabinClass,
            adults: request.adults,
            childrenCount: request.childrenCount,
          }, pricing);
          setRecentSearches(updated.recent);
          setSearchCount(updated.searchCount);
        }
      }
      if (results.length === 0) {
        showDialog(
          'No flights found',
          'No flights were found for your search. Try different dates or airports.'
        );
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    const request: FlightSearchRequest = {
      origin: origin.trim(),
      destination: destination.trim(),
      departureDate: date,
      returnDate,
      tripType,
      searchType,
      cabinClass,
      adults,
      childrenCount,
    };

    const validationError = getFlightSearchValidationError(request);
    if (validationError) {
      showDialog('Missing information', validationError);
      return;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    void runFlightSearch(request);
  };

  const handleResumeTrackedDeal = async (deal: TrackedDeal, openInNewTab = false) => {
    const input = trackedDealToSearchInput(deal);
    const request: FlightSearchRequest = {
      ...input,
      searchType: 'points',
    };

    if (openInNewTab) {
      openFlightSearchInNewTab(request);
      return;
    }

    applyFormFromSearch(request);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    await runFlightSearch(request);
  };

  useEffect(() => {
    if (authLoading) return;
    if (initialUrlSearchRanRef.current) return;
    const parsed = parseFlightSearchFromParams(searchParams);
    if (!parsed) return;
    initialUrlSearchRanRef.current = true;
    applyFormFromSearch(parsed);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    void runFlightSearch(parsed);
  }, [searchParams, applyFormFromSearch, authLoading]);

  useEffect(() => {
    const state = location.state as { resumeTrackedDeal?: TrackedDeal } | null;
    const deal = state?.resumeTrackedDeal;
    if (!deal || resumeTrackedDealRef.current === deal.id) return;
    resumeTrackedDealRef.current = deal.id;
    window.history.replaceState({}, document.title);
    void handleResumeTrackedDeal(deal);
  }, [location.state]);

  const handleResumeSearch = (search: RecentSearch) => {
    openFlightSearchInNewTab({
      origin: search.origin,
      destination: search.destination,
      departureDate: search.departureDate,
      returnDate: search.returnDate,
      tripType: search.tripType,
      searchType: 'points',
      cabinClass: search.cabinClass,
      adults: search.adults,
      childrenCount: search.childrenCount,
    });
  };

  const handleTrendingDealSelect = (deal: TrendingDeal) => {
    const request = {
      origin: deal.origin,
      destination: deal.destination,
      departureDate: deal.departureDate,
      returnDate: deal.returnDate,
      tripType: deal.tripType,
      searchType: deal.searchType,
      cabinClass: deal.cabinClass,
      adults: 1,
      childrenCount: 0,
    };

    if (user) {
      const recorded = recordRecentSearch(user.uid, request);
      setRecentSearches(recorded.recent);
      setSearchCount(recorded.searchCount);
    }

    openFlightSearchInNewTab(request);
  };

  const handleWorkspaceStep = (stepId: WorkspaceStepId) => {
    if (stepId === 'search') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (stepId === 'optimize') {
      navigate('/points-news#points-guide');
      return;
    }
    if (stepId === 'ask-hero') {
      navigate('/ask-hero');
      return;
    }
    navigate('/profile?section=tracked');
  };

  return (
    <HomeSearchResetProvider value={resetHomePage}>
    <div className="app-page">
      <TopNavbar />

      {!hasSearched ? (
        <>
        <section className="hero-section hero-section--landing" aria-label="Flight search">
          <div className="hero-backdrop" aria-hidden />
          <div className="hero-inner hero-inner--landing">
            <HeroCopyBlock immediate />
            <div className="hero-search hero-search--landing home-dashboard-search">
              <div className="search-panel-wrap search-panel-wrap--refined search-panel-wrap--full">
              <div
                id="search-panel-body"
                className="search-panel"
                style={styles.searchPanel}
                role="region"
                aria-label="Award search"
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
            />
            </div>
          </div>

          <div className="main-bar main-bar--refined main-bar--dashboard" style={dashboardMainBar}>
            <div className="route-block" style={dashboardRouteBlock}>
              <div className="route-fields-stack">
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
            </div>

            <div className="date-block" style={dashboardDateBlock}>
              <span className="form-field-icon" style={styles.fieldIcon}><CalendarIcon /></span>
              <DatePicker
                value={date}
                onChange={(nextDate) => {
                  setDate(nextDate);
                  if (returnDate && nextDate && returnDate < nextDate) {
                    setReturnDate('');
                  }
                }}
                placeholder="Depart"
                ariaLabel="Departure date"
              />
              <span
                className="date-block-arrow"
                style={{ ...styles.dateArrow, ...(tripType === 'one-way' ? styles.dateHidden : {}) }}
              >
                →
              </span>
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
          <ResultsFiltersPanel
            stopsFilter={stopsFilter}
            onStopsFilterChange={setStopsFilter}
            maxTaxes={maxTaxes}
            taxesSliderMax={taxesSliderMax}
            onMaxTaxesChange={setMaxTaxes}
            selectedBankKeys={selectedBankKeys}
            onToggleBankKey={toggleBankKey}
          />
        )}
            {loading && (
              <div className="flight-search-loader" style={styles.flightSearchLoader} role="status" aria-live="polite">
                <PlacesSearchLoader size={112} />
                <span style={styles.flightSearchLoaderText}>Searching flights...</span>
              </div>
            )}
              </div>
            </div>
          </div>
        </div>
        </section>

        <div className="home-landing-features">
          <HowItWorksSection
            mode={user ? 'workspace' : 'marketing'}
            onStepAction={user ? handleWorkspaceStep : undefined}
          />
          <EcosystemBanner isAuthenticated={Boolean(user)} />
        </div>

        <NeedHelpSection />

        {showContinueSearching && (
          <ContinueSearching searches={recentSearches} onSelect={handleResumeSearch} />
        )}

        {user && trackedDeals.length > 0 && (
          <TrackedDealsSection
            deals={trackedDeals}
            onSelect={(deal) => { void handleResumeTrackedDeal(deal); }}
            onRemove={(deal) => { void removeTrackedDeal(deal.id); }}
          />
        )}

        <TrendingDeals deals={HOME_TRENDING_DEALS} onSelectDeal={handleTrendingDealSelect} />
        </>
      ) : (
        <section className="hero-section hero-section--landing hero-section--searched" aria-label="Flight search">
          <div className="hero-backdrop" aria-hidden />
          <div className="hero-inner hero-inner--compact">
            <div className="hero-search hero-search--compact">
              <div className="search-panel-wrap search-panel-wrap--refined" style={styles.searchPanelWrap}>
              <div
                id="search-panel-body"
                className="search-panel"
                style={styles.searchPanel}
                role="region"
                aria-label="Award search"
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
            />
            </div>
          </div>

          <div className="main-bar main-bar--refined" style={styles.mainBar}>
            <div className="route-block" style={styles.routeBlock}>
              <div className="route-fields-stack">
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
                placeholder="Depart"
                ariaLabel="Departure date"
              />
              <span
                className="date-block-arrow"
                style={{ ...styles.dateArrow, ...(tripType === 'one-way' ? styles.dateHidden : {}) }}
              >
                →
              </span>
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
          <ResultsFiltersPanel
            stopsFilter={stopsFilter}
            onStopsFilterChange={setStopsFilter}
            maxTaxes={maxTaxes}
            taxesSliderMax={taxesSliderMax}
            onMaxTaxesChange={setMaxTaxes}
            selectedBankKeys={selectedBankKeys}
            onToggleBankKey={toggleBankKey}
          />
        )}
            {loading && (
              <div className="flight-search-loader" style={styles.flightSearchLoader} role="status" aria-live="polite">
                <PlacesSearchLoader size={112} />
                <span style={styles.flightSearchLoaderText}>Searching flights...</span>
              </div>
            )}
              </div>
            </div>
          </div>
        </div>
      </section>
      )}

      <div className="app-content app-content--compact" style={styles.container}>
      {/* Results Section */}
      <main className="results-container" style={styles.resultsContainer}>
        {hasSearched && flights.length > 0 && (
          <div className="results-header-row" style={styles.resultsHeaderRow}>
            <p style={styles.resultsCount}>
              Showing {displayedFlights.length} of {flights.length} flight{flights.length === 1 ? '' : 's'}
            </p>
            <div className="results-header-actions" style={styles.resultsHeaderActions}>
              <div className="results-sort-control" style={styles.resultsSortControl}>
                <span style={styles.resultsSortLabel}>Sort:</span>
                <FilterDropdown
                  value={sortOption}
                  onChange={setSortOption}
                  options={SORT_OPTIONS}
                  ariaLabel="Sort results"
                  minTriggerWidth={196}
                />
              </div>
              <TrackDealButton
                dealInput={{
                  origin,
                  destination,
                  departureDate: date,
                  returnDate,
                  tripType,
                  cabinClass,
                  adults,
                  childrenCount,
                }}
                className="results-track-deal"
              />
            </div>
          </div>
        )}
        {!loading && displayedFlights.length > 0 ? (
          displayedFlights.map((flight) => {
            const cardTransferBonuses = flight.award_details?.mileage_program
              ? getApplicableTransferBonuses(
                flight.award_details.transfer_partners,
                flight.award_details.mileage_program,
                flight.award_details.points_required,
              )
              : [];

            return (
            <div key={flight.id} className="flight-card" style={styles.flightCard}>
              <div className="flight-card-body" style={styles.flightCardBody}>
                <div className="flight-card-route flight-info" style={styles.flightInfo}>
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

                <div className="flight-card-aside">
                  <div className="flight-card-pricing pricing-section" style={styles.pricingSection}>
                    {flight.award_details && (
                      <>
                        {tripType === 'round-trip' && (
                          <div className="price-hint" style={styles.priceHint}>Round trip</div>
                        )}
                        <div className="flight-card-price-stack">
                          <div className="flight-card-points" style={styles.pointsText}>
                            {flight.award_details.points_required.toLocaleString()} pts
                          </div>
                          <div className="flight-card-fees" style={styles.subtext}>
                            + {formatPrice(flight.award_details.taxes_and_fees)} fees
                          </div>
                        </div>
                        {flight.cash_price_matched && flight.cash_price > 0 && (
                          <div className="flight-card-cash-compare" style={styles.subtext}>
                            ~{formatPrice(flight.cash_price)} cash
                          </div>
                        )}
                        {getFlightCpp(flight) != null && (
                          <div className="flight-card-cpp" style={styles.cppText}>
                            {getFlightCpp(flight)!.toFixed(2)} cents/pt
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="flight-card-booking">
                    {flight.award_details && (
                      <>
                        {flight.award_details.mileage_program && (
                          <div className="flight-card-program" style={styles.programTag}>
                            {flight.award_details.mileage_program}
                          </div>
                        )}
                        <div className="flight-card-partners partner-container" style={styles.partnerContainer}>
                          <div className="flight-card-partners-bonus">
                            {flight.award_details.transfer_partners.map((partner, index) => {
                              const partnerBonus = getTransferBonusForPartner(cardTransferBonuses, partner);
                              if (!partnerBonus) return null;
                              return (
                                <TransferBonusPartnerChip
                                  key={`bonus-${index}`}
                                  partner={partner}
                                  percent={partnerBonus.bonus.bonusPercent}
                                  logoSize={25}
                                  compact
                                />
                              );
                            })}
                          </div>
                          <div className="flight-card-partners-regular">
                            {flight.award_details.transfer_partners.map((partner, index) => {
                              const partnerBonus = getTransferBonusForPartner(cardTransferBonuses, partner);
                              if (partnerBonus) return null;
                              return (
                                <span key={`partner-${index}`} className="partner-tag" style={styles.partnerTag} title={partner}>
                                  <TransferPartnerLogo partner={partner} size={25} />
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}
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
            </div>
            );
          })
        ) : !loading && hasSearched && flights.length === 0 ? (
          <div style={styles.emptyState}>No flights were found for your search. Try different dates or airports.</div>
        ) : !loading && hasSearched && flights.length > 0 ? (
          <div style={styles.emptyState}>No flights match your filters. Try allowing more stops, selecting more bank programs, or raising the max taxes limit.</div>
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
          searchContext={{
            origin,
            destination,
            departureDate: selectedFlight.departure_date,
            returnDate,
            tripType,
            cabinClass,
            adults,
            childrenCount,
          }}
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
  fontSize: '14px',
  fontWeight: 400,
  color: '#111827',
  letterSpacing: '-0.01em',
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    fontFamily: FONT_FAMILY,
    maxWidth: '990px',
    margin: '0 auto',
    padding: '22px 14px 43px',
    color: '#111827',
  },
  searchPanelWrap: {
    width: '100%',
    maxWidth: '900px',
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
    padding: '11px 18px 14px',
  },
  advancedToggle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '7px',
    marginBottom: '13px',
    cursor: 'pointer',
    fontSize: '14px',
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
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    alignItems: 'center',
    gap: '12px 20px',
    width: '100%',
  },
  advancedControlItem: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '8px',
    minWidth: 0,
  },
  advancedControlLabel: {
    fontSize: '14px',
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
    gap: '7px 11px',
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
    padding: '5px 4px',
    cursor: 'pointer',
    fontSize: '14px',
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
    padding: '11px 14px',
    borderRadius: 0,
    cursor: 'pointer',
    fontSize: '14px',
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
    minWidth: '252px',
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 8px 30px rgba(99, 102, 241, 0.14), 0 2px 8px rgba(0, 0, 0, 0.06)',
    padding: '16px 18px',
  },
  passengerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '18px',
    marginBottom: '13px',
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
    fontSize: '14px',
    fontWeight: 500,
    color: '#3c4043',
    whiteSpace: 'nowrap',
  },
  passengerSublabel: {
    fontSize: '12px',
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
    width: '31px',
    height: '31px',
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
    minWidth: '22px',
    textAlign: 'center',
    fontSize: '14px',
    fontWeight: 500,
    color: '#3c4043',
  },
  mainBar: {
    display: 'flex',
    alignItems: 'stretch',
    gap: '9px',
    flexWrap: 'wrap',
    overflow: 'visible',
  },
  routeBlock: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)',
    alignItems: 'center',
    flex: '2 1 270px',
    minWidth: '234px',
    background: '#f5f5f5',
    borderRadius: '9px',
    padding: '5px 7px',
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
    width: '40px',
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
    fontSize: '14px',
    fontWeight: 500,
    color: '#3c4043',
  },
  suggestionSubtitle: {
    fontSize: '12px',
    color: '#80868b',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  suggestionCode: {
    fontSize: '13px',
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
    height: '43px',
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
    width: '34px',
    height: '34px',
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
    flex: '1 1 270px',
    minWidth: '270px',
    background: '#f5f5f5',
    borderRadius: '9px',
    padding: '5px 13px',
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
    padding: '0 25px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    minHeight: '43px',
    minWidth: '119px',
    flexShrink: 0,
    alignSelf: 'stretch',
    marginLeft: 'auto',
  },
  resultsContainer: { marginTop: '0' },
  resultsHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap',
    marginBottom: '10px',
  },
  resultsHeaderActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
    marginLeft: 'auto',
  },
  resultsSortControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  resultsSortLabel: {
    fontSize: '12px',
    fontWeight: 500,
    color: '#6b7280',
    whiteSpace: 'nowrap',
  },
  resultsCount: {
    margin: 0,
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: 500,
  },
  flightSearchLoader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    padding: '28px 24px',
    marginTop: 0,
    textAlign: 'center',
    background: '#fff',
  },
  flightSearchLoaderText: {
    fontSize: '16px',
    fontWeight: 500,
    color: '#4b5563',
  },
  flightCard: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '14px',
    background: '#fff',
    padding: '14px 18px',
    borderRadius: '9px',
    border: '1px solid #e5e7eb',
    marginBottom: '9px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
  },
  flightCardBody: {
    display: 'flex',
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '14px',
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
    minWidth: '119px',
  },
  viewFlightBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
    padding: '8px 14px',
    minWidth: '112px',
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
  flightDetailCashLink: {
    display: 'block',
    textAlign: 'center',
    background: '#f0fdf4',
    color: '#166534',
    textDecoration: 'none',
    padding: '10px 16px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: 500,
    border: '1px solid #bbf7d0',
    marginTop: '4px',
  } as React.CSSProperties,
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
    paddingLeft: '47px',
  },
  flightReturnRouteRow: {
    paddingLeft: '47px',
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
    padding: '9px 11px',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '11px',
    lineHeight: 1.2,
    minHeight: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    color: '#374151',
  },
  carrierLogo: { height: '36px', width: 'auto', maxWidth: '65px', objectFit: 'contain', display: 'block' },
  carrierLogoOverflow: { fontSize: '12px', color: '#6b7280', fontWeight: 500 },
  routeLabel: { fontSize: '14px', fontWeight: 600, color: '#111827', lineHeight: 1.25 },
  returnRouteLabel: { fontSize: '14px', fontWeight: 600, color: '#111827', lineHeight: 1.25 },
  returnLoading: { fontSize: '12px', color: '#6b7280', fontStyle: 'italic', paddingLeft: '47px' },
  timeText: { fontSize: '13px', fontWeight: 500, color: '#374151', lineHeight: 1.35 },
  subtext: { fontSize: '12px', color: '#6b7280', lineHeight: 1.35, fontWeight: 400 },
  pricingSection: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' },
  priceText: { fontSize: '25px', fontWeight: 700, color: '#15803d', letterSpacing: '-0.02em' },
  priceHint: { fontSize: '10px', color: '#6b7280', marginBottom: '2px', textAlign: 'right', fontWeight: 500 },
  pointsText: { fontSize: '23px', fontWeight: 700, color: '#4338ca', letterSpacing: '-0.02em' },
  cppText: { fontSize: '13px', fontWeight: 600, color: '#059669', marginTop: 2 },
  programTag: {
    fontSize: '11px',
    color: '#4338ca',
    fontWeight: 600,
    marginTop: '4px',
    textAlign: 'right',
  },
  partnerContainer: { display: 'flex', gap: '11px', flexWrap: 'wrap', marginTop: '0', justifyContent: 'flex-end' },
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

const { flex: _routeFlex, minWidth: _routeMinWidth, ...dashboardRouteBlock } = styles.routeBlock;
const { flex: _dateFlex, minWidth: _dateMinWidth, ...dashboardDateBlock } = styles.dateBlock;
const dashboardMainBar = { ...styles.mainBar, flexWrap: 'nowrap' as const };