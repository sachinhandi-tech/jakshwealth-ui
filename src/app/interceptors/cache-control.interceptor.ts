import { HttpInterceptorFn } from '@angular/common/http';

export const cacheControlInterceptor: HttpInterceptorFn = (req, next) =>
  next(req.clone({ setHeaders: { 'cache-control': 'no-cache,no-store' } }));
