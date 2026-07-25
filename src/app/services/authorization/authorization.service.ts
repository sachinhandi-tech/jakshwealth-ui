import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, map, Observable, of, shareReplay, tap } from 'rxjs';

import { SecureDataService } from '../secure-data/secure-data.service';

export interface EnsureAccessOptions {
  requiredAuthorizerRoles?: readonly string[];
  redirectOnDenied?: string;
  redirectOnAllowed?: string;
  replaceUrl?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthorizationService {
  private readonly secureData = inject(SecureDataService);
  private readonly router = inject(Router);

  private readonly authorizerRolesSignal = signal<string[]>([]);
  private readonly accessGrantedSignal = signal<boolean | null>(null);
  private boundToken: string | null = null;
  private inFlightProbe: Observable<boolean> | null = null;

  readonly accessGranted = this.accessGrantedSignal.asReadonly();
  readonly authorizerRoles = this.authorizerRolesSignal.asReadonly();

  bindSessionToken(accessToken: string): void {
    if (this.boundToken !== accessToken) {
      this.boundToken = accessToken;
      this.clearProbeCache();
    }
  }

  ensureAccess(options: EnsureAccessOptions = {}): Observable<boolean> {
    const { requiredAuthorizerRoles, redirectOnDenied, redirectOnAllowed, replaceUrl = false } =
      options;

    return this.probeAccess(requiredAuthorizerRoles).pipe(
      tap(allowed => {
        if (!allowed && redirectOnDenied) {
          void this.router.navigateByUrl(redirectOnDenied, { replaceUrl });
          return;
        }
        if (allowed && redirectOnAllowed) {
          void this.router.navigateByUrl(redirectOnAllowed, { replaceUrl });
        }
      }),
    );
  }

  probeAccess(requiredAuthorizerRoles?: readonly string[]): Observable<boolean> {
    if (this.canUseCachedProbe()) {
      return of(this.evaluate(this.authorizerRolesSignal(), requiredAuthorizerRoles));
    }

    if (!this.inFlightProbe) {
      this.inFlightProbe = this.fetchAuthorizerAccess().pipe(
        shareReplay({ bufferSize: 1, refCount: true }),
        finalize(() => {
          this.inFlightProbe = null;
        }),
      );
    }

    return this.inFlightProbe.pipe(
      map(() => this.evaluate(this.authorizerRolesSignal(), requiredAuthorizerRoles)),
    );
  }

  reset(): void {
    this.boundToken = null;
    this.clearProbeCache();
  }

  private fetchAuthorizerAccess(): Observable<boolean> {
    return this.secureData.getSecureData().pipe(
      tap(res => {
        this.authorizerRolesSignal.set(res.roles ?? []);
        this.accessGrantedSignal.set(true);
      }),
      map(() => true),
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401 || err.status === 403) {
          this.accessGrantedSignal.set(false);
          this.authorizerRolesSignal.set([]);
          return of(false);
        }
        throw err;
      }),
    );
  }

  private canUseCachedProbe(): boolean {
    return Boolean(this.boundToken && this.accessGrantedSignal() !== null);
  }

  private clearProbeCache(): void {
    this.inFlightProbe = null;
    this.accessGrantedSignal.set(null);
    this.authorizerRolesSignal.set([]);
  }

  private evaluate(roles: string[], requiredAuthorizerRoles?: readonly string[]): boolean {
    if (this.accessGrantedSignal() !== true) {
      return false;
    }
    if (!requiredAuthorizerRoles?.length) {
      return true;
    }
    return requiredAuthorizerRoles.some(role => roles.includes(role));
  }
}
