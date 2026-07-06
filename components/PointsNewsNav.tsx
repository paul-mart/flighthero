import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import {
  CreditCardIcon,
  GiftIcon,
  GlobeIcon,
  LayersIcon,
} from '../icons';

export interface PointsNewsNavSection {
  id: string;
  label: string;
}

type NavIcon = ComponentType<{ size?: number }>;

const SECTION_ICONS: Record<string, NavIcon> = {
  'transfer-bonuses': GiftIcon,
  'other-programs': LayersIcon,
  'card-offers': CreditCardIcon,
  'transfer-guide': GlobeIcon,
};

const SCROLL_OFFSET = 112;

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET;
  window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  window.history.replaceState(null, '', `#${id}`);
}

function pickActiveSection(sectionIds: string[]): string {
  if (sectionIds.length === 0) return '';

  let active = sectionIds[0];
  for (const id of sectionIds) {
    const el = document.getElementById(id);
    if (!el) continue;
    if (el.getBoundingClientRect().top <= SCROLL_OFFSET + 12) {
      active = id;
    }
  }
  return active;
}

function useActiveSection(sectionIds: string[]) {
  const idsKey = sectionIds.join('|');
  const [activeId, setActiveId] = useState(sectionIds[0] ?? '');
  const scrollingToRef = useRef<string | null>(null);
  const scrollLockTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const ids = idsKey.split('|').filter(Boolean);
    if (ids.length === 0) return undefined;

    const hash = window.location.hash.slice(1);
    if (hash && ids.includes(hash)) {
      setActiveId(hash);
    } else {
      setActiveId(pickActiveSection(ids));
    }

    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (scrollingToRef.current) {
          setActiveId(scrollingToRef.current);
          return;
        }
        setActiveId(pickActiveSection(ids));
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (scrollLockTimerRef.current !== null) {
        window.clearTimeout(scrollLockTimerRef.current);
      }
    };
  }, [idsKey]);

  const navigateToSection = (id: string) => {
    if (scrollLockTimerRef.current !== null) {
      window.clearTimeout(scrollLockTimerRef.current);
    }
    scrollingToRef.current = id;
    setActiveId(id);
    scrollToSection(id);
    scrollLockTimerRef.current = window.setTimeout(() => {
      scrollingToRef.current = null;
      scrollLockTimerRef.current = null;
    }, 900);
  };

  return { activeId, navigateToSection };
}

interface PointsNewsNavProps {
  sections: PointsNewsNavSection[];
}

export function PointsNewsNav({ sections }: PointsNewsNavProps) {
  const sectionIds = useMemo(
    () => sections.map((section) => section.id),
    [sections],
  );
  const { activeId, navigateToSection } = useActiveSection(sectionIds);

  return (
    <aside className="points-news-nav" aria-label="Points News sections">
      <nav className="points-news-nav-inner">
        <p className="points-news-nav-heading">On this page</p>
        <ul className="points-news-nav-list">
          {sections.map((section) => {
            const Icon = SECTION_ICONS[section.id] ?? GlobeIcon;
            const isActive = activeId === section.id;

            return (
              <li key={section.id} className="points-news-nav-item">
                <a
                  href={`#${section.id}`}
                  className={`points-news-nav-link${isActive ? ' points-news-nav-link--active' : ''}`}
                  onClick={(event) => {
                    event.preventDefault();
                    navigateToSection(section.id);
                  }}
                  aria-current={isActive ? 'location' : undefined}
                >
                  <span className="points-news-nav-icon" aria-hidden="true">
                    <Icon size={20} />
                  </span>
                  <span className="points-news-nav-label">{section.label}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
