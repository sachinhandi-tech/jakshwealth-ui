import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, shareReplay, tap } from 'rxjs';

export interface AppConfig {
  appName: string;
  version: string;
  environment: string;
  features: Record<string, boolean>;
  enableAiChat?: boolean;
  bypassOktaAuth: boolean;
  clientId: string;
}

@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private readonly http = inject(HttpClient);
  private readonly configSignal = signal<AppConfig | null>(null);

  /** Latest loaded config snapshot for signal-based consumers. */
  readonly snapshot = this.configSignal.asReadonly();

  private config$ = this.createConfigRequest();

  private createConfigRequest(): Observable<AppConfig> {
    return this.http.get<AppConfig>('app-config').pipe(
      tap(config => {
        console.info('[AppConfig] received from API:', config);
        this.configSignal.set(config);
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
  }

  /** Required app-config fetch; errors propagate (no fallback). */
  getConfig(): Observable<AppConfig> {
    return this.config$;
  }

  /** Reload app-config from the API (for example after admin feature changes). */
  refreshConfig(): Observable<AppConfig> {
    this.config$ = this.createConfigRequest();
    return this.config$;
  }

  isFeatureEnabled(feature: string): boolean {
    return this.configSignal()?.features?.[feature] === true;
  }

  patchFeatures(features: Record<string, boolean>): void {
    const current = this.configSignal();
    if (!current) {
      return;
    }
    this.configSignal.set({
      ...current,
      features: {
        ...current.features,
        ...features,
      },
    });
  }
}
