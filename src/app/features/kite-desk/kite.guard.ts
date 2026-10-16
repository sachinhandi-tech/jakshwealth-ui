import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { KiteService } from './kite.service';

export const kiteAuthGuard: CanActivateFn = () => {
  const kite = inject(KiteService);
  const router = inject(Router);
  return kite.session().pipe(
    map(status => (status.authenticated ? true : router.createUrlTree(['/kite/login']))),
    catchError(() => of(router.createUrlTree(['/kite/login']))),
  );
};
