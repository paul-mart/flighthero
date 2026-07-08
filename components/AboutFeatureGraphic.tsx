type AboutFeatureGraphicProps = {
  variant: 'compare' | 'transfer' | 'alerts' | 'guide';
};

export function AboutFeatureGraphic({ variant }: AboutFeatureGraphicProps) {
  if (variant === 'compare') {
    return (
      <svg className="about-feature-graphic-svg" viewBox="0 0 64 64" fill="none" aria-hidden>
        <rect x="4" y="12" width="24" height="40" rx="6" fill="#eef2ff" stroke="#c7d2fe" strokeWidth="1.5" />
        <rect x="36" y="12" width="24" height="40" rx="6" fill="#eef2ff" stroke="#c7d2fe" strokeWidth="1.5" />
        <text x="16" y="28" textAnchor="middle" fontSize="10" fontWeight="700" fill="#4f46e5">$</text>
        <text x="48" y="28" textAnchor="middle" fontSize="9" fontWeight="700" fill="#4f46e5">pts</text>
        <path d="M28 32 H36" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" />
        <path d="M33 29 L36 32 L33 35" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="10" y="36" width="12" height="3" rx="1.5" fill="#a5b4fc" />
        <rect x="42" y="36" width="12" height="3" rx="1.5" fill="#a5b4fc" />
        <rect x="10" y="42" width="8" height="3" rx="1.5" fill="#c7d2fe" />
        <rect x="42" y="42" width="10" height="3" rx="1.5" fill="#c7d2fe" />
      </svg>
    );
  }

  if (variant === 'transfer') {
    return (
      <svg className="about-feature-graphic-svg" viewBox="0 0 64 64" fill="none" aria-hidden>
        <circle cx="14" cy="32" r="10" fill="#eef2ff" stroke="#c7d2fe" strokeWidth="1.5" />
        <circle cx="50" cy="32" r="10" fill="#eef2ff" stroke="#c7d2fe" strokeWidth="1.5" />
        <path d="M24 32 H40" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 3" />
        <path d="M37 28 L40 32 L37 36" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <text x="14" y="35" textAnchor="middle" fontSize="8" fontWeight="700" fill="#4f46e5">bank</text>
        <text x="50" y="35" textAnchor="middle" fontSize="7" fontWeight="700" fill="#4f46e5">air</text>
        <rect x="26" y="14" width="12" height="8" rx="3" fill="#6366f1" />
        <path d="M28 22 L32 28 L36 22" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (variant === 'alerts') {
    return (
      <svg className="about-feature-graphic-svg" viewBox="0 0 64 64" fill="none" aria-hidden>
        <path
          d="M32 10 C22 10 18 18 18 24 V34 L14 40 H50 L46 34 V24 C46 18 42 10 32 10Z"
          fill="#eef2ff"
          stroke="#c7d2fe"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M26 44 C26 47.3 28.7 50 32 50 C35.3 50 38 47.3 38 44" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" />
        <circle cx="42" cy="18" r="7" fill="#6366f1" />
        <path d="M42 15 V21 M39 18 H45" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg className="about-feature-graphic-svg" viewBox="0 0 64 64" fill="none" aria-hidden>
      <rect x="12" y="10" width="40" height="44" rx="8" fill="#eef2ff" stroke="#c7d2fe" strokeWidth="1.5" />
      <path d="M20 22 H44 M20 30 H38 M20 38 H42" stroke="#a5b4fc" strokeWidth="2" strokeLinecap="round" />
      <circle cx="46" cy="46" r="10" fill="#6366f1" />
      <path
        d="M46 41 L46 46 L49 49"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
