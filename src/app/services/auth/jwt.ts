/** Read ``exp`` from a JWT payload when the redirect omits ``expiresAt``. */
export function expiresAtFromJwt(accessToken: string): number | undefined {
  try {
    const payload = accessToken.split('.')[1];
    if (!payload) {
      return undefined;
    }
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(normalized)) as { exp?: number };
    return typeof decoded.exp === 'number' && decoded.exp > 0 ? decoded.exp : undefined;
  } catch {
    return undefined;
  }
}
