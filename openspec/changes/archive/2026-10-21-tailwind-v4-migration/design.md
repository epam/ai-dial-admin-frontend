## Context

The app builds its own Tailwind stylesheet and loads the kit's precompiled `@epam/ai-dial-ui-kit/styles.css` next to it (`[lang]/layout.tsx`, before `global.scss`). The kit's sheet is built with Tailwind v4 and already ships `.dial-*-text` classes and global `h1`–`h3` rules. The app's tokens in `tailwind.config.js` replaced whole Tailwind scales (colors, shadows) and used `important: true`.

An earlier plan had the kit publish `theme`/`mixins`/`typography` as `.css` exports so the app could import them. That was prepared in the kit repo (`export-style-sources`) but the migration did not wait for it: the compiled `styles.css` of the pinned `0.15.3` already carries the typography classes, which is all the app needs.

## Goals / Non-Goals

**Goals:** one Tailwind major across app and kit; the type scale comes from the kit; themes keep working through `var(--token, fallback)`.

**Non-Goals:** sharing token source with the kit; replacing component SCSS; a redesign.

## Decisions

### D1. The app keeps its own tokens, generated from the old config

`src/scss/app-theme.css` holds `@theme inline` with the same values as `tailwind.config.js` (`--background-color-*`, `--border-color-*`, `--text-color-*`, `--divide-color-*`, `--outline-color-*`, shadows, `--radius`, `--text-xxs`, gradients, `fadeIn` and `spin-steps` animations). `inline` writes values into utilities and nothing lands on `:root`. `fill-*`, `stroke-*` and `outline-*` are `@utility` shims over those namespaces, and a bare `font` utility keeps the theme font. The five named screens became `@custom-variant`s with the same ranges. The score-cell classes are kept by `@source inline`.

_Alternative:_ import the kit's `theme.css`. Rejected for now: the kit's values differ from the app's (shadows, radii) and the kit export is not released; a later change can swap the file.

### D2. Single Sass compilation with a plain-CSS Tailwind entry

`global.scss` `@use`s `style.scss` (the component partials) and `@import`s `src/scss/tailwind.css`. Sass leaves a `.css` import untouched; Tailwind resolves it after sass-loader, so the partials' `@apply` calls see the theme and utilities in the same stylesheet. `tailwind.css` declares the layer order, imports `tailwindcss/theme.css`, `preflight.css` and `utilities.css`, `app-theme.css`, and the `@source` globs (app `src`, kit `dist`), and restores the v3 preflight behaviour v4 dropped (button cursor, placeholder color, dialog margin). Proven by `nx build`, not only by a standalone compile.

### D3. `important` is kept

`@import 'tailwindcss/utilities.css' layer(utilities) important` keeps every utility `!important`. The kit's `dial-*` classes are unlayered and would otherwise beat the app's layered utilities. Dropping it is a follow-up that needs a visual diff.

### D4. `@apply` of a custom class became a mixin or `@utility`

v4 rejects `@apply` of non-utilities. `input-disable`, `base-button` and `base-button-disable` became `@utility`; `.input`, `.primary` and `.secondary` bodies became Sass mixins shared by the class and its `@apply` sites. The unused `.tooltip` component class was removed.

### D5. Typography is the kit's classes, applied in markup

`fonts.scss` is deleted. Call sites use `dial-*-text` (body → `dial-body-text`, small → `dial-small-text`, small-text-semi → `dial-small-semi-text`, small-150 → `dial-small-paragraph-text`, tiny → `dial-tiny-text`, tiny-semi → `dial-tiny-semi-text`, caption → `dial-caption-text`); `<body>` carries `dial-body-text`. SCSS that styles third-party elements cannot take a class, so it uses the equal-sized Tailwind steps (`text-sm` 14/20, `text-xs` 12/16). `h1`–`h3` come from the kit.

The rename was done with an AST codemod over class contexts. Its first pass also rewrote prose strings (test titles, `en.ts`); those were found by an audit of non-class strings and reverted.

### D6. v3 utilities renamed where v4 changed meaning

`outline-none` → `outline-hidden`, `flex-shrink-*` → `shrink-*`, `rounded-sm` → `rounded-xs` (keeps 2px), `placeholder-primary` → `placeholder:text-primary`, bare `focus-visible:outline` → `outline-3` (keeps the 3px width). The app's own shadow, radius and color scales are defined in `app-theme.css` under the same names, so `shadow-*` and `rounded` need no rename.

## Risks / Trade-offs

- **Silent visual drift** (v4 defaults, the kit's line heights, `hover:` only on hover-capable devices) → no visual check was run; the user declined it. Build, typecheck, lint and the full unit suite pass.
- **Stale dev server / `.next` cache** after the swap shows a v3 error → restart and clear `apps/ai-dial-admin/.next`.
- **Browser baseline rise** → inherited from Tailwind v4 and the kit.

## Open Questions

- Whether the app should later import the kit's `theme.css` instead of `app-theme.css` (kit `export-style-sources`).
- Whether `important` can go once a visual diff is available.
- Overlap between the app's `ag-grid.scss` / `markdown-editor.scss` and the kit's.
