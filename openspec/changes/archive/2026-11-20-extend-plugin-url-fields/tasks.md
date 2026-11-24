## 1. Plugin option propagation

- [x] 1.1 Reuse the existing model plugin option flow and propagate router options/errors through the relevant `View`, `TabsContent`, `Properties` and `InterfacesField` props.
- [x] 1.2 Ensure `src/components/BaseControls/InterfacesField/InterfaceRow.tsx` and `TranslatorField.tsx` offer plugin choices for model and router custom translators only, preserving inline `out`, casing, validation and read-only behavior, and retaining the URL-only control elsewhere.

## 2. Router and shared controls

- [x] 2.1 Wire the router detail page at `src/app/[lang]/platform-routers/[id]/page.tsx` through `Assets/Platform/Routers/View.tsx`, `TabsContent.tsx` and `Properties.tsx`; reuse `BaseUrlControl` for the router base URL and enable it for router passthrough interface rows.
- [x] 2.2 Preserve router URL fallback, explicit overrides, inherited and explicit plugin `overridePaths` validation, decision-mode restrictions, save/discard, ETags, permissions and notification behavior.
- [x] 2.3 Update `src/components/BaseControls/BaseUrlControl/BaseUrlControl.tsx` to suppress redundant visible active-control labels while retaining localized accessible names, required indication, errors and keyboard interaction for every consumer.
- [x] 2.4 Update `src/components/Assets/Platform/Plugins/CreateProperties.tsx` and relevant i18n entries for the create-only `Enter type` placeholder; preserve detail placeholder and required validation.

## 3. Automated tests

- [x] 3.1 Add or update unit/component tests for every changed control and owner: option propagation on model and router custom translators, source failures, fallback, read-only/config-file, decisions, plugin reference and suffix preservation, switch/discard, save payload and notifications, and unchanged unrelated URL controls.
- [x] 3.2 Add or update tests under `BaseUrlControl/tests`, `InterfacesField/tests`, `Assets/Platform/Routers/tests`, and `Assets/Platform/Plugins/tests` for accessible names without duplicate visible labels, keyboard operation, required errors, explicit and inherited override-path conflicts, and the create placeholder; retain existing model and standalone translator regressions.

## 4. Final quality checks

- [x] 4.1 Run targeted tests, `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs`, and the full `npm run test` suite; resolve or report failures.
