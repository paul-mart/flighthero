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

function AskHeroIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z" />
      <path d="M9 10h6M9 14h4" />
    </svg>
  );
}

export type WorkspaceStepId = 'search' | 'optimize' | 'monitor' | 'ask-hero';

type StepConfig = {
  id: WorkspaceStepId;
  icon: typeof SearchIcon;
  title: string;
  copy: string;
};

const MARKETING_STEPS: StepConfig[] = [
  {
    id: 'search',
    icon: SearchIcon,
    title: '1. Search Your Route',
    copy: 'Compare live cash fares and award availability side-by-side in one simple search.',
  },
  {
    id: 'optimize',
    icon: SparklesIcon,
    title: '2. Optimize Your Points',
    copy: 'Uncover hidden partner award space and see exactly which credit card points to transfer.',
  },
  {
    id: 'monitor',
    icon: BellIcon,
    title: '3. Lock in Daily Alerts',
    copy: 'Save your route and get notified the exact moment seat space opens or prices drop.',
  },
];

const WORKSPACE_STEPS: StepConfig[] = [
  {
    id: 'search',
    icon: SearchIcon,
    title: 'New Search Engine',
    copy: 'Launch a fresh live scan across cash fares and award seat availability.',
  },
  {
    id: 'optimize',
    icon: SparklesIcon,
    title: 'Points Optimization',
    copy: 'Explore sweet spots, transfer award charts, and valuation guides.',
  },
  {
    id: 'monitor',
    icon: BellIcon,
    title: 'Active Route Monitoring',
    copy: 'View or update your current daily email drop tracking parameters.',
  },
  {
    id: 'ask-hero',
    icon: AskHeroIcon,
    title: 'Ask Hero',
    copy: 'Chat with Hero for personalized help planning routes, redemptions, and award strategies.',
  },
];

interface HowItWorksSectionProps {
  mode?: 'marketing' | 'workspace';
  onStepAction?: (stepId: WorkspaceStepId) => void;
}

export function HowItWorksSection({
  mode = 'marketing',
  onStepAction,
}: HowItWorksSectionProps) {
  const isWorkspace = mode === 'workspace';
  const steps = isWorkspace ? WORKSPACE_STEPS : MARKETING_STEPS;
  const sectionTitle = isWorkspace ? 'Your Travel Tools' : 'Fly Smarter with FlightHero';

  return (
    <section className="home-how-it-works" aria-labelledby="home-how-it-works-title">
      <div className="home-how-it-works-inner">
        <h2 id="home-how-it-works-title" className="home-how-it-works-title">
          {sectionTitle}
        </h2>
        <div className={`home-how-it-works-grid${isWorkspace ? ' home-how-it-works-grid--workspace' : ''}`}>
          {steps.map(({ id, icon: Icon, title, copy }) => {
            const interactive = isWorkspace && onStepAction;

            if (interactive) {
              return (
                <button
                  key={id}
                  type="button"
                  className="home-how-it-works-step home-how-it-works-step--interactive"
                  onClick={() => onStepAction(id)}
                >
                  <div className="home-how-it-works-icon" aria-hidden>
                    <Icon size={22} />
                  </div>
                  <h3 className="home-how-it-works-step-title">{title}</h3>
                  <p className="home-how-it-works-step-copy">{copy}</p>
                </button>
              );
            }

            return (
              <article key={id} className="home-how-it-works-step">
                <div className="home-how-it-works-icon" aria-hidden>
                  <Icon size={22} />
                </div>
                <h3 className="home-how-it-works-step-title">{title}</h3>
                <p className="home-how-it-works-step-copy">{copy}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
