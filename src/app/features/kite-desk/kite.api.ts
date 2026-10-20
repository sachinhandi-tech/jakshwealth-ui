/** Fallback while kite-api-base.json is absent. The desk replaces this after the EC2 API publishes that file. */
export const KITE_API_BASE = 'https://4jadhr4hk8.execute-api.ap-south-2.amazonaws.com/dev/jw-api/kite';

let activeKiteApiBase = KITE_API_BASE;

export function currentKiteApiBase(): string {
  return activeKiteApiBase;
}

export function setKiteApiBase(value: string): void {
  activeKiteApiBase = value.replace(/\/$/, '');
}

const PLATFORM_USER_KEY = 'kite_platform_user_id';

export function currentPlatformUserId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const fromQuery = new URLSearchParams(window.location.search).get('platform_user_id');
  if (fromQuery) {
    window.sessionStorage.setItem(PLATFORM_USER_KEY, fromQuery);
    return fromQuery;
  }
  return window.sessionStorage.getItem(PLATFORM_USER_KEY);
}

export function rememberPlatformUserId(value: string): void {
  window.sessionStorage.setItem(PLATFORM_USER_KEY, value);
}

export function forgetPlatformUserId(): void {
  window.sessionStorage.removeItem(PLATFORM_USER_KEY);
}

export async function loadPublishedKiteApiBase(): Promise<void> {
  try {
    const response = await fetch('/kite-api-base.json', { cache: 'no-store' });
    if (!response.ok) {
      return;
    }
    const body = await response.json() as { kite?: unknown };
    if (typeof body.kite === 'string' && body.kite.startsWith('https://')) {
      setKiteApiBase(body.kite);
    }
  } catch {
    return;
  }
}
