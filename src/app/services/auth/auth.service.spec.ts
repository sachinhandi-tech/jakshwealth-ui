import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';
import { firstValueFrom, of } from 'rxjs';

import { AuthorizationService } from '../authorization/authorization.service';
import { AuthService } from './auth.service';
import { OKTA_STATE_KEY, RETURN_URL_KEY } from './auth.constants';

describe('AuthService', () => {
  let auth: AuthService;
  let authorization: AuthorizationService;
  let httpMock: HttpTestingController;

  const env = {
    name: 'dev',
    production: false,
    url: '/jw-api/',
    unAuthenticatedAPI: ['token-auth'],
    fssoUrl: 'https://okta.example/authorize',
    fssoRedirectRoute: '/authorize',
    clientId: 'client-id',
    scope: 'openid',
  };

  beforeEach(() => {
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: AuthorizationService,
          useValue: {
            ensureAccess: vi.fn(() => of(true)),
          },
        },
      ],
    });

    auth = TestBed.inject(AuthService);
    authorization = TestBed.inject(AuthorizationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('stores and resolves valid return urls', () => {
    auth.rememberReturnUrl('/proof-points/ccd?tab=1');
    expect(auth.consumeReturnUrl()).toBe('/proof-points/ccd');
  });

  it('ignores auth-flow paths when remembering return urls', () => {
    auth.rememberReturnUrl('/authorize');
    expect(sessionStorage.getItem(RETURN_URL_KEY)).toBeNull();
  });

  it('starts login after app-config loads', async () => {
    const startLoginSpy = vi.spyOn(auth, 'startLogin').mockImplementation(() => undefined);

    const loginPromise = firstValueFrom(auth.startLoginFromAppConfig('/home', env));
    httpMock.expectOne('app-config').flush({
      appName: 'SSA',
      version: '1',
      environment: 'dev',
      features: {},
      bypassOktaAuth: true,
      clientId: 'from-app-config',
    });

    await loginPromise;

    expect(startLoginSpy).toHaveBeenCalledWith(env, true, 'from-app-config');
    startLoginSpy.mockRestore();
  });

  it('builds Okta login url and stores oauth state', () => {
    const url = auth.buildOktaLoginUrl(env);
    expect(url.startsWith(env.fssoUrl)).toBe(true);
    expect(sessionStorage.getItem(OKTA_STATE_KEY)).toBeTruthy();
  });

  it('prefers app-config client id when building Okta login url', () => {
    const url = auth.buildOktaLoginUrl(env, '0oaFromAppConfig');
    expect(url).toContain('client_id=0oaFromAppConfig');
  });

  it('validates oauth state once', () => {
    sessionStorage.setItem(OKTA_STATE_KEY, 'expected-state');
    expect(auth.consumeOktaState('expected-state')).toBe(true);
    expect(auth.consumeOktaState('expected-state')).toBe(false);
  });

  it('parses authorize redirect fragment into session data', () => {
    history.replaceState(null, '', '/authorize#accessToken=abc&firstName=Ada&lastName=Lovelace');
    const session = auth.parseAuthorizeRedirectFragment();
    expect(session).toMatchObject({
      accessToken: 'abc',
      firstName: 'Ada',
      lastName: 'Lovelace',
      fullName: 'Ada Lovelace',
    });
  });

  it('completes authorize login and probes access', () => {
    const userService = {
      createSession: vi.fn(),
    } as unknown as import('../user/user.service').UserService;
    const ensureAccess = vi.spyOn(authorization, 'ensureAccess').mockReturnValue(of(true));

    auth.completeAuthorizeLogin(
      {
        accessToken: 'token',
        refreshToken: '',
        expiresAt: 999,
        firstName: 'Ada',
        lastName: 'Lovelace',
        fullName: 'Ada Lovelace',
        email: '',
        department: '',
        lanId: 'AL01',
        globalGroups: [],
      },
      userService,
    );

    expect(userService.createSession).toHaveBeenCalled();
    expect(ensureAccess).toHaveBeenCalledWith({
      redirectOnDenied: '/unauthorised',
      redirectOnAllowed: '/home',
      replaceUrl: true,
    });
  });

  it('includes redirect_uri when starting bypass login', () => {
    const assign = vi.fn();
    vi.stubGlobal('location', {
      ...window.location,
      origin: 'https://dev-ssa.da-hpp-dev.aws.cignacloud.com',
      assign,
    });

    try {
      auth.startLogin(env, true);
      expect(assign).toHaveBeenCalledWith(
        '/jw-api/token-auth/?bypass=true&redirect=true&redirect_uri=https%3A%2F%2Fdev-ssa.da-hpp-dev.aws.cignacloud.com',
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
