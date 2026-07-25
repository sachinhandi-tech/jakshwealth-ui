import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  computed,
  input,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ChipModule } from '@cigna/cigna_dae_ngui_library/lib/chip';
import { ChipsModule } from '@cigna/cigna_dae_ngui_library/lib/chips';
import { DropdownModule } from '@cigna/cigna_dae_ngui_library/lib/dropdown';
import { TypographyModule } from '@cigna/cigna_dae_ngui_library/lib/typography';

import {
  DEFAULT_UTILIZATION_TIMELINE,
  UtilizationFilterKey,
  UtilizationFilterValues,
  UtilizationTimeline,
  getUtilizationFiltersForTab,
  isUtilizationFilterDisabled,
} from '../utilization-filters.model';
import { UtilizationTabId } from '../utilization.model';

@Component({
  selector: 'app-utilization-filters',
  imports: [FormsModule, ChipModule, ChipsModule, DropdownModule, TypographyModule],
  templateUrl: './utilization-filters.html',
  styleUrl: './utilization-filters.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UtilizationFilters {
  readonly tabId = input.required<UtilizationTabId>();
  readonly timeline = input<UtilizationTimeline>(DEFAULT_UTILIZATION_TIMELINE);
  readonly filterValues = input.required<UtilizationFilterValues>();
  readonly visible = input(false);
  readonly isCollapsed = input(false);
  readonly isNarrow = input(false);

  readonly visibleChange = output<boolean>();
  readonly timelineChange = output<UtilizationTimeline>();
  readonly filterValuesChange = output<UtilizationFilterValues>();

  readonly filters = computed(() => getUtilizationFiltersForTab(this.tabId()));

  @HostBinding('class.utilization-filters-host--collapsed')
  get collapsedHost(): boolean {
    return this.isCollapsed();
  }

  @HostBinding('class.utilization-filters-host--narrow')
  get narrowHost(): boolean {
    return this.isNarrow();
  }

  togglePanel(): void {
    this.visibleChange.emit(!this.visible());
  }

  closePanel(): void {
    this.visibleChange.emit(false);
  }

  isDisabled(filterKey: UtilizationFilterKey): boolean {
    const filter = this.filters().find(item => item.key === filterKey);
    if (!filter) {
      return true;
    }
    return isUtilizationFilterDisabled(filter, this.filterValues());
  }

  onTimelineChange(value: string | number | string[] | number[]): void {
    const resolved = Array.isArray(value) ? value[0] : value;
    if (resolved === 'qr' || resolved === 'mom') {
      this.timelineChange.emit(resolved);
    }
  }

  onFilterChange(key: UtilizationFilterKey, value: string | string[] | null): void {
    const normalized = Array.isArray(value) ? (value[0] ?? null) : value;
    this.filterValuesChange.emit({
      ...this.filterValues(),
      [key]: normalized,
    });
  }
}
