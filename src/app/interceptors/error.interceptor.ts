import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, retry, throwError, timer } from 'rxjs';

import { ErrorService } from '../services/error/error.service';
import { UserService } from '../services/user/user.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const userService = inject(UserService);
  const router = inject(Router);
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
      if (error.status === 403) {
        return throwError(() => error);
      }
      if (error.status === 401) {
        const onAuthorize = router.url.startsWith('/authorize');
        if (!onAuthorize) {
          userService.logout();
          void router.navigate(['/authorize']);
        }
        return throwError(() => error);
      }
      if (!req.headers.has('no-retry')) {
        errorService.handle(error);
      }
      return throwError(() => error);
    }),
  );
};
