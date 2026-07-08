import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { apiFetch, apiUrl } from '../api';

export interface PlaceSuggestion {
  id: string;
  code: string;
  name: string;
  subtitle: string;
  type: 'airport' | 'city';
}

export interface AirportAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
  swapGeneration?: number;
  onSuggestionSelect?: (suggestion: PlaceSuggestion) => void;
  menuAnchorClassName?: string;
  variant?: 'route' | 'profile';
  disabled?: boolean;
  inputId?: string;
}

export function formatPlaceLabel(suggestion: PlaceSuggestion): string {
  return `${suggestion.name} (${suggestion.code})`;
}

export function PlacesSearchLoader({ size = 32 }: { size?: number }) {
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
  cache: Map<string, PlaceSuggestion[]>,
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

export function AirportAutocomplete({
  value,
  onChange,
  placeholder,
  ariaLabel,
  swapGeneration = 0,
  onSuggestionSelect,
  menuAnchorClassName,
  variant = 'route',
  disabled = false,
  inputId,
}: AirportAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const [menuPosition, setMenuPosition] = useState<React.CSSProperties>({});
  const suppressFetchRef = useRef(false);
  const cacheRef = useRef<Map<string, PlaceSuggestion[]>>(new Map());
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  const updateMenuPosition = useCallback(() => {
    if (!rootRef.current) return;
    const inputRect = rootRef.current.getBoundingClientRect();
    const anchor = menuAnchorClassName
      ? rootRef.current.closest(`.${menuAnchorClassName}`)
      : rootRef.current.closest('.route-block');
    const anchorRect = (anchor as HTMLElement | null)?.getBoundingClientRect() ?? inputRect;
    setMenuPosition({
      position: 'fixed',
      top: inputRect.bottom + 6,
      left: anchorRect.left,
      width: anchorRect.width,
    });
  }, [menuAnchorClassName]);

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

    const dismissMenu = () => {
      abortRef.current?.abort();
      setOpen(false);
      setHighlightIndex(-1);
      setLoading(false);
    };

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      dismissMenu();
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        dismissMenu();
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

  const lastSwapGenerationRef = useRef(swapGeneration);

  useEffect(() => {
    if (disabled) return;

    const swapJustHappened = swapGeneration !== lastSwapGenerationRef.current;
    if (swapJustHappened) {
      lastSwapGenerationRef.current = swapGeneration;
      abortRef.current?.abort();
      requestIdRef.current += 1;
      setOpen(false);
      setSuggestions([]);
      setHighlightIndex(-1);
      setLoading(false);
      return;
    }

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
          { signal: controller.signal },
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
  }, [value, swapGeneration, disabled]);

  const selectSuggestion = (suggestion: PlaceSuggestion) => {
    suppressFetchRef.current = true;
    abortRef.current?.abort();
    requestIdRef.current += 1;
    onChange(formatPlaceLabel(suggestion));
    onSuggestionSelect?.(suggestion);
    setOpen(false);
    setSuggestions([]);
    setHighlightIndex(-1);
    setLoading(false);
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

  const inputClassName = variant === 'profile'
    ? `profile-home-airport-input${loading ? ' profile-home-airport-input--loading' : ''}`
    : `route-airport-input${loading ? ' route-airport-input--loading' : ''}`;

  return (
    <div ref={rootRef} className="airport-autocomplete">
      <input
        ref={inputRef}
        id={inputId}
        type="text"
        className={inputClassName}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          if (!disabled && (suggestions.length > 0 || loading)) setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        aria-label={ariaLabel}
        aria-autocomplete="list"
        aria-expanded={open}
        aria-busy={loading}
        aria-controls={open ? `${ariaLabel}-suggestions` : undefined}
        role="combobox"
        autoComplete="off"
        disabled={disabled}
      />
      {loading && (
        <div className="airport-autocomplete-loader" aria-hidden>
          <PlacesSearchLoader size={26} />
        </div>
      )}
      {(open || loading) &&
        createPortal(
          <ul
            ref={menuRef}
            id={`${ariaLabel}-suggestions`}
            className="suggestion-menu"
            style={menuPosition}
            role="listbox"
            aria-label={`${ariaLabel} suggestions`}
          >
            {loading && suggestions.length === 0 ? (
              <li className="suggestion-loader-row" role="presentation">
                <PlacesSearchLoader size={40} />
                <span className="suggestion-loader-text">Searching places...</span>
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
                      className={`suggestion-option${highlighted ? ' suggestion-option--hover' : ''}${suggestion.type === 'city' ? ' suggestion-option--city' : ''}`}
                      onMouseEnter={() => {
                        setHoveredIndex(index);
                        setHighlightIndex(index);
                      }}
                      onMouseLeave={() => setHoveredIndex(null)}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectSuggestion(suggestion)}
                    >
                      <span className="suggestion-text">
                        <span className="suggestion-name">{formatPlaceLabel(suggestion)}</span>
                        {suggestion.subtitle && (
                          <span className="suggestion-subtitle">{suggestion.subtitle}</span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>,
          document.body,
        )}
    </div>
  );
}
