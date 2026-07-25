// Replaced at build time via angular.json fileReplacements.
// Local dev: `ng serve` uses the `local` configuration → environment.development.ts
import { Environment } from './environment.model';

export const environment: Environment = {
  name: 'default',
  production: false,
  url: '/jw-api/',
  unAuthenticatedAPI: ['token-auth', 's3.amazonaws.com'],
  fssoUrl: 'https://cigna.oktapreview.com/oauth2/default/v1/authorize',
  fssoRedirectRoute: '/authorize',
  clientId: 'REPLACE_WITH_DEV_OKTA_CLIENT_ID',
  scope: 'apigroups email profile openid groups',
};

export const JW_ADMIN_ROLES = ['admin'] as const;
