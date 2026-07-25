import { describe, expect, it } from 'vitest';

import { isRegisteredReturnPath, resolveReturnUrl } from './return-url';

describe('resolveReturnUrl', () => {
  it('returns stored path when it is a registered route', () => {
    expect(resolveReturnUrl('/proof-points/ccd')).toBe('/proof-points/ccd');
    expect(resolveReturnUrl('/home')).toBe('/home');
  });

  it('falls back to /home for unknown or auth-flow paths', () => {
    expect(resolveReturnUrl(null)).toBe('/home');
    expect(resolveReturnUrl('/does-not-exist')).toBe('/home');
    expect(resolveReturnUrl('/authorize')).toBe('/home');
    expect(resolveReturnUrl('/unauthorised')).toBe('/home');
  });
});

describe('isRegisteredReturnPath', () => {
  it('recognises feature routes', () => {
    expect(isRegisteredReturnPath('/utilization')).toBe(true);
    expect(isRegisteredReturnPath('/admin')).toBe(true);
    expect(isRegisteredReturnPath('/proof-points/tier-1')).toBe(true);
  });

  it('rejects unregistered paths', () => {
    expect(isRegisteredReturnPath('/about')).toBe(false);
    expect(isRegisteredReturnPath('/random')).toBe(false);
  });
});
