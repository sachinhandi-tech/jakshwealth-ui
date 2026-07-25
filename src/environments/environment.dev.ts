import { Environment } from './environment.model';

/** Deployed dev environment (Jenkins dev branch). */
export const environment: Environment = {
  name: 'dev',
  production: false,
  // API Gateway custom domain (see jakshwealth-api gw_deploy/main.tf).
  // UI is on dev-ssa.*; API is on jw-api-g.* — same-origin /jw-api/ only works with ng serve proxy.
  url: 'https://jw-api-g.da-hpp-dev.aws.cignacloud.com/jw-api/',
  unAuthenticatedAPI: ['token-auth', 'app-config', 's3.amazonaws.com'],
  fssoUrl: 'https://cigna.oktapreview.com/oauth2/default/v1/authorize',
  fssoRedirectRoute: '/authorize',
  clientId: 'REPLACE_WITH_DEV_OKTA_CLIENT_ID',
  scope: 'apigroups email profile openid groups',
};

export const JW_ADMIN_ROLES = ['admin'] as const;
