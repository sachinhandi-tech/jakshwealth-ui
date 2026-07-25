---
name: ngui-component-reference
description: >-
  Looks up NGUI Canvas Angular component APIs from published interface files, docs site, and
  AGENTS catalog—import paths, selectors, standalone vs field pattern. Use before implementing
  ngui-button, ngui-card, ngui-table, forms, or any @cigna/cigna_dae_ngui_library component.
disable-model-invocation: true
---

# NGUI component reference

## When to use

- Before adding or changing any `ngui-*` component
- When unsure of import path, selector, inputs, or composition (slots, children)
- When choosing standalone control vs `-field` reactive form pattern

## API source order (do not skip)

1. **`AGENTS.md` or `AGENTS.ngui.md`** in the app root — **Component Reference** catalog (which packages exist, deprecations)
2. **`node_modules/@cigna/cigna_dae_ngui_library/lib/interfaces/<name>.ts`**
   - Top comment: `## Import`, `## Usage` (HTML examples)
   - Exported `interface`: JSDoc for props (`@defaultValue`, `@group`)
3. **Live docs:** https://library.ngui-dev.aws.cignacloud.com
4. **Dashboards demos** (in repo): `projects/dashboards/src/app/components/<name>/` for composition patterns
5. Implementation only if behavior is unclear: `node_modules/.../lib/<package>/` (templates, not for inventing APIs)

Do **not** guess prop names or events.

## How to read an interface file

```ts
// 1. Comment block — copy Import + Usage into your feature
// 2. export interface Xxx { ... } — public contract for Typedoc and agents
```

Example lookup for a button:

```
node_modules/@cigna/cigna_dae_ngui_library/lib/interfaces/button.ts
```

Import in app code from the path in `## Import`, typically:

```ts
import { ButtonModule } from '@cigna/cigna_dae_ngui_library/lib/button';
```

## Naming exceptions

| Need | Import package | Interface file |
|------|----------------|----------------|
| Date field in reactive form | `lib/calendar-field` (`CalendarFieldModule`) | `interfaces/datepicker-field.ts` |
| Standalone date picker | `lib/date-picker` | `interfaces/datepicker.ts` |
| Header + menu bar | `lib/header`, `lib/menu-bar` | `interfaces/header.ts` (menu examples) |
| Table + action row | `lib/table`, `lib/action-row` | `interfaces/table.ts`, `action-row.ts` |

## Standalone vs `-field`

| Pattern | Selectors | Binding |
|---------|-----------|---------|
| Standalone | `ngui-input`, `ngui-dropdown`, `ngui-checkbox`, … | `[(ngModel)]`, `formControlName`, or `@Input()` |
| Field | `ngui-input-field`, `ngui-select-field`, … | `[group]="form"` + `[config]="fieldConfig"` |

Field config shape: see `interfaces/base-field.ts` and the matching `*-field.ts` file.

## Quick catalog (package folder → interface)

| UI need | Package | Interface file |
|---------|---------|----------------|
| Button | `button` | `button.ts` |
| Card | `card` | `card.ts` |
| Page title band | `page-header` | `page-header.ts` |
| App header | `header` | `header.ts` |
| Drawer | `drawer` | `drawer.ts` |
| Left nav rail (placed within Drawer) | `vertical-nav` | `vertical-nav.ts` |
| Data grid | `table` (+ ag-grid) | `table.ts` |
| Simple table | `simple-table` | `simple-table.ts` |
| Bulk actions row | `action-row` | `action-row.ts` |
| Alert | `alert` | `alert.ts` |
| Dialog | `dialog` | `dialog.ts` |
| Typography | `typography` | (demos; limited interface) |

Full tables are in **`AGENTS.md`** (or **`AGENTS.ngui.md`**) under **Component Reference** — do not maintain a second catalog in skills.

## Deprecated — do not use for new UI

| Avoid | Use instead |
|-------|-------------|
| `progress-bar` | `progress-loader` |
| `content-element` | `typography` |
| `date-range-picker` | `date-picker` or `calendar-field` |
| `sidebar` | `drawer` |

## Variants (common)

- **Card / table / action-row:** `variant="page-level"` (default, elevated) vs `in-element` / `in-container` (embedded)
- Read each interface for exact allowed values

## Related skills

- **ngui-typography** — when to use Canvas `type` / `color` vs plain text in containers; see **ngui-typography** skill
- **ngui-search** — which input/autocomplete/button pattern to use for search, filters, and typeahead
- **ngui-build-feature-page** — compose multiple components on one page
- **ngui-install-and-setup** — styles, ThemeService, and app shell scaffold
