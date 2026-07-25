---
name: ngui-build-feature-page
description: >-
  Builds or extends an Angular feature page after ngui-install-and-setup: gathers layout
  requirements conversationally, scaffolds Metrics + Table, Drawer + Table, or Metrics +
  Cards Grid templates with ngui-card/table/drawer, registers routes, and updates shell nav.
  Use when adding a screen, dashboard section, CRUD page, or composing ngui components on a
  routed page without Figma.
disable-model-invocation: true
---

# NGUI build feature page

Logical next step after **ngui-install-and-setup**. Use this skill when the user wants a **new routed page** or to **extend an existing page** with NGUI components.

## When to use

- Add a new page after the app shell exists (Home is already scaffolded)
- Extend an existing page with cards, tables, filters, or forms
- Build a dashboard-style section from a ticket or verbal spec (no Figma required)

## Prerequisites

- **ngui-install-and-setup** completed (global styles, app shell, Home route)
- `@cigna/cigna_dae_ngui_library` installed
- For interactive tables: `ag-grid-angular` (or enterprise) installed

## Before coding (always)

1. Read **ngui-component-reference** — open each component’s `interfaces/<name>.ts` before writing markup or TS.
2. Do **not** invent `@Input()` names, events, or module paths.
3. Use **`ngui-typography`** when the design needs a Canvas **type** or **color** not covered by a container default — see **ngui-typography**. Plain text is fine in **`ngui-list-item`**, **`ngui-card`**, **`ngui-drawer`**, **`ngui-dialog`**, **`ngui-accordion`**, and **`ngui-popover`** when default styling is enough.
4. Use **`variant="page-level"`** on page-surface `ngui-card` and `ngui-table`; use **`variant="in-element"`** on `ngui-action-row` and nested tables inside cards.
5. Do **not** use deprecated components: `progress-bar`, `content-element`, `sidebar`, `date-range-picker`.
6. Prefer design tokens (`var(--spacing-default)`, `var(--background-screen-lightest)`) over hard-coded hex in page SCSS.

---

## Step 0: Ask the page layout type

**Do not generate code until the user selects a layout** (or describes option 4).

> **Question 1 — Page layout:**
> Which layout best describes the page you want?
> 1. **Metrics + Table** — stat cards across the top, table below
> 2. **Drawer + Table** — table as main content, with a collapsible relative drawer beside it
> 3. **Metrics + Cards Grid** — stat cards across the top, card grid below
> 4. **Other** — describe your page layout and this skill will adapt

**If the user chose option 2 (Drawer + Table), ask immediately:**

> **Question 1b — Drawer side:**
> Should the collapsible drawer sit on the **left** or **right** of the table?

Record the answers; they drive the template in Step 2.

---

## Step 1: Gather page information and routing

**Do not generate code until you have enough to name the route.**

Ask (combine into one conversational turn when possible):

> **Question 2 — Page details:**
> - **Page title** — display name (for example “Claims”, “Reports”)
> - **Route path** — URL segment (for example `claims` → `/claims`)
> - **Route placement** — is this a **top-level sibling of `/home`** (for example `/claims`), or a **child of an existing route** (for example `/home/settings`)? If nested, which parent route?

**If the user chose a child/nested route, ask immediately:**

> **Question 1c — Child route rendering:**
> When navigating to this child route, should the **parent page's content remain visible** (the parent acts as a persistent shell that hosts the child below its own content), or should the **child fully replace the view** (only the child's content is shown; the parent's content disappears)?

Record the answer — it drives how the parent component and route config are structured in Step 2 and Step 4.

Optional follow-ups when relevant:

- Should the app shell **navigation** include this page? (vertical nav items for Layout A, `mainNavItems` for Layout B from install-and-setup)
- Any real data source yet, or placeholder/mock rows and metrics for now?

### Routing rules

- Scaffold **one new page component** per request unless the user asks for multiple.
- Default redirect remains `'' → home`; new routes are **siblings or children**, not replacements for Home.
- Use route `data` for labels when the app uses `RouterConfigMenuService` or manual nav arrays:

```ts
{ path: 'claims', component: ClaimsComponent, data: { label: 'Claims', icon: 'description' } }
```

### Shell navigation updates (when user wants nav entries)

| Install layout | Where to add the new link |
|----------------|---------------------------|
| **A** — Left rail (`sideNavItems`) | `{ label: 'Claims', routerLink: '/claims', icon: '…' }` |
| **B** — Menu bar (`mainNavItems`) | `{ label: 'Claims', routerLink: '/claims' }` — `selectedRootItem` must match the active root **label** |
| **C** — Header only | No shell nav array; rely on in-page links or add menu bar later |

