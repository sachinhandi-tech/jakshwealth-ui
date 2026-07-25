import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { TypographyModule } from '@cigna/cigna_dae_ngui_library/lib/typography';

import { AiChatTableColumn } from '../../ai-chat.model';

@Component({
  selector: 'app-chat-table',
  imports: [TypographyModule],
  templateUrl: './chat-table.html',
  styleUrl: './chat-table.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatTable {
  readonly title = input<string | undefined>();
  readonly columns = input.required<AiChatTableColumn[]>();
  readonly rows = input.required<Record<string, unknown>[]>();

  cellValue(row: Record<string, unknown>, key: string): string {
    const value = row[key];
    if (value === null || value === undefined) {
      return '';
    }
    return String(value);
  }
}
