import { Environment } from './environment.model';

/**
 * Copy to environment.development.ts for local dev (that file is gitignored).
 */
export const environment: Environment = {
  name: 'dev',
  production: false,
  url: '/jw-api/',
};
