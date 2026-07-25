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
  fssoUrl: 'https://cigna.oktapreview.com/oauth2/default/v1/authorize',
  fssoRedirectRoute: '/authorize',
  clientId: '0oa115h0hl9OPMnFl0h8',
  scope: 'apigroups email profile openid groups',
};

/** Authorizer role labels used in route guards (from authorizer context, not Okta groups). */
export const JW_ADMIN_ROLES = ['admin'] as const;
