import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';
import { of } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import { AuthorizationService } from '../authorization/authorization.service';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let authService: AuthService;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: {
            useRefreshToken: vi.fn(),
          },
        },
        {
          provide: AuthorizationService,
          useValue: {
            bindSessionToken: vi.fn(),
            reset: vi.fn(),
          },
        },
      ],
    });

    service = TestBed.inject(UserService);
    authService = TestBed.inject(AuthService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('reports unauthenticated when no session exists', () => {
    let authenticated = true;
    service.isAuthenticated().subscribe(value => {
      authenticated = value;
    });
    expect(authenticated).toBe(false);
  });

  it('reports authenticated for a valid non-expired session', () => {
    const future = Math.floor(Date.now() / 1000) + 3600;
    service.createSession({
      accessToken: 'token',
      refreshToken: '',
      expiresAt: future,
      firstName: 'Ada',
      lastName: 'Lovelace',
      fullName: 'Ada Lovelace',
      email: '',
      department: '',
      lanId: 'AL01',
      globalGroups: [],
    });

    let authenticated = false;
    service.isAuthenticated().subscribe(value => {
      authenticated = value;
    });
    expect(authenticated).toBe(true);
  });

  it('refreshes an expiring session when refresh token is available', () => {
    const soon = Math.floor(Date.now() / 1000) + 120;
    service.createSession({
      accessToken: 'token',
      refreshToken: 'refresh',
      expiresAt: soon,
      firstName: 'Ada',
      lastName: 'Lovelace',
      fullName: 'Ada Lovelace',
      email: '',
      department: '',
      lanId: 'AL01',
      globalGroups: [],
    });

    vi.mocked(authService.useRefreshToken).mockReturnValue(
      of({
        accessToken: 'new-token',
        refreshToken: 'refresh',
        expiresAt: soon + 3600,
        firstName: 'Ada',
        lastName: 'Lovelace',
        lanId: 'AL01',
        email: '',
        department: '',
        globalGroups: [],
      }),
    );

    let authenticated = false;
    service.isAuthenticated().subscribe(value => {
      authenticated = value;
    });

    expect(authenticated).toBe(true);
    expect(authService.useRefreshToken).toHaveBeenCalledWith('refresh');
    expect(service.getSessionData()?.accessToken).toBe('new-token');
  });
});
