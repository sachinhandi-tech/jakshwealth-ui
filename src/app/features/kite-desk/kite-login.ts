import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { currentKiteApiBase, currentPlatformUserId, forgetPlatformUserId, rememberPlatformUserId } from './kite.api';
import { KiteSubscriber } from './kite.model';
import { KiteService } from './kite.service';

@Component({
  selector: 'app-kite-login',
  imports: [RouterLink],
  templateUrl: './kite-login.html',
  styleUrl: './kite-login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KiteLogin {
  private readonly kite = inject(KiteService);

  readonly existingUser = signal<string | null>(null);
  readonly backendOffline = signal(false);
  readonly subscribers = signal<KiteSubscriber[]>([]);
  readonly subscriberError = signal(false);
  readonly accountsReady = signal(false);
  readonly selectedId = signal<string | null>(currentPlatformUserId());
  readonly zerodhaLoginUrl = computed(() => {
    const id = this.selectedId();
    const base = `${currentKiteApiBase()}/login`;
    return id ? `${base}?platform_user_id=${encodeURIComponent(id)}` : base;
  });

  constructor() {
    this.kite.subscribers().subscribe({
      next: body => {
        const rows = body.subscribers ?? [];
        this.subscribers.set(rows);
        this.accountsReady.set(true);
        const known = new Set(rows.map(row => row.platform_user_id));
        const current = this.selectedId();
        if (current && !known.has(current)) {
          this.clearAccount();
        } else if (!current && rows.length === 1) {
          this.choose(rows[0].platform_user_id);
        }
      },
      error: () => {
        this.subscriberError.set(true);
        this.accountsReady.set(true);
      },
    });
    this.kite.session().subscribe({
      next: status => {
        this.backendOffline.set(false);
        if (status.platform_user_id && this.subscribers().some(row => row.platform_user_id === status.platform_user_id)) {
          this.choose(status.platform_user_id);
        }
        if (status.authenticated) {
          this.existingUser.set(status.user_name || status.user_id);
        }
      },
      error: () => this.backendOffline.set(true),
    });
  }

  choose(platformUserId: string): void {
    rememberPlatformUserId(platformUserId);
    this.selectedId.set(platformUserId);
  }

  clearAccount(): void {
    forgetPlatformUserId();
    this.selectedId.set(null);
  }
}
