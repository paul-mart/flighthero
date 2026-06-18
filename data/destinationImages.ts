import { extractAirportCode } from '../lib/airportCode';

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=900&q=80';

const IMAGES_BY_CODE: Record<string, string> = {
  HND: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=900&q=80',
  NRT: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=900&q=80',
  CDG: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=900&q=80',
  ORY: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=900&q=80',
  LHR: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=900&q=80',
  LGW: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=900&q=80',
  JFK: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=900&q=80',
  LGA: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=900&q=80',
  EWR: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=900&q=80',
  BOS: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=900&q=80',
  SFO: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=900&q=80',
  LAX: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=900&q=80',
  MIA: 'https://images.unsplash.com/photo-1514214246283-d427a95c5d2f?auto=format&fit=crop&w=900&q=80',
  ORD: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=900&q=80',
  SEA: 'https://images.unsplash.com/photo-1502175353170-46f98599370b4?auto=format&fit=crop&w=900&q=80',
  DEN: 'https://images.unsplash.com/photo-1617854818583-09d7bab81a83?auto=format&fit=crop&w=900&q=80',
  LAS: 'https://images.unsplash.com/photo-1581351721775-1bfd0b8c4c1b?auto=format&fit=crop&w=900&q=80',
  HNL: 'https://images.unsplash.com/photo-1507876466758-bc54f384809c?auto=format&fit=crop&w=900&q=80',
  FCO: 'https://images.unsplash.com/photo-1529260830197-42a241e216c5?auto=format&fit=crop&w=900&q=80',
  MXP: 'https://images.unsplash.com/photo-1529260830197-42a241e216c5?auto=format&fit=crop&w=900&q=80',
  BCN: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=900&q=80',
  MAD: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=900&q=80',
  AMS: 'https://images.unsplash.com/photo-1534351590666-13e9e7450468?auto=format&fit=crop&w=900&q=80',
  FRA: 'https://images.unsplash.com/photo-1467269204514-70f968068fa0?auto=format&fit=crop&w=900&q=80',
  MUC: 'https://images.unsplash.com/photo-1595867818082-083862f3d630?auto=format&fit=crop&w=900&q=80',
  ZRH: 'https://images.unsplash.com/photo-1527661355762-1b9927a34459?auto=format&fit=crop&w=900&q=80',
  GVA: 'https://images.unsplash.com/photo-1527661355762-1b9927a34459?auto=format&fit=crop&w=900&q=80',
  ICN: 'https://images.unsplash.com/photo-1517154423-37a6326900b6?auto=format&fit=crop&w=900&q=80',
  SIN: 'https://images.unsplash.com/photo-1525621483915-b8f036a0af9b?auto=format&fit=crop&w=900&q=80',
  BKK: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=900&q=80',
  SYD: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=900&q=80',
  MEL: 'https://images.unsplash.com/photo-1514395462725-f9a1358238f1?auto=format&fit=crop&w=900&q=80',
  DXB: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=900&q=80',
  DOH: 'https://images.unsplash.com/photo-1558548359-66e3a2377121?auto=format&fit=crop&w=900&q=80',
  IST: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=900&q=80',
  CUN: 'https://images.unsplash.com/photo-1510097469244-898806552ca4?auto=format&fit=crop&w=900&q=80',
  SJU: 'https://images.unsplash.com/photo-1580541631950-7282082b53de?auto=format&fit=crop&w=900&q=80',
  DUB: 'https://images.unsplash.com/photo-1549913073-6eab5cbcd7e4?auto=format&fit=crop&w=900&q=80',
  LIS: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=900&q=80',
  ATH: 'https://images.unsplash.com/photo-1555993537-0e6095a4a7da?auto=format&fit=crop&w=900&q=80',
  YVR: 'https://images.unsplash.com/photo-1559511643-496577a87078?auto=format&fit=crop&w=900&q=80',
  YYZ: 'https://images.unsplash.com/photo-1517935706615-2717063c2225?auto=format&fit=crop&w=900&q=80',
  MEX: 'https://images.unsplash.com/photo-1518659094540-fcfd90ae28a6?auto=format&fit=crop&w=900&q=80',
};

export function getDestinationImage(destinationLabel: string): string {
  const code = extractAirportCode(destinationLabel);
  if (code && IMAGES_BY_CODE[code]) {
    return IMAGES_BY_CODE[code];
  }
  return DEFAULT_IMAGE;
}

export function getDestinationCityLabel(destinationLabel: string): string {
  const trimmed = destinationLabel.trim();
  if (!trimmed) return 'Destination';
  const withoutCode = trimmed.replace(/\s*\([A-Z]{3}\)\s*$/, '').trim();
  return withoutCode || trimmed;
}
