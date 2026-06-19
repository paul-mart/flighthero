import { extractAirportCode } from '../lib/airportCode';

const DEFAULT_IMAGE = '/deals/default.jpg';

const LOCAL_IMAGES_BY_CODE: Record<string, string> = {
  CDG: '/deals/cdg.jpg',
  ORY: '/deals/cdg.jpg',
  LHR: '/deals/lhr.jpg',
  LGW: '/deals/lhr.jpg',
  DUB: '/deals/dub.jpg',
  FCO: '/deals/fco.jpg',
  MXP: '/deals/fco.jpg',
  HND: '/deals/hnd.jpg',
  NRT: '/deals/hnd.jpg',
  ICN: '/deals/icn.jpg',
  SYD: '/deals/syd.jpg',
  SIN: '/deals/sin.jpg',
  SJU: '/deals/sju.jpg',
  CUN: '/deals/cun.jpg',
  LIS: '/deals/lis.jpg',
  MEX: '/deals/mex.jpg',
};

export function getDestinationImage(destinationLabel: string): string {
  const code = extractAirportCode(destinationLabel);
  if (code && LOCAL_IMAGES_BY_CODE[code]) {
    return LOCAL_IMAGES_BY_CODE[code];
  }
  return DEFAULT_IMAGE;
}

export function getDestinationCityLabel(destinationLabel: string): string {
  const trimmed = destinationLabel.trim();
  if (!trimmed) return 'Destination';
  const withoutCode = trimmed.replace(/\s*\([A-Z]{3}\)\s*$/, '').trim();
  return withoutCode || trimmed;
}
