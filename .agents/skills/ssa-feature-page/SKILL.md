---
name: ssa-feature-page
description: >-
  Add a new lazy-loaded feature page in JakshWealth — routes, FeatureLayout,
  NGUI markup, and optional landing/header links. Use when building utilization-style
  dashboards, proof-point tabs, or admin sections in jakshwealth-ui.
---

# Add a feature page (JakshWealth)

## Prerequisites

- Read **`AGENTS.md`** (app layout, auth, existing examples).
- Pick a reference feature: **`proof-points`** (tabs + children) or **`utilization`** (single home).

## Steps

### 1. Create the feature folder

```
src/app/features/<feature-name>/
├── <feature-name>.routes.ts
├── <feature-name>-home.ts
├── <feature-name>-home.html
└── <feature-name>-home.css
```

Standalone component template (match existing style):

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TypographyModule } from '@cigna/cigna_dae_ngui_library/lib/typography';

@Component({
  selector: 'app-<feature-name>-home',
  imports: [TypographyModule],
  templateUrl: './<feature-name>-home.html',
  styleUrl: './<feature-name>-home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class <FeatureName>Home {}
```

HTML skeleton:

```html
<section class="page-card">
  <ngui-typography type="h2">Title</ngui-typography>
  <ngui-typography type="paragraph">Description.</ngui-typography>
</section>
```

Routes file:

```typescript
import { Routes } from '@angular/router';

export const <FEATURE>_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./<feature-name>-home').then(m => m.<FeatureName>Home) },
];
```

### 2. Register in `app.routes.ts`

Protected feature (typical):

```typescript
{
  path: '<feature-path>',
  title: 'Human title',
  canActivate: [authGuard],
  loadComponent: () => import('./layout/feature-layout').then(m => m.FeatureLayout),
  loadChildren: () =>
    import('./features/<feature-name>/<feature-name>.routes').then(m => m.<FEATURE>_ROUTES),
},
```

Admin-only: add `data: { authorizerRoles: JW_ADMIN_ROLES }`.

### 3. NGUI components

Before adding a component, read its interface file under `node_modules/@cigna/cigna_dae_ngui_library/lib/interfaces/`.

Copy import/style patterns from:

- Cards/metrics → `features/proof-points/ccd/ccd-proof-points.html`
- Tabs → `features/proof-points/proof-points-home.html`
- Landing tiles → `components/landing/`

### 4. Navigation (optional)

- Home tiles: `components/landing/landing.model.ts`
- Header menu: `components/app-header-bar/app-header-bar.ts`

### 5. Verify

```bash
npm start
```

Navigate to the new path; confirm `authGuard` behavior when logged out.

## Out of scope

- Do not add app shell, Okta config, or global `angular.json` style changes unless explicitly requested.
- Do not duplicate the NGUI component catalog — use **`AGENTS.ngui.md`**.
