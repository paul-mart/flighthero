export function AboutHeroGraphic() {
  return (
    <svg
      className="about-hero-graphic-svg"
      viewBox="0 0 240 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="about-hero-sky" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#eef2ff" />
          <stop offset="100%" stopColor="#e0e7ff" />
        </linearGradient>
        <linearGradient id="about-hero-path" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
        <radialGradient id="about-hero-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(99, 102, 241, 0.18)" />
          <stop offset="100%" stopColor="rgba(99, 102, 241, 0)" />
        </radialGradient>
      </defs>

      <rect x="20" y="24" width="200" height="132" rx="20" fill="url(#about-hero-sky)" />
      <circle cx="120" cy="90" r="52" fill="url(#about-hero-glow)" />

      <circle cx="120" cy="90" r="44" stroke="#c7d2fe" strokeWidth="1.5" />
      <ellipse cx="120" cy="90" rx="44" ry="16" stroke="#c7d2fe" strokeWidth="1" />
      <ellipse cx="120" cy="90" rx="16" ry="44" stroke="#c7d2fe" strokeWidth="1" />
      <path d="M76 90 H164" stroke="#c7d2fe" strokeWidth="1" strokeDasharray="4 4" />

      <path
        d="M36 118 C 78 52, 142 52, 204 88"
        stroke="url(#about-hero-path)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="8 6"
      />

      <circle cx="36" cy="118" r="5" fill="#6366f1" />
      <circle cx="204" cy="88" r="5" fill="#818cf8" />

      <g transform="translate(188 76) rotate(20)">
        <path d="M0 0 L20 7 L0 14 L5 7 Z" fill="#4f46e5" />
        <path d="M5 7 L16 7" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" />
      </g>

      <g transform="translate(52 48)">
        <circle cx="0" cy="0" r="14" fill="#fff" stroke="#c7d2fe" strokeWidth="1.5" />
        <text x="0" y="5" textAnchor="middle" fontSize="11" fontWeight="700" fill="#4f46e5">
          pts
        </text>
      </g>

      <g transform="translate(168 122)">
        <rect x="-18" y="-12" width="36" height="24" rx="6" fill="#fff" stroke="#c7d2fe" strokeWidth="1.5" />
        <text x="0" y="4" textAnchor="middle" fontSize="10" fontWeight="600" fill="#6366f1">
          $ vs pts
        </text>
      </g>

      <circle cx="88" cy="132" r="6" fill="#a5b4fc" opacity="0.7" />
      <circle cx="152" cy="56" r="4" fill="#a5b4fc" opacity="0.7" />
    </svg>
  );
}
