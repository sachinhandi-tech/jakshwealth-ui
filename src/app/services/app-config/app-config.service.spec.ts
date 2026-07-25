import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { beforeEach, describe, expect, it, afterEach } from 'vitest';
import { firstValueFrom } from 'rxjs';

import { AppConfigService } from './app-config.service';

describe('AppConfigService', () => {
  let service: AppConfigService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AppConfigService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  it('loads app-config and exposes a signal snapshot', async () => {
    const configPromise = firstValueFrom(service.getConfig());
    const req = httpMock.expectOne('app-config');
    expect(req.request.method).toBe('GET');
    req.flush({
      appName: 'SSA',
      version: '1.0.0',
      environment: 'dev',
      features: {},
      bypassOktaAuth: false,
      clientId: '0oaDevClientId',
    });

    const config = await configPromise;
    expect(config).toEqual({
      appName: 'SSA',
      version: '1.0.0',
      environment: 'dev',
      features: {},
      bypassOktaAuth: false,
      clientId: '0oaDevClientId',
    });
    expect(service.snapshot()).toEqual(config);
  });

  it('reuses cached config on subsequent calls', async () => {
    const firstLoad = firstValueFrom(service.getConfig());
    httpMock.expectOne('app-config').flush({
      appName: 'SSA',
      version: '1.0.0',
      environment: 'dev',
      features: {},
      bypassOktaAuth: true,
      clientId: '0oaDevClientId',
    });
    await firstLoad;

    const config = await firstValueFrom(service.getConfig());
    httpMock.expectNone('app-config');
    expect(config.bypassOktaAuth).toBe(true);
  });
});