**When adding a child route**, nest the new nav item inside the **parent item's `items` array** rather than appending it as a flat sibling. Both `ngui-vertical-nav` and `ngui-menu-bar` support nested `MenuItem[]` via the `items` property:

**Layout A (`sideNavItems`) — nested child:**

```ts
sideNavItems: MenuItem[] = [
  {
    label: 'Parent', routerLink: '/parent', icon: 'folder',
    items: [
      { label: 'Child Page', routerLink: '/parent/child', icon: 'description' }
    ]
  }
];
```

**Layout B (`mainNavItems`) — nested child:**

```ts
mainNavItems = [
  {
    label: 'Parent',
    items: [
      { label: 'Child Page', routerLink: '/parent/child' }
    ]
  }
];
```

Read the existing array from the shell component before editing — find the parent entry and add the child to its `items` array. If the parent entry does not yet have an `items` property, add one.

Do **not** add extra placeholder routes (for example `/reports`) unless the user explicitly requests them.

---

## Step 2: Generate the page

Implement in this order:

1. **Feature component** — `*.component.ts`, `*.component.html`, `*.component.scss` (and spec if the project already uses them)
2. **Template** — apply the layout from Step 0 (see templates below)
3. **Route** — register in `app.routes.ts` (or feature routing module)
4. **Navigation** — update `sideNavItems` / `mainNavItems` when requested
5. **Module imports** — add only what the template uses

Feature page content renders inside the shell’s `<router-outlet>`. The shell usually already provides `<ngui-page-header>` + breadcrumbs; set **`pageTitle`** on the shell header via route data or add a page-level title inside the feature template when the shell does not expose one.

---

## Shared: metric stat card

Reusable KPI tile for layout templates. **Do not add `ngui-icon`** to scaffold cards.

When a card uses **`ngui-slot-top`** or **`ngui-slot-bottom`**, set **`[borderHeader]="false"`** and **`[borderFooter]="false"`** on that `ngui-card`.

| Card region | Typography |
|-------------|------------|
| Title (in `ngui-slot-top`) | `type="h4"` |
| Metric (card body) | `type="display-1"` |
| Label (card body) | `type="display-3"` with `color="accent"` |

```html
<ngui-card variant="page-level" [borderHeader]="false" [borderFooter]="false" class="metric-card">
  <ngui-slot-top>
    <ngui-typography type="h4">{{ title }}</ngui-typography>
  </ngui-slot-top>
  <ngui-typography type="display-1">{{ metric }}</ngui-typography>
  <ngui-typography type="display-3" color="accent">{{ label }}</ngui-typography>
</ngui-card>
```

Use placeholder strings (`Title`, `Metric`, `Label`) until the user supplies real copy or data bindings.

---

## Template 1: Metrics + Table

**Structure:** one row of **four** equal-width stat cards, then a **page-level** `ngui-table` below. Outer padding and gaps use **`var(--spacing-default)`**.

### HTML

```html
<section class="feature-page">
  <div class="metrics-row">
    <ngui-card *ngFor="let m of metrics" variant="page-level" [borderHeader]="false" [borderFooter]="false" class="metric-card">
      <ngui-slot-top>
        <ngui-typography type="h4">{{ m.title }}</ngui-typography>
      </ngui-slot-top>
      <ngui-typography type="display-1">{{ m.value }}</ngui-typography>
      <ngui-typography type="display-3" color="accent">{{ m.label }}</ngui-typography>
    </ngui-card>
  </div>

  <ngui-table variant="page-level" class="feature-table" [ariaLabel]="tableAriaLabel">
    <ngui-table-header [tableHeader]="tableHeader"></ngui-table-header>
    <ag-grid-angular
      class="w-100"
      domLayout="autoHeight"
      [columnDefs]="columnDefs"
      [defaultColDef]="defaultColDef"
      [rowData]="rowData">
    </ag-grid-angular>
  </ngui-table>
</section>
```

### SCSS

```scss
.feature-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-default);
  padding: var(--spacing-default);
  min-height: 0;
}

.metrics-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--spacing-default);
}

.feature-table {
  width: 100%;
}
```

### TS (minimal)

```ts
metrics = [
  { title: 'Title', value: 'Metric', label: 'Label' },
  { title: 'Title', value: 'Metric', label: 'Label' },
  { title: 'Title', value: 'Metric', label: 'Label' },
  { title: 'Title', value: 'Metric', label: 'Label' },
];

tableHeader = 'Results';
tableAriaLabel = 'Results table';
columnDefs = [
  { field: 'name', headerName: 'Name', flex: 1, minWidth: 160 },
  { field: 'status', headerName: 'Status', minWidth: 120 },
];
defaultColDef = { suppressHeaderMenuButton: true, suppressMovable: true };
rowData = [
  { name: 'Example row', status: 'Active' },
];
```

