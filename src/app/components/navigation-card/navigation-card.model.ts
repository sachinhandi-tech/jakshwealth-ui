/** Config for a clickable dashboard navigation card. */
export interface NavigationCardConfig {
  icon: string;
  title: string;
  description: string;
  actionLabel: string;
  route: string;
  accent?: 'cyan' | 'purple' | 'pink' | 'lime' | 'amber';
  badge?: string;
}

/** Default height : width = 1 : 2.1 → CSS aspect-ratio is width / height. */
export const NAVIGATION_CARD_ASPECT_RATIO = '2.1 / 1';

/** Minimum card width; cards do not shrink below this on any viewport. */
export const NAVIGATION_CARD_MIN_WIDTH = '320px';
