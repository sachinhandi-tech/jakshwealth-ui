export interface SpecifiedAPI {
  name: string;
  url: string;
}

export interface Environment {
  name: string;
  production: boolean;
  url: string;
  altUrl?: string;
  unAuthenticatedAPI: string[];
  fssoUrl: string;
  fssoRedirectRoute: string;
  clientId: string;
  scope: string;
  specifiedAPI?: SpecifiedAPI[];
}
