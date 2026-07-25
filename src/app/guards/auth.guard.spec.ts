import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { firstValueFrom, Observable, of } from 'rxjs';

import { authGuard, loggedInGuard } from './auth.guard';
import { AuthService } from '../services/auth/auth.service';
import { AuthorizationService } from '../services/authorization/authorization.service';
import { EnvironmentService } from '../services/environment/environment.service';
import { UserService } from '../services/user/user.service';

describe('authGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'home', component: class {} },
          { path: 'unauthorised', component: class {} },
        ]),
        {
          provide: EnvironmentService,
          useValue: { getEnvironment: () => ({ url: '/jw-api/' }) },
        },
        {
          provide: UserService,
          useValue: { isAuthenticated: vi.fn(() => of(false)) },
        },
        {
          provide: AuthService,
          useValue: { startLoginFromAppConfig: vi.fn(() => of(undefined)) },
        },
        {
          provide: AuthorizationService,
          useValue: { ensureAccess: vi.fn(() => of(true)) },
        },
      ],
    });
  });

  it('starts login when user is not authenticated', async () => {
    const auth = TestBed.inject(AuthService);
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'url', 'get').mockReturnValue('/home');

    const result = await TestBed.runInInjectionContext(() =>
      firstValueFrom(authGuard({ data: {} } as never, {} as never) as Observable<boolean>),
    );

    expect(result).toBe(false);
    expect(auth.startLoginFromAppConfig).toHaveBeenCalled();
  });

  it('delegates to authorization when user is authenticated', async () => {
    const user = TestBed.inject(UserService);
    const authorization = TestBed.inject(AuthorizationService);
    vi.mocked(user.isAuthenticated).mockReturnValue(of(true));

    const result = await TestBed.runInInjectionContext(() =>
      firstValueFrom(authGuard({ data: {} } as never, {} as never) as Observable<boolean>),
    );

    expect(result).toBe(true);
    expect(authorization.ensureAccess).toHaveBeenCalledWith({
      requiredAuthorizerRoles: undefined,
      redirectOnDenied: '/unauthorised',
    });
  });
});

describe('loggedInGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'about', component: class {} }]),
        {
          provide: UserService,
          useValue: { isAuthenticated: vi.fn(() => of(false)) },
        },
      ],
    });
  });

  it('redirects anonymous users to about', async () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const result = await TestBed.runInInjectionContext(() =>
      firstValueFrom(loggedInGuard({} as never, {} as never) as Observable<boolean>),
    );

    expect(result).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith(['/about']);
  });
});
