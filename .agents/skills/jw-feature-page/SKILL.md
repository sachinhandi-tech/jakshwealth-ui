---
name: jw-feature-page
description: Add a lazy-loaded JakshWealth feature page — routes, FeatureLayout, and JakshWealth markup.
---

# JakshWealth feature page

## Reference

Copy **`features/stock-analysis/`** — single home component, lazy routes, no external UI library.

## Steps

1. Create `features/<name>/` with `<name>-home.ts|html|css`, `<name>.routes.ts`, optional services/models.
2. Register in `app.routes.ts` with `FeatureLayout` + `authGuard`.
3. Add nav link in `components/app-header-bar/app-header-bar.ts` if needed.
4. Add landing card in `components/landing/landing-cards.json` if needed.

## Component template

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-my-feature-home',
  templateUrl: './my-feature-home.html',
  styleUrl: './my-feature-home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyFeatureHome {}
```

Use existing CSS tokens from `src/styles.css` (`--jw-*` variables).

## Routes

```typescript
export const MY_FEATURE_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./my-feature-home').then(m => m.MyFeatureHome) },
];
```
