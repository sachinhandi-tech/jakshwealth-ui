---
name: ngui-typography
description: >-
  Selects when and how to use ngui-typography — Canvas type tokens, semantic colors,
  and heading hierarchy. Plain text is fine in ngui-list-item and ngui-card body when
  default styling suffices. Use before applying non-default text styles in Angular templates.
disable-model-invocation: true
---

# NGUI typography

## When to use this skill

- Before applying a **non-default** Canvas text style (headings, metrics, emphasis, accent color)
- When reviewing whether raw `<p>` / `<h*>` / `<span>` should become `ngui-typography`
- When choosing between `paragraph`, `ui`, and `display-*` types

## When `ngui-typography` is required vs optional

**Use `ngui-typography` when the design needs a specific Canvas type or color:**

- Page/section headings (`h1`–`h4`)
- Metrics and KPIs (`display-1`, `display-2`, `display-3`)
- Emphasis variants (`ui-emphasis`, `paragraph-emphasis`)
- Semantic text colors (`color="accent"`, `disabled`, `reversed`)
- Multi-line body copy where you want the **`paragraph`** token explicitly (same as global body default, but explicit in markup)

**Plain text is fine without `ngui-typography` when:**

- **`ngui-list-item`** — applies **`--type-ui-default`** to row text
- **`ngui-card`** body — inherits **`--type-paragraph-default`** from global `body`
- Other **content-projection containers** listed below when default inherited styling is enough

**Use raw HTML (`h1`–`h4`, `p`, `small`, `a`) only for** legacy markdown, CMS HTML, or migration — global fallbacks in `styles.min.css` now use the **same composite tokens** as `ngui-typography`. Prefer **`ngui-typography`** in new Angular templates when you need **display/metric types**, **semantic color**, **emphasis variants**, or explicit control over heading hierarchy in app code.

**Avoid raw `<strong>` / styled `<span>`** — use `ngui-typography` with the appropriate `type` and `display="inline"`.

## Content containers (plain text defaults)

These components accept projected or inline text without requiring `ngui-typography` for **default** styling:

| Component | Default text style | Notes |
|-----------|-------------------|--------|
| **`ngui-list` / `ngui-list-item`** | `--type-ui-default` | Component sets font on `.ngui-list-item`; use `ngui-slot-right` for second column |
| **`ngui-card`** | `--type-paragraph-default` (via `body` inherit) | No card-body font rule; docs use plain projected text |
| **`ngui-drawer`** | `--type-paragraph-default` | Layout/filter panels; metric titles still need `ngui-typography` |
| **`ngui-dialog`** | `--type-paragraph-default` | Projected body content |
| **`ngui-accordion`** (item body) | `--type-paragraph-default` | Padded body region; header title uses accordion APIs |
| **`ngui-popover`** | `--type-ui-default` | Popover content wrapper |

**Use component inputs instead of free text** when the component owns typography: **`ngui-alert`** (`title`, `text`), **`ngui-empty-state`** (`title`, `text`), **`ngui-page-header`** (`pageTitle`, `subTitle`).

## Import

```ts
import { TypographyModule } from '@cigna/cigna_dae_ngui_library/lib/typography';
```

Add `TypographyModule` to the `imports` array of the host `@NgModule` or standalone component.

## Selector and inputs

```html
<ngui-typography
  type="..."          <!-- required: see type table below -->
  [display]="'...'"  <!-- optional: overrides host display (inline, block, flex, …) -->
  [color]="'...'"    <!-- optional: 'default' | 'accent' | 'disabled' | 'reversed' -->
>
  Content
</ngui-typography>
```

- `type` is required. All valid values are listed in the sections below.
- `display` defaults to `block` for headings and paragraphs. Pass `display="inline"` to flow
  alongside other inline content (e.g. emphasis inside a sentence).
- `color` maps to semantic color tokens; omit it for the default body text color.

---

## Type selection guide

### Headings — `h1` / `h2` / `h3` / `h4`

Use for page, section, and content hierarchy. Maps to the corresponding semantic `<h*>` element.

| Type | Canvas token | Size / line | Use for |
|------|--------------|-------------|---------|
| `h1` | `--type-heading-html-h1` | 28px / 34px | One per view; the main page title |
| `h2` | `--type-heading-html-h2` | 24px / 24px | Major sections within a page |
| `h3` | `--type-heading-html-h3` | 22px / 22px | Sub-sections within an h2 block |
| `h4` | `--type-heading-html-h4` | 18px / 20px | Fine-grained divisions under h3 |

