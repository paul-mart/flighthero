import type { CSSProperties } from 'react';
import {
  formatSingleFlightTimeParts,
  isNextDayArrival,
  type FlightTimeParts,
} from '../lib/flightTimes';

interface FlightTimeRangeProps {
  departure: FlightTimeParts;
  arrival: FlightTimeParts;
  militaryTime: boolean;
  className?: string;
  style?: CSSProperties;
}

function renderTime({ time, timezone }: { time: string; timezone: string }) {
  if (!time) return null;
  return timezone ? `${time} ${timezone}` : time;
}

export function FlightTimeRange({
  departure,
  arrival,
  militaryTime,
  className,
  style,
}: FlightTimeRangeProps) {
  const dep = formatSingleFlightTimeParts(departure, militaryTime);
  const arr = formatSingleFlightTimeParts(arrival, militaryTime);

  if (!dep.time || !arr.time) return null;

  const nextDay = isNextDayArrival(departure.at, arrival.at);

  return (
    <span className={className} style={style}>
      {renderTime(dep)}
      {' – '}
      {arr.time}
      {nextDay && <sup className="flight-day-offset">+1</sup>}
      {arr.timezone ? ` ${arr.timezone}` : ''}
    </span>
  );
}
