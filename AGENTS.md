# AGENTS.md — JakshWealth (jakshwealth-ui)

Personal **Angular 21** app for NSE stock analysis. Paired with **`jakshwealth-api`** at `/jw-api/`.

---

## Stack

| Layer | Choice |
|-------|--------|
| Framework | Angular **21**, standalone components, `ChangeDetectionStrategy.OnPush` |
| UI | Custom JakshWealth CSS (`src/styles.css`, component-scoped styles) |
| State / async | RxJS; session via `UserService` (signals + `localStorage`) |
| API | Relative base `environment.url` → `/jw-api/` (dev proxy) |
| Auth | Okta → `/authorize` callback → `AuthService` + `AuthorizationService` |

---

## Do not redo

- **App shell** — `AppHeaderBar` is wired in `app.ts` / `app.html`.
- **Auth plumbing** — use existing guards, interceptors, and services.

---

## Repository layout

```
src/app/
├── app.routes.ts
├── components/          # about, landing, authorize, app-header-bar
├── features/stock-analysis/
├── layout/feature-layout.ts
├── guards/auth.guard.ts
├── services/
└── interceptors/
src/environments/
```

---

## Auth & routing

- **`authGuard`** — requires login + `AuthorizationService.ensureAccess()`.
- Public: `/about`, `/authorize`. Protected: `/home`, `/stock-analysis`.
- Okta settings: `src/environments/environment.development.ts` (gitignored copy from `environment.development.example.ts`).

When adding a **protected route**:

```typescript
{
  path: 'my-feature',
  title: 'My Feature',
  canActivate: [authGuard],
  loadComponent: () => import('./layout/feature-layout').then(m => m.FeatureLayout),
  loadChildren: () => import('./features/my-feature/my-feature.routes').then(m => m.MY_FEATURE_ROUTES),
}
```

---

## Adding a feature page

Use skill **`jw-feature-page`** — `.cursor/skills/jw-feature-page/SKILL.md`.

Copy **`features/stock-analysis/`** for structure (standalone component, lazy routes, JakshWealth CSS).

---

## Local development

```bash
npm start
npm run build
npm test
```

API sibling: `../jakshwealth-api` — run `./run-api.sh` for `/jw-api/` locally.
