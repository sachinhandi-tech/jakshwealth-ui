import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { KiteService } from './kite.service';

@Component({
  selector: 'app-kite-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './kite-login.html',
  styleUrl: './kite-login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KiteLogin {
  private readonly kite = inject(KiteService);
  private readonly router = inject(Router);

  apiKey = '';
  apiSecret = '';
  requestToken = '';
  showSecret = false;

  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
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

  submit(): void {
    this.error.set(null);
    this.submitting.set(true);
    this.kite
      .login({
        api_key: this.apiKey.trim(),
        api_secret: this.apiSecret.trim(),
        request_token: this.requestToken.trim(),
      })
      .subscribe({
        next: () => {
          this.apiSecret = '';
          this.requestToken = '';
          void this.router.navigate(['/kite/dashboard']);
        },
        error: err => {
          this.submitting.set(false);
          this.error.set(readError(err));
        },
      });
  }
}

function readError(err: { error?: { detail?: unknown }; message?: string }): string {
  const detail = err?.error?.detail;
  if (typeof detail === 'string' && detail.trim()) {
    return detail;
  }
  if (err?.message?.includes('Http failure')) {
    return 'Cannot reach the Kite API. Start the FastAPI server on port 8010, then try again.';
  }
  return 'Login failed. Check the API key, secret, and request token.';
}
