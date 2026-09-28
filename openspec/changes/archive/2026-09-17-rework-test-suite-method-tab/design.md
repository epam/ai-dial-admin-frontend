## Context

See `proposal.md` - Why. The relevant current code, from investigation:

- `MethodTabContent.tsx` → `DeploymentMethodContent` already scopes everything to the selected chain
  request via `toRequestView(testSuite, selectedRequestIndex)` / `fromRequestView(...)`: `MethodEndpoint`,
  `RequestTemplate`, `EndpointSchema`, and `ChangeMethodModal` all receive this per-request `requestView`
  and write back through `onChangeRequestView`.
- `ChangeMethodModal` is a single-step `DialConfirmationPopup` (fixed `h-[800px]`) wrapping the `Methods`
  picker. It keeps a local `structuredClone` of the request, only committing via `onChangeTestSuite` on
  Confirm; Confirm is gated on `endpointRef.method`/`relativeUrlPattern` and `useSaveValidationContext().isValid`.
- `RequestTemplate` (Body/Headers/Parameters tabs, JSONata toggle, content-type select) currently renders
  inline on the main tab page, below the endpoint header, sitting alongside `ChangeMethodModal` as a
  sibling — not inside the modal.
- `TemplateVariables`/`DynamicConfiguration` (Attribute/Constant binding UI) currently renders on the
  **Test Cases** tab (`TestCases.tsx`) and reads/writes `selectedTestSuite.inputBindings` directly — i.e.
  always request #0, with no chain-index scoping. `use-input-binding-handlers.ts` lives under
  `TestSuites/TestCases/`.
- `TemplateVariablesDoc.tsx` (the "Variable references" content) already exists under
  `RequestTemplate/components/` and is reused unchanged (per the user's decision, this change does not
  touch it).
- The create/edit wizard (`CreateTestSuite.tsx`) already uses `DialSteps` with a "Methods" step that
  renders the same `Methods` component — this change's Step 1 reuses that pattern rather than inventing a
  new stepper mechanism.

## Goals / Non-Goals

**Goals:**
- Turn the single-step Change Method modal into a two-step `DialSteps` wizard (Methods → Configuration)
  that also hosts request body/header/parameter editing.
- Move Dynamic Configuration onto the Method tab, scoped per selected chain request (not just request #0).
- Preserve all existing data flow: `inputBindings`, `responseColumns`, `requestTemplate`, and
  `endpointRef` keep their current shapes; this is a UI restructuring only.

**Non-Goals:**
- No change to the `${{var|type:default}}` template syntax or `TemplateVariablesDoc` content (explicit
  user decision — reuse as-is).
- No change to the MCP suite flow (`McpMethodContent`/`ChangeMcpToolModal`) — Figma only covers
  deployment-based suites.
- No change to `TestSuite`/`InputBinding`/`ResponseColumn`/`TestSuiteEndpointRef` model shapes.
- No visual redesign of `RequestChainSelector`'s own internal behavior beyond restyling to match Figma
  spacing/tokens.

## Decisions

**1. Wizard state ownership: keep the modal's local-clone-until-Save pattern, extended across two steps.**
`ChangeMethodModal` already clones the request into local state and only commits on Confirm. The new
wizard keeps this shape: local state holds the in-progress `requestView` clone across both steps: step 1
mutates `endpointRef`, step 2 mutates `requestTemplate`. Save commits the whole clone via
`onChangeRequestView` in one call (per the "Saving applies all wizard changes" scenario). Alternative
considered: commit step 1 immediately on Next (so Methods and Configuration are separately persisted) —
rejected because it would apply a partial method change if the user cancels on step 2, and complicates
"Back" (would need to un-commit). Single commit on Save matches the existing Confirm-only-commits
behavior and keeps Cancel simple at either step.

**2. Reuse `DialSteps` (already used by `CreateTestSuite.tsx`) rather than composing two separate modals.**
This matches an established pattern in the codebase, avoids a second stepper implementation, and keeps
"Back" a first-class step transition rather than modal-swap logic.

**3. `RequestTemplate` moves from `MethodTabContent`'s main render into the wizard's step 2, and is no
longer rendered inline on the tab page.**
It already receives a `requestView`-scoped `testSuite` prop and an `onChangeTestSuite` callback, and
`jsonataVariables` (previous-request output variables) — the wizard step reuses it with the same props,
sourced from the wizard's local clone instead of the tab's live `requestView`.

**4. Dynamic Configuration becomes chain-index-aware.**
Today `TemplateVariables` operates on `selectedTestSuite.inputBindings` unconditionally (always request
#0). Once relocated to the Method tab, it renders alongside other per-request sections and SHALL use the
same `requestView`/`onChangeRequestView` scoping `MethodTabContent` already threads through to
`RequestTemplate`/`EndpointSchema`, so it edits whichever request is selected in the chain. This is a
deliberate behavior change (see spec `test-suite-method-tab`), not a like-for-like relocation — for a
multi-request suite, users gain the ability to bind variables for requests other than #0, which was not
previously possible from any tab.
Alternative considered: keep it scoped to request #0 only (true like-for-like move) — rejected because
it would leave no way to bind variables for additional requests, and every sibling section on the tab is
already chain-aware, so a request-#0-only Dynamic Configuration would be visibly inconsistent on the same
screen.

**5. `use-input-binding-handlers.ts` and `TemplateVariables.tsx` relocate out of `TestSuites/TestCases/`.**
Per `.claude/rules/components.md` §4 (feature components follow domain, not accidental placement), once
neither renders under Test Cases, they move to `TestSuites/View/` (alongside `MethodTabContent.tsx`,
which is where they're now consumed) rather than staying under `TestCases/`.

**6. "Edit request" wording replaces "Change Method" on the trigger button.**
Figma labels the action "Edit request"; this change renames `TestSuitesI18nKey.ChangeMethod`'s
associated button label to match (or introduces a new key if the existing one is reused elsewhere —
verify during implementation) so the trigger name matches what it now opens (a request-wide editor, not
just a method picker).

## Risks / Trade-offs

- **[Risk]** Moving `RequestTemplate` into the modal means it only mounts while the wizard is open,
  whereas today it's always mounted on the tab page. Anything relying on it being mounted outside the
  wizard (e.g., `TryOutRequestPreview.tsx` reading live preview state) could break.
  → **Mitigation**: confirm during implementation that `TryOutRequestPreview.tsx` reads from `testSuite`/
  `toRequestView` state, not from the mounted `RequestTemplate` instance (this matches what the earlier
  investigation found, but must be verified against current code, not memory, before removing the inline
  render).
- **[Risk]** Making Dynamic Configuration chain-index-aware is a behavior change beyond a pure reskin;
  it could surprise users who expect bindings to stay tied to request #0.
  → **Mitigation**: called out explicitly in the spec and design as an intentional change, not a
  side-effect; flag it in the PR description for reviewer visibility.
- **[Risk]** Two-step wizard adds a "Back" transition that must preserve step 1's selection when
  returning from step 2 — easy to regress if state is reset on step change rather than lifted to the
  wizard's local clone.
  → **Mitigation**: the "Navigating back to Methods" scenario in the wizard spec exists specifically to
  cover this; add a test for it (no equivalent test exists today, since `ChangeMethodModal.spec.tsx`
  doesn't exist).

## Open Questions

- Exact final component/file names for the restructured modal (e.g. whether `ChangeMethodModal` is
  renamed to something like `EditRequestWizard`, and where it lives) — an implementation detail that
  doesn't change the spec or task breakdown, left for `tasks.md`/implementation to settle following
  existing naming conventions.
