import React, { useEffect, useMemo, useRef, useState } from 'react';

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

function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function ChevronLeftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
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
  const [open, setOpen] = useState(false);
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

  const displayLabel = value ? formatDisplayDate(value) : placeholder;
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
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <span style={styles.triggerText}>{displayLabel}</span>
      </button>

      {open && !disabled && (
        <div className="date-picker-popover" style={styles.popover} role="dialog" aria-label={ariaLabel}>
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
        </div>
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
    border: 'none',
    background: 'transparent',
    padding: '12px 0',
    height: '48px',
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
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
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: 'block',
  },
  popover: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '300px',
    maxWidth: 'min(300px, calc(100vw - 32px))',
    background: '#fff',
    borderRadius: '14px',
    boxShadow: '0 16px 40px rgba(99, 102, 241, 0.18), 0 4px 14px rgba(0, 0, 0, 0.08)',
    border: '1px solid rgba(199, 210, 254, 0.8)',
    padding: '16px',
    zIndex: 40,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '14px',
    gap: '8px',
  },
  navBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    border: 'none',
    borderRadius: '10px',
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
    fontSize: '16px',
    fontWeight: 600,
    color: '#1f2937',
    letterSpacing: '0.01em',
  },
  weekdayRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '2px',
    marginBottom: '6px',
  },
  weekdayCell: {
    textAlign: 'center',
    fontSize: '11px',
    fontWeight: 600,
    color: '#9ca3af',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    padding: '4px 0',
  },
  dayGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '4px',
  },
  dayBtn: {
    width: '100%',
    aspectRatio: '1',
    border: 'none',
    borderRadius: '10px',
    background: 'transparent',
    color: '#374151',
    fontSize: '14px',
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
