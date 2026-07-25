import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { NavigationCardConfig } from './navigation-card.model';

const ICON_MAP: Record<string, string> = {
  radar: '📡',
  trending_up: '📈',
  insights: '💡',
  analytics: '📊',
};

@Component({
  selector: 'app-navigation-card',
  templateUrl: './navigation-card.html',
  styleUrl: './navigation-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavigationCard {
  readonly card = input.required<NavigationCardConfig>();
  readonly cardSelect = output<NavigationCardConfig>();

  readonly iconEmoji = computed(() => ICON_MAP[this.card().icon] ?? '✨');

  onCardClick(): void {
    this.cardSelect.emit(this.card());
  }
}
