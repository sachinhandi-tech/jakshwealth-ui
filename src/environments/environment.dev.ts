import { Environment } from './environment.model';

/** Deployed dev environment (Jenkins main branch). */
export const environment: Environment = {
  name: 'dev',
  production: false,
  url: '/jw-api/',
};
