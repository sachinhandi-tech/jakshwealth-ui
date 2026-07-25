---
name: ngui-install-and-setup
description: >-
  Sets up a new Canvas Angular app end-to-end: installs @cigna/cigna_dae_ngui_library, configures global styles and dark theme assets, scaffolds the app shell (header, drawer, nav, or menu bar), and wires ThemeService. Use when creating a new app, building a dashboard, scaffolding a layout shell, or fixing missing styles, icons, tokens, or dark mode errors.
disable-model-invocation: true
---

# NGUI install and setup

## When to use

- Creating any new Angular app with Canvas components
- Scaffolding an app layout (header, navigation, main content)
- First-time install of `@cigna/cigna_dae_ngui_library`
- Fixing missing styles, icons, or tokens
- Enabling Canvas vs Evernorth branding or light/dark mode

> **Scope — new apps only:** The shell scaffold, routing, and breadcrumbs wiring in Steps 4–9 apply to **new Angular apps** being set up end-to-end.
> - **Adding ngui to an existing app:** Follow Steps 1–3 (package and styles) and add only the specific module imports from Step 4 that you need. Do not alter existing routes, app structure, or add shell scaffolding.
> - **Using ngui for components only (no layout):** Follow Steps 1–3 and the relevant module imports — no routing or service wiring required.

## Prerequisites

- Angular 19 or 20
- Access to Cigna Artifactory npm registry

---

## Step 0: Ask three required questions before writing any code

**Do not proceed until all three are answered.**

> **Question 1 — Theme:**
> Which design system bundle should this app use?
> - **Canvas** (default / Cigna branding) — `styles.min.css`
> - **Evernorth** — `styles.evernorth.min.css`

> **Question 2 — Dark mode:**
> Does this app need a dark-mode toggle in the header?
> - **Yes** — wire `ThemeService` and copy dark theme assets
> - **No** — skip dark theme setup

> **Question 3 — Layout:**
> Which shell layout do you need?
> - **A) Header + Left Rail Navigation** — persistent collapsible left drawer with `ngui-vertical-nav`
> - **B) Header + Menu Bar Navigation** — `ngui-menu-bar` in the header for section routing, no side rail
> - **C) Header only** — top bar with no side navigation
> - **D) Other** — describe your layout and this skill will adapt

Use answers to drive all code choices (imports, template, SCSS, ThemeService).

---

## Step 1: Registry and package

```bash
npm config set registry "https://cigna.jfrog.io/artifactory/api/npm/npm-repos"
npm install @cigna/cigna_dae_ngui_library
```

For **interactive tables**, also install AG Grid:

```bash
npm install ag-grid-angular
# or ag-grid-enterprise per team license
```

---

## Step 2: Global stylesheet (`angular.json`)

Apply under `projects.<your-app>.architect.build.options.styles` **and** `projects.<your-app>.architect.test.options.styles`.

**Canvas:**

```json
"styles": [
  "node_modules/@cigna/cigna_dae_ngui_library/assets/styles.min.css"
]
```

**Evernorth:**

```json
"styles": [
  "node_modules/@cigna/cigna_dae_ngui_library/assets/styles.evernorth.min.css"
]
```

---

## Step 2b: App logo

Copy the packaged placeholder logo into the app:

```bash
mkdir -p src/assets/images
cp node_modules/@cigna/cigna_dae_ngui_library/assets/app-shell-logo.svg src/assets/images/app-shell-logo.svg
```

Ensure `angular.json` assets include `src/assets`. Use a custom logo only when the user provides one. Reference in templates as `assets/images/app-shell-logo.svg`. Never reference internal NGUI repo paths such as `projects/dashboards/...`.

---

## Step 3: Copy dark theme files (required when dark mode is Yes)

`ThemeService.applyColorMode(true)` loads `assets/themes/canvas_dark.css` (or `evernorth_dark.css`) at runtime. These files must be copied into the build output.

Add to `angular.json` `assets` (build **and** test):

