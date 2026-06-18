import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { TRANSFER_PARTNER_OPTIONS } from '../lib/cpp';

export type FaqCategoryId = 'general' | 'transfer' | 'booking' | 'valuation';

export interface FaqCategory {
  id: FaqCategoryId;
  label: string;
}

export interface FaqItem {
  id: string;
  category: FaqCategoryId;
  title: string;
  searchText: string;
  body: ReactNode;
}

export const FAQ_CATEGORIES: FaqCategory[] = [
  { id: 'general', label: 'General' },
  { id: 'transfer', label: 'Transfer partners' },
  { id: 'booking', label: 'Award booking' },
  { id: 'valuation', label: 'Redemption value' },
];

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'what-is-flighthero',
    category: 'general',
    title: 'What is FlightHero?',
    searchText: 'flighthero search award points miles compare cash',
    body: (
      <>
        <p>
          FlightHero helps you compare cash fares and award availability on the same routes. Search
          a trip, switch between cash and points, and see which option gives you better value —
          including cents-per-point grades when we can match an award to a comparable cash fare.
        </p>
        <p>
          We aggregate award space from multiple mileage programs and show transfer partners that
          can book each option, so you can plan the full path from bank points to a seat.
        </p>
      </>
    ),
  },
  {
    id: 'cash-vs-points-search',
    category: 'general',
    title: 'How do cash and points search differ?',
    searchText: 'cash points toggle award economy business first cabin',
    body: (
      <>
        <p>
          Use the search toggle on the home page to pick <strong>cash</strong> or{' '}
          <strong>points</strong>. Cash search returns bookable fares from Google Flights data.
          Points search returns award availability from supported mileage programs for the same
          route and dates.
        </p>
        <p>
          Award results show the program, cabin, points required, taxes and fees, and — when we find
          a matching cash fare — a redemption grade based on your cent-per-point benchmarks.
        </p>
      </>
    ),
  },
  {
    id: 'transfer-points-to-partners',
    category: 'transfer',
    title: 'How do I transfer points to partners?',
    searchText: 'transfer chase amex citi bilt capital one airline hotel partner portal',
    body: (
      <>
        <p>
          Bank points (Chase Ultimate Rewards, Amex Membership Rewards, Citi ThankYou, Capital One,
          Bilt Rewards, and similar) live in your credit card or bank portal. They are not airline
          miles until you transfer them to a partner program.
        </p>
        <ol className="faq-list faq-list-ordered">
          <li>Find award space first — on FlightHero or the partner airline&apos;s site.</li>
          <li>
            Log in to your bank&apos;s rewards portal and open the <strong>transfer partners</strong>{' '}
            section.
          </li>
          <li>
            Select the airline or hotel program that can book the award you found. Enter your loyalty
            account number and the amount to transfer.
          </li>
          <li>
            Confirm the transfer. Most bank-to-airline transfers are one-way and cannot be reversed.
          </li>
          <li>
            Once miles post (instantly for many partners, or within a day or two for others), book
            the award on the partner site or by phone.
          </li>
        </ol>
        <p>
          <strong>Tip:</strong> Never transfer points until you have confirmed the award is still
          available and you are ready to book. Transferred miles usually cannot be moved back to
          your bank.
        </p>
      </>
    ),
  },
  {
    id: 'what-is-transfer-bonus',
    category: 'transfer',
    title: 'What is a transfer bonus?',
    searchText: 'transfer bonus promotion extra percent amex chase citi',
    body: (
      <>
        <p>
          A <strong>transfer bonus</strong> is a limited-time promotion where a bank rewards program
          gives you extra partner miles or points when you transfer. For example, a 20% bonus means
          transferring 10,000 bank points delivers 12,000 partner miles instead of 10,000.
        </p>
        <p>
          Bonuses are run by the bank (Chase, Amex, etc.), not the airline. They have start and end
          dates and sometimes cap how much you can transfer. A bonus improves the math on a specific
          redemption but does not change whether award space exists — always confirm availability
          before transferring.
        </p>
        <p>
          See current promotions on our{' '}
          <Link to="/points-news">Points News</Link> page, which lists active transfer bonuses for
          programs FlightHero supports.
        </p>
      </>
    ),
  },
  {
    id: 'supported-transfer-partners',
    category: 'transfer',
    title: 'Which transfer partners does FlightHero show?',
    searchText: 'chase amex citi capital one bilt partners programs supported',
    body: (
      <>
        <p>
          On award results, we list bank programs that can transfer to the mileage program offering
          the seat. Common examples include Chase Ultimate Rewards, Amex Membership Rewards, Citi
          ThankYou, Capital One, and Bilt Rewards.
        </p>
        <p>
          You can set personal cent-per-point benchmarks for these programs in{' '}
          <Link to="/profile">Profile → Preferences</Link>. Default benchmarks we use when you
          have not set your own:
        </p>
        <ul className="faq-list">
          {TRANSFER_PARTNER_OPTIONS.map((partner) => (
            <li key={partner.key}>
              {partner.label}: {partner.defaultCpp.toFixed(2)}¢/pt
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    id: 'when-to-transfer',
    category: 'transfer',
    title: 'When should I transfer points?',
    searchText: 'when transfer hold award book ready instant reversible',
    body: (
      <>
        <p>
          Transfer only when you are ready to book a specific award and have verified the seat is
          still available. Award space can disappear quickly, and transferred miles are almost
          never refundable back to your bank.
        </p>
        <p>
          Some travelers hold an award by booking and canceling within the free-cancellation window,
          or by calling the airline to place a short hold, before transferring — policies vary by
          program. If you are new to a program, read its transfer and booking rules before moving
          points.
        </p>
      </>
    ),
  },
  {
    id: 'two-one-ways-vs-roundtrip',
    category: 'booking',
    title: 'Why book two one-ways instead of a roundtrip for awards?',
    searchText: 'one way round trip outbound return separate programs mix partners',
    body: (
      <>
        <p>
          Most experienced award travelers book <strong>two one-way awards</strong> instead of a
          single roundtrip ticket. There are a few practical reasons:
        </p>
        <ul className="faq-list">
          <li>
            <strong>Different programs each direction.</strong> The cheapest or only available
            outbound might be on United miles while the return is on Air Canada Aeroplan — a
            roundtrip award usually must be on one program.
          </li>
          <li>
            <strong>Mix cabins.</strong> You might fly business outbound and economy home; two
            one-ways make that straightforward.
          </li>
          <li>
            <strong>Lower total cost.</strong> One program&apos;s roundtrip price is not always the
            sum of its best one-way prices. Shopping each leg separately often lets you cherry-pick the
            best deal per direction.
          </li>
          <li>
            <strong>Flexibility.</strong> If plans change, you cancel or change one leg without
            affecting the other (subject to each ticket&apos;s rules).
          </li>
          <li>
            <strong>Availability quirks.</strong> Some programs release one-way space more readily
            than roundtrip space, or price roundtrips at a premium.
          </li>
        </ul>
        <p>
          The tradeoff: you manage two bookings, and change/cancel policies apply separately to each
          ticket. For simple trips on one program with good roundtrip pricing, a single roundtrip
          award can still make sense.
        </p>
      </>
    ),
  },
  {
    id: 'taxes-and-fees',
    category: 'booking',
    title: 'What are taxes and fees on award tickets?',
    searchText: 'taxes fees fuel surcharge carrier imposed charges cash copay',
    body: (
      <>
        <p>
          An award ticket covers the fare in miles or points, but airlines and governments often
          still charge <strong>taxes and fees</strong> in cash. These can range from a few dollars
          to several hundred, depending on the carrier, route, and departure country.
        </p>
        <p>
          FlightHero shows taxes and fees on award results when the data source provides them.
          High surcharges (common on some European and Asian carriers) can make an award a poor deal
          even when the mileage price looks low — always compare the full cash out-of-pocket cost.
        </p>
        <p>
          When we calculate cents per point, we subtract taxes and fees from the comparable cash
          fare so the grade reflects the value of the miles themselves.
        </p>
      </>
    ),
  },
  {
    id: 'no-award-availability',
    category: 'booking',
    title: 'Why is there no award availability for my route?',
    searchText: 'no results empty saver space release waitlist partner',
    body: (
      <>
        <p>
          Award seats are a separate inventory bucket from cash tickets. A flight can be cheap in
          cash but have zero award space, or vice versa. Common reasons you may see no results:
        </p>
        <ul className="faq-list">
          <li>The program has not released saver-level space for your dates yet.</li>
          <li>Space existed but was already booked.</li>
          <li>The program only publishes awards to its own members or certain partner sites.</li>
          <li>Your search dates, cabin, or routing fall outside what the data source covers.</li>
        </ul>
        <p>
          Try flexible dates, nearby airports, a different mileage program that flies the same
          route, or searching one direction at a time. Some programs also release last-minute space.
        </p>
      </>
    ),
  },
  {
    id: 'partner-awards',
    category: 'booking',
    title: 'What are partner awards?',
    searchText: 'partner alliance codeshare star alliance oneworld skyteam book another airline',
    body: (
      <>
        <p>
          A <strong>partner award</strong> uses miles from one program to fly a flight operated by
          another airline. For example, you might use United MileagePlus miles to fly Lufthansa, or
          Aeroplan points to fly Swiss — when those partnerships exist.
        </p>
        <p>
          Partner awards often have different prices and availability than flying the same airline
          with its own miles. They are one reason award search tools matter: the best deal may not
          be on the airline that actually operates the flight.
        </p>
        <p>
          FlightHero shows which program is providing the award and which transfer partners can
          fund that booking.
        </p>
      </>
    ),
  },
  {
    id: 'custom-cent-per-point',
    category: 'valuation',
    title: 'What is custom cent-per-point?',
    searchText: 'cpp cents per point benchmark grade redemption value default preferences',
    body: (
      <>
        <p>
          When you book with points, <strong>redemption value</strong> tells you how many cents of
          flight value you are getting for each point on a specific award. We calculate it by
          comparing the matched cash fare to the points price, after subtracting taxes and fees.
        </p>
        <p>
          <strong>Custom cent-per-point</strong> benchmarks are the personal targets you set for
          each transfer partner in{' '}
          <Link to="/profile">Profile → Preferences</Link>. Grades on award flights compare this
          flight&apos;s redemption value to those benchmarks:
        </p>
        <ul className="faq-list">
          <li><strong>Very good</strong> — 25% or more above your benchmark</li>
          <li><strong>Good</strong> — 5% to 25% above</li>
          <li><strong>OK</strong> — within about 15% below to 5% above</li>
          <li><strong>Bad</strong> — 15% to 35% below</li>
          <li><strong>Very bad</strong> — more than 35% below</li>
        </ul>
        <p>
          If you have not set custom values yet, we use default benchmarks so grades still appear.
          Rows marked <span className="faq-inline-default">default</span> in View flight are using
          these defaults, not a value you saved. Set your own in{' '}
          <Link to="/profile">Preferences</Link> to grade redemptions against what matters to you.
        </p>
      </>
    ),
  },
  {
    id: 'redemption-grades',
    category: 'valuation',
    title: 'How should I interpret redemption grades?',
    searchText: 'grade very good bad ok benchmark compare cash worth it',
    body: (
      <>
        <p>
          Grades are a quick signal for whether a specific award beats your personal bar for that
          transfer partner. They are not a universal truth — your benchmarks reflect how you value
          each points currency.
        </p>
        <p>
          A <strong>very good</strong> redemption means you are getting significantly more flight
          value per point than your target. A <strong>bad</strong> grade suggests paying cash or
          waiting for better space might be smarter, unless you need the flight urgently or have
          miles expiring.
        </p>
        <p>
          Grades require a matched cash fare for the same or comparable itinerary. When no cash
          match exists, we show the award without a grade.
        </p>
      </>
    ),
  },
];

export function faqMatchesQuery(item: FaqItem, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  const haystack = `${item.title} ${item.searchText}`.toLowerCase();
  return normalized.split(/\s+/).every((term) => haystack.includes(term));
}
