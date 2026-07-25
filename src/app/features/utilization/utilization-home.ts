import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

import { TabsModule } from '@cigna/cigna_dae_ngui_library/lib/tabs';
import { TypographyModule } from '@cigna/cigna_dae_ngui_library/lib/typography';

import { DEFAULT_UTILIZATION_TAB, UTILIZATION_TABS } from './utilization.model';

@Component({
  selector: 'app-utilization-home',
  imports: [RouterOutlet, TabsModule, TypographyModule],
  templateUrl: './utilization-home.html',
  styleUrl: './utilization-home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UtilizationHome {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly tabItems = UTILIZATION_TABS.map(tab => ({ label: tab.label, id: tab.path }));

  private readonly activeSegment = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.currentSegment()),
      startWith(this.currentSegment()),
    ),
    { initialValue: this.currentSegment() },
  );

  readonly activeIndex = computed(() => {
    const index = UTILIZATION_TABS.findIndex(tab => tab.path === this.activeSegment());
    return index >= 0 ? index : 0;
  });

  onTabChange(index: number | number[]): void {
    const resolvedIndex = Array.isArray(index) ? index[0] : index;
    const path = UTILIZATION_TABS[resolvedIndex]?.path ?? DEFAULT_UTILIZATION_TAB;
    void this.router.navigate([path], { relativeTo: this.route });
  }

  private currentSegment(): string {
    return this.route.firstChild?.snapshot.url[0]?.path ?? DEFAULT_UTILIZATION_TAB;
  }
}
