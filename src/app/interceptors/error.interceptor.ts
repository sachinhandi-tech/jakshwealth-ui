import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, retry, throwError, timer } from 'rxjs';

import { ErrorService } from '../services/error/error.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const errorService = inject(ErrorService);

  return next(req).pipe(
    retry({
      count: 3,
      delay: (error: { status?: number }) => {
        if (error?.status && error.status < 500) {
          throw error;
        }
        return timer(1000);
      },
    }),
    catchError(error => {
      if (!req.headers.has('no-retry')) {
        errorService.handle(error);
      }
      return throwError(() => error);
    }),
  );
};