**Rules (from Canvas Documentation):**
- Capitalize the first letter of every word in a heading except articles (a, an, the),
  conjunctions (and, but, or), and prepositions (in, on, at, …).
- Use headings strictly in hierarchical order — never place an `h4` before its parent `h3`.
- One `h1` per view. More than one Screen Title breaks the semantic hierarchy.
- If you need a prominent decorative title that is not part of the content hierarchy (e.g. a
  metric label), use a **Display** type instead.
- Do **not** use headings to style non-heading text — use `ui-emphasis` or `paragraph-emphasis`.

```html
<!-- Correct -->
<ngui-typography type="h2">Claims Overview</ngui-typography>

<!-- Wrong — skips hierarchy and uses raw element -->
<h4>Claims Overview</h4>
```

---

### Display — `display-1` / `display-2` / `display-3`

Use to draw attention to metrics, KPIs, and decorative titles. **Not** for content hierarchy.

| Type | Canvas name | Use for |
|------|-------------|---------|
| `display-1` | Super Display (Metric) | Primary large metric or KPI value |
| `display-2` | Display 1 (Metric) | Supporting metric; less prominent than display-1 |
| `display-3` | Display 2 (Supporting Metric) | Supertitle above a metric, or subtitle below one |

**Rules:**
- Use Display types exclusively for metrics and attention-drawing values, not for section titles.
- Do **not** use Display types to divide content — use `h2` / `h3` / `h4` for that.
- `display-3` is for contextual labels placed directly adjacent to `display-1` or `display-2` values.

```html
<ngui-typography type="display-3">Total Claims</ngui-typography>
<ngui-typography type="display-1">12,847</ngui-typography>
```

---

### UI — `ui` / `ui-emphasis` / `ui-small` / `ui-small-emphasis` / `ui-large` / `ui-large-emphasis`

Use for single-line labels, control text, hints, tooltips, field labels, and inline emphasis.
**Not** for multi-line sentences or paragraphs.

| Type | Use for |
|------|---------|
| `ui` | Default body UI text — field labels, data values, menu items |
| `ui-emphasis` | Bold inline emphasis, sub-labels, section meta labels |
| `ui-small` | Hint text, helper labels, secondary metadata |
| `ui-small-emphasis` | Bold hint or secondary label that needs emphasis |
| `ui-large` | Prominent single-line label or page-level UI text |
| `ui-large-emphasis` | Bold prominent label |

**Rules:**
- Use `ui` and its variants for labels and controls, **not** for body copy.
- Do **not** use `ui` types for multi-line sentences — use `paragraph` instead.
- Use `display="inline"` when placing emphasis inside a flowing sentence:

```html
<!-- Inline emphasis inside a paragraph — correct -->
<ngui-typography type="paragraph">
  Click
  <ngui-typography type="ui-emphasis" display="inline">Save</ngui-typography>
  to continue.
</ngui-typography>

<!-- Wrong — raw <strong> for visual emphasis -->
<p>Click <strong>Save</strong> to continue.</p>
```

- Use `display="block"` (or omit `display`) for standalone labels above/below a field:

```html
<ngui-typography type="ui-emphasis" display="block">Registry</ngui-typography>
```

---

### Paragraph — `paragraph` / `paragraph-emphasis`

Use for multi-line body copy, descriptions, and flowing prose.

| Type | Use for |
|------|---------|
| `paragraph` | Standard body text — descriptions, instructions, explanatory copy |
| `paragraph-emphasis` | Bold body copy — important instructions, warnings in prose |

**Rules:**
- Use `paragraph` in place of raw `<p>` tags for all multi-sentence body text.
- Do **not** use `paragraph` for single-line labels or UI controls — use `ui` types.
- Hyperlinks inside a paragraph should use `ngui-link` inline; do **not** use a standalone
  anchor as a replacement for a button.
- `paragraph-emphasis` is for a full sentence or block that needs visual weight, not for a
  single inline word (use `ui-emphasis display="inline"` for that).

```html
<!-- Correct — multi-line description -->
<ngui-typography type="paragraph" class="mb-2">
  Install the Canvas stylesheet before using components.
</ngui-typography>

<!-- Wrong — raw <p> tag -->
<p>Install the Canvas stylesheet before using components.</p>
```

---

### Table — `table-header` / `table-cell`

Reserved for table column headers and cell content inside `ngui-table` or `ngui-simple-table`.
Do not use these types for general body text outside a table context.

---

## Replacing common raw HTML patterns

Use these replacements when you need **non-default** Canvas styling or semantic heading hierarchy — not for every text node.

