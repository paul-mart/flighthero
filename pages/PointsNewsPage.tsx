import { useMemo } from 'react';
import { TransferBonusRatio } from '../components/TransferBonusBadge';
import { PointsNewsNav } from '../components/PointsNewsNav';
import { TransferPartnerLogo } from '../components/TransferPartnerLogo';
import { TopNavbar } from '../components/TopNavbar';
import { SiteFooter } from '../components/SiteFooter';
import { CARD_OFFERS, formatOfferDate } from '../data/cardOffers';
import { TRANSFER_GUIDE_DESTINATIONS } from '../data/transferGuides';
import {
  ACTIVE_TRANSFER_BONUSES,
  TRANSFER_BONUS_SOURCE,
  calculateBonusTransferRatio,
  formatBonusDate,
  isFlightHeroTransferProgram,
  transferFromToLogoPartner,
} from '../data/transferBonuses';

export default function PointsNewsPage() {
  const lastUpdated = formatBonusDate(TRANSFER_BONUS_SOURCE.lastUpdated);
  const flightHeroBonuses = ACTIVE_TRANSFER_BONUSES.filter((bonus) =>
    isFlightHeroTransferProgram(bonus.transferFrom),
  );
  const otherBonuses = ACTIVE_TRANSFER_BONUSES.filter((bonus) =>
    !isFlightHeroTransferProgram(bonus.transferFrom),
  );

  const navSections = useMemo(
    () => [
      { id: 'transfer-bonuses', label: 'Transfer Bonuses' },
      ...(otherBonuses.length > 0
        ? [{ id: 'other-programs', label: 'Other Programs' }]
        : []),
      { id: 'card-offers', label: 'Hot Card Offers' },
      { id: 'transfer-guide', label: 'Transfer Guide by Destination' },
    ],
    [otherBonuses.length],
  );

  return (
    <div className="app-page faq-shell">
      <TopNavbar />
      <main className="faq-main page-shell-main points-news-main">
        <div className="points-news-layout">
          <PointsNewsNav sections={navSections} />

          <div className="points-news-content">
            <header className="faq-header points-news-header">
              <h1 className="faq-title">Points News</h1>
              <p className="points-news-lede">
                Transfer bonuses, card offers, and points program updates for award travelers.
              </p>
            </header>

            <section id="transfer-bonuses" className="points-news-section">
              <div className="points-news-section-header">
                <h2 className="points-news-section-title">Transfer Bonuses</h2>
                <p className="points-news-section-copy">
                  Bonuses from programs FlightHero supports in award search.
                </p>
              </div>
              {flightHeroBonuses.length > 0 ? (
                <div className="points-news-bonus-grid">
                  {flightHeroBonuses.map((bonus) => (
                    <BonusCard key={`${bonus.transferFrom}-${bonus.transferTo}-${bonus.endDate}`} bonus={bonus} />
                  ))}
                </div>
              ) : (
                <p className="points-news-empty">No active bonuses for supported programs right now.</p>
              )}
            </section>

            {otherBonuses.length > 0 && (
              <section id="other-programs" className="points-news-section">
                <div className="points-news-section-header">
                  <h2 className="points-news-section-title">Other Programs</h2>
                  <p className="points-news-section-copy">
                    Active bonuses from programs outside FlightHero search.
                  </p>
                </div>
                <div className="points-news-bonus-grid">
                  {otherBonuses.map((bonus) => (
                    <BonusCard key={`${bonus.transferFrom}-${bonus.transferTo}-${bonus.endDate}`} bonus={bonus} />
                  ))}
                </div>
              </section>
            )}

            <section id="card-offers" className="points-news-section">
              <div className="points-news-section-header">
                <h2 className="points-news-section-title">Hot Card Offers</h2>
                <p className="points-news-section-copy">
                  Featured welcome offers and what they mean for your next trip.
                </p>
              </div>
              <div className="card-offers-list">
                {CARD_OFFERS.map((offer) => (
                  <CardOfferArticle key={offer.id} offer={offer} />
                ))}
              </div>
            </section>

            <section id="transfer-guide" className="points-news-section">
              <div className="points-news-section-header">
                <h2 className="points-news-section-title">Transfer Guide by Destination</h2>
                <p className="points-news-section-copy">
                  Where to move bank points for common trip goals — then search live award space on FlightHero.
                </p>
              </div>
              <div className="transfer-guide-grid">
                {TRANSFER_GUIDE_DESTINATIONS.map((guide) => (
                  <article key={guide.id} className="transfer-guide-card">
                    <p className="transfer-guide-region">{guide.region}</p>
                    <h3 className="transfer-guide-destination">{guide.destination}</h3>
                    <p className="transfer-guide-programs">
                      <span className="transfer-guide-label">Top programs</span>
                      {guide.topPrograms}
                    </p>
                    <p className="transfer-guide-tip">{guide.tip}</p>
                  </article>
                ))}
              </div>
            </section>

            <p className="points-news-source">
              Transfer bonus data last updated {lastUpdated}. Sourced from{' '}
              <a href={TRANSFER_BONUS_SOURCE.url} target="_blank" rel="noreferrer">
                {TRANSFER_BONUS_SOURCE.name}
              </a>
              . Card offer articles link to original reporting — confirm terms on the issuer site before applying.
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function CardOfferArticle({ offer }: { offer: typeof CARD_OFFERS[number] }) {
  return (
    <article className="card-offer-article">
      <div className="card-offer-body">
        <div className="card-offer-header">
          <div className="card-offer-brand">
            <TransferPartnerLogo partner={offer.issuerPartner} size={24} className="card-offer-logo" />
            <span className="card-offer-card-name">{offer.cardName}</span>
          </div>
          <span className="card-offer-date">{formatOfferDate(offer.publishedDate)}</span>
        </div>
        <h3 className="card-offer-headline">{offer.headline}</h3>

        <dl className="card-offer-stats">
          <div className="card-offer-stat">
            <dt>Welcome offer</dt>
            <dd>{offer.offerHighlight}</dd>
          </div>
          <div className="card-offer-stat">
            <dt>Spend requirement</dt>
            <dd>{offer.spendRequirement}</dd>
          </div>
          <div className="card-offer-stat">
            <dt>Annual fee</dt>
            <dd>{offer.annualFee}</dd>
          </div>
        </dl>

        {offer.paragraphs.map((paragraph, index) => (
          <p key={index} className="card-offer-paragraph">{paragraph}</p>
        ))}

        <ul className="card-offer-highlights">
          {offer.highlights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        {offer.caveat && (
          <p className="card-offer-caveat">{offer.caveat}</p>
        )}

        <p className="card-offer-source">
          Based on reporting from{' '}
          <a href={offer.sourceUrl} target="_blank" rel="noreferrer">
            {offer.sourceName}
          </a>
          . Offer terms may change — verify on Chase&apos;s site before applying.
        </p>
      </div>
    </article>
  );
}

function BonusCard({ bonus }: { bonus: typeof ACTIVE_TRANSFER_BONUSES[number] }) {
  const logoPartner = transferFromToLogoPartner(bonus.transferFrom);
  const cardTitle = logoPartner
    ? bonus.transferTo
    : `${bonus.transferFrom} → ${bonus.transferTo}`;
  const transferRatio = calculateBonusTransferRatio(bonus.baseTransferRatio, bonus.bonusPercent);

  return (
    <article className="points-news-card">
      <div className="points-news-card-top">
        {logoPartner ? (
          <TransferPartnerLogo partner={logoPartner} size={32} />
        ) : (
          <span className="points-news-card-fallback" aria-hidden="true">
            {bonus.transferFrom.slice(0, 2).toUpperCase()}
          </span>
        )}
        <span className="points-news-card-bonus">{bonus.bonusPercent}% bonus</span>
      </div>
      <h3
        className="points-news-card-title"
        aria-label={logoPartner ? `${bonus.transferFrom} to ${bonus.transferTo}` : undefined}
      >
        {cardTitle}
      </h3>
      <TransferBonusRatio
        base={transferRatio.base}
        withBonus={transferRatio.withBonus}
        compact
      />
      <p className="points-news-card-dates">
        {formatBonusDate(bonus.startDate)} – {formatBonusDate(bonus.endDate)}
      </p>
      {bonus.detailsUrl && (
        <a
          href={bonus.detailsUrl}
          className="points-news-card-link"
          target="_blank"
          rel="noreferrer"
        >
          Details
        </a>
      )}
    </article>
  );
}
