import { Routes } from '@angular/router';

import { routes } from '../../app.routes';
import { ADMIN_ROUTES } from '../../features/admin/admin.routes';
import { AI_CHAT_ROUTES } from '../../features/ai-chat/ai-chat.routes';
import { PROOF_POINTS_ROUTES } from '../../features/proof-points/proof-points.routes';
import { UTILIZATION_ROUTES } from '../../features/utilization/utilization.routes';

const DEFAULT_RETURN_URL = '/home';

const AUTH_FLOW_PATHS = new Set(['/authorize', '/logout', '/unauthorised', '/about', '/']);

const LAZY_CHILDREN: Record<string, Routes> = {
  utilization: UTILIZATION_ROUTES,
  'proof-points': PROOF_POINTS_ROUTES,
  admin: ADMIN_ROUTES,
  'ai-chat': AI_CHAT_ROUTES,
};

const REGISTERED_RETURN_PATHS = collectReturnPaths(routes);

function collectReturnPaths(routeList: Routes, prefix = ''): Set<string> {
  const paths = new Set<string>();

  for (const route of routeList) {
    if (route.path === undefined || route.path === '**') {
      continue;
    }
    if (route.redirectTo) {
      continue;
    }

    const segment = route.path === '' ? '' : `/${route.path}`;
    const fullPath = (prefix + segment || '/').replace(/\/+/g, '/');

    if (route.loadChildren && route.path) {
      const childRoutes = LAZY_CHILDREN[route.path];
      if (childRoutes) {
        paths.add(fullPath);
        for (const childPath of collectReturnPaths(childRoutes, fullPath)) {
          paths.add(childPath);
        }
      } else {
        paths.add(fullPath);
      }
      continue;
    }

    if (route.children?.length) {
      paths.add(fullPath);
      for (const childPath of collectReturnPaths(route.children, fullPath === '/' ? '' : fullPath)) {
        paths.add(childPath);
      }
      continue;
    }

    paths.add(fullPath);
  }

  return paths;
}

/** True when `path` matches a registered in-app route (excluding auth flow pages). */
export function isRegisteredReturnPath(path: string): boolean {
  const normalized = path.split('?')[0];
  if (AUTH_FLOW_PATHS.has(normalized)) {
    return false;
  }
  return REGISTERED_RETURN_PATHS.has(normalized);
}

/** Use a stored return path when it maps to a real route; otherwise fall back to `/home`. */
export function resolveReturnUrl(stored: string | null, fallback = DEFAULT_RETURN_URL): string {
  if (!stored) {
    return fallback;
  }

  const path = stored.split('?')[0];
  if (AUTH_FLOW_PATHS.has(path)) {
    return fallback;
  }

  return isRegisteredReturnPath(path) ? path : fallback;
}
