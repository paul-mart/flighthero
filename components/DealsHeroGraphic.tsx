export function DealsHeroGraphic() {
  return (
    <svg
      className="deals-hero-banner-graphic-svg"
      viewBox="0 0 220 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="deals-hero-glow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
        <radialGradient id="deals-hero-orbit" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(203, 213, 225, 0.35)" />
          <stop offset="100%" stopColor="rgba(203, 213, 225, 0)" />
        </radialGradient>
      </defs>

      <circle cx="110" cy="82" r="58" stroke="#cbd5e1" strokeWidth="1" />
      <ellipse cx="110" cy="82" rx="58" ry="22" stroke="#cbd5e1" strokeWidth="1" />
      <ellipse cx="110" cy="82" rx="22" ry="58" stroke="#cbd5e1" strokeWidth="1" />
      <circle cx="110" cy="82" r="36" fill="url(#deals-hero-orbit)" />

      <path
        d="M28 118 C 72 38, 128 38, 192 72"
        stroke="url(#deals-hero-glow)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="7 5"
      />

      <circle cx="28" cy="118" r="4" fill="#cbd5e1" />
      <circle cx="192" cy="72" r="4" fill="#94a3b8" />

      <g transform="translate(178 58) rotate(18)">
        <path d="M0 0 L18 6 L0 12 L4 6 Z" fill="#94a3b8" />
        <path d="M4 6 L14 6" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />
      </g>

      <circle cx="52" cy="52" r="10" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 3" />
      <circle cx="168" cy="108" r="8" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 3" />
      <path
        d="M46 46 L58 58 M58 46 L46 58"
        stroke="#cbd5e1"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
