import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { currentKiteApiBase, currentPlatformUserId, rememberPlatformUserId } from './kite.api';
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
  readonly selectedId = signal<string | null>(currentPlatformUserId());
  readonly zerodhaLoginUrl = computed(() => {
    const id = this.selectedId();
    const base = `${currentKiteApiBase()}/auth/zerodha/login`;
    return id ? `${base}?platform_user_id=${encodeURIComponent(id)}` : base;
  });

  constructor() {
    this.kite.subscribers().subscribe({
      next: body => {
        const rows = body.subscribers ?? [];
        this.subscribers.set(rows);
        if (!this.selectedId() && rows.length === 1) {
          this.choose(rows[0].platform_user_id);
        }
      },
      error: () => this.backendOffline.set(true),
    });
    this.kite.session().subscribe({
      next: status => {
        this.backendOffline.set(false);
        if (status.platform_user_id) {
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
}
