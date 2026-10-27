## 1. Tooltip shim

- [x] 1.1 Find which kit components the app renders still import the 1.0 `Tooltip` (the non-`New` components under the kit's `components/`), and record the result in the PR
- [x] 1.2 With the `#tooltip-portal` block removed, hover tooltips on grid cells, form fields and icon buttons and look for a bordered bubble or one without `data-placement`
- [x] 1.3 If none appears, delete the `#tooltip-portal` block and its comment from `scss/tooltip.scss`, keeping `.tooltip-arrow`; if one does, keep the block and rewrite its comment to name the component that portals it

## 2. Specs and docs

- [x] 2.1 Fix the Purpose text in `inline-source-field-warnings` (`DialInputPopup`), `toolset-vendor-website-field` (`DialInput`) and `autocomplete-input` ("typeable legacy select")
- [x] 2.2 Reword the "legacy `Dial*` ones" line in `.claude/rules/a11y.md`, then run `npm run sync:agent-mirrors` and `npm run validate:agent-docs`
- [x] 2.3 Drop the "1.0 `DialSelectField`" history from the comments in the `GroupKeysEditor`, `MeasuresEditor`, `SourceField`, `OutputsEditor`, `VariablesEditor` and `CreatePipelinePopup` specs

## 3. Close out

- [x] 3.1 Grep `openspec/specs`, `docs`, `.claude` and `apps/ai-dial-admin/src` for the kit's retired `Dial*` component names; none may remain outside archived changes
- [x] 3.2 Run both typecheck gates, lint and the six edited specs
