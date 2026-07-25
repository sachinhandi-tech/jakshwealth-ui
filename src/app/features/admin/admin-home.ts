import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from '@cigna/cigna_dae_ngui_library/lib/button';
import { TypographyModule } from '@cigna/cigna_dae_ngui_library/lib/typography';

import { AppConfigService } from '../../services/app-config/app-config.service';
import { AdminService } from './services/admin.service';

@Component({
  selector: 'app-admin-home',
  imports: [FormsModule, ButtonModule, TypographyModule],
  templateUrl: './admin-home.html',
  styleUrl: './admin-home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminHome {
  private readonly adminService = inject(AdminService);
  private readonly appConfig = inject(AppConfigService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly aiChatEnabled = signal(false);
  readonly platformAiChatEnabled = signal(false);
  readonly statusMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly canManageAiChat = computed(() => this.platformAiChatEnabled());

  constructor() {
    this.adminService.getAdminArea().subscribe({
      next: response => {
        this.platformAiChatEnabled.set(response.enableAiChat === true);
        this.aiChatEnabled.set(response.features.aiChat === true);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Unable to load admin settings.');
        this.loading.set(false);
      },
    });
  }

  saveAiChatSetting(): void {
    if (!this.canManageAiChat()) {
      return;
    }

    this.saving.set(true);
    this.statusMessage.set(null);
    this.errorMessage.set(null);

    const enabled = this.aiChatEnabled();
    this.adminService.updateFeatures({ features: { aiChat: enabled } }).subscribe({
      next: response => {
        this.platformAiChatEnabled.set(response.enableAiChat === true);
        this.aiChatEnabled.set(response.features.aiChat === true);
        this.appConfig.patchFeatures({ aiChat: response.features.aiChat === true });
        this.appConfig.refreshConfig().subscribe();
        this.statusMessage.set(
          enabled
            ? 'AI chat is enabled. The AI Chat tab is now visible in the header.'
            : 'AI chat is disabled. The AI Chat tab has been hidden.',
        );
        this.saving.set(false);
      },
      error: error => {
        const message =
          typeof error?.error?.message === 'string'
            ? error.error.message
            : 'Unable to save feature settings.';
        this.errorMessage.set(message);
        this.saving.set(false);
      },
    });
  }
}
