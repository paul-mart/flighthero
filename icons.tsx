import React from 'react';

export const FORM_ICON_SIZE = 18;

interface IconProps {
  size?: number;
  strokeWidth?: number;
}

function FeatherIcon({
  size = FORM_ICON_SIZE,
  strokeWidth = 2,
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function ChevronDownIcon({ size = 14, strokeWidth = 2 }: IconProps) {
  return (
    <FeatherIcon size={size} strokeWidth={strokeWidth}>
      <path d="M6 9l6 6 6-6" />
    </FeatherIcon>
  );
}

export function PlaneDepartIcon({ size = FORM_ICON_SIZE }: IconProps) {
  return (
    <FeatherIcon size={size}>
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
    </FeatherIcon>
  );
}

export function PlaneArriveIcon({ size = FORM_ICON_SIZE }: IconProps) {
  return (
    <FeatherIcon size={size}>
      <g transform="scale(-1,1) translate(-24,0)">
        <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
      </g>
    </FeatherIcon>
  );
}

export function CalendarIcon({ size = FORM_ICON_SIZE }: IconProps) {
  return (
    <FeatherIcon size={size}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </FeatherIcon>
  );
}

export function SwapIcon({ size = FORM_ICON_SIZE }: IconProps) {
  return (
    <FeatherIcon size={size} strokeWidth={2.25}>
      <path d="M7 16V4" />
      <path d="M7 4L3 8" />
      <path d="M7 4l4 4" />
      <path d="M17 8v12" />
      <path d="M17 20l4-4" />
      <path d="M17 20l-4-4" />
    </FeatherIcon>
  );
}

export function SearchIcon({ size = FORM_ICON_SIZE }: IconProps) {
  return (
    <FeatherIcon size={size} strokeWidth={2.25}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </FeatherIcon>
  );
}

export function ArrowRightIcon({ size = 14, strokeWidth = 2.25 }: IconProps) {
  return (
    <FeatherIcon size={size} strokeWidth={strokeWidth}>
      <path d="M5 12h14M12 5l7 7-7 7" />
    </FeatherIcon>
  );
}