```json
{
  "glob": "**/*",
  "input": "node_modules/@cigna/cigna_dae_ngui_library/assets/themes",
  "output": "assets/themes"
}
```

Without this, dark mode fails with a MIME type error (`text/html` instead of CSS).

---

## Step 4: Module imports

Choose based on the layout answer from Step 0. Always import `FormsModule` for `ngModel` bindings.

**All layouts:**

```ts
import { HeaderModule } from '@cigna/cigna_dae_ngui_library/lib/header';
import { PageHeaderModule } from '@cigna/cigna_dae_ngui_library/lib/page-header';
import { BreadcrumbsModule } from '@cigna/cigna_dae_ngui_library/lib/breadcrumbs';
import { SwitchModule } from '@cigna/cigna_dae_ngui_library/lib/switch';
import { IconModule } from '@cigna/cigna_dae_ngui_library/lib/icon';
import { AvatarModule } from '@cigna/cigna_dae_ngui_library/lib/avatar';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
```

**Layout A only (left rail nav):**

```ts
import { DrawerModule } from '@cigna/cigna_dae_ngui_library/lib/drawer';
import { VerticalNavModule } from '@cigna/cigna_dae_ngui_library/lib/vertical-nav';
```

**Layout B only (menu bar):**

```ts
import { MenuBarModule } from '@cigna/cigna_dae_ngui_library/lib/menu-bar';
```

---

## Step 5: App template

Use the template that matches the layout chosen in Step 0.

### Layout A — Header + Left Rail Navigation

```html
<ngui-header>
  <ngui-header-left>
    <ngui-header-logo appName="My Application" [routerLink]="'/'">
      <img height="24" width="24" src="assets/images/app-shell-logo.svg" alt="My Application logo" />
    </ngui-header-logo>
  </ngui-header-left>
  <ngui-header-right>
    <!-- dark mode toggle if needed -->
    <ngui-avatar initials="AB" userName="User Name"></ngui-avatar>
  </ngui-header-right>
</ngui-header>

<section class="app-page-container">
  <ngui-drawer
    [visible]="true"
    position="relative"
    direction="left"
    [shadow]="true"
    [modal]="false"
    [dismissible]="false"
    width="280px"
    class="app-drawer"
    role="navigation">
    <ngui-vertical-nav
      [items]="sideNavItems"
      [fillHeight]="true"
      [panelWidth]="'280px'"
      collapseButton="top"
      [showIconsOnCollapse]="true"
      [(collapse)]="navCollapsed">
    </ngui-vertical-nav>
  </ngui-drawer>

  <main class="app-main" role="main">
    <ngui-page-header [pageTitle]="currentPageTitle">
      <ngui-breadcrumbs></ngui-breadcrumbs>
    </ngui-page-header>
    <div class="app-page-content">
      <router-outlet></router-outlet>
    </div>
  </main>
</section>
```

**Critical rules for the nav rail drawer:**

- **`[visible]="true"`** is required. `ngui-drawer` sets `display: none` when `visible` is unset or `false`. For a permanent nav rail this must always be `true`. Do not bind it to a variable — `ngui-vertical-nav` handles visual collapse independently via `collapseButton`.
- **`[dismissible]="false"`** — collapse via `ngui-vertical-nav` only; the drawer's dismissible toggle hides slot content and breaks `showIconsOnCollapse`.
- **`[modal]="false"`** — modal applies to `fixed` overlays only, not relative rails.
- **`panelWidth`** on the nav must match drawer `width` (both `280px` or both `'100%'`).
- Relative rails default to `zIndex` 2000 (below `ngui-header` at 2001).

### Layout B — Header + Menu Bar Navigation

