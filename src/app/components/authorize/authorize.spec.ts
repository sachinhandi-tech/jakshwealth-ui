import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of } from 'rxjs';

import { Authorize } from './authorize';
import { AuthService } from '../../services/auth/auth.service';
import { AuthorizationService } from '../../services/authorization/authorization.service';
import { EnvironmentService } from '../../services/environment/environment.service';
import { UserService } from '../../services/user/user.service';

describe('Authorize', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Authorize],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({}),
              url: [],
            },
          },
        },
        {
          provide: EnvironmentService,
          useValue: { getEnvironment: () => ({ url: '/jw-api/' }) },
        },
        {
          provide: UserService,
          useValue: {
            logout: vi.fn(),
            getSessionData: vi.fn(() => null),
          },
        },
        {
          provide: AuthService,
          useValue: {
            parseAuthorizeRedirectFragment: vi.fn(() => null),
            completeAuthorizeLogin: vi.fn(),
            consumeOktaState: vi.fn(),
            exchangeAuthCodeWithRedirect: vi.fn(),
            startLoginFromAppConfig: vi.fn(() => of(undefined)),
          },
        },
        {
          provide: AuthorizationService,
          useValue: {
            accessGranted: signal<boolean | null>(null),
            ensureAccess: vi.fn(() => of(true)),
          },
        },
      ],
    }).compileComponents();
  });

  it('logs out on /logout route', () => {
    TestBed.overrideProvider(ActivatedRoute, {
      useValue: {
        snapshot: {
          queryParamMap: convertToParamMap({}),
          url: [{ path: 'logout' }],
        },
      },
    });

    const fixture = TestBed.createComponent(Authorize);
    const user = TestBed.inject(UserService);
    fixture.detectChanges();

    expect(user.logout).toHaveBeenCalled();
    expect(fixture.componentInstance.logout()).toBe(true);
    expect(fixture.componentInstance.authenticated()).toBe(false);
  });

  it('shows sign-in prompt when no session exists', () => {
    const fixture = TestBed.createComponent(Authorize);
    fixture.detectChanges();

    expect(fixture.componentInstance.authenticated()).toBe(false);
  });
});
