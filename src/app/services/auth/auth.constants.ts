export const OKTA_STATE_KEY = 'okta_oauth_state';
export const RETURN_URL_KEY = 'ssa_return_url';
export const AUTHORIZE_ROUTE = '/authorize';

export const NON_RETURN_PATHS = new Set([
  AUTHORIZE_ROUTE,
  '/unauthorised',
  '/logout',
  '/about',
  '/',
]);
