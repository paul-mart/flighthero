import { BellIcon, SearchIcon } from '../icons';

function SparklesIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3l1.4 4.3L17.7 9 13.4 10.4 12 14.7 10.6 10.4 6.3 9l4.3-1.7L12 3z" />
      <path d="M5 16l.8 2.4L8.2 19l-2.4.8L5 22.2 3.8 19.8 1.4 19l2.4-.8L5 16z" />
      <path d="M19 14l.6 1.8L21.4 17l-1.8.6L19 19.4 18.4 17.6 16.6 17l1.8-.6L19 14z" />
    </svg>
  );
}

const STEPS = [
  {
    icon: SearchIcon,
    title: '1. Search Your Route',
    copy: 'Compare live cash fares and award availability side-by-side in one simple search.',
  },
  {
    icon: SparklesIcon,
    title: '2. Optimize Your Points',
    copy: 'Uncover hidden partner award space and see exactly which credit card points to transfer.',
  },
  {
    icon: BellIcon,
    title: '3. Lock in Daily Alerts',
    copy: 'Save your route and get notified the exact moment seat space opens or prices drop.',
  },
] as const;

export function HowItWorksSection() {
  return (
    <section className="home-how-it-works" aria-labelledby="home-how-it-works-title">
      <div className="home-how-it-works-inner">
        <h2 id="home-how-it-works-title" className="home-how-it-works-title">
          Fly Smarter with FlightHero
        </h2>
        <div className="home-how-it-works-grid">
          {STEPS.map(({ icon: Icon, title, copy }) => (
            <article key={title} className="home-how-it-works-step">
              <div className="home-how-it-works-icon" aria-hidden>
                <Icon size={22} />
              </div>
              <h3 className="home-how-it-works-step-title">{title}</h3>
              <p className="home-how-it-works-step-copy">{copy}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
