import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, tap } from 'rxjs';

import { Environment } from '../../../environments/environment.model';
import { UserSessionData } from '../../models/user/user.model';
import { AppConfigService } from '../app-config/app-config.service';
import { AuthorizationService } from '../authorization/authorization.service';
import { UserService } from '../user/user.service';
import {
  AUTHORIZE_ROUTE,
  NON_RETURN_PATHS,
  OKTA_STATE_KEY,
  RETURN_URL_KEY,
} from './auth.constants';
import { expiresAtFromJwt } from './jwt';
import { resolveReturnUrl } from './return-url';

export { expiresAtFromJwt } from './jwt';

interface UserSessionResponse {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  firstName: string;
  lastName: string;
  lanId: string;
  email: string;
  department: string;
  globalGroups: string[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly authorization = inject(AuthorizationService);
  private readonly appConfig = inject(AppConfigService);

  readonly authorizeRoute = AUTHORIZE_ROUTE;

  rememberReturnUrl(url: string): void {
    const path = url.split('?')[0];
    if (path && !NON_RETURN_PATHS.has(path)) {
      sessionStorage.setItem(RETURN_URL_KEY, path);
    }
  }

  consumeReturnUrl(): string {
    const stored = sessionStorage.getItem(RETURN_URL_KEY);
    sessionStorage.removeItem(RETURN_URL_KEY);
    return resolveReturnUrl(stored);
  }

  startLoginFromAppConfig(returnUrl: string, env: Environment): Observable<void> {
    this.rememberReturnUrl(returnUrl);
    return this.appConfig.getConfig().pipe(
      tap(config => this.startLogin(env, config.bypassOktaAuth, config.clientId)),
      map(() => undefined),
    );
  }

  startLogin(env: Environment, bypassOkta = false, clientId?: string): void {
    if (bypassOkta) {
      const params = new URLSearchParams({
        bypass: 'true',
        redirect: 'true',
        redirect_uri: window.location.origin,
      });
      window.location.assign(`${env.url}token-auth/?${params.toString()}`);
      return;
    }
    this.redirectToOkta(env, clientId);
  }

  redirectToOkta(env: Environment, clientId?: string): void {
    window.location.assign(this.buildOktaLoginUrl(env, clientId));
  }

  buildOktaLoginUrl(env: Environment, clientId?: string): string {
    const state = crypto.randomUUID();
    sessionStorage.setItem(OKTA_STATE_KEY, state);
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId?.trim() || env.clientId,
      state,
      nonce: crypto.randomUUID(),
      scope: env.scope,
      redirect_uri: `${window.location.origin}${env.fssoRedirectRoute}`,
    });
    return `${env.fssoUrl}?${params.toString()}`;
  }

  consumeOktaState(returnedState: string | null): boolean {
    const expected = sessionStorage.getItem(OKTA_STATE_KEY);
    sessionStorage.removeItem(OKTA_STATE_KEY);
    return Boolean(expected && returnedState && expected === returnedState);
  }

  exchangeAuthCodeWithRedirect(apiBaseUrl: string, authCode: string, state: string): void {
    const params = new HttpParams()
      .set('code', authCode)
      .set('state', state)
      .set('redirect', 'true')
      .set('redirect_uri', window.location.origin);
    window.location.assign(`${apiBaseUrl}token-auth/?${params.toString()}`);
  }

  parseAuthorizeRedirectFragment(): UserSessionData | null {
    const hash = window.location.hash;
    const raw = hash.startsWith('#') ? hash.slice(1) : hash;
    return raw ? this.sessionFromParams(new URLSearchParams(raw)) : null;
  }

  completeAuthorizeLogin(session: UserSessionData, userService: UserService): void {
    userService.createSession(session);
    this.clearAuthorizeCallbackUrl();
    this.authorization
      .ensureAccess({
        redirectOnDenied: '/unauthorised',
        redirectOnAllowed: this.consumeReturnUrl(),
        replaceUrl: true,
      })
      .subscribe();
  }

  useRefreshToken(refreshToken: string) {
    const headers = new HttpHeaders().set('refresh_token', refreshToken);
    return this.http.get<UserSessionResponse>('token-auth/', { headers });
  }

  clearAuthorizeCallbackUrl(): void {
    history.replaceState(null, '', this.authorizeRoute);
  }

  private sessionFromParams(params: URLSearchParams): UserSessionData | null {
    const accessToken = params.get('accessToken');
    if (!accessToken) {
      return null;
    }

    const firstName = params.get('firstName') ?? '';
    const lastName = params.get('lastName') ?? '';
    const expiresAt = this.resolveExpiresAt(params.get('expiresAt'), accessToken);

    return {
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`.trim() || 'Signed-in user',
      lanId: params.get('lanId') ?? '',
      email: params.get('email') ?? '',
      department: params.get('department') ?? '',
      accessToken,
      refreshToken: params.get('refreshToken') ?? '',
      expiresAt,
      globalGroups: (params.get('globalGroups') ?? '').split(',').filter(Boolean),
    };
  }

  private resolveExpiresAt(raw: string | null, accessToken: string): number {
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
    return expiresAtFromJwt(accessToken) ?? 0;
  }
}
