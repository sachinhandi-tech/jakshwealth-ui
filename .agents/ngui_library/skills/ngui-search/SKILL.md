---
name: ngui-search
description: >-
  Chooses the right Canvas components for adding search to a page — free-text input,
  autocomplete with suggestions, reactive form fields, or an expandable icon button.
  Use when implementing search, filter boxes, typeahead, or toolbar search patterns.
disable-model-invocation: true
---

# NGUI search patterns

## When to use

- Adding a search box, filter field, or typeahead to a page or toolbar
- Choosing between `ngui-input`, `ngui-autocomplete`, and their `-field` variants
- Implementing a collapsed search button that expands to a full field (space-constrained toolbars)

Canvas has **no** `ngui-search` package. Search is a **composition** of existing input and button components.

**Live demo:** dashboards `/components/search`  
**Source:** `projects/dashboards/src/app/components/search/`

## Decision guide

| User need | Component | Binding |
|-----------|-----------|---------|
| Free-text query; filter list/table/API on change or Enter | `ngui-input` | `type="search"`, `iconLeft="search"`, `[(ngModel)]` or `formControlName` |
| Pick from suggested values while typing | `ngui-autocomplete` | `[suggestions]` filtered in `(completeMethod)` |
| Same as above inside a reactive form with labels/hints/errors | `ngui-input-field` / `ngui-autocomplete-field` | `[group]` + `[config]`; autocomplete uses `(keyboardSearch)` |
| Save toolbar space until user searches | `ngui-button` → reveal input | Icon-only button; toggle visibility on `(buttonClick)` |

Read exact props in:

- `lib/interfaces/input.ts`
- `lib/interfaces/autocomplete.ts`
- `lib/interfaces/input-field.ts`
- `lib/interfaces/autocomplete-field.ts`
- `lib/interfaces/button.ts`

## Standalone free-text search

```html
<ngui-input
  type="search"
  iconLeft="search"
  placeholder="Search"
  width="100%"
  ariaLabel="Search"
  [(ngModel)]="query">
</ngui-input>
```

```ts
import { InputModule } from '@cigna/cigna_dae_ngui_library/lib/input';
```

Wire filtering on `ngModelChange` (debounced), `(keyup.enter)`, or a dedicated search button elsewhere on the page.

## Standalone search with suggestions

```html
<ngui-autocomplete
  placeholder="Search"
  width="100%"
  [(ngModel)]="selected"
  [suggestions]="suggestions"
  [showEmptyMessage]="true"
  emptyMessage="No results found"
  (completeMethod)="filterSuggestions($event)">
</ngui-autocomplete>
```

```ts
filterSuggestions(event: { query: string }): void {
  const q = (event.query ?? '').trim().toLowerCase();
  this.suggestions = q
    ? this.allItems.filter((item) => item.toLowerCase().includes(q))
    : [];
}
```

```ts
import { AutocompleteModule } from '@cigna/cigna_dae_ngui_library/lib/autocomplete';
```

## Reactive form fields

Use when the screen already uses `FormGroup`, validation, hints, and error messages.

```html
<form [formGroup]="form">
  <ngui-input-field [group]="form" [config]="searchField"></ngui-input-field>
  <ngui-autocomplete-field
    [group]="form"
    [config]="typeaheadField"
    [suggestions]="suggestions"
    (keyboardSearch)="filterSuggestions($event)">
  </ngui-autocomplete-field>
</form>
```

```ts
searchField: InputField = {
  label: 'Search',
  name: 'query',
  placeholder: 'Search',
  type: 'search',
  icon: 'search',
  iconPos: 'left',
};
```

```ts
import { InputFieldModule } from '@cigna/cigna_dae_ngui_library/lib/input-field';
import { AutocompleteFieldModule } from '@cigna/cigna_dae_ngui_library/lib/autocomplete-field';
```

## Expandable button (collapsed toolbar search)

Start with an icon-only primary button; reveal any search control on click.

```html
<ngui-button
  *ngIf="!expanded"
  alert="primary"
  iconLeft="search"
  size="md"
  ariaLabel="Show search"
  (buttonClick)="expanded = true">
</ngui-button>
<ngui-input
  *ngIf="expanded"
  type="search"
  iconLeft="search"
  placeholder="Search"
  width="100%"
  ariaLabel="Search"
  [(ngModel)]="query"
  (blur)="collapseIfEmpty()">
</ngui-input>
```

```ts
import { ButtonModule } from '@cigna/cigna_dae_ngui_library/lib/button';
```

You may reveal `ngui-autocomplete` or a `-field` variant instead of `ngui-input` when suggestions or form integration are required.

## Related skills

- **ngui-component-reference** — import paths and standalone vs `-field` pattern
- **ngui-build-feature-page** — placing search in page headers, action rows, or tables