---

## Template 2: Drawer + Table

**Structure:** horizontal flex row — **collapsible relative `ngui-drawer`** (filters or secondary content) beside a **page-level `ngui-table`**. Padding on the page wrapper: **`var(--spacing-default)`**.

Use **`[dismissible]="true"`**, **`[(visible)]="drawerExpanded"`**, **`[modal]="false"`**, **`position="relative"`**. Set **`direction`** to `'left'` or `'right'` from Step 0 question 1b. Do **not** use `ngui-vertical-nav` here — this drawer is for page-local content (filters, details), not app shell navigation.

### HTML

```html
<section class="feature-page feature-page--drawer-table">
  <ngui-drawer
    [(visible)]="drawerExpanded"
    [position]="'relative'"
    [dismissible]="true"
    [modal]="false"
    [direction]="drawerSide"
    title="Filters"
    width="280px"
    class="feature-drawer">
    <div class="feature-drawer__body">
      <!-- Placeholder filter fields — replace with ngui-input-field / ngui-dropdown as needed -->
      <ngui-typography type="ui-emphasis">Filters</ngui-typography>
      <ngui-typography type="ui" color="accent">Add filter controls here.</ngui-typography>
    </div>
  </ngui-drawer>

  <div class="feature-main">
    <ngui-table variant="page-level" class="feature-table" [ariaLabel]="tableAriaLabel">
      <ngui-table-header [tableHeader]="tableHeader"></ngui-table-header>
      <ag-grid-angular
        class="w-100"
        domLayout="autoHeight"
        [columnDefs]="columnDefs"
        [defaultColDef]="defaultColDef"
        [rowData]="rowData">
      </ag-grid-angular>
    </ngui-table>
  </div>
</section>
```

### SCSS

```scss
.feature-page--drawer-table {
  display: flex;
  flex-direction: row;
  gap: 0;
  padding: var(--spacing-default);
  min-height: 0;
  align-items: stretch;
}

.feature-page--drawer-table.drawer-right {
  flex-direction: row-reverse;
}

.feature-drawer {
  flex-shrink: 0;
}

.feature-drawer__body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-small-08);
  padding: var(--spacing-small-08);
}

.feature-main {
  flex: 1 1 0;
  min-width: 0;
}

.feature-table {
  width: 100%;
}
```

Add class `drawer-right` on the section host when `drawerSide === 'right'`.

### TS (minimal)

```ts
drawerExpanded = true;
drawerSide: 'left' | 'right' = 'left'; // set from user answer

tableHeader = 'Results';
tableAriaLabel = 'Results table';
columnDefs = [{ field: 'name', headerName: 'Name', flex: 1 }];
defaultColDef = { suppressHeaderMenuButton: true };
rowData = [{ name: 'Example row' }];
```

---

## Template 3: Metrics + Cards Grid

**Structure:**

- **Row 1:** three metric stat cards (same pattern as Template 1, but **three** columns)
- **Row 2:** three-column grid — **two content cards** with **`ngui-list`** key-value rows, **right column** stacks **two** metric cards vertically

Matches the common dashboard pattern: KPIs on top, mixed content + stacked KPIs below.

### HTML

```html
<section class="feature-page">
  <div class="metrics-row metrics-row--three">
    <ngui-card *ngFor="let m of topMetrics" variant="page-level" [borderHeader]="false" [borderFooter]="false" class="metric-card">
      <ngui-slot-top>
        <ngui-typography type="h4">{{ m.title }}</ngui-typography>
      </ngui-slot-top>
      <ngui-typography type="display-1">{{ m.value }}</ngui-typography>
      <ngui-typography type="display-3" color="accent">{{ m.label }}</ngui-typography>
    </ngui-card>
  </div>

  <div class="cards-grid-row">
    <ngui-card *ngFor="let block of contentBlocks" variant="page-level" [borderHeader]="false" [borderFooter]="false" class="content-card">
      <ngui-slot-top>
        <ngui-typography type="h4">{{ block.title }}</ngui-typography>
      </ngui-slot-top>
      <ngui-list>
        <ngui-list-item *ngFor="let row of block.rows">
          {{ row.left }}
          <ngui-slot-right>{{ row.right }}</ngui-slot-right>
        </ngui-list-item>
      </ngui-list>
    </ngui-card>

    <div class="cards-grid-stack">
      <ngui-card *ngFor="let m of sideMetrics" variant="page-level" [borderHeader]="false" [borderFooter]="false" class="metric-card">
        <ngui-slot-top>
          <ngui-typography type="h4">{{ m.title }}</ngui-typography>
        </ngui-slot-top>
        <ngui-typography type="display-1">{{ m.value }}</ngui-typography>
        <ngui-typography type="display-3" color="accent">{{ m.label }}</ngui-typography>
      </ngui-card>
    </div>
  </div>
</section>
```

