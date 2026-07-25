export interface SpecifiedAPI {
  name: string;
  url: string;
}

export interface Environment {
  name: string;
  production: boolean;
  url: string;
  altUrl?: string;
  specifiedAPI?: SpecifiedAPI[];
}
