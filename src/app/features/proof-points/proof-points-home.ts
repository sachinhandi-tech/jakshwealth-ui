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

import { DEFAULT_PROOF_POINTS_TAB, PROOF_POINTS_TABS } from './proof-points.model';

@Component({
  selector: 'app-proof-points-home',
  imports: [RouterOutlet, TabsModule, TypographyModule],
  templateUrl: './proof-points-home.html',
  styleUrl: './proof-points-home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProofPointsHome {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly tabItems = PROOF_POINTS_TABS.map(tab => ({ label: tab.label, id: tab.path }));

  private readonly activeSegment = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.currentSegment()),
      startWith(this.currentSegment()),
    ),
    { initialValue: this.currentSegment() },
  );

  readonly activeIndex = computed(() => {
    const index = PROOF_POINTS_TABS.findIndex(tab => tab.path === this.activeSegment());
    return index >= 0 ? index : 0;
  });

  onTabChange(index: number | number[]): void {
    const resolvedIndex = Array.isArray(index) ? index[0] : index;
    const path = PROOF_POINTS_TABS[resolvedIndex]?.path ?? DEFAULT_PROOF_POINTS_TAB;
    void this.router.navigate([path], { relativeTo: this.route });
  }

  private currentSegment(): string {
    return this.route.firstChild?.snapshot.url[0]?.path ?? DEFAULT_PROOF_POINTS_TAB;
  }
}