### SCSS

```scss
.feature-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-default);
  padding: var(--spacing-default);
}

.metrics-row--three {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--spacing-default);
}

.cards-grid-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--spacing-default);
  align-items: stretch;
}

.cards-grid-stack {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-default);
}
```

### TS (minimal)

```ts
topMetrics = [
  { title: 'Title', value: 'Metric', label: 'Label' },
  { title: 'Title', value: 'Metric', label: 'Label' },
  { title: 'Title', value: 'Metric', label: 'Label' },
];

contentBlocks = [
  {
    title: 'Text',
    rows: [
      { left: 'Left Label', right: 'Right Label' },
      { left: 'Left Label', right: 'Right Label' },
    ],
  },
  {
    title: 'Text',
    rows: [
      { left: 'Left Label', right: 'Right Label' },
      { left: 'Left Label', right: 'Right Label' },
    ],
  },
];

sideMetrics = [
  { title: 'Title', value: 'Metric', label: 'Label' },
  { title: 'Title', value: 'Metric', label: 'Label' },
];
```

---

## Template 4: Other

When the user selects **Other**:

1. Restate the described layout in your own words and confirm before coding.
2. Reuse primitives from Templates 1–3 (`ngui-card`, `ngui-table`, `ngui-drawer`, `ngui-list`, slots, typography).
3. Keep spacing on **`var(--spacing-default)`** unless the user specifies otherwise.
4. Still complete Step 1 routing and register a single new route.

---

## Step 3: Module imports

Import only what the chosen template needs. Read each package’s `## Import` block in `interfaces/<name>.ts`.

**Common for all templates:**

```ts
import { CardModule } from '@cigna/cigna_dae_ngui_library/lib/card';
import { TypographyModule } from '@cigna/cigna_dae_ngui_library/lib/typography';
import { CommonModule } from '@angular/common';
```

**Metrics + Cards Grid only:**

```ts
import { ListModule } from '@cigna/cigna_dae_ngui_library/lib/list';
```

**Metrics + Table and Drawer + Table:**

```ts
import { TableModule } from '@cigna/cigna_dae_ngui_library/lib/table';
import { AgGridAngular } from 'ag-grid-angular';
```

**Drawer + Table only:**

```ts
import { DrawerModule } from '@cigna/cigna_dae_ngui_library/lib/drawer';
```

`ActionRowComponent` is standalone — import directly when adding bulk actions above a grid.

---

## Step 4: Register the route

```ts
// app.routes.ts — example top-level sibling of home
export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'claims', component: ClaimsComponent, data: { label: 'Claims' } },
];
```

**Nested example** (child of `home`):

```ts
{
  path: 'home',
  component: HomeComponent,
  children: [
    { path: 'settings', component: SettingsComponent, data: { label: 'Settings' } },
  ],
},
```

**Child route rendering — two modes (from Question 1c):**

| Mode | Route config | Parent component |
|------|-------------|------------------|
| **Fully replace** — child takes over the full view | Use `children` array. Strip parent template to only `<router-outlet>`. | Import `RouterOutlet`; template contains **only** `<router-outlet>` — no page content |
| **Parent stays visible** — child renders below parent content | Use `children` array as-is. Append `<router-outlet>` at the bottom of the parent template. | Import `RouterOutlet`; add `<router-outlet>` at end of existing template |

**Fully replace — convert parent to a passthrough shell:**

```ts
// parent.ts — stripped to a URL-namespace shell
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-parent',
  imports: [RouterOutlet],
  template: '<router-outlet></router-outlet>',
})
export class ParentComponent {}
```

**⚠ If the parent already has a full-content template and the user wants "fully replace" mode**, confirm with the user before removing the parent's content — the parent component becomes a URL-namespace shell only.

Wire lazy loading only if the existing app already uses it.

---

## Reference: Forms on a page

**Reactive form with field components** (enterprise CRUD):

```html
<form [formGroup]="form">
  <ngui-input-field [group]="form" [config]="emailField"></ngui-input-field>
  <ngui-select-field [group]="form" [config]="statusField"></ngui-input-field>
</form>
```

