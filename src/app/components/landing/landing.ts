import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import { NavigationCard } from '../navigation-card/navigation-card';
import { NavigationCardConfig } from '../navigation-card/navigation-card.model';

import {
  LANDING_CARD_ASPECT_RATIO,
  LANDING_CARD_GAP,
  LANDING_CARD_MIN_WIDTH,
  LANDING_CARDS,
  LANDING_STATS,
} from './landing.model';

@Component({
  selector: 'app-landing',
  imports: [NavigationCard, RouterModule],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Landing {
  private readonly router = inject(Router);

  readonly cards = LANDING_CARDS;
  readonly stats = LANDING_STATS;
  readonly cardMinWidth = LANDING_CARD_MIN_WIDTH;
  readonly cardGap = LANDING_CARD_GAP;
  readonly cardAspectRatio = LANDING_CARD_ASPECT_RATIO;

  onCardSelect(card: NavigationCardConfig): void {
    void this.router.navigate([card.route]);
  }
}
