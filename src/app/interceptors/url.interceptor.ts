import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { EnvironmentService } from '../services/environment/environment.service';

function isAppAssetRequest(url: string): boolean {
  const normalized = url.startsWith('/') ? url.slice(1) : url;
  return normalized.startsWith('assets/');
}

export const urlInterceptor: HttpInterceptorFn = (req, next) => {
  const env = inject(EnvironmentService).getEnvironment();

  if (req.url.slice(0, 4).toLowerCase() === 'http') {
    return next(req);
  }

  if (isAppAssetRequest(req.url)) {
    const assetUrl = req.url.startsWith('/') ? req.url : `/${req.url}`;
    return next(req.clone({ url: assetUrl }));
  }

  const specified = env.specifiedAPI?.find(el => req.url.startsWith(el.name));
  if (specified) {
    return next(req.clone({ url: specified.url + req.url }));
  }

  if (req.url === 'app-config') {
    return next(req.clone({ url: env.url + req.url }));
  }

  const base = env.altUrl ?? env.url;
  return next(req.clone({ url: base + req.url }));
};
