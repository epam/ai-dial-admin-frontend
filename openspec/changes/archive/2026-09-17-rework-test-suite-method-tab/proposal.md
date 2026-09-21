## Why

The Method tab of the Test Suite create/edit page (Eval > Test Suites) is getting a Figma redesign. Today, editing a suite's method is a single-step confirmation popup (`ChangeMethodModal`) that only lets a user pick an endpoint, while the request body/headers/params editor lives inline on the Method tab page itself. The new design consolidates method selection and request configuration into a single two-step "Edit request" wizard, and moves the per-variable binding UI ("Dynamic configuration") from the Test Cases tab onto the Method tab, next to the request's extracted response fields — so everything about a request's method, body, variable bindings, and output fields lives in one place.

## What Changes

- **BREAKING** (internal UX, not an API/data change): "Change Method" no longer opens a single-step confirmation popup. It opens a two-step wizard (`DialSteps`: **Methods** → **Configuration**).
  - Step 1 "Methods" reuses the existing endpoint picker (`Methods`/`MethodInfo`) essentially as-is.
  - Step 2 "Configuration" hosts the request body/headers/parameters editor (today's `RequestTemplate` — Body/Headers/Parameters tabs, JSONata toggle, content-type selector), moved out of the main Method tab page and into this wizard step.
  - Step 2 links out to the existing variable-syntax reference (`TemplateVariablesDoc`), reused unchanged.
  - Footer semantics: Step 1 = Cancel / Next; Step 2 = Back / Cancel / Save, with a "Reset to default" action once the body has been hand-edited.
- Relocate the "Dynamic configuration" section (per-variable Attribute/Constant binding UI, currently `TemplateVariables`/`DynamicConfiguration`) from the **Test Cases** tab onto the **Method** tab, positioned between the endpoint/actions row and the extracted response fields grid. It is removed from the Test Cases tab — one editing surface only, no duplication.
- Re-skin (no behavior change) of: the Requests chain selector, the method/path header row, and the extracted response fields grid (`EndpointSchema`/`Columns`), to match the new Figma layout.
- Add an OpenSpec capability spec for the Method tab layout and the edit-request wizard — neither currently has a dedicated spec.

## Capabilities

### New Capabilities
- `test-suite-method-tab`: The Method tab's layout and composition for deployment-based test suites — endpoint header, relocated Dynamic Configuration section, and extracted response fields grid.
- `test-suite-method-edit-wizard`: The two-step "Edit request" wizard (Methods → Configuration) that replaces the single-step Change Method confirmation popup.

### Modified Capabilities
None. No existing spec currently documents the Method tab layout, the Change Method modal, or the Dynamic Configuration section's location, so there are no existing requirements to amend via delta — this change introduces the first specs for this surface.

## Impact

- `apps/ai-dial-admin/src/components/TestSuites/View/MethodTabContent.tsx` — Method tab composition (add Dynamic Configuration section; remove old inline `RequestTemplate` rendering).
- `apps/ai-dial-admin/src/components/TestSuites/Modals/ChangeMethodModal/ChangeMethodModal.tsx` — restructured into a `DialSteps` wizard; likely renamed/relocated to reflect the two-step shape.
- `apps/ai-dial-admin/src/components/TestSuites/TestCases/TestCases.tsx` — remove `TemplateVariables` rendering.
- `apps/ai-dial-admin/src/components/TestSuites/TestCases/TemplateVariables.tsx`, `use-input-binding-handlers.ts` — relocate (move out of `TestCases/`, likely into `View/` or a shared Method-tab location) since they no longer belong to Test Cases.
- `apps/ai-dial-admin/src/components/TestSuites/RequestTemplate/RequestTemplate.tsx` and its tabs — reused inside the new wizard step instead of the main tab page.
- No changes to `TestSuite`/`TestSuiteEndpointRef`/`InputBinding`/`ResponseColumn` models — this is a UI restructuring, not a data model change.
- `apps/ai-dial-admin/src/components/TestSuites/RequestTemplate/components/TryOutRequestPreview.tsx` — verify it doesn't depend on `RequestTemplate`/`TemplateVariables` being mounted inline on the main tab page (it reads from `testSuite` state via `toRequestView`, so expected to be unaffected, but needs confirmation during implementation).
- Tests: existing `MethodTabContent.spec.tsx`, `TestCases.spec.tsx` (if present) need updates; a new spec file is needed for the wizard (no `ChangeMethodModal.spec.tsx` exists today).
