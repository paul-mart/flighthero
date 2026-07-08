import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { PointsGuideDestination } from '../data/pointsGuides';

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

function useScrollActiveSection(sectionIds: string[]) {
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

interface PointsGuideNavProps {
  guides: Pick<PointsGuideDestination, 'id' | 'title'>[];
  activeGuideId?: string;
  mode?: 'scroll' | 'route';
}

export function PointsGuideNav({
  guides,
  activeGuideId,
  mode = 'scroll',
}: PointsGuideNavProps) {
  const location = useLocation();
  const sectionIds = useMemo(
    () => guides.map((guide) => guide.id),
    [guides],
  );
  const { activeId: scrollActiveId, navigateToSection } = useScrollActiveSection(
    mode === 'scroll' ? sectionIds : [],
  );

  const routeActiveId = activeGuideId
    ?? guides.find((guide) => location.pathname.endsWith(`/${guide.id}`))?.id
    ?? '';

  const activeId = mode === 'route' ? routeActiveId : scrollActiveId;

  return (
    <aside className="points-guide-nav" aria-label="Points Guide destinations">
      <nav className="points-guide-nav-inner">
        <p className="points-guide-nav-heading">Destinations</p>
        <ul className="points-guide-nav-list">
          {guides.map((guide) => {
            const isActive = activeId === guide.id;

            if (mode === 'route') {
              return (
                <li key={guide.id} className="points-guide-nav-item">
                  <Link
                    to={`/points-guide/${guide.id}`}
                    className={`points-guide-nav-link${isActive ? ' points-guide-nav-link--active' : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {guide.title}
                  </Link>
                </li>
              );
            }

            return (
              <li key={guide.id} className="points-guide-nav-item">
                <a
                  href={`#${guide.id}`}
                  className={`points-guide-nav-link${isActive ? ' points-guide-nav-link--active' : ''}`}
                  onClick={(event) => {
                    event.preventDefault();
                    navigateToSection(guide.id);
                  }}
                  aria-current={isActive ? 'location' : undefined}
                >
                  {guide.title}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
