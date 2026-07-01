import { useEffect, useMemo, useState } from 'react';
import { TopNavbar } from '../components/TopNavbar';
import { SiteFooter } from '../components/SiteFooter';
import { SearchIcon } from '../icons';
import {
  FAQ_CATEGORIES,
  FAQ_ITEMS,
  faqMatchesQuery,
  type FaqCategoryId,
} from '../data/faqContent';

function scrollToFaqId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  window.history.replaceState(null, '', `#${id}`);
}

export default function FaqPage() {
  const [query, setQuery] = useState('');

  const filteredItems = useMemo(
    () => FAQ_ITEMS.filter((item) => faqMatchesQuery(item, query)),
    [query],
  );

  const visibleByCategory = useMemo(() => {
    const map = new Map<FaqCategoryId, typeof FAQ_ITEMS>();
    for (const category of FAQ_CATEGORIES) {
      map.set(
        category.id,
        filteredItems.filter((item) => item.category === category.id),
      );
    }
    return map;
  }, [filteredItems]);

  const hasResults = filteredItems.length > 0;

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const frame = requestAnimationFrame(() => scrollToFaqId(hash));
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleNavClick = (id: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    scrollToFaqId(id);
  };

  return (
    <div className="app-page faq-shell">
      <TopNavbar />
      <main className="faq-main faq-main-wide">
        <header className="faq-header">
          <h1 className="faq-title">FAQ</h1>
          <p className="faq-lede">
            Answers about transfers, award booking, and how FlightHero grades redemptions.
          </p>
          <label className="faq-search">
            <SearchIcon size={18} />
            <input
              type="search"
              className="faq-search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search questions…"
              aria-label="Search FAQ"
            />
          </label>
        </header>

        <div className="faq-layout">
          <aside className="faq-sidebar" aria-label="FAQ topics">
            <nav className="faq-nav">
              {FAQ_CATEGORIES.map((category) => {
                const items = visibleByCategory.get(category.id) ?? [];
                if (items.length === 0) return null;
                return (
                  <div key={category.id} className="faq-nav-group">
                    <h2 className="faq-nav-heading">{category.label}</h2>
                    <ul className="faq-nav-list">
                      {items.map((item) => (
                        <li key={item.id}>
                          <a
                            href={`#${item.id}`}
                            className="faq-nav-link"
                            onClick={handleNavClick(item.id)}
                          >
                            {item.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
              {!hasResults && (
                <p className="faq-nav-empty">No matching topics</p>
              )}
            </nav>
          </aside>

          <div className="faq-content">
            {!hasResults ? (
              <div className="faq-article faq-empty-state">
                <p>No questions match your search. Try different keywords or clear the search box.</p>
              </div>
            ) : (
              FAQ_CATEGORIES.map((category) => {
                const items = visibleByCategory.get(category.id) ?? [];
                if (items.length === 0) return null;
                return (
                  <section key={category.id} className="faq-category-section">
                    <h2 className="faq-category-title">{category.label}</h2>
                    {items.map((item) => (
                      <article key={item.id} id={item.id} className="faq-article">
                        <h3 className="faq-article-title">{item.title}</h3>
                        {item.body}
                      </article>
                    ))}
                  </section>
                );
              })
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
