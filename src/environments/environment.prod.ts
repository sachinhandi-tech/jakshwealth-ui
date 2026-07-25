import { Environment } from './environment.model';

/** Production environment — set Okta clientId and API URL before release. */
export const environment: Environment = {
  name: 'prod',
  production: true,
  url: '/jw-api/',
  unAuthenticatedAPI: ['token-auth', 'app-config', 's3.amazonaws.com'],
  fssoUrl: 'https://REPLACE_WITH_OKTA_DOMAIN/oauth2/default/v1/authorize',
  fssoRedirectRoute: '/authorize',
  clientId: 'REPLACE_WITH_OKTA_CLIENT_ID',
  scope: 'apigroups email profile openid groups',
};

export const JW_ADMIN_ROLES = ['admin'] as const;
