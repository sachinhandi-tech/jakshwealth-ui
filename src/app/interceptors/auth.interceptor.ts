import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { EnvironmentService } from '../services/environment/environment.service';
import { UserService } from '../services/user/user.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const env = inject(EnvironmentService).getEnvironment();
  const userService = inject(UserService);

  if (env.unAuthenticatedAPI.some(api => req.url.includes(api))) {
    return next(req);
  }

  const session = userService.getSessionData();
  if (session?.accessToken) {
    return next(
      req.clone({
        setHeaders: { Authorization: `Bearer ${session.accessToken}` },
      }),
    );
  }
  return next(req);
};
