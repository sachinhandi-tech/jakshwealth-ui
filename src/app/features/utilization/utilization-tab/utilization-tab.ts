import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { TypographyModule } from '@cigna/cigna_dae_ngui_library/lib/typography';

import { FunnelChart } from '../funnel-chart/funnel-chart';
import { TIERED_MEMBERSHIP_FUNNEL_CHART } from '../funnel-chart/funnel-chart.model';
import {
  DEFAULT_UTILIZATION_TIMELINE,
  createDefaultUtilizationFilterValues,
} from '../utilization-filters.model';
import { UtilizationFilters } from '../utilization-filters/utilization-filters';
import { UtilizationContent } from '../utilization-content/utilization-content';
import {
  UTILIZATION_COLLAPSED_STRIP_WIDTH,
  UTILIZATION_FILTERS_COLLAPSE_BREAKPOINT_PX,
  UTILIZATION_FILTERS_WIDTH,
  UTILIZATION_NARROW_BREAKPOINT_PX,
  UtilizationTabId,
} from '../utilization.model';

@Component({
  selector: 'app-utilization-tab',
  imports: [FunnelChart, UtilizationContent, UtilizationFilters, TypographyModule],
  templateUrl: './utilization-tab.html',
  styleUrl: './utilization-tab.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UtilizationTab {
  private readonly destroyRef = inject(DestroyRef);

  readonly tabId = input.required<UtilizationTabId>();
  readonly title = input.required<string>();
  readonly description = input.required<string>();

  readonly timeline = signal(DEFAULT_UTILIZATION_TIMELINE);
  readonly filterValues = signal(createDefaultUtilizationFilterValues());
  readonly rightPanelVisible = signal(false);

  readonly isNarrow = signal(this.matchesNarrowViewport());
  readonly isFiltersCollapsed = signal(this.matchesFiltersCollapsedViewport());
  readonly filtersWidth = UTILIZATION_FILTERS_WIDTH;
  readonly stripWidth = UTILIZATION_COLLAPSED_STRIP_WIDTH;
  readonly tieredMembershipChart = TIERED_MEMBERSHIP_FUNNEL_CHART;

  constructor() {
    fromEvent<MediaQueryListEvent>(
      window.matchMedia(`(max-width: ${UTILIZATION_FILTERS_COLLAPSE_BREAKPOINT_PX}px)`),
      'change',
    )
      .pipe(
        map(event => event.matches),
        startWith(this.matchesFiltersCollapsedViewport()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(isFiltersCollapsed => {
        this.isFiltersCollapsed.set(isFiltersCollapsed);
        if (isFiltersCollapsed) {
          this.rightPanelVisible.set(false);
        }
      });

    fromEvent<MediaQueryListEvent>(
      window.matchMedia(`(max-width: ${UTILIZATION_NARROW_BREAKPOINT_PX}px)`),
      'change',
    )
      .pipe(
        map(event => event.matches),
        startWith(this.matchesNarrowViewport()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(isNarrow => {
        this.isNarrow.set(isNarrow);
        if (isNarrow) {
          this.rightPanelVisible.set(false);
        }
      });
  }

  onRightPanelVisibleChange(visible: boolean): void {
    this.rightPanelVisible.set(visible);
  }

  closeFiltersPanel(): void {
    this.rightPanelVisible.set(false);
  }

  private matchesNarrowViewport(): boolean {
    return window.matchMedia(`(max-width: ${UTILIZATION_NARROW_BREAKPOINT_PX}px)`).matches;
  }

  private matchesFiltersCollapsedViewport(): boolean {
    return window.matchMedia(`(max-width: ${UTILIZATION_FILTERS_COLLAPSE_BREAKPOINT_PX}px)`)
      .matches;
  }
}
