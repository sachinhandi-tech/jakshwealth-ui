import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, switchMap } from 'rxjs';

import { AuthorizationService } from '../services/authorization/authorization.service';
import { AuthService } from '../services/auth/auth.service';
import { EnvironmentService } from '../services/environment/environment.service';
import { UserService } from '../services/user/user.service';

export const authGuard: CanActivateFn = route => {
  const env = inject(EnvironmentService).getEnvironment();
  const user = inject(UserService);
  const router = inject(Router);
  const auth = inject(AuthService);
  const authorization = inject(AuthorizationService);
  const requiredAuthorizerRoles = route.data['authorizerRoles'] as readonly string[] | undefined;

  return user.isAuthenticated().pipe(
    switchMap(isAuth => {
      if (!isAuth) {
        return auth.startLoginFromAppConfig(router.url, env).pipe(map(() => false));
      }

      return authorization
        .ensureAccess({
          requiredAuthorizerRoles,
          redirectOnDenied: '/unauthorised',
        })
        .pipe(map(allowed => allowed));
    }),
  );
};

export const loggedInGuard: CanActivateFn = () => {
  const user = inject(UserService);
  const router = inject(Router);

  return user.isAuthenticated().pipe(
    map(isAuth => {
      if (!isAuth) {
        void router.navigate(['/about']);
        return false;
      }
      return true;
    }),
  );
};