| Raw HTML | Replace with |
|----------|-------------|
| `<p>Multi-sentence body copy.</p>` | Plain text (inherits paragraph body styles) **or** `<ngui-typography type="paragraph">…</ngui-typography>` when explicit |
| `<h2>Section title</h2>` | `<ngui-typography type="h2">Section title</ngui-typography>` |
| `<strong>Inline bold</strong>` | `<ngui-typography type="ui-emphasis" display="inline">…</ngui-typography>` |
| `<span class="label">Field label</span>` | Plain text in `ngui-list-item` **or** `<ngui-typography type="ui">…</ngui-typography>` |
| `<small>Hint text</small>` | `<ngui-typography type="ui-small">…</ngui-typography>` |
| `<h1>42,000</h1>` (metric) | `<ngui-typography type="display-1">42,000</ngui-typography>` |

**Plain text in `ngui-list-item` and `ngui-card` body** — no wrapper needed for scaffold/default labels.

**Keep `<code>` for inline code** — `ngui-typography` has no monospace/code variant.
Inline code snippets (`<code>npm install</code>`, `<code>lib/button</code>`) are appropriate
as semantic HTML and should remain as `<code>`.

**Keep `<kbd>`, `<em>` (semantic), `<li>`** — these carry HTML semantics that ngui-typography
does not replace. Text inside `<li>` elements does not need to be wrapped in ngui-typography
unless the list item requires explicit Canvas styling.

---

## Global fallback HTML vs Canvas tokens

Shipped `styles.min.css` maps raw **`body`**, **`h1`–`h4`**, **`p`**, **`small`**, and **`a`** to the same composite **`font: var(--type-*)`** tokens as `ngui-typography`. **`h5` / `h6`** have no Canvas `heading.html` tokens and map to the closest **`ui-small`** scale.

| Element | Global fallback token | `ngui-typography` equivalent | Match |
|---------|----------------------|------------------------------|--------|
| `body` / inherited plain text | `--type-paragraph-default` | `type="paragraph"` | Yes |
| `h1` | `--type-heading-html-h1` | `type="h1"` | Yes |
| `h2` | `--type-heading-html-h2` | `type="h2"` | Yes |
| `h3` | `--type-heading-html-h3` | `type="h3"` | Yes |
| `h4` | `--type-heading-html-h4` | `type="h4"` | Yes |
| `h5` | `--type-ui-small-emphasis` | `type="ui-small-emphasis"` | Closest (no html.h5 token) |
| `h6` | `--type-ui-small` | `type="ui-small"` | Closest (no html.h6 token) |
| `p` | `--type-paragraph-default` | `type="paragraph"` | Yes |
| `p strong` | `--type-paragraph-bold` | `type="paragraph-emphasis"` | Yes |
| `small` | `--type-ui-small` | `type="ui-small"` | Yes |
| `a` | `--type-paragraph-hyperlink` + link color | use **`ngui-link`** in app UI | Yes for raw anchors |

### When to choose which

| Situation | Use |
|-----------|-----|
| Metric / KPI values, display sizes | **`ngui-typography`** `display-*` |
| Accent, disabled, or reversed text color | **`ngui-typography`** with `color` |
| Inline emphasis in prose | **`ngui-typography`** `ui-emphasis` / `paragraph-emphasis` |
| List row labels, card body scaffold copy | **Plain text** in `ngui-list-item` / `ngui-card` |
| Legacy HTML, markdown, CMS content | **Raw HTML** (now token-aligned) |
| App navigation links | **`ngui-link`**, not raw `<a>` |

---

## `display` input quick reference

The `display` input overrides the host element's CSS `display` property.

| Value | When to use |
|-------|-------------|
| `block` (default for h*, paragraph) | Full-width block text |
| `inline` | Emphasis or labels embedded in running text |
| `inline-block` | Inline text that needs block-level box model |
| `flex` | Typography that is itself a flex container |

---

## `color` input

| Value | Token | Use for |
|-------|-------|---------|
| `default` (omit) | `--type-color-default` | Standard body and heading text |
| `accent` | `--type-color-accent` | Secondary / supporting body copy |
| `disabled` | `--type-color-disabled` | Disabled-state labels |
| `reversed` | `--type-color-reversed` | Text on dark/colored backgrounds |

---

## Related skills

- **ngui-build-feature-page** — metric cards use typography types; list scaffold rows use plain text
- **ngui-install-and-setup** — app shell header and nav labels use `h2`/`ui-emphasis`
- **ngui-component-reference** — canonical API lookup for any component including `typography`
