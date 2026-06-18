import { Link } from 'react-router-dom';
import { FlightHeroLogo } from './FlightHeroLogo';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-main">
        <div className="site-footer-columns">
          <div className="site-footer-column">
            <h2 className="site-footer-heading">Product</h2>
            <ul className="site-footer-links">
              <li><Link to="/">Search flights</Link></li>
              <li><a href="/#deals">Deals</a></li>
              <li><a href="/#explore">Explore</a></li>
              <li><a href="/#points-guide">Points Guide</a></li>
            </ul>
          </div>
          <div className="site-footer-column">
            <h2 className="site-footer-heading">Support</h2>
            <ul className="site-footer-links">
              <li><Link to="/faq">FAQ</Link></li>
              <li><Link to="/legal">Legal</Link></li>
              <li><Link to="/contact">Contact us</Link></li>
            </ul>
          </div>
        </div>
        <Link to="/" className="site-footer-brand" aria-label="FlightHero home">
          <FlightHeroLogo variant="footer" />
        </Link>
      </div>
      <p className="site-footer-credit">Created by Paul Martin</p>
    </footer>
  );
}
