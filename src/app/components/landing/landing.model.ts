import { NavigationCardConfig, NAVIGATION_CARD_MIN_WIDTH } from '../navigation-card/navigation-card.model';

import landingCardsJson from './landing-cards.json';

export const LANDING_CARD_GAP = '1.25rem';
export const LANDING_CARD_MIN_WIDTH = NAVIGATION_CARD_MIN_WIDTH;
export const LANDING_CARD_ASPECT_RATIO = '1.6 / 1';

export const LANDING_CARDS = landingCardsJson as NavigationCardConfig[];

export interface LandingStat {
  value: string;
  label: string;
  color: string;
}

export const LANDING_STATS: LandingStat[] = [
  { value: '500+', label: 'NSE symbols scanned', color: 'var(--jw-cyan)' },
  { value: '80+', label: 'Min score threshold', color: 'var(--jw-purple)' },
  { value: 'Weekly', label: 'HH-HL structure', color: 'var(--jw-pink)' },
  { value: 'RSI', label: 'Cooling filter', color: 'var(--jw-lime)' },
];