Import `ReactiveFormsModule` and the relevant `*FieldModule` packages. See `interfaces/base-field.ts`.

**Standalone controls** (filters in a drawer):

```html
<ngui-input [label]="'Search'" [(ngModel)]="search"></ngui-input>
```

---

## Reference: Tables and lists

| Need | Approach |
|------|----------|
| Interactive sort/filter/select | `ngui-table` + `ag-grid-angular` — set **`ariaLabel`** on `ngui-table` |
| Read-only tabular data (many columns/rows) | `ngui-simple-table` — no AG Grid |
| Static one- or two-column data (key-value pairs, glanceable rows) | **`ngui-list`** + **`ngui-list-item`** — plain text labels; use **`ngui-slot-right`** to right-align the second column. **`ngui-list-item`** applies **`--type-ui-default`** automatically — no **`ngui-typography`** needed for scaffold rows. |

Inside `ngui-table`, project **`ngui-action-row`** with **`variant="in-element"`** before `ag-grid-angular` for bulk actions. See `interfaces/table.ts` and `interfaces/action-row.ts`.

**List example** (common in content cards — Template 3):

```html
<ngui-list>
  <ngui-list-item>
    Left Label
    <ngui-slot-right>Right Label</ngui-slot-right>
  </ngui-list-item>
</ngui-list>
```

Add **`ngui-typography`** to list rows only when you need a non-default type or **`color`** (for example `color="accent"` on the right value).

Import `ListModule` from `lib/list`. See `interfaces/list.ts`.

---

## Reference: Cards and slots

When using **`ngui-slot-top`** or **`ngui-slot-bottom`**, set **`[borderHeader]="false"`** and **`[borderFooter]="false"`** on the card.

```html
<ngui-card variant="page-level" [borderHeader]="false" [borderFooter]="false">
  <ngui-slot-top>
    <ngui-typography type="h4">Section title</ngui-typography>
  </ngui-slot-top>
  <!-- body content -->
  <ngui-slot-bottom>
    <ngui-button label="Save" alert="primary"></ngui-button>
  </ngui-slot-bottom>
</ngui-card>
```

Nested inside another card: `variant="in-container"` on `ngui-card`.

---

## Reference: Feedback and empty states

| Need | Component | Interface |
|------|-----------|-----------|
| Page banner below header | `ngui-alert` | `alert.ts` |
| Inline message | `ngui-message` | `message.ts` |
| Modal | `ngui-dialog` | `dialog.ts` |
| Toast | `ToastsService` / `ngui-toasts` | `toast.ts` |
| Loading | `ngui-spinner`, `ngui-progress-loader` | `spinner.ts`, `progress-loader.ts` |
| Empty table/page | `ngui-empty-state` | `empty-state.ts` |

---

## Verification

Run `ng serve` and confirm:

- [ ] User was asked **layout type** (Step 0) and **page title / route / placement** (Step 1) before code was written
- [ ] Exactly **one** new page route added (no extra placeholder routes unless requested)
- [ ] Selected template matches the layout choice (4 metric cards + table, drawer + table, or 3 + grid row)
- [ ] Drawer + Table: `[dismissible]="true"`, `[modal]="false"`, `position="relative"`, correct `direction`
- [ ] All `ngui-*` modules imported; AG Grid installed when using `ag-grid-angular`
- [ ] Metric cards use `ngui-typography` for title (`h4`), metric (`display-1`), and label (`display-3` + `color="accent"`)
- [ ] Cards with `ngui-slot-top` / `ngui-slot-bottom` have `[borderHeader]="false"` and `[borderFooter]="false"`
- [ ] Scaffold templates do not include `ngui-icon` unless the user explicitly requests icons
- [ ] Metrics + Cards Grid content cards use `ngui-list` with plain text labels (no `ngui-typography` unless a non-default type or color is needed)
- [ ] Table has `ariaLabel`; variants consistent (`page-level` vs `in-element`)
- [ ] Shell nav updated when user requested it (Layout A / B)
- [ ] Child routes: new nav item is **nested inside the parent item's `items` array** in `sideNavItems` / `mainNavItems` — not appended as a flat sibling
- [ ] Child routes (fully replace): parent template contains **only** `<router-outlet>`; no page content renders alongside the child
- [ ] Child routes (parent stays visible): parent imports `RouterOutlet`; `<router-outlet>` at the bottom of the parent template
- [ ] Page loads without template or console errors

---

## Related skills

- **ngui-install-and-setup** — app shell (run first)
- **ngui-component-reference** — per-component API lookup
- **ngui-typography** — text type selection
- **ngui-migrate-to-canvas** — replacing legacy markup on an existing page
