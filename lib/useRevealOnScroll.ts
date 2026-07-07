import { useLayoutEffect, useRef, useState } from 'react';

interface UseRevealOnScrollOptions {
  threshold?: number;
  rootMargin?: string;
}

function isElementInViewport(el: HTMLElement, rootMargin = '0px'): boolean {
  const margin = Number.parseFloat(rootMargin) || 0;
  const rect = el.getBoundingClientRect();
  return rect.top < window.innerHeight + margin && rect.bottom > -margin;
}

export function useRevealOnScroll(options: UseRevealOnScrollOptions = {}) {
  const { threshold = 0.08, rootMargin = '120px 0px' } = options;
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || visible) return undefined;

    if (isElementInViewport(el, rootMargin)) {
      setVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin, threshold, visible]);

  return { ref, visible };
}
