import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { ProofPointsCharts } from '../proof-points-charts/proof-points-charts';
import { ProofPointChartConfig } from '../proof-points-charts-api.model';
import {
  DEFAULT_PROOF_POINT_TIMELINE,
  createEmptyProofPointFilterValues,
} from '../proof-points-filters.model';
import { ProofPointsFilters } from '../proof-points-filters/proof-points-filters';
import { ProofPointsViews } from '../proof-points-views/proof-points-views';
import { ProofPointsChartsService } from '../services/proof-points-charts.service';
import {
  PROOF_POINTS_COLLAPSED_STRIP_WIDTH,
  PROOF_POINTS_DASHBOARD,
  PROOF_POINTS_FILTERS_COLLAPSE_BREAKPOINT_PX,
  PROOF_POINTS_NARROW_BREAKPOINT_PX,
  PROOF_POINTS_SIDEBAR_WIDTH,
  PROOF_POINTS_VIEWS_COLLAPSE_BREAKPOINT_PX,
  ProofPointDesignation,
  ProofPointViewItem,
} from '../proof-points.model';

@Component({
  selector: 'app-proof-points-tab',
  imports: [ProofPointsCharts, ProofPointsFilters, ProofPointsViews],
  templateUrl: './proof-points-tab.html',
  styleUrl: './proof-points-tab.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProofPointsTab {
  private readonly destroyRef = inject(DestroyRef);
  private readonly chartsService = inject(ProofPointsChartsService);

  readonly designation = input.required<ProofPointDesignation>();
  readonly views = input.required<ProofPointViewItem[]>();

  readonly selectedViewId = signal<string | null>(null);
  readonly timeline = signal(DEFAULT_PROOF_POINT_TIMELINE);
  readonly filterValues = signal(createEmptyProofPointFilterValues());
  readonly leftPanelVisible = signal(false);
  readonly rightPanelVisible = signal(false);
  readonly charts = signal<ProofPointChartConfig[]>([]);
  readonly chartsLoading = signal(false);
  readonly chartsError = signal<string | null>(null);

  readonly isNarrow = signal(this.matchesNarrowViewport());
  readonly isViewsCollapsed = signal(this.matchesViewsCollapsedViewport());
  readonly isFiltersCollapsed = signal(this.matchesFiltersCollapsedViewport());
  readonly sidebarWidth = PROOF_POINTS_SIDEBAR_WIDTH;
  readonly stripWidth = PROOF_POINTS_COLLAPSED_STRIP_WIDTH;

  readonly activeViewId = computed(() => {
    const items = this.views();
    const selected = this.selectedViewId();
    if (selected && items.some(view => view.id === selected)) {
      return selected;
    }
    return items[0]?.id ?? '';
  });

  readonly activeViewLabel = computed(() => {
    return this.views().find(view => view.id === this.activeViewId())?.label ?? '';
  });

  private readonly chartsRequest = computed(() => ({
    dashboard: PROOF_POINTS_DASHBOARD,
    designation: this.designation(),
    viewId: this.activeViewId(),
    timeline: this.timeline(),
    filters: this.filterValues(),
  }));

  constructor() {
    effect(onCleanup => {
      const request = this.chartsRequest();
      if (!request.viewId) {
        this.charts.set([]);
        return;
      }

      this.chartsLoading.set(true);
      this.chartsError.set(null);

      const subscription = this.chartsService.getCharts(request).subscribe({
        next: response => {
          this.charts.set(response.charts);
          this.chartsLoading.set(false);
        },
        error: () => {
          this.charts.set([]);
          this.chartsError.set('Unable to load charts. Please try again.');
          this.chartsLoading.set(false);
        },
      });

      onCleanup(() => subscription.unsubscribe());
    });

    fromEvent<MediaQueryListEvent>(
      window.matchMedia(`(max-width: ${PROOF_POINTS_VIEWS_COLLAPSE_BREAKPOINT_PX}px)`),
      'change',
    )
      .pipe(
        map(event => event.matches),
        startWith(this.matchesViewsCollapsedViewport()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(isViewsCollapsed => {
        this.isViewsCollapsed.set(isViewsCollapsed);
        if (isViewsCollapsed) {
          this.leftPanelVisible.set(false);
        }
      });

    fromEvent<MediaQueryListEvent>(
      window.matchMedia(`(max-width: ${PROOF_POINTS_FILTERS_COLLAPSE_BREAKPOINT_PX}px)`),
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
      window.matchMedia(`(max-width: ${PROOF_POINTS_NARROW_BREAKPOINT_PX}px)`),
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
          this.leftPanelVisible.set(false);
          this.rightPanelVisible.set(false);
        }
      });
  }

  onLeftPanelVisibleChange(visible: boolean): void {
    if (visible) {
      this.rightPanelVisible.set(false);
    }
    this.leftPanelVisible.set(visible);
  }

  onRightPanelVisibleChange(visible: boolean): void {
    if (visible) {
      this.leftPanelVisible.set(false);
    }
    this.rightPanelVisible.set(visible);
  }

  closeAllPanels(): void {
    this.leftPanelVisible.set(false);
    this.rightPanelVisible.set(false);
  }

  onViewChange(viewId: string): void {
    this.selectedViewId.set(viewId);
  }

  private matchesNarrowViewport(): boolean {
    return window.matchMedia(`(max-width: ${PROOF_POINTS_NARROW_BREAKPOINT_PX}px)`).matches;
  }

  private matchesViewsCollapsedViewport(): boolean {
    return window.matchMedia(`(max-width: ${PROOF_POINTS_VIEWS_COLLAPSE_BREAKPOINT_PX}px)`)
      .matches;
  }

  private matchesFiltersCollapsedViewport(): boolean {
    return window.matchMedia(`(max-width: ${PROOF_POINTS_FILTERS_COLLAPSE_BREAKPOINT_PX}px)`)
      .matches;
  }
}
