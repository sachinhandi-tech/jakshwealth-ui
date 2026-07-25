import { describe, expect, it } from 'vitest';

import { expiresAtFromJwt } from './jwt';

function jwtWithExp(exp: number): string {
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ exp }));
  return `${header}.${payload}.signature`;
}

describe('expiresAtFromJwt', () => {
  it('returns exp from a valid JWT payload', () => {
    expect(expiresAtFromJwt(jwtWithExp(1_700_000_000))).toBe(1_700_000_000);
  });

  it('returns undefined for malformed tokens', () => {
    expect(expiresAtFromJwt('not-a-jwt')).toBeUndefined();
    expect(expiresAtFromJwt('a.b')).toBeUndefined();
  });

  it('returns undefined when exp is missing or invalid', () => {
    const header = btoa('{}');
    const payload = btoa(JSON.stringify({ sub: 'user' }));
    expect(expiresAtFromJwt(`${header}.${payload}.sig`)).toBeUndefined();
  });
});
