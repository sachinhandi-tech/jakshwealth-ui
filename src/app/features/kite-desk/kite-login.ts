import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { KITE_API_BASE } from './kite.api';
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

  readonly zerodhaLoginUrl = `${KITE_API_BASE}/auth/zerodha/login`;
  readonly existingUser = signal<string | null>(null);
  readonly backendOffline = signal(false);

  constructor() {
    this.kite.session().subscribe({
      next: status => {
        this.backendOffline.set(false);
        if (status.authenticated) {
          this.existingUser.set(status.user_name || status.user_id);
        }
      },
      error: () => this.backendOffline.set(true),
    });
  }
}