```html
<ngui-header>
  <ngui-header-left>
    <ngui-header-logo appName="My Application" [routerLink]="'/'">
      <img height="24" width="24" src="assets/images/app-shell-logo.svg" alt="My Application logo" />
    </ngui-header-logo>
    <ngui-menu-bar
      [items]="mainNavItems"
      [selectable]="true"
      [(selectedRootItem)]="selectedNav">
    </ngui-menu-bar>
  </ngui-header-left>
  <ngui-header-right>
    <!-- dark mode toggle if needed -->
    <ngui-avatar initials="AB" userName="User Name"></ngui-avatar>
  </ngui-header-right>
</ngui-header>

<main class="app-main" role="main">
  <ngui-page-header [pageTitle]="currentPageTitle">
    <ngui-breadcrumbs></ngui-breadcrumbs>
  </ngui-page-header>
  <div class="app-page-content">
    <router-outlet></router-outlet>
  </div>
</main>
```

Initialize **`selectedNav`** to **`'Home'`** so the Home root item is selected on first load. The value must match the Home item **`label`** exactly.

### Layout C — Header only

```html
<ngui-header>
  <ngui-header-left>
    <ngui-header-logo appName="My Application" [routerLink]="'/'">
      <img height="24" width="24" src="assets/images/app-shell-logo.svg" alt="My Application logo" />
    </ngui-header-logo>
  </ngui-header-left>
  <ngui-header-right>
    <!-- dark mode toggle if needed -->
  </ngui-header-right>
</ngui-header>

<main class="app-main" role="main">
  <ngui-page-header [pageTitle]="currentPageTitle">
    <ngui-breadcrumbs></ngui-breadcrumbs>
  </ngui-page-header>
  <div class="app-page-content">
    <router-outlet></router-outlet>
  </div>
</main>
```

### Dark mode toggle (add to `ngui-header-right` when dark mode is Yes)

No `label` prop — use `ariaLabel` and a projected `ngui-icon`. Spacing between the switch and icon is handled by the library; do not add Bootstrap utility classes.

```html
<ngui-switch
  [ariaLabel]="darkmode ? 'Disable dark mode' : 'Enable dark mode'"
  [(ngModel)]="darkmode"
  (ngModelChange)="onDarkModeChange($event)">
  <ngui-icon
    [matIcon]="darkmode ? 'dark_mode' : 'light_mode'"
    [matFill]="true"></ngui-icon>
</ngui-switch>
```

---

## Step 6: Host SCSS

```scss
:host {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-height: 100%;
  min-height: 0;
  overflow: hidden;
  box-sizing: border-box;
}

/* Layout A only */
.app-page-container {
  display: flex;
  flex-direction: row;
  flex: 1 1 0;
  min-height: 0;
  gap: 0;
  box-sizing: border-box;
}

.app-drawer {
  flex-shrink: 0;
}

/* All layouts */
.app-main {
  flex: 1 1 0;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior-y: contain;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.app-page-content {
  flex: 1 1 0;
  min-height: 0;
  padding: var(--spacing-default);
}

@media (max-width: 768px) {
  .app-page-container {
    flex-direction: column;
  }
}
```

---

## Step 7: Component class

```ts
import {
  NguiThemeFamily,
  ThemeService,
  RouterConfigMenuService,
  RouterDataService,
} from '@cigna/cigna_dae_ngui_library/lib/services';
import { MenuItem } from '@cigna/cigna_dae_ngui_library/lib/interfaces';

export class AppComponent implements OnInit {
  /** Set from Step 0 Question 1 */
  themeFamily: NguiThemeFamily = 'canvas'; // or 'evernorth'

  /** Only needed when dark mode is Yes (Step 0 Question 2) */
  darkmode = false;

  currentPageTitle = '';

  /** Layout A only */
  navCollapsed = false;
  sideNavItems: MenuItem[] = [
    { label: 'Home', routerLink: '/home', icon: 'home' },
  ];

  /** Layout B only — scaffold one Home item; add more routes later via ngui-build-feature-page */
  mainNavItems = [{ label: 'Home', routerLink: '/home' }];
  selectedNav = 'Home';

  constructor(
    private themeService: ThemeService,
    private routerConfigMenuService: RouterConfigMenuService,
    private routerDataService: RouterDataService) {}

  ngOnInit(): void {
    this.themeService.setThemeFamily(this.themeFamily);

    // Dynamic breadcrumbs — always include these two lines
    this.routerConfigMenuService.generateRouterMenu();
    this.routerDataService.breadcrumbs.subscribe(routes => {
      const crumbs = routes.filter(r => r.path && r.data?.['label']);
      this.currentPageTitle = crumbs[crumbs.length - 1]?.data?.['label'] ?? '';
    });

    // Only include the block below when dark mode is Yes
    const stored = this.themeService.localStorageTheme();
    this.darkmode =
      stored === 'dark_mode' ||
      (!localStorage.getItem('canvas_theme') && this.prefersDark());
    this.onDarkModeChange(this.darkmode);
  }

  /** Only needed when dark mode is Yes */
  onDarkModeChange(isDark: boolean): void {
    this.darkmode = isDark;
    this.themeService.applyColorMode(isDark);
    localStorage.setItem('canvas_theme', isDark ? 'dark_mode' : 'light_mode');
  }

  private prefersDark(): boolean {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
}
```

