import { Environment } from './environment.model';

/** Deployed test environment (Jenkins test branch). */
export const environment: Environment = {
  name: 'test',
  production: false,
  url: 'https://jw-api-g.da-hpp-test.aws.cignacloud.com/jw-api/',
  unAuthenticatedAPI: ['token-auth', 'app-config', 's3.amazonaws.com'],
  fssoUrl: 'https://cigna.oktapreview.com/oauth2/default/v1/authorize',
  fssoRedirectRoute: '/authorize',
  clientId: 'REPLACE_WITH_TEST_OKTA_CLIENT_ID',
  scope: 'apigroups email profile openid groups',
};

export const JW_ADMIN_ROLES = ['admin'] as const;
