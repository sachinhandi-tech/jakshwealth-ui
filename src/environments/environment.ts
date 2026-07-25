import { Environment } from './environment.model';

export const environment: Environment = {
  name: 'default',
  production: false,
  url: '/jw-api/',
  unAuthenticatedAPI: ['token-auth', 's3.amazonaws.com'],
  fssoUrl: 'https://REPLACE_WITH_OKTA_DOMAIN/oauth2/default/v1/authorize',
  fssoRedirectRoute: '/authorize',
  clientId: 'REPLACE_WITH_OKTA_CLIENT_ID',
  scope: 'apigroups email profile openid groups',
};

export const JW_ADMIN_ROLES = ['admin'] as const;
