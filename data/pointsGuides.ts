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
      'Tokyo is a favorite award destination from the US. Business class can be a solid use of bank points if you know which programs to search and when to transfer.',
    bestAirlines: [
      { label: 'All Nippon Airways', logo: 'partners/airlines/ana.png', accentClass: 'ana' },
      { label: 'Japan Airlines', logo: 'partners/airlines/japan-airlines.png', accentClass: 'jal' },
      { label: 'United Airlines', logo: 'partners/airlines/united.png', accentClass: 'united' },
      { label: 'Air Canada Aeroplan', logo: 'partners/airlines/air-canada.png', accentClass: 'air-canada' },
    ],
    topPrograms:
      'ANA Mileage Club (via Amex and other partners), United MileagePlus, Virgin Atlantic Flying Club, and Aeroplan for Star Alliance connections. Each program prices Tokyo differently, so compare total miles and surcharges before you move bank points.',
    sweetSpots: [
      'ANA round-trip business from the US West Coast often starts around 88k-95k miles when partner space opens on ANA metal.',
      'United saver business to Tokyo (HND/NRT) can show up at 88k round trip. Check ANA before you transfer.',
      'Virgin Atlantic sometimes prices Japan in premium cabins below the operating carrier when award charts line up.',
      'Book Star Alliance partners through Aeroplan when United surcharges or dynamic pricing jump on the same flight.',
    ],
    bookingWindowMatrix: [
      {
        program: 'ANA Mileage Club',
        calendarOpens: '355 days (partner awards)',
        strategy: 'Search both HND and NRT. Partner awards often release in weekly batches.',
      },
      {
        program: 'United MileagePlus',
        calendarOpens: '11 months',
        strategy: 'Filter for saver awards first. Set alerts 330+ days out for peak cherry-blossom dates.',
      },
      {
        program: 'Virgin Atlantic',
        calendarOpens: '330 days',
        strategy: 'Check ANA and JAL partner space before transferring Amex or Chase points.',
      },
    ],
    bookingTips: [
      'Start searching 11 months out for ANA and United. Last-minute space happens, but it is harder to plan around.',
      'Tokyo has two airports (HND and NRT). Search both when you build a route.',
      'After your long-haul award lands, domestic hops within Japan are often cheap on cash or LCC fares.',
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
      'London is the busiest transatlantic award market from the US East Coast. Several alliances serve Heathrow and Gatwick, so it pays to compare programs before you transfer.',
    bestAirlines: [
      { label: 'British Airways', logo: 'partners/airlines/british-airways.png', accentClass: 'british-airways' },
      { label: 'Virgin Atlantic', shortLabel: 'VS' },
      { label: 'United Airlines', logo: 'partners/airlines/united.png', accentClass: 'united' },
      { label: 'American Airlines', logo: 'partners/airlines/american-airlines.png', accentClass: 'american' },
    ],
    topPrograms:
      'British Airways Avios, Aer Lingus Avios, Virgin Atlantic Flying Club, Flying Blue, and United MileagePlus. Avios uses distance-based pricing on short hops. Watch fuel surcharges on BA metal into LHR.',
    sweetSpots: [
      'Avios off-peak economy from the US Northeast to London can price under 20k one-way on some dates.',
      'Aer Lingus business via Dublin can beat direct BA pricing if you do not mind a connection.',
      'Virgin Atlantic often has good premium cabin space to London when booked far in advance.',
      'Off-peak Avios from East Coast cities to LGW can beat dynamic programs on the same nonstops.',
    ],
    bookingWindowMatrix: [
      {
        program: 'British Airways Avios',
        calendarOpens: '355 days',
        strategy: 'Compare LHR vs LGW. Partner awards on AA/IB metal can avoid peak BA surcharges.',
      },
      {
        program: 'Virgin Atlantic',
        calendarOpens: '330 days',
        strategy: 'Delta and VS nonstops release early. Transfer Amex or Chase only after you see space.',
      },
      {
        program: 'United MileagePlus',
        calendarOpens: '11 months',
        strategy: 'Saver business to LHR is competitive. Add a positioning flight if EWR/BOS is sold out.',
      },
    ],
    bookingTips: [
      'Heathrow (LHR) often carries high surcharges. Compare Gatwick (LGW) and Dublin (DUB) routings.',
      'Taxes and fees vary a lot by program. Compare total out-of-pocket cost, not just the miles.',
      'Shoulder season (March-May, September-October) usually has the best mix of space and value.',
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
      'Paris is a core Flying Blue destination and a common target for SkyTeam and Star Alliance awards. CDG and ORY both matter depending on your program and routing.',
    bestAirlines: [
      { label: 'Air France', shortLabel: 'AF' },
      { label: 'Delta Air Lines', logo: 'partners/airlines/delta.png', accentClass: 'delta' },
      { label: 'United Airlines', logo: 'partners/airlines/united.png', accentClass: 'united' },
      { label: 'Air Canada', logo: 'partners/airlines/air-canada.png', accentClass: 'air-canada' },
    ],
    topPrograms:
      'Flying Blue (Air France/KLM), Virgin Atlantic, United MileagePlus, and Aeroplan. Flying Blue Promo Rewards are the main sale to watch. Star Alliance options add backup space via Swiss, Lufthansa, or United.',
    sweetSpots: [
      'Flying Blue Promo Rewards can cut Paris business class by 25% or more during monthly sales.',
      'Off-peak Flying Blue economy from the US to CDG often starts in the low 20k-30k range one-way.',
      'United and Aeroplan can surface Star Alliance space on Lufthansa, Swiss, or United metal into Paris.',
      'Virgin Atlantic Delta partner awards occasionally beat Flying Blue on the same SkyTeam flights.',
    ],
    bookingWindowMatrix: [
      {
        program: 'Flying Blue',
        calendarOpens: '10-11 months',
        strategy: 'Watch monthly Promo Rewards. Book quickly when a Paris route drops.',
      },
      {
        program: 'United MileagePlus',
        calendarOpens: '11 months',
        strategy: 'Search CDG and ORY. Star Alliance partners fill gaps when AF is waitlisted.',
      },
      {
        program: 'Virgin Atlantic',
        calendarOpens: '330 days',
        strategy: 'Use for Delta nonstops or AF partner space when Amex transfer bonuses are live.',
      },
    ],
    bookingTips: [
      'Flying Blue runs Promo Rewards every month. They are worth watching if Paris is on your list.',
      'Open-jaw tickets (fly into Paris, out of another city) can save miles on a longer Europe trip.',
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
      'Mexico is one of the easier award wins from the US: short flights, frequent space, and several programs price Mexico City and beach destinations at low mileage levels.',
    bestAirlines: [
      { label: 'United Airlines', logo: 'partners/airlines/united.png', accentClass: 'united' },
      { label: 'Delta Air Lines', logo: 'partners/airlines/delta.png', accentClass: 'delta' },
      { label: 'Aeroméxico', shortLabel: 'AM' },
      { label: 'American Airlines', logo: 'partners/airlines/american-airlines.png', accentClass: 'american' },
    ],
    topPrograms:
      'United MileagePlus, Aeroplan, JetBlue TrueBlue, and Flying Blue for Aeromexico and partners. Short-haul pricing stretches modest point balances, but cash fares are often cheap, so run the math before you transfer.',
    sweetSpots: [
      'United saver economy to Mexico City (MEX) or Cancun (CUN) often starts around 17.5k-22k one-way.',
      'JetBlue points can work well for nonstops from Florida and the Northeast when cash fares jump.',
      'Aeroplan sometimes prices short-haul Star Alliance awards to Mexico below United on the same metal.',
      'Flying Blue Aeromexico partner awards can beat Delta pricing during Promo Rewards windows.',
    ],
    bookingWindowMatrix: [
      {
        program: 'United MileagePlus',
        calendarOpens: '11 months',
        strategy: 'Saver space is common. Book winter beach dates early; midweek departures help.',
      },
      {
        program: 'Aeroplan',
        calendarOpens: '355 days',
        strategy: 'Search the same United flights. Fixed partner pricing can win on short hops.',
      },
      {
        program: 'Flying Blue',
        calendarOpens: '10-11 months',
        strategy: 'Use for Aeromexico metal. Stack Promo Rewards for CUN and MEX peak weeks.',
      },
    ],
    bookingTips: [
      'Beach destinations (CUN, PVR, SJD) peak during US holidays. Book early for winter and spring break.',
      'Mexico City works well as a hub for deeper Latin America connections on cash or separate awards.',
      'Check both United and Aeroplan for the same flight. Pricing can differ on identical segments.',
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
      'Rome and Milan anchor most US-Italy award searches. Premium cabin space is tighter than London or Paris, but economy and premium economy can be good values in shoulder season.',
    bestAirlines: [
      { label: 'ITA Airways', shortLabel: 'ITA' },
      { label: 'Delta Air Lines', logo: 'partners/airlines/delta.png', accentClass: 'delta' },
      { label: 'United Airlines', logo: 'partners/airlines/united.png', accentClass: 'united' },
      { label: 'Emirates', logo: 'partners/airlines/emirates.png', accentClass: 'emirates' },
    ],
    topPrograms:
      'Flying Blue, United MileagePlus, Aeroplan, and Virgin Atlantic for Delta and partner space. Italy rewards flexibility. Alternate airports and open-jaw trips can unlock space other travelers miss.',
    sweetSpots: [
      'Flying Blue to FCO or MXP during Promo Rewards can undercut other programs by a wide margin.',
      'United saver economy to Rome often prices around 30k one-way from the East Coast when space opens.',
      'Milan (MXP) sometimes has better business availability than Rome on SkyTeam carriers.',
      'Emirates fifth-freedom or connecting awards via DXB can appear when direct Star Alliance space is gone.',
    ],
    bookingWindowMatrix: [
      {
        program: 'Flying Blue',
        calendarOpens: '10-11 months',
        strategy: 'Target Promo Rewards for FCO/MXP. Book within hours of the monthly release.',
      },
      {
        program: 'United MileagePlus',
        calendarOpens: '11 months',
        strategy: 'Search FCO, MXP, VCE, and NAP. Saver economy is the most reliable tier.',
      },
      {
        program: 'Virgin Atlantic',
        calendarOpens: '330 days',
        strategy: 'Check Delta nonstops to Rome and Milan before transferring bank points.',
      },
    ],
    bookingTips: [
      'If Rome is sold out, search Venice (VCE), Milan (MXP), or Naples (NAP) and connect by train.',
      'Summer peak (June-August) is the hardest window. April-May and late September are easier.',
      'Compare total taxes. ITA Airways and legacy Alitalia routes can carry different fee structures.',
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
      'Domestic awards are where most travelers start. Short hops, transcons, and Hawaii routes all price differently by program, and cash fares often compete, so compare before you transfer.',
    bestAirlines: [
      { label: 'United Airlines', logo: 'partners/airlines/united.png', accentClass: 'united' },
      { label: 'American Airlines', logo: 'partners/airlines/american-airlines.png', accentClass: 'american' },
      { label: 'Delta Air Lines', logo: 'partners/airlines/delta.png', accentClass: 'delta' },
      { label: 'Southwest', shortLabel: 'WN' },
    ],
    topPrograms:
      'United MileagePlus, Southwest Rapid Rewards, JetBlue TrueBlue, and American AAdvantage. Dynamic pricing is the norm. Compare cents per point against the cash fare before you transfer.',
    sweetSpots: [
      'United saver economy on transcons (JFK-LAX, BOS-SFO) often starts around 12.5k-17.5k one-way.',
      'JetBlue Mint and domestic first can make sense with points when cash fares run high on popular routes.',
      'Southwest points track cash. Great for sales, less useful when cash is already cheap.',
      'American off-peak short hops under 500 miles can price below legacy fixed-chart programs.',
    ],
    bookingWindowMatrix: [
      {
        program: 'United MileagePlus',
        calendarOpens: '11 months',
        strategy: 'Filter saver first. Set alerts on routes you fly often.',
      },
      {
        program: 'American AAdvantage',
        calendarOpens: '11 months',
        strategy: 'Web Specials and off-peak dates beat standard dynamic pricing on key transcons.',
      },
      {
        program: 'Southwest Rapid Rewards',
        calendarOpens: 'Rolling (varies)',
        strategy: 'Book when cash drops. Points price moves with fare sales automatically.',
      },
    ],
    bookingTips: [
      'Compare cents per point against the cash fare. Domestic awards below 1 cpp are often better paid in cash.',
      'Search nearby airports (EWR vs JFK, OAK vs SFO). Saver space varies by airport even in the same metro.',
      'Set a route alert for trips you repeat so you catch drops without searching every day.',
    ],
    sampleRoutes: 'JFK → LAX, BOS → SFO, ORD → DEN, SEA → HNL',
  },
];

export function getPointsGuideById(id: string): PointsGuideDestination | undefined {
  return POINTS_GUIDE_DESTINATIONS.find((guide) => guide.id === id);
}
