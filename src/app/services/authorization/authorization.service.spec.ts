import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpErrorResponse } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of, throwError } from 'rxjs';

import { SecureDataService } from '../secure-data/secure-data.service';
import { AuthorizationService } from './authorization.service';

describe('AuthorizationService', () => {
  let service: AuthorizationService;
  let secureData: SecureDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: SecureDataService,
          useValue: {
            getSecureData: vi.fn(),
          },
        },
      ],
    });

    service = TestBed.inject(AuthorizationService);
    secureData = TestBed.inject(SecureDataService);
  });

  it('caches probe results for the bound token', () => {
    vi.mocked(secureData.getSecureData).mockReturnValue(
      of({ message: 'ok', roles: ['user'], principalId: 'p', servedAt: 'now' }),
    );

    service.bindSessionToken('token-a');
    let allowed = false;
    service.probeAccess().subscribe(value => {
      allowed = value;
    });
    expect(allowed).toBe(true);

    service.probeAccess().subscribe(value => {
      allowed = value;
    });
    expect(allowed).toBe(true);
    expect(secureData.getSecureData).toHaveBeenCalledTimes(1);
  });

  it('denies when secure-data returns 403', () => {
    vi.mocked(secureData.getSecureData).mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 403 })),
    );

    service.bindSessionToken('token-b');
    let allowed = true;
    service.probeAccess().subscribe(value => {
      allowed = value;
    });

    expect(allowed).toBe(false);
    expect(service.accessGranted()).toBe(false);
  });

  it('requires configured authorizer roles when provided', () => {
    vi.mocked(secureData.getSecureData).mockReturnValue(
      of({ message: 'ok', roles: ['user'], principalId: 'p', servedAt: 'now' }),
    );

    service.bindSessionToken('token-c');
    let allowed = true;
    service.probeAccess(['admin']).subscribe(value => {
      allowed = value;
    });

    expect(allowed).toBe(false);
  });
});
