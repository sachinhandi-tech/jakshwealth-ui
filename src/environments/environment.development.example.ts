import { Environment } from './environment.model';

/**
 * Copy to environment.development.ts for local dev (that file is gitignored).
 * Okta domain and client ID are public (not secrets); client secret stays in the API config.
 */
export const environment: Environment = {
  name: 'dev',
  production: false,
  url: '/jw-api/',
  unAuthenticatedAPI: ['token-auth', 'app-config', 's3.amazonaws.com'],
  fssoUrl: 'https://REPLACE_WITH_OKTA_DOMAIN/oauth2/default/v1/authorize',
  fssoRedirectRoute: '/authorize',
  clientId: 'REPLACE_WITH_OKTA_CLIENT_ID',
  scope: 'apigroups email profile openid groups',
};

/** Authorizer role labels used in route guards (from authorizer context, not Okta groups). */
export const JW_ADMIN_ROLES = ['admin'] as const;
