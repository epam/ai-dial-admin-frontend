## 1. Form state

- [x] 1.1 Add a replacing setter to `apps/ai-dial-admin/src/components/Analytics/Evaluators/use-evaluator-form.ts`:
  `replaceDraft(next: CreateEvaluatorDto)` sets the draft wholesale. Leave `onChange` merging as it is —
  the Properties controls depend on that. Extend `EvaluatorFormState` with the new member.

- [x] 1.2 Invert `buildEvaluatorDto` in `apps/ai-dial-admin/src/utils/analytics/evaluator-dto.ts` from an
  allow-list to spread-and-subtract: carry the draft through, then delete the read-only members, delete the
  llm-only members when the type is `sql`, and prune empties. Without this a member introduced in the JSON
  never reaches the request, and — because change detection compares assembled requests — adding one
  reports no change at all, so no Save control appears.

## 2. Page wiring

- [x] 2.1 Wrap `EvaluatorDetailView` in `SaveValidationContextProvider` in
  `apps/ai-dial-admin/src/app/[lang]/evaluators/[name]/page.tsx`, following the placement used by
  `app/[lang]/interceptors/[id]/page.tsx`. Required even for a read-only caller: `EntityJsonEditor`
  calls `useJsonEditorValidation()` before consulting `readonly`.

## 3. Editor in the detail view

All in `apps/ai-dial-admin/src/components/Analytics/Evaluators/EvaluatorDetailView.tsx`.

- [x] 3.1 Add `isEditorEnabled` state and render `JsonToggle`
  (`components/EntityHeaderControls/JsonToggle/JsonToggle.tsx`) in the identity row beside
  `EvaluatorVersionSwitcher`, resolving the slot the three ways `SimpleButtonsWrapper` does: a caller
  who is not a full admin always gets the toggle; `form.isChanged` gets `ChangedEntityButtons` and **no**
  toggle; otherwise the toggle. The existing `isFullAdmin && form.isChanged` guard becomes the middle
  branch. Do not use `JsonToggleWithFormats`; its export-format selector has no analytics meaning.
- [x] 3.2 Swap the whole tabbed region: when the editor is on, render `EntityJsonEditor` in place of the
  tabs row, the facts section, the fields, and the rules grid alike. Gate the `HeaderTabs` row on
  `!isEditorEnabled` in the view rather than passing the flag to `HeaderTabs`, whose
  `isReadOnlyAdmin` disjunct would leave a read-only caller with inert tabs. Leave `activeTab` untouched
  while the editor is on, so disabling it returns to the tab the caller came from.
- [x] 3.3 Configure `EntityJsonEditor` with `entity={form.draft}`, `setSelectedEntity` wired to
  `replaceDraft` (not `onChange`), `ignoredFields={['name']}`, and `readonly={isDisabled}`.
- [x] 3.4 Relax the shape check in editor mode: `onSave`'s leading `if (!form.isValid || isSaving)` and
  the Save control's `disabled` apply the `form.isValid` half only when the fields are on screen.
  `isSaving` keeps applying in both modes.
- [x] 3.5 Gate submission on Monaco markers: read `jsonErrors` from `useSaveValidationContext`, and when
  the editor is on and markers are present, raise one notification per marker via
  `showEditorErrorNotifications` (`components/EntityHeaderControls/Buttons/utils.ts`) and do not open the
  confirmation popup. Store the returned notifications through
  `ValidationActionType.SetJsonEditorNotifications` so the editor's unmount cleanup can clear them.
- [x] 3.6 Leave the confirmation popup, the `Save as new version` label, and `createEvaluator(form.buildDto())`
  untouched — both presentations submit through them.
- [x] 3.7 Trigger the Discard/Save pair on `jsonErrors` as well as on `form.isChanged`, since unparseable
  text never reaches the draft: without it a caller whose first edit breaks the document gets no Discard to
  back out of it and no Save to surface the parse errors, so the gate in 3.5 is unreachable.

