import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { TypographyModule } from '@cigna/cigna_dae_ngui_library/lib/typography';

@Component({
  selector: 'app-utilization-content',
  imports: [TypographyModule],
  templateUrl: './utilization-content.html',
  styleUrl: './utilization-content.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UtilizationContent {
  readonly title = input.required<string>();
  readonly description = input.required<string>();
  readonly loading = input(false);
  readonly error = input<string | null>(null);
}
