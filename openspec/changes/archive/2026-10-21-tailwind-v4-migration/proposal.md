## Why

The admin app was on Tailwind 3 (PostCSS + `tailwind.config.js`), while `@epam/ai-dial-ui-kit` builds its stylesheet with Tailwind v4 (kit PR #937). Two stylesheets built by different Tailwind majors shared one page, and `src/scss/fonts.scss` re-implemented a type scale that the kit already ships as `.dial-*-text` classes in its compiled `styles.css` (the pinned `0.15.3` already contains them).

## What Changes

- Migrate the app from Tailwind 3 to Tailwind 4: CSS-first configuration (`@theme`, `@source`, `@utility`, `@custom-variant`) replaces `tailwind.config.js`; `@tailwindcss/postcss` replaces `tailwindcss` + `autoprefixer` as the PostCSS plugin.
- Delete `src/scss/fonts.scss` and move every call site from the local classes (`body`, `small`, `tiny`, `caption`, …) to the kit's `dial-*-text` classes. **BREAKING (visual):** line heights and the `h1`/`h2`/`h3` weights and sizes follow the kit's scale, which differs from the old one.
- Port the SCSS that `@apply`-ed classes (v4 only accepts utilities) and rename the v3 utilities that changed meaning in v4.
- Drop `eslint-plugin-tailwindcss` (it registered no rules and has no stable v4 release).

## Capabilities

### New Capabilities

- `app-styling`: how the admin app is styled — Tailwind v4 CSS-first setup, where tokens and typography come from, and how the app overrides the kit.

### Modified Capabilities

<!-- None: user-facing behavior is unchanged apart from the kit's type scale. -->

## Impact

- `apps/ai-dial-admin/tailwind.config.js` and `src/scss/fonts.scss` removed; `postcss.config.js`, `src/scss/style.scss`, `src/app/[lang]/global.scss`, `ag-grid.scss`, `date-picker.scss` changed; `src/scss/tailwind.css` and `src/scss/app-theme.css` added.
- About 170 typography class tokens renamed across ~115 files, plus the `outline-none`, `flex-shrink`, `rounded-sm` and `placeholder-*` renames.
- `package.json`: `tailwindcss` 3 → 4, `@tailwindcss/postcss` added, `autoprefixer` and `eslint-plugin-tailwindcss` removed.
- `scripts/validate-agent-docs.mjs` reads the named breakpoints from `app-theme.css`; `.claude` rules and skills, `openspec/config.yaml` updated.
- Browser baseline rises to Safari 16.4+, Chrome 111+, Firefox 128+ (Tailwind v4).
- Theming: the themes service still sets the CSS variables; every token keeps its `var(--…, fallback)` shape.

## Non-goals

- Redesigning any screen; the only intended visual change is the kit's type scale.
- Sharing the kit's design tokens: the app keeps its own token values in `app-theme.css` (see design D1).
- Replacing the app's component SCSS (`ag-grid`, `markdown-editor`, …) with the kit's.
- Visual regression testing: browser verification was declined for this change.
