## 1. Tailwind 4 foundation

- [x] 1.1 Replace `tailwindcss@3`, `autoprefixer` and `eslint-plugin-tailwindcss` with `tailwindcss@4` and `@tailwindcss/postcss`; update `apps/ai-dial-admin/postcss.config.js` and `eslint.config.mjs`; drop the Tailwind v3 imports from `vitest.config.ts`.
- [x] 1.2 Add `src/scss/tailwind.css` (layer order, Tailwind imports with `important`, `@source`, v3 preflight compat) and import it from `global.scss`; remove the `tailwindcss/*` `@use` lines from `style.scss`.
- [x] 1.3 Add `src/scss/app-theme.css` with the tokens from `tailwind.config.js`, the named breakpoints as `@custom-variant`, the `fill`/`stroke`/`outline` shims, the bare `font` utility and the score-cell `@source inline`.
- [x] 1.4 Delete `apps/ai-dial-admin/tailwind.config.js`; update `scripts/validate-agent-docs.mjs`, `openspec/config.yaml`, `.claude/rules/a11y.md` and the code-review skill to the new token and breakpoint source; run `npm run sync:agent-mirrors`.

## 2. Utility and SCSS port

- [x] 2.1 Port `ag-grid.scss` so no `@apply` targets a class (`@utility` / mixins), and use the `text-right!` suffix form.
- [x] 2.2 Rename the v3 utilities that changed meaning (`outline-none`, `flex-shrink`, `rounded-sm`, `placeholder-primary`, bare `focus-visible:outline`) across `src/`.

## 3. Typography

- [x] 3.1 Rename call sites from the local classes to the kit's `dial-*-text` classes across `src/` (class contexts only), and give `<body>` `dial-body-text`.
- [x] 3.2 Replace `small`/`tiny` in SCSS for third-party elements with `text-sm`/`text-xs`; delete `src/scss/fonts.scss` and its `@use`.

## 4. Tests

- [x] 4.1 Update specs that assert old class names; `npm run typecheck:specs` stays at zero.

## 5. Quality checks

- [x] 5.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs`, `npm run build` and the full vitest suite; all pass.

<!--
No browser-verification task: asked and declined by the user. The kit-side `export-style-sources` change
and a `check:styles` script were part of an earlier plan and are not part of this change.
-->
