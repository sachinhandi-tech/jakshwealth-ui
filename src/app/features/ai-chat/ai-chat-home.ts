import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';

import { ButtonModule } from '@cigna/cigna_dae_ngui_library/lib/button';
import { TypographyModule } from '@cigna/cigna_dae_ngui_library/lib/typography';

import { AppConfigService } from '../../services/app-config/app-config.service';
import { AiChatMessage } from './ai-chat.model';
import { ChatChart } from './components/chat-chart/chat-chart';
import { ChatMessage } from './components/chat-message/chat-message';
import { ChatTable } from './components/chat-table/chat-table';
import { AiChatService } from './services/ai-chat.service';
import { createErrorMessage, createUserMessage } from './utils/chat-response-mapper';

@Component({
  selector: 'app-ai-chat-home',
  imports: [
    ButtonModule,
    TypographyModule,
    ChatMessage,
    ChatTable,
    ChatChart,
  ],
  templateUrl: './ai-chat-home.html',
  styleUrl: './ai-chat-home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiChatHome {
  private readonly aiChat = inject(AiChatService);
  private readonly appConfig = inject(AppConfigService);

  readonly messages = signal<AiChatMessage[]>([]);
  readonly prompt = signal('');
  readonly loading = signal(false);
  readonly useLiveData = signal(false);
  readonly featureReady = signal(false);
  readonly featureError = signal<string | null>(null);

  readonly canSend = computed(
    () => this.featureReady() && this.prompt().trim().length > 0 && !this.loading(),
  );

  readonly sendLabel = computed(() => (this.loading() ? 'Thinking…' : 'Send'));

  constructor() {
    this.appConfig.getConfig().subscribe({
      next: config => {
        if (config.enableAiChat !== true) {
          this.featureError.set(
            'AI chat is not enabled for this environment. Set ENABLE_AI_CHAT in the SSA secret, or in config.local.json for local development.',
          );
          return;
        }
        if (config.features?.['aiChat'] === true) {
          this.featureReady.set(true);
          this.featureError.set(null);
          return;
        }
        this.featureError.set(
          'AI chat is disabled. An administrator can enable it from the Admin page.',
        );
      },
      error: () => {
        this.featureError.set('Unable to load application configuration.');
      },
    });
  }

  onPromptInput(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.prompt.set(value);
  }

  onPromptKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendPrompt();
    }
  }

  onLiveDataChange(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.useLiveData.set(checked);
  }

  sendPrompt(): void {
    const text = this.prompt().trim();
    if (!text || this.loading() || !this.featureReady()) {
      return;
    }

    this.messages.update(items => [...items, createUserMessage(text)]);
    this.prompt.set('');
    this.loading.set(true);

    this.aiChat
      .sendPrompt({
        prompt: text,
        useLiveData: this.useLiveData(),
      })
      .subscribe({
        next: response => {
          this.messages.update(items => [...items, response]);
          this.loading.set(false);
        },
        error: error => {
          const message =
            typeof error?.error?.message === 'string'
              ? error.error.message
              : 'Unable to complete the chat request.';
          this.messages.update(items => [...items, createErrorMessage(message)]);
          this.loading.set(false);
        },
      });
  }
}
