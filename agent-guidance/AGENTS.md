# AGENTS.md — JakshWealth (jakshwealth-ui)

App-specific context for humans and AI agents working in **this repository**.

For the full **NGUI component catalog** (all `ngui-*` components, deprecations, Figma notes), read **`AGENTS.ngui.md`** at the repo root (written by `@cigna/cigna_dae_ngui_library` postinstall) or `node_modules/@cigna/cigna_dae_ngui_library/AGENTS.md`.

For auth architecture, see **`docs/AUTH_DESIGN_PLAN.md`** and **`docs/CCD_AUTH_AUTHORIZATION_WALKTHROUGH.md`**.

---

## Stack

| Layer | Choice |
|-------|--------|
| Framework | Angular **21**, standalone components, `ChangeDetectionStrategy.OnPush` |
| UI | **NGUI Canvas** — `@cigna/cigna_dae_ngui_library` (styles already in `angular.json`) |
| State / async | RxJS; session via `UserService` (signals + `localStorage`) |
| API | Relative base `environment.url` → `/jw-api/` (dev proxy) |
| Auth | Okta → `/authorize` callback → `AuthService` + `AuthorizationService` |

---

## Do not redo

- **App shell** — `AppHeaderBar` (`ngui-header`, menu bar) is already wired in `app.ts` / `app.html`. Do not run a greenfield NGUI install/shell scaffold.
- **Global styles / theme** — Canvas CSS is in `angular.json`; use existing tokens in component CSS.
- **Auth plumbing** — use existing guards, interceptors, and services; see [Auth & routing](#auth--routing).

---

## Repository layout

```
src/app/
├── app.routes.ts              # all top-level routes
├── app.config.ts              # router + HTTP interceptors
├── components/                # shared pages (about, landing, authorize, app-header-bar, …)
├── features/<name>/           # lazy feature areas (proof-points, utilization, admin, …)
├── layout/feature-layout.ts   # nested <router-outlet> for feature modules
├── guards/auth.guard.ts       # authGuard, loggedInGuard
├── services/
│   ├── auth/                  # Okta redirect, token-auth calls
│   ├── authorization/         # authorizer role checks
│   └── user/                  # session
└── interceptors/              # url, auth, error, cache-control
src/environments/              # environment.development.ts (gitignored) + model
```

---

## Auth & routing

- **`authGuard`** — requires login + `AuthorizationService.ensureAccess()`; optional `data.authorizerRoles` for admin-only routes.
- **`loggedInGuard`** — must be logged in (e.g. `/unauthorised`).
- Public: `/about`, `/authorize`. Protected examples: `/home`, `/utilization`, `/proof-points`, `/system_admin`.
- Okta settings: `src/environments/environment.development.ts` (`fssoUrl`, `clientId`, `scope`, `fssoRedirectRoute: '/authorize'`).
- API auth headers: `auth.interceptor.ts` attaches Bearer token except for `unAuthenticatedAPI` (`token-auth`, …).

When adding a **protected route**, mirror an existing entry in `app.routes.ts`:

```typescript
{
  path: 'my-feature',
  title: 'My Feature',
  canActivate: [authGuard],
  data: { authorizerRoles: JW_ADMIN_ROLES }, // only if admin-only
  loadComponent: () => import('./layout/feature-layout').then(m => m.FeatureLayout),
  loadChildren: () => import('./features/my-feature/my-feature.routes').then(m => m.MY_FEATURE_ROUTES),
}
```

---

## NGUI in this app (quick reference)

**Already used patterns** — copy from these before inventing markup:

| Pattern | Example |
|---------|---------|
| Page title + body | `components/about/about.html`, `features/utilization/utilization-home.html` |
| Card grid landing | `components/landing/landing.html` |
| Tabs + nested routes | `features/proof-points/proof-points-home.html` |
| App chrome | `components/app-header-bar/` |

**Imports** — standalone: import `XxxModule` from `@cigna/cigna_dae_ngui_library/lib/<package>` into the component `imports` array.

**API truth** — before using a component, read:

`node_modules/@cigna/cigna_dae_ngui_library/lib/interfaces/<name>.ts`

**Typography** — prefer `ngui-typography` for headings and emphasis; plain text inside `ngui-card` body is often fine without extra wrappers.

**Tokens** — use CSS variables (`var(--spacing-default)`, `var(--type-color-default)`, …), not hardcoded hex/px.

**Deprecated** — do not use: `progress-bar`, `content-element`, `sidebar`, `date-range-picker`, `x-http`.

---

## Adding a feature page (workflow)

Use skill **`ssa-feature-page`** — `.cursor/skills/ssa-feature-page/SKILL.md` (same file under `.agents/skills/`).

1. Create `features/<name>/` with `*-home.ts|html|css`, optional child components, and `<name>.routes.ts`.
2. Register lazy route in `app.routes.ts` with `FeatureLayout` + `authGuard` when protected.
3. Use NGUI (`TypographyModule`, `CardModule`, `TabsModule`, …) matching existing features.
4. Add navigation from `landing.model.ts` or `app-header-bar` if the feature should appear in chrome.

---

## Local development

```bash
npm start          # ng serve (development config)
npm run build
npm test
```

API sibling repo: `../jakshwealth-api` — run `./run-api.sh` for `/jw-api/` locally.

---

## Agent file map (this repo)

| Path | Purpose |
|------|---------|
| **`AGENTS.md`** (this file) | App architecture, auth, routing, where to copy patterns |
| **`AGENTS.ngui.md`** | Full NGUI component catalog (from npm postinstall) |
| **`.cursor/rules/`** | Cursor always-on / glob rules |
| **`.cursor/skills/`** / **`.agents/skills/`** | Shared skills (synced from `agent-guidance/skills/`) |
| **`agent-guidance/`** | Source of truth; `npm run postinstall` syncs to `.cursor` / `.agents` |
