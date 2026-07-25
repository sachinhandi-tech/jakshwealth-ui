import { describe, expect, it } from 'vitest';

import { isRegisteredReturnPath, resolveReturnUrl } from './return-url';

describe('resolveReturnUrl', () => {
  it('returns stored path when it is a registered route', () => {
    expect(resolveReturnUrl('/stock-analysis')).toBe('/stock-analysis');
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
    expect(isRegisteredReturnPath('/stock-analysis')).toBe(true);
    expect(isRegisteredReturnPath('/home')).toBe(true);
  });

  it('rejects unregistered paths', () => {
    expect(isRegisteredReturnPath('/about')).toBe(false);
    expect(isRegisteredReturnPath('/random')).toBe(false);
  });
});
