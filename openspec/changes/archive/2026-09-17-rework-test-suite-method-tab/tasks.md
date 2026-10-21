## 1. Investigate before moving code

- [x] 1.1 Confirm `TryOutRequestPreview.tsx` and any other consumer read request-template state from
      `testSuite`/`toRequestView` rather than from `RequestTemplate` being mounted inline, so removing its
      inline render from the Method tab page is safe; note findings in the PR description
- [x] 1.2 Confirm whether `TestSuitesI18nKey.ChangeMethod` (and its disabled-tooltip key) is referenced
      anywhere besides the Method tab's trigger button, to decide whether to rename it or add a new key
      for "Edit request" / its tooltip

## 2. Relocate Dynamic Configuration onto the Method tab

- [x] 2.1 Move `TemplateVariables.tsx` and `use-input-binding-handlers.ts` from
      `src/components/TestSuites/TestCases/` to `src/components/TestSuites/View/`, updating imports, and
      verify the app still typechecks (`npm run typecheck`)
- [x] 2.2 Update `TemplateVariables`/`use-input-binding-handlers` to operate on the per-request
      `requestView` (via `toRequestView`/`onChangeRequestView`, matching the pattern already used by
      `RequestTemplate`/`EndpointSchema` in `MethodTabContent.tsx`) instead of `selectedTestSuite`
      directly, and verify with a unit test that selecting a different chain request changes which
      request's `inputBindings` are shown and edited
- [x] 2.3 Render the relocated Dynamic Configuration section inside `MethodTabContent.tsx`'s
      `DeploymentMethodContent`, between the endpoint header and `EndpointSchema`, and verify via a
      component test that it appears in that position with the correct variables/bindings for the
      selected request
- [x] 2.4 Remove the `TemplateVariables` rendering from `TestCases.tsx` and verify via a component test
      that the Test Cases tab no longer shows a Dynamic Configuration section
- [x] 2.5 Update or remove now-outdated tests in `TestCases.spec.tsx` (or equivalent) that asserted
      Dynamic Configuration's presence on the Test Cases tab

## 3. Restructure Change Method into the two-step Edit Request wizard

- [x] 3.1 Create the new wizard component (using `DialSteps`, following the pattern in
      `CreateTestSuite.tsx`) with two steps, "Methods" and "Configuration," replacing
      `ChangeMethodModal.tsx`; verify it renders step 1 by default when opened
- [x] 3.2 Wire step 1 to reuse the existing `Methods`/`MethodInfo` components and warning notification
      unchanged; verify via a unit test that selecting a method enables the Next button and that Cancel
      discards the selection
- [x] 3.3 Move `RequestTemplate` (Body/Headers/Parameters tabs, JSONata toggle, content-type selector)
      from its inline render in `MethodTabContent.tsx` into the wizard's step 2, wired to the wizard's
      local request clone; verify via a unit test that editing the body in step 2 does not affect the
      live `testSuite` until Save
- [x] 3.4 Implement the "Back" transition from step 2 to step 1 that preserves the step 1 selection, and
      verify with a unit test that navigating back and forward keeps the previously selected method
- [x] 3.5 Implement "Reset to default" on step 2 (reverts the body template to the selected method's
      default) and verify with a unit test that it only appears after the body has been edited
- [x] 3.6 Wire step 2's "Variable references" action to open the existing `TemplateVariablesDoc`
      unchanged; verify with a unit test that it renders the same content as today
- [x] 3.7 Implement Save (commits the wizard's local clone — method, path, and request template — to the
      live request in one `onChangeRequestView` call) and Cancel (discards all wizard state) on step 2;
      verify with unit tests for both paths, including that Cancel after Back-then-edit still discards
      everything
- [x] 3.8 Rename the Method tab's trigger button from "Change Method" to "Edit request" (add/reuse i18n
      keys per findings from task 1.2) and keep its Try-out-disabled behavior; verify with a unit test
      that the button opens the new wizard and is disabled while Try-out is open
- [x] 3.9 Remove the old `ChangeMethodModal.tsx` once the new wizard fully replaces it, and verify no
      remaining imports reference it (`npm run typecheck`)

## 4. Re-skin remaining Method tab sections

- [x] 4.1 Replace `RequestChainSelector` (a horizontal tab strip) with a `RequestsSidebar` left-side
      panel matching the Figma design — request list, per-row remove, an "Add" action, and an info
      tooltip explaining request ordering — reusing `DialCollapsibleSidebar` for the collapse affordance;
      align the endpoint header row and `EndpointSchema`/`Columns` grid styling with the Figma spacing;
      verify via `MethodTabContent.spec.tsx` and a new `RequestsSidebar.spec.tsx`

## 5. Tests and documentation

- [x] 5.1 Add a new spec file (e.g. `EditRequestWizard.spec.tsx`) covering the wizard's step navigation,
      Save/Cancel commit semantics, and the "Edit request" trigger button — no equivalent test exists
      today for the old `ChangeMethodModal`
- [x] 5.2 Update `MethodTabContent.spec.tsx` for the relocated Dynamic Configuration section and the
      renamed trigger button/wizard integration
