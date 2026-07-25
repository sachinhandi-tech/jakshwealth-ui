import { Environment } from './environment.model';

/** Production environment — set API URL before release if not using same-origin proxy. */
export const environment: Environment = {
  name: 'prod',
  production: true,
  url: '/jw-api/',
};
