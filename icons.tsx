import React from 'react';

interface IconProps {
  size?: number;
  strokeWidth?: number;
}

export const FORM_ICON_SIZE = 18;

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

export function ChevronLeftIcon({ size = 14, strokeWidth = 2 }: IconProps) {
  return (
    <FeatherIcon size={size} strokeWidth={strokeWidth}>
      <path d="M15 18l-6-6 6-6" />
    </FeatherIcon>
  );
}

export function ChevronRightIcon({ size = 14, strokeWidth = 2 }: IconProps) {
  return (
    <FeatherIcon size={size} strokeWidth={strokeWidth}>
      <path d="M9 18l6-6-6-6" />
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

export function CloseIcon({ size = 16, strokeWidth = 2.25 }: IconProps) {
  return (
    <FeatherIcon size={size} strokeWidth={strokeWidth}>
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
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

export function GiftIcon({ size = 20, strokeWidth = 2 }: IconProps) {
  return (
    <FeatherIcon size={size} strokeWidth={strokeWidth}>
      <polyline points="20 12 20 22 4 22 4 12" />
      <rect x="2" y="7" width="20" height="5" />
      <line x1="12" y1="22" x2="12" y2="7" />
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </FeatherIcon>
  );
}

export function LayersIcon({ size = 20, strokeWidth = 2 }: IconProps) {
  return (
    <FeatherIcon size={size} strokeWidth={strokeWidth}>
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </FeatherIcon>
  );
}

export function CreditCardIcon({ size = 20, strokeWidth = 2 }: IconProps) {
  return (
    <FeatherIcon size={size} strokeWidth={strokeWidth}>
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </FeatherIcon>
  );
}

export function GlobeIcon({ size = 20, strokeWidth = 2 }: IconProps) {
  return (
    <FeatherIcon size={size} strokeWidth={strokeWidth}>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </FeatherIcon>
  );
}

export function BellIcon({
  size = 16,
  strokeWidth = 2,
  filled = false,
}: IconProps & { filled?: boolean }) {
  if (filled) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        aria-hidden
      >
        <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 01-3.46 0" fill="none" />
      </svg>
    );
  }

  return (
    <FeatherIcon size={size} strokeWidth={strokeWidth}>
      <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </FeatherIcon>
  );
}

export function TrashIcon({ size = 18, strokeWidth = 2 }: IconProps) {
  return (
    <FeatherIcon size={size} strokeWidth={strokeWidth}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </FeatherIcon>
  );
}

export function LockIcon({ size = 14, strokeWidth = 2 }: IconProps) {
  return (
    <FeatherIcon size={size} strokeWidth={strokeWidth}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </FeatherIcon>
  );
}

export function UserIcon({ size = 18, strokeWidth = 2 }: IconProps) {
  return (
    <FeatherIcon size={size} strokeWidth={strokeWidth}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </FeatherIcon>
  );
}