- [x] 5.3 Update `.claude/reference/areas.md` if the relocated files change which area owns them (verify
      by checking whether the file lists `TestSuites/TestCases/` or `TestSuites/View/` explicitly)

## 6. Sidebar, add-flow, and wizard layout follow-ups (review feedback)

- [x] 6.1 Wire the Requests sidebar's "Add" action to open the Edit Request wizard immediately for the
      newly added request (previously it only added and selected the request, requiring a separate
      "Edit request" click); verify with a component test that adding opens the wizard
- [x] 6.2 Add an `isNewRequest` flag threaded from "Add" (true) vs. "Edit request" (false) into
      `EditRequestWizard`, and make step 2 ("Configuration") show as incomplete until visited only when
      `isNewRequest` is true — already-configured requests (edit flow) show it complete from the start;
      decouple Save's enablement from this cosmetic step status (Save depends only on step 1's
      method/path validity); verify with unit tests for both flows
- [x] 6.3 Fix `EditRequestWizard` to pass its action buttons via `DialPopup`'s `footer` prop instead of
      as scrollable children, so the header and footer never scroll with the body; give the body a
      `min-h-[674px]` floor (800px popup minus header/footer) so nested `flex-1 min-h-0` regions have a
      real height to compute against
- [x] 6.4 Fix `Methods.tsx` so the method list (`DialCollapsibleSidebar`) and the selected method's detail
      panel (`MethodInfo`) scroll independently instead of sharing one outer scroll region, and so the
      "changing method" warning stays pinned below both rather than scrolling with them
- [x] 6.5 Update `specs/test-suite-method-tab/spec.md` and `specs/test-suite-method-edit-wizard/spec.md`
      to describe the sidebar, add-opens-wizard, new-request step-completeness, and layout-containment
      behavior above

## 7. Requests-sidebar menu, section styling, and schema-view cleanup (review feedback)

- [x] 7.1 Replace the sidebar's always-visible remove icon with a per-row, hover-revealed "more actions"
      menu (`ActionsDropdown` + `IconDotsVertical`) offering "Rename" (all rows) and "Delete" (all but
      the first row), each with an icon, matching the Figma hover state; verify with component tests for
      hover-menu contents per row
- [x] 7.2 Add a `RenameRequestModal` (name input pre-filled with the current request name, Cancel/Confirm)
      matching the Figma rename dialog, wire it to the sidebar's "Rename" action and to
      `updateRequestName` in `MethodTabContent.tsx`; verify with component tests for pre-fill, confirm,
      cancel, and reopening resetting the field
- [x] 7.3 Remove the standalone "Request name" input from the Method tab's main column — renaming is now
      sidebar-only; verify the field is gone from `MethodTabContent.spec.tsx`
- [x] 7.4 Make the Method tab's Dynamic Configuration section non-collapsible (plain bordered box, no
      accordion toggle) by adding a `collapsible` pass-through prop to the shared `DynamicConfiguration`
      component (default `true`, preserving the Try-out sidebar's own collapsible usage) and passing
      `collapsible={false}` from the Method tab's instance only
- [x] 7.5 Simplify `EndpointSchema.tsx` to always render the extracted-fields grid directly — no
      Table/JSON schema switcher, no Request/Response Schema tabs — and rename its heading to "Extracted
      response fields"; remove the now-dead `getEndpointSchemaTabs`/`requestSchemaTab`/`responseSchemaTab`
      helpers and `EntityViewTab.RequestSchema`/`ResponseSchema` enum members; update
      `EndpointSchema.spec.tsx` and `utils.spec.ts` accordingly
- [x] 7.6 Update `specs/test-suite-method-tab/spec.md` for the per-row actions menu, rename modal, no
      standalone request-name field, non-collapsible Dynamic Configuration, and the simplified Extracted
      response fields section

## 8. Final quality gate

- [x] 8.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, and the full `npm run test` suite,
      and fix any failures (re-run after every follow-up round above)

## 9. Reconcile manual UI polish with tests and specs

- [x] 9.1 Reconcile the manually polished `TabSelector` (bordered segmented-control `clearView` variant),
      `DynamicConfiguration`/`VariableRow` spacing and info-tooltip, new `AttributeSelect`/`AttributeOption`
      rich column picker, `columns.tsx` "JSON Path" header/proportional widths, sidebar row label format
      (name-or-"Request N", no positional prefix), static Dynamic Configuration heading, and the wizard's
      in-place "View variable references" drill-down (header swap, hidden footer, overlay content) against
      the test suite; fix the resulting failures in `utils.spec.ts`, `RequestTemplate.spec.tsx`,
      `RequestsSidebar.spec.tsx`, and `MethodTabContent.spec.tsx`
- [x] 9.2 Fix lint/format issues introduced by the unformatted manual edits (`RequestsSidebar.tsx`,
      `TemplateVariablesDoc.tsx`, `AttributeSelect.spec.tsx`)
- [x] 9.3 Update `specs/test-suite-method-tab/spec.md` (static Dynamic Configuration heading, richer
      Attribute-binding picker, sidebar label wording) and `specs/test-suite-method-edit-wizard/spec.md`
      (in-wizard variable-references drill-down replacing the old separate-panel wording, fixed body
      height) to describe the actual polished behavior; re-run `openspec validate --strict`