## 4. Tests

- [x] 4.1 Unit-test `replaceDraft` in `components/Analytics/Evaluators/tests/use-evaluator-form.spec.ts`:
  it replaces rather than merges, so a member absent from the argument is absent from the draft, and
  `isChanged` reflects the replacement.
- [x] 4.2 Component-test the new view behaviour in
  `components/Analytics/Evaluators/tests/EvaluatorJsonEditor.spec.tsx` — a new file rather than the existing
  `EvaluatorDetailView.spec.tsx`, because the marker cases need a controllable `SaveValidationContext` that
  the suite-wide mock pins empty — mocking
  `@/src/components/EntityTabs/JsonEditor/JsonEditor` as existing specs do (Monaco does not run under
  jsdom): the toggle is offered; enabling it replaces the Properties fields while name, version control
  remain; the tabs and the rules grid are withdrawn; the mocked editor receives `ignoredFields={['name']}`
  and `readonly` reflecting `isFullAdmin`; enabling the editor from the `Rules` tab and disabling it with
  nothing pending returns to `Rules`; submitting from the editor opens the same confirmation popup.
- [x] 4.3 Component-test the two gates: with markers present, submitting raises a notification per marker
  and does not open the confirmation popup, and the Save control stays enabled; with the editor on and
  `form.isValid` false, the Save control is not disabled by the shape check.
- [x] 4.4 Component-test the identity row's three branches: an unchanged full admin gets the toggle; a
  changed one gets Discard and Save and **no** toggle; discarding from the editor restores the stored
  version and brings the toggle back.
- [x] 4.5 Extend `components/Analytics/Evaluators/tests/EvaluatorDetailPermissions.spec.tsx` so a
  non-full-admin caller is shown the toggle, given a read-only editor, and has the tabs withdrawn in
  editor mode like any other caller — alongside the existing assertions that the caller gets no Save
  control.
- [x] 4.6 Add `components/Analytics/Evaluators/tests/EvaluatorJsonRoundTrip.spec.tsx`, stubbing only
  `JsonEditorBase` so the real `EntityJsonEditor` runs: the typed document reaches the request, an
  unpresented member both counts as a change and is registered, a deleted member is absent, a changed name
  is disregarded, and unparseable text leaves the last good draft in place. Stubbing the whole editor
  cannot cover this path, which is how the missing Discard/Save was shipped past the other specs. Include a
  characterization test for the version switcher silently replacing unsaved edits, which is pre-existing
  behaviour this change deliberately leaves alone.
- [x] 4.7 Cover the parse-failure entry point in `EvaluatorJsonEditor.spec.tsx`: markers present with an
  untouched draft still offer Discard and Save, using Save then reports each parse error, and the toggle
  returns once the document parses.

## 5. Review follow-ups

- [x] 5.1 Make `evaluator-dto.ts` total over arbitrary parsed JSON: a value of the wrong type reads as
  absent rather than raising. Both exported functions run during render, so `{"model": 5}` or
  `{"output_vars": {}}` — both valid JSON — blanked the page through the error boundary and lost the
  document.
- [x] 5.2 Carry unknown members through a declared variable as well as the top level: `toTypedVar` rebuilt
  each variable from `{name, type}` plus one expression, dropping anything else.
- [x] 5.3 Dispatch `ValidationActionType.Reset` before discarding, as `SimpleButtonsWrapper` does, so a
  marker for a document that no longer exists cannot hold the change bar up.
- [x] 5.4 Restore the comment on the version-switch reset effect, deleted while the region was rewritten.
- [x] 5.5 Replace two assertions that could not fail — the marker-cleared transition and the shape-check
  bypass — and cover the read-only strip, which nothing reached.

## 6. Quality gate

- [x] 6.1 Run `npm run lint`, `npm run format`, and `npm run test` from the repo root; fix anything they
  report.
