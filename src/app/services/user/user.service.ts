import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, defer, map, Observable, of, tap } from 'rxjs';

import { UserSessionData } from '../../models/user/user.model';
import { AuthorizationService } from '../authorization/authorization.service';
import { AuthService } from '../auth/auth.service';
import { expiresAtFromJwt } from '../auth/jwt';

const SESSION_KEY = 'session_data';
const EXPIRY_WARN_MINUTES = 5;

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly authService = inject(AuthService);
  private readonly authorization = inject(AuthorizationService);

  private readonly sessionSignal = signal<UserSessionData | null>(this.loadFromStorage());

  readonly userSession = this.sessionSignal.asReadonly();
  readonly isLoggedIn = computed(() => this.sessionSignal() !== null);

  constructor() {
    const token = this.sessionSignal()?.accessToken;
    if (token) {
      this.authorization.bindSessionToken(token);
    }
  }

  getSessionData(): UserSessionData | null {
    return this.sessionSignal();
  }

  createSession(sessionData: UserSessionData): void {
    this.sessionSignal.set(sessionData);
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    this.authorization.bindSessionToken(sessionData.accessToken);
  }

  logout(): void {
    this.sessionSignal.set(null);
    this.authorization.reset();
    localStorage.removeItem(SESSION_KEY);
  }

  tokenToBeExpired(expUnixSeconds: number): boolean {
    const mins = Math.round((expUnixSeconds * 1000 - Date.now()) / 60000);
    return mins <= EXPIRY_WARN_MINUTES && mins > 0;
  }

  isAuthenticated(): Observable<boolean> {
    return defer(() => this.resolveAuthentication());
  }

  private resolveAuthentication(): Observable<boolean> {
    const session = this.sessionSignal();
    if (!session?.accessToken) {
      this.logout();
      return of(false);
    }

    const expiresAt = this.effectiveExpiresAt(session);
    if (!expiresAt) {
      this.logout();
      return of(false);
    }

    const expired = Date.now() >= expiresAt * 1000;
    const shouldRefresh =
      session.refreshToken && (expired || this.tokenToBeExpired(expiresAt));

    if (shouldRefresh) {
      return this.authService.useRefreshToken(session.refreshToken!).pipe(
        tap(res =>
          this.createSession({
            ...session,
            ...res,
            fullName: `${res.firstName} ${res.lastName}`.trim() || session.fullName,
          }),
        ),
        map(() => true),
        catchError(() => {
          this.logout();
          return of(false);
        }),
      );
    }

    if (!expired) {
      return of(true);
    }

    this.logout();
    return of(false);
  }

  private effectiveExpiresAt(session: UserSessionData): number {
    if (session.expiresAt > 0) {
      return session.expiresAt;
    }
    return expiresAtFromJwt(session.accessToken) ?? 0;
  }

  private loadFromStorage(): UserSessionData | null {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as UserSessionData;
    } catch {
      return null;
    }
  }
}
