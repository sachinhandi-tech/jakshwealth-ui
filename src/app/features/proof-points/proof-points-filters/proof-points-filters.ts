import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  input,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ChipModule } from '@cigna/cigna_dae_ngui_library/lib/chip';
import { ChipsModule } from '@cigna/cigna_dae_ngui_library/lib/chips';
import { DropdownModule } from '@cigna/cigna_dae_ngui_library/lib/dropdown';
import { TypographyModule } from '@cigna/cigna_dae_ngui_library/lib/typography';

import {
  DEFAULT_PROOF_POINT_TIMELINE,
  PROOF_POINT_FILTERS,
  ProofPointFilterKey,
  ProofPointFilterValues,
  ProofPointTimeline,
} from '../proof-points-filters.model';

@Component({
  selector: 'app-proof-points-filters',
  imports: [
    FormsModule,
    ChipModule,
    ChipsModule,
    DropdownModule,
    TypographyModule,
  ],
  templateUrl: './proof-points-filters.html',
  styleUrl: './proof-points-filters.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProofPointsFilters {
  readonly timeline = input<ProofPointTimeline>(DEFAULT_PROOF_POINT_TIMELINE);
  readonly filterValues = input.required<ProofPointFilterValues>();
  readonly visible = input(false);
  readonly isCollapsed = input(false);
  readonly isNarrow = input(false);

  readonly visibleChange = output<boolean>();
  readonly timelineChange = output<ProofPointTimeline>();
  readonly filterValuesChange = output<ProofPointFilterValues>();

  readonly filters = PROOF_POINT_FILTERS;

  @HostBinding('class.proof-points-filters-host--collapsed')
  get collapsedHost(): boolean {
    return this.isCollapsed();
  }

  @HostBinding('class.proof-points-filters-host--narrow')
  get narrowHost(): boolean {
    return this.isNarrow();
  }

  togglePanel(): void {
    this.visibleChange.emit(!this.visible());
  }

  closePanel(): void {
    this.visibleChange.emit(false);
  }

  onTimelineChange(value: string | number | string[] | number[]): void {
    const resolved = Array.isArray(value) ? value[0] : value;
    if (resolved === 'ytd' || resolved === 'yoy') {
      this.timelineChange.emit(resolved);
    }
  }

  onFilterChange(key: ProofPointFilterKey, value: string | string[] | null): void {
    const normalized = Array.isArray(value) ? value : value ? [value] : [];
    this.filterValuesChange.emit({
      ...this.filterValues(),
      [key]: normalized,
    });
  }
}