Use **`applyColorMode`** + **`setThemeFamily`**. The older `upsert('dark_mode')` API is Canvas-only; prefer `applyColorMode` for all new apps.

---

## Step 8: Routing

Scaffold **one Home page only** for every layout. Do not add placeholder routes (for example Reports) during install — use **ngui-build-feature-page** for additional pages later.

```ts
// app.routes.ts
export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent, data: { label: 'Home' } },
];
```

Add `RouterModule.forRoot(routes)` (NgModule) or configure via `ApplicationConfig` (standalone). Feature pages render in `<router-outlet>` inside `app-main`.

---

## Step 9: Verify

Run `ng serve` and confirm:

- [ ] User was asked **Canvas vs Evernorth**, **dark mode**, and **layout** before code was written
- [ ] Logo copies to `assets/images/app-shell-logo.svg` (or custom logo in place)
- [ ] Correct `styles` entry in `angular.json` (build + test)
- [ ] `assets/themes` copy entry present when dark mode is Yes
- [ ] For layout A: `ngui-drawer` has `[visible]="true"`, `[dismissible]="false"`, `[modal]="false"`
- [ ] For layout A: `ngui-vertical-nav` has `[fillHeight]="true"` and `[panelWidth]` matching drawer `width`
- [ ] For layout B: `mainNavItems` has one Home item and `selectedNav` is `'Home'`
- [ ] Drawer visually below header (default z-index 2000 vs header 2001)
- [ ] Dark mode toggle works without MIME errors in the console
- [ ] App builds and routes to home page
- [ ] Home route has `data: { label: 'Home' }` set
- [ ] `RouterConfigMenuService.generateRouterMenu()` called in `ngOnInit`
- [ ] `ngui-page-header` has `[pageTitle]="currentPageTitle"` bound
- [ ] Breadcrumbs hide on root, appear correctly on child routes

---

## Optional: runtime brand switching (Canvas ↔ Evernorth)

Only when the product needs to switch brands at runtime:

1. Copy both base bundles to `assets/`:

```json
{
  "glob": "styles*.min.css",
  "input": "node_modules/@cigna/cigna_dae_ngui_library/assets",
  "output": "assets"
}
```

2. Still copy `assets/themes` per Step 3.

3. In `index.html`, load the initial bundle via a link the app can swap:

```html
<link id="ngui-base-stylesheet" rel="stylesheet" href="assets/styles.min.css" />
```

4. On brand change, update `link#ngui-base-stylesheet` href, call `setThemeFamily`, then re-apply `applyColorMode(darkmode)`.

Reference: `projects/dashboards/src/app/app.component.ts` (`onThemeFamilyChange`, `updateBaseStylesheet`).

---

## After setup

Use **ngui-build-feature-page** to add individual routed pages (cards, forms, tables) to the shell you just created.

Use **ngui-component-reference** to look up any `ngui-*` component API before using it.
