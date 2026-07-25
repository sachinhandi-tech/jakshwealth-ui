import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { TypographyModule } from '@cigna/cigna_dae_ngui_library/lib/typography';

import { AiChatMessage } from '../../ai-chat.model';

@Component({
  selector: 'app-chat-message',
  imports: [TypographyModule],
  templateUrl: './chat-message.html',
  styleUrl: './chat-message.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatMessage {
  readonly message = input.required<AiChatMessage>();
}
