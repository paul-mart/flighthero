import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDownIcon } from './icons';

const POPOVER_WIDTH = 248;
const POPOVER_GAP = 6;
const POPOVER_MARGIN = 16;

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

function parseIsoDate(value: string): Date | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);
  if (
    date.getFullYear() !== year
    || date.getMonth() !== month
    || date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDisplayDate(value: string): string {
  const date = parseIsoDate(value);
  if (!date) return '';
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatCompactDisplayDate(value: string): string {
  const date = parseIsoDate(value);
  if (!date) return '';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function useCompactDateLabels(): boolean {
  const [compact, setCompact] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 767px)').matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const handleChange = (event: MediaQueryListEvent) => {
      setCompact(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return compact;
}

function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function ChevronLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
  minDate?: string;
  disabled?: boolean;
  hidden?: boolean;
}

export default function DatePicker({
  value,
  onChange,
  placeholder,
  ariaLabel,
  minDate,
  disabled = false,
  hidden = false,
}: DatePickerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState<React.CSSProperties>({});
  const [triggerHovered, setTriggerHovered] = useState(false);
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const [viewMonth, setViewMonth] = useState(() => {
    const initial = parseIsoDate(value) ?? startOfDay(new Date());
    return new Date(initial.getFullYear(), initial.getMonth(), 1);
  });

  const minDay = useMemo(
    () => (minDate ? parseIsoDate(minDate) : null),
    [minDate],
  );
  const todayDay = useMemo(() => startOfDay(new Date()), [open]);
  const effectiveMinDay = useMemo(() => {
    if (!minDay) return todayDay;
    return minDay > todayDay ? minDay : todayDay;
  }, [minDay, todayDay]);
  const todayIso = useMemo(() => toIsoDate(todayDay), [todayDay]);
  const canGoPrevMonth = useMemo(() => {
    const firstOfView = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
    const firstOfMinMonth = new Date(
      effectiveMinDay.getFullYear(),
      effectiveMinDay.getMonth(),
      1,
    );
    return firstOfView > firstOfMinMonth;
  }, [viewMonth, effectiveMinDay]);

  const updatePopoverPosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();

    let left = rect.left + rect.width / 2 - POPOVER_WIDTH / 2;
    left = Math.max(POPOVER_MARGIN, Math.min(left, window.innerWidth - POPOVER_WIDTH - POPOVER_MARGIN));

    setPopoverPosition({
      position: 'fixed',
      top: rect.bottom + POPOVER_GAP,
      left,
      width: POPOVER_WIDTH,
      transform: 'none',
    });
  }, []);

  useLayoutEffect(() => {
    if (!open || disabled) return;
    updatePopoverPosition();
    const frame = requestAnimationFrame(() => updatePopoverPosition());
    window.addEventListener('scroll', updatePopoverPosition, true);
    window.addEventListener('resize', updatePopoverPosition);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', updatePopoverPosition, true);
      window.removeEventListener('resize', updatePopoverPosition);
    };
  }, [open, disabled, updatePopoverPosition]);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  useEffect(() => {
    if (!open) return;
    const selected = parseIsoDate(value);
    const anchor = selected && selected >= effectiveMinDay ? selected : effectiveMinDay;
    setViewMonth(new Date(anchor.getFullYear(), anchor.getMonth(), 1));
  }, [open, value, effectiveMinDay]);

  useEffect(() => {
    if (!open || disabled) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
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
  }, [open, disabled]);

  const calendarDays = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells: Array<{ iso: string; inMonth: boolean }> = [];

    for (let index = firstWeekday - 1; index >= 0; index -= 1) {
      const day = daysInPrevMonth - index;
      const date = new Date(year, month - 1, day);
      cells.push({ iso: toIsoDate(date), inMonth: false });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month, day);
      cells.push({ iso: toIsoDate(date), inMonth: true });
    }

    while (cells.length % 7 !== 0) {
      const day = cells.length - firstWeekday - daysInMonth + 1;
      const date = new Date(year, month + 1, day);
      cells.push({ iso: toIsoDate(date), inMonth: false });
    }

    return cells;
  }, [viewMonth]);

  const compactLabels = useCompactDateLabels();

  const isDisabledDay = (iso: string) => {
    const day = parseIsoDate(iso);
    return !day || day < effectiveMinDay;
  };

  const selectDay = (iso: string) => {
    if (isDisabledDay(iso)) return;
    onChange(iso);
    setOpen(false);
    triggerRef.current?.blur();
  };

  const displayLabel = value
    ? (compactLabels ? formatCompactDisplayDate(value) : formatDisplayDate(value))
    : placeholder;
  const monthLabel = `${MONTH_NAMES[viewMonth.getMonth()]} ${viewMonth.getFullYear()}`;

  return (
    <div
      ref={rootRef}
      className={`date-picker${hidden ? ' date-picker--hidden' : ''}`}
      style={{
        ...styles.root,
        ...(hidden ? styles.hidden : {}),
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        className="date-picker-trigger"
        style={{
          ...styles.trigger,
          ...(value ? styles.triggerFilled : styles.triggerEmpty),
          ...(disabled ? styles.triggerDisabled : {}),
          ...(open ? styles.triggerOpen : {}),
        }}
        onClick={() => {
          if (disabled || hidden) return;
          setOpen((prev) => !prev);
        }}
        onMouseEnter={() => !disabled && setTriggerHovered(true)}
        onMouseLeave={() => setTriggerHovered(false)}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <span className="date-picker-trigger-text" style={styles.triggerText}>{displayLabel}</span>
        <span
          style={{
            ...styles.triggerChevron,
            ...(open ? styles.triggerChevronOpen : triggerHovered ? styles.triggerChevronHover : {}),
          }}
        >
          <ChevronDownIcon />
        </span>
      </button>

      {open && !disabled &&
        createPortal(
          <div
            ref={popoverRef}
            className="date-picker-popover"
            style={{ ...styles.popover, ...popoverPosition }}
            role="dialog"
            aria-label={ariaLabel}
          >
            <div style={styles.header}>
              <button
                type="button"
                className="date-picker-nav"
                style={{
                  ...styles.navBtn,
                  ...(!canGoPrevMonth ? styles.navBtnDisabled : {}),
                }}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  if (!canGoPrevMonth) return;
                  setViewMonth((prev) => addMonths(prev, -1));
                }}
                disabled={!canGoPrevMonth}
                aria-label="Previous month"
              >
                <ChevronLeftIcon />
              </button>
              <span style={styles.monthLabel}>{monthLabel}</span>
              <button
                type="button"
                className="date-picker-nav"
                style={styles.navBtn}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setViewMonth((prev) => addMonths(prev, 1))}
                aria-label="Next month"
              >
                <ChevronRightIcon />
              </button>
            </div>

            <div style={styles.weekdayRow}>
              {WEEKDAYS.map((weekday) => (
                <span key={weekday} style={styles.weekdayCell}>{weekday}</span>
              ))}
            </div>

            <div style={styles.dayGrid}>
              {calendarDays.map(({ iso, inMonth }) => {
                const selected = value === iso;
                const today = todayIso === iso;
                const disabledDay = isDisabledDay(iso);
                const hovered = hoveredDay === iso;

                return (
                  <button
                    key={iso}
                    type="button"
                    className="date-picker-day"
                    style={{
                      ...styles.dayBtn,
                      ...(!inMonth ? styles.dayOutside : {}),
                      ...(selected ? styles.daySelected : {}),
                      ...(!selected && today ? styles.dayToday : {}),
                      ...(hovered && !selected && !disabledDay ? styles.dayHover : {}),
                      ...(disabledDay ? styles.dayDisabled : {}),
                    }}
                    onMouseEnter={() => setHoveredDay(iso)}
                    onMouseLeave={() => setHoveredDay(null)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectDay(iso)}
                    disabled={disabledDay}
                    aria-label={iso}
                    aria-pressed={selected}
                  >
                    {parseIsoDate(iso)?.getDate()}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  root: {
    position: 'relative',
    flex: 1,
    minWidth: 0,
  },
  hidden: {
    visibility: 'hidden',
    pointerEvents: 'none',
  },
  trigger: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    border: 'none',
    background: 'transparent',
    padding: '12px 0',
    height: '48px',
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: '16px',
    fontWeight: 400,
    outline: 'none',
    borderRadius: '8px',
    transition: 'color 0.12s ease',
  },
  triggerFilled: {
    color: '#1f2937',
    fontWeight: 500,
  },
  triggerEmpty: {
    color: '#9ca3af',
  },
  triggerDisabled: {
    color: '#b0b0b0',
    cursor: 'not-allowed',
  },
  triggerOpen: {
    color: '#6366f1',
  },
  triggerText: {
    flex: 1,
    minWidth: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  triggerChevron: {
    display: 'flex',
    color: '#9ca3af',
    flexShrink: 0,
    transition: 'transform 0.15s ease, color 0.15s ease',
  },
  triggerChevronHover: {
    color: '#b8bcc4',
  },
  triggerChevronOpen: {
    transform: 'rotate(180deg)',
    color: '#6366f1',
  },
  popover: {
    maxWidth: `min(${POPOVER_WIDTH}px, calc(100vw - 32px))`,
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 12px 32px rgba(99, 102, 241, 0.16), 0 4px 12px rgba(0, 0, 0, 0.08)',
    border: '1px solid rgba(199, 210, 254, 0.8)',
    padding: '12px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '10px',
    gap: '6px',
  },
  navBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '30px',
    height: '30px',
    border: 'none',
    borderRadius: '8px',
    background: '#f3f4ff',
    color: '#6366f1',
    cursor: 'pointer',
    flexShrink: 0,
    padding: 0,
  },
  navBtnDisabled: {
    background: '#f3f4f6',
    color: '#d1d5db',
    cursor: 'not-allowed',
  },
  monthLabel: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1f2937',
    letterSpacing: '0.01em',
  },
  weekdayRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '1px',
    marginBottom: '4px',
  },
  weekdayCell: {
    textAlign: 'center',
    fontSize: '10px',
    fontWeight: 600,
    color: '#9ca3af',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    padding: '2px 0',
  },
  dayGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '2px',
  },
  dayBtn: {
    width: '100%',
    aspectRatio: '1',
    border: 'none',
    borderRadius: '8px',
    background: 'transparent',
    color: '#374151',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
    padding: 0,
    lineHeight: 1,
  },
  dayOutside: {
    color: '#d1d5db',
  },
  daySelected: {
    background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)',
    color: '#fff',
    fontWeight: 600,
    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)',
  },
  dayToday: {
    boxShadow: 'inset 0 0 0 2px #c7d2fe',
  },
  dayHover: {
    background: '#eef2ff',
    color: '#4338ca',
  },
  dayDisabled: {
    color: '#e5e7eb',
    cursor: 'not-allowed',
  },
};
