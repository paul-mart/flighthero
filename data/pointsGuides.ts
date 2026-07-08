import { publicUrl } from '../lib/publicUrl';

export interface GuideAirline {
  label: string;
  shortLabel?: string;
  logo?: string;
  accentClass?: 'ana' | 'united' | 'delta' | 'american' | 'british-airways' | 'jal' | 'air-canada' | 'emirates';
}

export interface BookingWindowRow {
  program: string;
  calendarOpens: string;
  strategy: string;
}

export interface PointsGuideDestination {
  id: string;
  title: string;
  region: string;
  image: string;
  imageAlt: string;
  lede: string;
  bestAirlines: GuideAirline[];
  topPrograms: string;
  sweetSpots: string[];
  bookingWindowMatrix: BookingWindowRow[];
  bookingTips: string[];
  sampleRoutes: string;
}

export const POINTS_GUIDE_DESTINATIONS: PointsGuideDestination[] = [
  {
    id: 'japan',
    title: 'Japan',
    region: 'Asia-Pacific',
    image: publicUrl('deals/hnd.jpg'),
    imageAlt: 'Tokyo skyline at dusk',
    lede:
      'Japan is one of the most popular award destinations from the US. Business class to Tokyo can be a strong use of bank points when you know which programs to search and when to transfer.',
    bestAirlines: [
      { label: 'All Nippon Airways', logo: 'partners/airlines/ana.png', accentClass: 'ana' },
      { label: 'Japan Airlines', logo: 'partners/airlines/japan-airlines.png', accentClass: 'jal' },
      { label: 'United Airlines', logo: 'partners/airlines/united.png', accentClass: 'united' },
      { label: 'Air Canada Aeroplan', logo: 'partners/airlines/air-canada.png', accentClass: 'air-canada' },
    ],
    topPrograms:
      'ANA Mileage Club (via Amex and other partners), United MileagePlus, Virgin Atlantic Flying Club, and Aeroplan for Star Alliance connections. Each prices Tokyo differently — compare total miles and surcharges before you transfer bank points.',
    sweetSpots: [
      'ANA round-trip business from the US West Coast often starts around 88k–95k miles when partner space is open on ANA metal.',
      'United saver business to Tokyo (HND/NRT) can appear at 88k round trip — compare against ANA before transferring.',
      'Virgin Atlantic sometimes prices Japan in premium cabins lower than the operating carrier when award charts align.',
      'Book Star Alliance partners through Aeroplan when United surcharges or dynamic pricing spike on the same flight.',
    ],
    bookingWindowMatrix: [
      {
        program: 'ANA Mileage Club',
        calendarOpens: '355 days (partner awards)',
        strategy: 'Search both HND and NRT; partner awards often release in weekly batches.',
      },
      {
        program: 'United MileagePlus',
        calendarOpens: '11 months',
        strategy: 'Filter for saver awards first; set alerts 330+ days out for peak cherry-blossom dates.',
      },
      {
        program: 'Virgin Atlantic',
        calendarOpens: '330 days',
        strategy: 'Check ANA and JAL partner space before transferring Amex or Chase points.',
      },
    ],
    bookingTips: [
      'Start searching 11 months out for ANA and United; last-minute space can appear but is less predictable.',
      'Tokyo has two airports (HND and NRT) — check both when building your route.',
      'Consider positioning flights within Japan on cash or low-cost carriers after your long-haul award lands.',
    ],
    sampleRoutes: 'LAX → HND, SFO → NRT, JFK → HND, SEA → NRT',
  },
  {
    id: 'united-kingdom',
    title: 'United Kingdom',
    region: 'Europe',
    image: publicUrl('deals/lhr.jpg'),
    imageAlt: 'London cityscape along the Thames',
    lede:
      'London is the busiest transatlantic award market from the US East Coast. Multiple alliances serve Heathrow and Gatwick, so comparing programs before you transfer is essential.',
    bestAirlines: [
      { label: 'British Airways', logo: 'partners/airlines/british-airways.png', accentClass: 'british-airways' },
      { label: 'Virgin Atlantic', shortLabel: 'VS' },
      { label: 'United Airlines', logo: 'partners/airlines/united.png', accentClass: 'united' },
      { label: 'American Airlines', logo: 'partners/airlines/american-airlines.png', accentClass: 'american' },
    ],
    topPrograms:
      'British Airways Avios, Aer Lingus Avios, Virgin Atlantic Flying Club, Flying Blue, and United MileagePlus. Avios distance-based pricing rewards short hops; watch fuel surcharges on BA metal into LHR.',
    sweetSpots: [
      'Avios off-peak economy from the US Northeast to London can price under 20k one-way on some dates.',
      'Aer Lingus business via Dublin can beat direct BA pricing when you do not mind a connection.',
      'Virgin Atlantic often has strong premium cabin space to London when booked far in advance.',
      'Off-peak Avios from East Coast cities to LGW can undercut dynamic programs on identical nonstops.',
    ],
    bookingWindowMatrix: [
      {
        program: 'British Airways Avios',
        calendarOpens: '355 days',
        strategy: 'Compare LHR vs LGW; partner awards on AA/IB metal can dodge peak BA surcharges.',
      },
      {
        program: 'Virgin Atlantic',
        calendarOpens: '330 days',
        strategy: 'Delta and VS nonstops release early; transfer Amex or Chase only after confirming space.',
      },
      {
        program: 'United MileagePlus',
        calendarOpens: '11 months',
        strategy: 'Saver business to LHR is competitive — pair with a positioning flight if EWR/BOS is sold out.',
      },
    ],
    bookingTips: [
      'Heathrow (LHR) carries high surcharges on many programs — compare Gatwick (LGW) and Dublin (DUB) routings.',
      'Taxes and fees vary widely by program; always compare total out-of-pocket cost, not just miles.',
      'Shoulder season (March–May, September–October) usually has the best mix of space and value.',
    ],
    sampleRoutes: 'JFK → LHR, BOS → LHR, EWR → LGW, IAD → LHR',
  },
  {
    id: 'france',
    title: 'France',
    region: 'Europe',
    image: publicUrl('deals/cdg.jpg'),
    imageAlt: 'Paris with the Eiffel Tower',
    lede:
      'Paris is a flagship Flying Blue destination and a common target for SkyTeam and Star Alliance awards. CDG and ORY both matter depending on your program and routing.',
    bestAirlines: [
      { label: 'Air France', shortLabel: 'AF' },
      { label: 'Delta Air Lines', logo: 'partners/airlines/delta.png', accentClass: 'delta' },
      { label: 'United Airlines', logo: 'partners/airlines/united.png', accentClass: 'united' },
      { label: 'Air Canada', logo: 'partners/airlines/air-canada.png', accentClass: 'air-canada' },
    ],
    topPrograms:
      'Flying Blue (Air France/KLM), Virgin Atlantic, United MileagePlus, and Aeroplan. Flying Blue Promo Rewards are the headline sale; Star Alliance options add backup space via Swiss, Lufthansa, or United.',
    sweetSpots: [
      'Flying Blue Promo Rewards can drop Paris business class by 25% or more during monthly sales.',
      'Off-peak Flying Blue economy from the US to CDG often starts in the low 20k–30k range one-way.',
      'United and Aeroplan can surface Star Alliance space on Lufthansa, Swiss, or United metal into Paris.',
      'Virgin Atlantic Delta partner awards occasionally beat Flying Blue on identical SkyTeam flights.',
    ],
    bookingWindowMatrix: [
      {
        program: 'Flying Blue',
        calendarOpens: '10–11 months',
        strategy: 'Watch monthly Promo Rewards; book immediately when a Paris route drops.',
      },
      {
        program: 'United MileagePlus',
        calendarOpens: '11 months',
        strategy: 'Search CDG and ORY; Star Alliance partners fill gaps when AF is waitlisted.',
      },
      {
        program: 'Virgin Atlantic',
        calendarOpens: '330 days',
        strategy: 'Use for Delta nonstops or AF partner space when Amex transfer bonuses are live.',
      },
    ],
    bookingTips: [
      'Watch Flying Blue monthly Promo Rewards — they are one of the most reliable sales in the space.',
      'Open-jaw tickets (fly into Paris, out of another city) can save miles on a broader Europe trip.',
      'Compare CDG vs ORY for lower taxes depending on the operating carrier.',
    ],
    sampleRoutes: 'JFK → CDG, BOS → CDG, ATL → CDG, SFO → CDG',
  },
  {
    id: 'mexico',
    title: 'Mexico',
    region: 'Americas',
    image: publicUrl('deals/mex.jpg'),
    imageAlt: 'Mexico City historic center',
    lede:
      'Mexico is one of the easiest award wins from the US: short flights, frequent space, and several programs price Mexico City and beach destinations at low mileage levels.',
    bestAirlines: [
      { label: 'United Airlines', logo: 'partners/airlines/united.png', accentClass: 'united' },
      { label: 'Delta Air Lines', logo: 'partners/airlines/delta.png', accentClass: 'delta' },
      { label: 'Aeroméxico', shortLabel: 'AM' },
      { label: 'American Airlines', logo: 'partners/airlines/american-airlines.png', accentClass: 'american' },
    ],
    topPrograms:
      'United MileagePlus, Aeroplan, JetBlue TrueBlue, and Flying Blue for Aeromexico and partners. Short-haul pricing means even modest bank balances go far — but cash fares are often cheap, so compare CPP.',
    sweetSpots: [
      'United saver economy to Mexico City (MEX) or Cancun (CUN) often starts around 17.5k–22k one-way.',
      'JetBlue points can be competitive for nonstop routes from Florida and the Northeast when cash fares spike.',
      'Aeroplan sometimes prices short-haul Star Alliance awards to Mexico lower than United on the same metal.',
      'Flying Blue Aeromexico partner awards can beat Delta pricing during Promo Rewards windows.',
    ],
    bookingWindowMatrix: [
      {
        program: 'United MileagePlus',
        calendarOpens: '11 months',
        strategy: 'Saver space is common — book winter beach dates early; midweek departures help.',
      },
      {
        program: 'Aeroplan',
        calendarOpens: '355 days',
        strategy: 'Search identical United flights; fixed partner pricing can win on short hops.',
      },
      {
        program: 'Flying Blue',
        calendarOpens: '10–11 months',
        strategy: 'Use for Aeromexico metal; stack Promo Rewards for CUN and MEX peak weeks.',
      },
    ],
    bookingTips: [
      'Beach destinations (CUN, PVR, SJD) peak during US holidays — book early for winter and spring break.',
      'Mexico City works well as a hub for deeper Latin America connections on cash or separate awards.',
      'Check both United and Aeroplan for the same flight — pricing can differ on identical segments.',
    ],
    sampleRoutes: 'DFW → MEX, LAX → CUN, ORD → MEX, MIA → CUN',
  },
  {
    id: 'italy',
    title: 'Italy',
    region: 'Europe',
    image: publicUrl('deals/fco.jpg'),
    imageAlt: 'Rome historic architecture',
    lede:
      'Rome and Milan anchor most US–Italy award searches. Premium cabin space is tighter than London or Paris, but economy and premium economy can be excellent values in shoulder season.',
    bestAirlines: [
      { label: 'ITA Airways', shortLabel: 'ITA' },
      { label: 'Delta Air Lines', logo: 'partners/airlines/delta.png', accentClass: 'delta' },
      { label: 'United Airlines', logo: 'partners/airlines/united.png', accentClass: 'united' },
      { label: 'Emirates', logo: 'partners/airlines/emirates.png', accentClass: 'emirates' },
    ],
    topPrograms:
      'Flying Blue, United MileagePlus, Aeroplan, and Virgin Atlantic for Delta and partner space. Italy rewards flexibility — alternate airports and open-jaw itineraries unlock space other travelers miss.',
    sweetSpots: [
      'Flying Blue to FCO or MXP during Promo Rewards can undercut other programs by a wide margin.',
      'United saver economy to Rome often prices around 30k one-way from the East Coast when space opens.',
      'Milan (MXP) sometimes has better business availability than Rome on SkyTeam carriers.',
      'Emirates fifth-freedom or connecting awards via DXB can appear when direct Star Alliance space is gone.',
    ],
    bookingWindowMatrix: [
      {
        program: 'Flying Blue',
        calendarOpens: '10–11 months',
        strategy: 'Target Promo Rewards for FCO/MXP; book within hours of the monthly release.',
      },
      {
        program: 'United MileagePlus',
        calendarOpens: '11 months',
        strategy: 'Search FCO, MXP, VCE, and NAP; saver economy is the most reliable tier.',
      },
      {
        program: 'Virgin Atlantic',
        calendarOpens: '330 days',
        strategy: 'Check Delta nonstops to Rome and Milan before transferring bank points.',
      },
    ],
    bookingTips: [
      'If Rome is sold out, search Venice (VCE), Milan (MXP), or Naples (NAP) and connect by train.',
      'Summer peak (June–August) is the hardest window — aim for April–May or late September.',
      'Compare total taxes: ITA Airways and legacy Alitalia routes can carry different fee structures.',
    ],
    sampleRoutes: 'JFK → FCO, EWR → FCO, BOS → FCO, MIA → MXP',
  },
  {
    id: 'domestic-us',
    title: 'Domestic US',
    region: 'United States',
    image: publicUrl('deals/jfk.jpg'),
    imageAlt: 'New York City skyline',
    lede:
      'Domestic awards are where most travelers start. Short hops, transcons, and Hawaii routes all price differently depending on the program — and cash fares often compete, so compare before you transfer.',
    bestAirlines: [
      { label: 'United Airlines', logo: 'partners/airlines/united.png', accentClass: 'united' },
      { label: 'American Airlines', logo: 'partners/airlines/american-airlines.png', accentClass: 'american' },
      { label: 'Delta Air Lines', logo: 'partners/airlines/delta.png', accentClass: 'delta' },
      { label: 'Southwest', shortLabel: 'WN' },
    ],
    topPrograms:
      'United MileagePlus, Southwest Rapid Rewards (cash-style), JetBlue TrueBlue, and American AAdvantage. Dynamic pricing dominates — always compare your cents-per-point against the cash fare before transferring.',
    sweetSpots: [
      'United saver economy on transcons (JFK–LAX, BOS–SFO) often starts around 12.5k–17.5k one-way.',
      'JetBlue Mint and domestic first can be booked with points when cash fares are high on popular routes.',
      'Southwest points track cash — great for sales, less ideal when cash is already cheap.',
      'American off-peak short hops under 500 miles can price lower than legacy fixed-chart programs.',
    ],
    bookingWindowMatrix: [
      {
        program: 'United MileagePlus',
        calendarOpens: '11 months',
        strategy: 'Filter saver first; set FlightHero alerts on routes you fly monthly.',
      },
      {
        program: 'American AAdvantage',
        calendarOpens: '11 months',
        strategy: 'Web Specials and off-peak dates beat standard dynamic pricing on key transcons.',
      },
      {
        program: 'Southwest Rapid Rewards',
        calendarOpens: 'Rolling (varies)',
        strategy: 'Book when cash drops — points price moves with fare sales automatically.',
      },
    ],
    bookingTips: [
      'Always compare your CPP against the cash fare; domestic awards below 1 cpp are often better paid in cash.',
      'Search nearby airports (EWR vs JFK, OAK vs SFO) — saver space varies by airport even in the same metro.',
      'Set a route alert on FlightHero for routes you fly often so you catch drops without daily searching.',
    ],
    sampleRoutes: 'JFK → LAX, BOS → SFO, ORD → DEN, SEA → HNL',
  },
];

export function getPointsGuideById(id: string): PointsGuideDestination | undefined {
  return POINTS_GUIDE_DESTINATIONS.find((guide) => guide.id === id);
}
