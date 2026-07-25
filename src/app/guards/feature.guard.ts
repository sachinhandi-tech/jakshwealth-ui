import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { AppConfigService } from '../services/app-config/app-config.service';

export const featureGuard = (feature: string): CanActivateFn => {
  return () => {
    const appConfig = inject(AppConfigService);
    const router = inject(Router);

    const snapshot = appConfig.snapshot();
    if (snapshot?.features?.[feature] === true) {
      return true;
    }

    return appConfig.getConfig().pipe(
      map(config => {
        if (config.features?.[feature] === true) {
          return true;
        }
        void router.navigate(['/home']);
        return false;
      }),
    );
  };
};

export const aiChatGuard: CanActivateFn = featureGuard('aiChat');
