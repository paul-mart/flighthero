export interface TransferGuideDestination {
  id: string;
  destination: string;
  region: string;
  topPrograms: string;
  tip: string;
}

export const TRANSFER_GUIDE_DESTINATIONS: TransferGuideDestination[] = [
  {
    id: 'europe',
    destination: 'Europe',
    region: 'Transatlantic',
    topPrograms: 'Flying Blue, Aeroplan, Avios',
    tip: 'East Coast departures often price lowest in Flying Blue or Aer Lingus Avios during shoulder season.',
  },
  {
    id: 'japan',
    destination: 'Japan',
    region: 'Asia-Pacific',
    topPrograms: 'ANA via Amex, United MileagePlus, Virgin Atlantic',
    tip: 'Watch for ANA partner awards from the US — they can beat direct program pricing when space opens.',
  },
  {
    id: 'caribbean',
    destination: 'Caribbean & Mexico',
    region: 'Americas',
    topPrograms: 'JetBlue TrueBlue, United MileagePlus, Aeroplan',
    tip: 'Short-haul awards from Florida and the Northeast frequently start under 15k points one-way.',
  },
  {
    id: 'middle-east',
    destination: 'Middle East',
    region: 'Long-haul premium',
    topPrograms: 'Emirates Skywards, Turkish Miles&Smiles, Aeroplan',
    tip: 'Compare Emirates direct pricing against Star Alliance routings through IST or via partner metal.',
  },
];
