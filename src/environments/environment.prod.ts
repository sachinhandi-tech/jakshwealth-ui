import { Environment } from './environment.model';

/**
 * Production environment — replace Okta clientId before release.
 * API Gateway custom domain: jw-api-g.da-hpp-prod.aws.cignacloud.com
 */
export const environment: Environment = {
  name: 'prod',
  production: true,
  url: 'https://jw-api-g.da-hpp-prod.aws.cignacloud.com/jw-api/',
  unAuthenticatedAPI: ['token-auth', 'app-config', 's3.amazonaws.com'],
  fssoUrl: 'https://cigna.okta.com/oauth2/default/v1/authorize',
  fssoRedirectRoute: '/authorize',
  clientId: 'REPLACE_WITH_PROD_OKTA_CLIENT_ID',
  scope: 'apigroups email profile openid groups',
};

/** Authorizer role labels used in route guards (from authorizer context, not Okta groups). */
export const JW_ADMIN_ROLES = ['admin'] as const;
