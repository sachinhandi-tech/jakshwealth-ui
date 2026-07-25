---
name: ngui-migrate-to-canvas
description: >-
  Migrates legacy Angular templates from Bootstrap, Material, or custom markup to NGUI Canvas
  components (ngui-button, ngui-card, ngui-table, form fields). Use when converting pages to
  Canvas, replacing btn-primary, mat-button, or raw HTML tables.
disable-model-invocation: true
---

# NGUI migrate to Canvas

## When to use

- Replace Bootstrap / legacy Cigna CSS / raw Material with `ngui-*` components
- Modernize a component template while keeping TS logic
- Align an app with Canvas Design System without Figma files

## Principles

1. **Preserve behavior** — keep component class, services, and form logic unless the user asks to refactor.
2. **Change templates and imports first** — module `imports` / `declarations` as needed.
3. **Look up every target API** via **ngui-component-reference** (`interfaces/<name>.ts`).
4. **Do not migrate to deprecated** NGUI packages (see list below).

## Step 1: Audit the file

Scan the open component `.html` and `.ts` for:

- Buttons (`<button class="btn">`, `mat-button`, `mat-raised-button`)
- Alerts (`alert`, `mat-snack-bar` patterns)
- Cards (`card`, `mat-card`, custom panels)
- Form controls (`input`, `mat-form-field`, `select`)
- Tables (`<table>`, `mat-table`, Kendo grids if replacing with NGUI)
- Navigation chrome (custom header → `ngui-header`)

List findings in the response before editing.

## Step 2: Common mappings

| Legacy pattern | NGUI target | Import from |
|----------------|-------------|-------------|
| Primary button | `<ngui-button alert="primary" label="...">` | `lib/button` |
| Secondary button | `alert="secondary"` | `lib/button` |
| Link styled as button | `<ngui-link label="..." [routerLink]="...">` | `lib/link` |
| Alert banner | `<ngui-alert>` | `lib/alert` |
| Card / panel | `<ngui-card>` + slots | `lib/card` |
| Text heading | `<ngui-typography [type]="'h2'">` | `lib/typography` |
| Text input | `<ngui-input>` or `<ngui-input-field>` | `lib/input` or `lib/input-field` |
| Checkbox | `<ngui-checkbox>` or `<ngui-checkbox-field>` | `lib/checkbox` or `lib/checkbox-field` |
| Select | `<ngui-dropdown>` or `<ngui-select-field>` | `lib/dropdown` or `lib/select-field` |
| HTML `<table>` (rich) | `ngui-table` + `ag-grid-angular` | `lib/table` + ag-grid |
| HTML `<table>` (simple) | `ngui-simple-table` | `lib/simple-table` |
| Progress bar (legacy) | `ngui-progress-loader` | `lib/progress-loader` |
| Sidebar | `ngui-drawer` | `lib/drawer` |

## Step 3: Module updates

For each NGUI component added:

```ts
import { ButtonModule } from '@cigna/cigna_dae_ngui_library/lib/button';
```

Add to `@NgModule({ imports: [...] })` or standalone component `imports: []`.

Remove unused Material/Bootstrap-only modules if nothing else in the file needs them (confirm with user on shared modules).

## Step 4: Forms migration

| Before | After |
|--------|-------|
| `FormGroup` + custom labeled inputs | `ngui-*-field` with `[group]` + `[config]` |
| `[(ngModel)]` on plain `<input>` | `ngui-input` with same binding |
| `mat-form-field` + `matInput` | Matching `ngui-input` or `ngui-input-field` |

Build `config` objects from existing label/name/validators in TS.

## Step 5: Tables migration

**Simple read-only tables:** Start with `ngui-simple-table` and column config from `interfaces/simple-table.ts`.

**Sortable/filterable grids:** Plan `ag-grid-angular` + `ngui-table` wrapper; migrate column defs to AG Grid column API; read `interfaces/table.ts` for chrome (header, pagination, action-row).

Migrate in steps if the table is large: shell first, then column defs, then selection/actions.

## Step 6: Styles cleanup

- Remove redundant Bootstrap utility classes on migrated elements where NGUI provides styling.
- Ensure `angular.json` includes NGUI global stylesheet (**ngui-install-and-setup**).
- Replace hard-coded colors on migrated sections with token variables when adding custom SCSS.

## Step 7: Verify

- [ ] Template compiles
- [ ] Visual check in browser (spacing, focus, disabled states)
- [ ] Form validation still works
- [ ] No deprecated NGUI components introduced

## Do not migrate to (deprecated)

| Legacy NGUI | Replacement |
|-------------|-------------|
| `ngui-progress-bar` | `ngui-progress-loader` |
| `ngui-content-element` | `ngui-typography` |
| `ngui-sidebar` | `ngui-drawer` |
| `ngui-date-range-picker` | `date-picker` / `calendar-field` |

## Related skills

- **ngui-component-reference** — API lookup
- **ngui-build-feature-page** — greenfield page composition
- **ngui-install-and-setup** — if styles are missing after migration
