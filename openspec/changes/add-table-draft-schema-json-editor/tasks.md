## 1. The draft document and its request split

Pure code, no React. `design.md` — D3 governs this section.

- [x] 1.1 Add `DraftTableDocument` to `apps/ai-dial-admin/src/models/analytics/table.ts`, beside
      `DraftSchemaDto` and `UpdateTableDto`: `DraftSchemaDto` plus optional `description` and
      `tag_order`, widened so a member this console does not know still type-checks (the document is
      not a wire DTO — both request bodies are subsets of it, and D3 says why). Do not change
      `DraftSourceSchemaDto`, `DraftEnrichmentSchemaDto` or `UpdateTableDto`.
- [x] 1.2 Add `apps/ai-dial-admin/src/components/Analytics/Tables/draft-document.ts` exporting
      `buildDraftDocument(table, schema): DraftTableDocument` (the seed: the column form's
      `DraftSchemaDto` plus `description`/`tag_order` read off the table) and
      `splitDraftDocument(document): { update: UpdateTableDto; schema: DraftSchemaDto }` (drop
      `status`, `system`, `permissions`, `column_count`, `name`, `type`, `source_table`; unpack
      `grain` into flat `grain_key`/`cardinality` with a flat member already present winning; route
      `description`/`tag_order` into `update`; pass everything else through into `schema`). One
      destructure does the whole split — see D3; no constant list of dropped fields.
- [x] 1.3 Add `apps/ai-dial-admin/src/components/Analytics/Tables/tests/draft-document.spec.ts`
      covering the seeded shape for a source and for an enrichment (including the members that must be
      absent), all seven dropped members, the grain unpack, flat-wins-over-nested, an omitted
      `cardinality`, and an unrecognized member surviving into the schema body. Verify with
      `npx vitest run src/components/Analytics/Tables/tests/draft-document.spec.ts --reporter=dot`
      from `apps/ai-dial-admin/`.

## 2. The table detail page provides the save-validation context

`design.md` — D6 governs this section. Do not modify `SaveValidationContext.tsx` itself.

- [x] 2.1 Wrap the rendered `TableDetailView` in `SaveValidationContextProvider` in
      `apps/ai-dial-admin/src/app/[lang]/tables/[id]/page.tsx`, exactly as
      `apps/ai-dial-admin/src/app/[lang]/evaluators/[name]/page.tsx` does. `notFound()` keeps throwing
      before the wrapper, so the not-found branch is unchanged.
- [x] 2.2 Add `apps/ai-dial-admin/src/app/[lang]/tables/tests/detail-page.spec.tsx`, modelled on
      `apps/ai-dial-admin/src/app/[lang]/evaluators/tests/detail-page.spec.tsx`: the page returns the
      provider, the view one level in receives `name`/`initialTable`/`apiBaseUrl`/`flightUri`, and a
      missing table still reaches `notFound()`. Verify with
      `npx vitest run "src/app/[lang]/tables/tests/detail-page.spec.tsx" --reporter=dot`.

## 3. Editor mode in the table detail view

`design.md` — D1, D2, D4, D5, D7, D8 govern this section. All three items touch one area; keep 3.1's
call-site comment on why the document object is stored by reference (D2) — nothing in the types
protects that, and jsdom cannot see it break.

- [x] 3.1 In `apps/ai-dial-admin/src/components/Analytics/Tables/TableDetailView.tsx`: add
      `isEditorEnabled` and document state (seeded on first entry only), render `JsonToggle` beside the
      existing Save button in the `!isActive && canModify` arm, render `EntityJsonEditor` in place of
      `properties` while the editor is active, change Save's `disabled` to
      `!isEditorEnabled && !draft.canMaterialize`, and route Save through an `onTryToSave` that turns
      `jsonErrors` into notifications (`showEditorErrorNotifications` +
      `ValidationActionType.SetJsonEditorNotifications`) and otherwise submits `updateTable` then
      `defineTableSchema` in editor mode, or today's `onSubmitDefineSchema` alone in form mode. No new
      prop on `EntityJsonEditor` and no new i18n key.
- [x] 3.2 Add `apps/ai-dial-admin/src/components/Analytics/Tables/tests/TableDraftJsonEditor.spec.tsx`,
      following the mocking convention in
      `apps/ai-dial-admin/src/components/Analytics/Pipelines/tests/PipelineJsonEditor.spec.tsx` (mock
      the `SaveValidationContext` module for a controllable `jsonErrors`; mock `EntityJsonEditor` to
      capture props and expose a control that calls `setSelectedEntity`). Cover: the toggle shown on a
      draft and absent on an `ACTIVE` table; the column form replaced while the editor is active; the
      document surviving a re-render and a toggle-off/on round trip; Save enabled on an incomplete
      document; markers blocking both requests and raising notifications; `updateTable` sent before
      `defineTableSchema` with the split bodies; a failed `updateTable` suppressing the schema request;
      a failed `defineTableSchema` leaving the draft surface. Verify with
      `npx vitest run src/components/Analytics/Tables/tests/TableDraftJsonEditor.spec.tsx --reporter=dot`.
- [x] 3.3 In `apps/ai-dial-admin/src/components/Analytics/Tables/tests/TableDetailView.spec.tsx` add the
      `vi.mock('@/src/context/SaveValidationContext', …)` block the ~40 bare renders now need (D6), and
      one regression case asserting a form-mode Save calls `defineTableSchema` and never `updateTable`.
      Verify with
      `npx vitest run src/components/Analytics/Tables/tests/TableDetailView.spec.tsx --reporter=dot`.

## 4. Browser verification

The house criterion was applied to every scenario's THEN clause and the decision recorded in the run's
`plan.json`: verification is **added**, narrowed to the three scenarios that cross a boundary the unit
tests mock away — the real Monaco editor and the real analytics backend. Everything else in the delta
is a props-level render or a pure function and is proved by sections 1-3.

- [x] 4.1 Run the `spec-browser-verify` skill against a locally booted app (port 4200) with
      `ANALYTICS_ENABLED` on and a `PENDING` table available, scoped to: an in-progress document
      surviving a re-render, a document with real Monaco parse markers blocking the save, and a
      successful save sending the metadata update before the schema and ending `ACTIVE`. Resolve any
      `fail` verdict before the change is complete.

## 5. Quality checks

- [x] 5.1 From `apps/ai-dial-admin/`: `npm run lint 2>&1 | tail -30`,
      `npx prettier --check "src/**/*.{ts,tsx}" 2>&1 | tail -10`, `npm run typecheck`, and
      `npx vitest run --reporter=dot --coverage --coverage.reporter=text-summary`. The app typecheck is
      green on `development` and blocks; a failure in it is this change's. Report anything that needs
      fixing rather than editing files this item does not own.

## 6. The draft header's changed state (follow-up)

`design.md` — D9 governs this section. The shipped header renders `Save` + `JsonToggle`
unconditionally on the draft branch and tracks no changed state, so it does not follow this console's
changed-entity convention. `EvaluatorDetailView.tsx` is the exemplar to measure against — read its
header block and its `onDiscard` before writing anything.

One rule is the owner's and is not open: while the draft is **unchanged** the header offers **neither
Save nor Discard** — only Manage access, Delete table and the JSON-editor toggle. An untouched `FAILED`
draft therefore cannot be re-submitted without an edit; that cost was weighed and accepted (D9).

Two boundaries: **nothing changes on an `ACTIVE` table**, and `ChangedEntityButtons`,
`SimpleButtonsWrapper`, `EntityJsonEditor` and `SaveValidationContext` are reused as-is — a needed new
prop on any of them is a `CONFLICT` back to the manager, not an edit. `SimpleButtonsWrapper` is
deliberately **not** adopted (D9 says why), so the inline marker gate in `TableDetailView` stays.

- [x] 6.1 Extract the hook's DTO builder and give the hook a changed state.
      In `apps/ai-dial-admin/src/components/Analytics/Tables/utils.ts` add a pure
      `buildDraftSchemaDto(form: DraftSchemaForm, type: AnalyticsTableType): DraftSchemaDto` holding the
      body currently inside `useDraftSchemaForm`'s `buildDto`; in
      `apps/ai-dial-admin/src/components/Analytics/Tables/use-draft-schema-form.ts` delegate `buildDto`
      to it and add three members to `UseDraftSchemaFormReturn`: `baselineDto` (the DTO
      `createDraftSchemaForm(table)` yields, memoized on `table`), `isChanged` (the live DTO deep-compared
      against `baselineDto` with `isEqualSkippingUndefined` — **not** a form-object comparison, see D9 for
      why the `ColumnRow.id` counter makes that impossible), and `reset` (`setForm(createDraftSchemaForm(table))`,
      the shape `use-evaluator-form.ts` already exposes). The extraction is behaviour-preserving: the 16
      existing cases in `tests/use-draft-schema-form.spec.ts` are its regression, so run them before
      adding anything. (The count was written as 18 here and in D9; measured at 16 before the
      extraction, green before and after.) Do not change `createDraftSchemaForm`, `canMaterialize` or the existing return
      members, and do not make the form re-derive itself when `table` changes — it is initialised once
      today and that stays.
- [x] 6.2 In `apps/ai-dial-admin/src/components/Analytics/Tables/tests/use-draft-schema-form.spec.ts` add
      cases for the three new members: unchanged on a fresh `PENDING` source and on a `PENDING`
      enrichment; unchanged on a `FAILED` table seeded from its stored definition (columns, ordering key,
      scan pair); changed once a valid column, an ordering key or a grain key is set; `reset` returning
      `isChanged` to `false` and the form to its seeded values; and `baselineDto` reflecting the stored
      definition rather than the live form. Verify with
      `npx vitest run src/components/Analytics/Tables/tests/use-draft-schema-form.spec.ts --reporter=dot`
      from `apps/ai-dial-admin/`.
- [x] 6.3 In `apps/ai-dial-admin/src/components/Analytics/Tables/TableDetailView.tsx` present the
      changed-entity header on the draft branch. Add
      `storedDocument = useMemo(() => buildDraftDocument(table, draft.baselineDto), …)`, derive
      `isDocumentChanged`, `hasJsonErrors = isEditorEnabled && Boolean(jsonErrors?.length)` and
      `isChangeBarShown = !isActive && canModify && (draft.isChanged || isDocumentChanged || hasJsonErrors)`.
      When it is true render `ChangedEntityButtons`
      (`@/src/components/EntityHeaderControls/Buttons/ChangedEntityButtons`) with `onSave={onTryToSave}`,
      `onDiscard`, and `disableSave={!isEditorEnabled && !draft.canMaterialize}` — the same gate Save has
      today — in place of `Manage access`, `Delete table`, `Save` and `JsonToggle`. When it is false the
      header renders `Manage access`, `Delete table` and `JsonToggle` **and no Save**: Save is withdrawn
      from the unchanged header, which is the owner's decision recorded in D9 and the shape
      `SimpleButtonsWrapper` already has. The `isActive` arm is untouched byte for byte.
      `onDiscard` dispatches `ValidationActionType.Reset` **first** (a stale marker would otherwise hold
      the bar up on its own — the reason is commented in `EvaluatorDetailView.onDiscard`), then
      `draft.reset()`, then `setDraftDocument(storedDocument)` when a document exists; it must not change
      `isEditorEnabled` and must not set the document to `null` (D9 records what that would look like).
      No new i18n key and no new prop on any shared component.
- [x] 6.4 Prove it, and reconcile the two specs that assert today's header.
      Add `apps/ai-dial-admin/src/components/Analytics/Tables/tests/TableDraftChangedHeader.spec.tsx`
      covering: editing the document swaps the header and withdraws `Manage access`, `Delete table` and
      the toggle; editing the column form does the same (mock `DraftSchemaEditor` as a control that calls
      its `draft.update(...)` prop — both existing specs mock it as an inert `<div>`, which cannot drive a
      form edit); an untouched draft keeping `Manage access`, `Delete table` and the toggle and offering
      **neither Save nor Discard**; an untouched `FAILED` table seeded from its stored definition offering
      no Save either (the owner's decision — see D9; it is a decided behaviour, not an oversight, so it
      needs its own case); parse markers alone raising the bar; Discard restoring both surfaces and
      staying in the editor; the confirmation being required and its dismissal changing nothing; the bar
      absent for a caller with `canDelete`/`canManageRoles` but not `canModify`; and an `ACTIVE` table's
      header unchanged.
      Then reconcile the existing cases that query Save on an **untouched** draft, where there is now no
      Save at all. Measured for this item, so they are not hunted for: in
      `tests/TableDetailView.spec.tsx` — `'a not-yet-active table shows Save in place of Connect and the
      Add buttons'`, `'a PENDING table shows a header Save action, disabled until the draft is complete'`
      and `'saving from the column form sends the schema request and no metadata request'` (that last one
      renders a complete stored definition and clicks Save without editing); in
      `tests/TableDraftJsonEditor.spec.tsx` — the four that open the editor and save without writing
      (`"the column form's completeness rules do not gate Save in the editor"`, `'the metadata request is
      sent before the schema request, each with its own members'`, `'a successful save refreshes the view
      onto the activated table'`, `'a failed metadata update blocks the schema request and reports the
      service error'`), plus the title `'offers the toggle beside Save on a PENDING table'`, which no
      longer describes the header. Each needs a change made before the header is queried — a document
      write, or a `draft.update(...)` from the mocked `DraftSchemaEditor` — not a weakened assertion; keep
      what each case actually proves. The Save button's accessible name is unchanged once the header has
      swapped (`ChangedEntityButtons` renders `ButtonsI18nKey.Save` and `t()` returns keys). Verify with
      `npx vitest run src/components/Analytics/Tables/tests --reporter=dot`.
      **Corrected after 6.3 landed and the reds were measured: it is 10 cases, not 7.** The three above
      that were not predicted are all in `tests/TableDraftJsonEditor.spec.tsx` — `'an unrelated
      re-render leaves the edited document alone'`, `'leaving and re-entering the editor shows the
      document as the author left it'` and `'a document edit leaves the column form's own submission
      unchanged'` — and they go red because *Delete* and the *toggle* are withdrawn once the draft is
      changed, not because of Save. Conversely `'offers the toggle beside Save on a PENDING table'`
      stays green: only its title is now wrong, its body never queries Save.
      Two of those three could not be fixed and were left `test.skip` — correctly, because the delta
      contradicted itself rather than the tests being wrong. That contradiction is now resolved (D10):
      the toggle stays withdrawn and the scenario is retired. **The two skips stay skipped** on the
      owner's ruling — they are a separate piece of work, no ticket was filed, and no item in this
      change touches them. This item is complete without them.
- [x] 6.5 **Satisfied by the owner's own verification, not by an agent pass.** Asked specifically
      whether Discard itself was exercised — edit the document, Discard, confirm, both surfaces
      restored — rather than accepting a general "it works"; he confirmed it directly on the local app
      running this working tree. Owner-attested rather than machine-recorded: it leaves no artifact and
      cannot be re-run, and it is valid only because 6.4 touches spec files alone. Should anything force
      a change to `TableDetailView.tsx`, this item reopens. Original instruction, unchanged:
      Run the `spec-browser-verify` skill against a locally booted app (port 4200, `ANALYTICS_ENABLED`
      on, a `PENDING` table available), scoped to **one** scenario: "Discard restores both surfaces to the
      stored state", entered through the JSON editor. It is the only new scenario that crosses a boundary
      the unit tests mock away — a real Monaco model being replaced through `EntityJsonEditor`'s remount
      key, which is the inverse of the guard section 4 checks and is stubbed to a `<textarea>` in jsdom.
      Every other new scenario is a props-level header render and is proved by 6.4. Resolve any `fail`
      verdict before the change is complete. Note for EM: if section 4's pass has not yet been re-run when
      this lands, fold this scenario into it and save a boot — and note that its scenarios now need an
      edit to the document before Save exists at all, since the unchanged header no longer offers it.
- [x] 6.7 Add the one case for the scenario that replaced the retired one. **One file:**
      `apps/ai-dial-admin/src/components/Analytics/Tables/tests/TableDraftChangedHeader.spec.tsx`. No
      source file is touched, and `TableDetailView.tsx` in particular must come out byte for byte
      unchanged. Numbered after 6.6 because 6.1-6.6 were already dispatched; **listed before it**
      because the quality checks have to run last.
      **The two `test.skip` blocks in `tests/TableDraftJsonEditor.spec.tsx` are out of scope and stay
      exactly as they are** — `'leaving and re-entering the editor shows the document as the author left
      it'` and `"a document edit leaves the column form's own submission unchanged"`. Do not delete,
      un-skip, rename or reword either, and do not touch that file at all. An earlier revision of this
      task had them deleted; the owner ruled that they are a separate piece of work, not this change's,
      and that no ticket is to be filed for them. D10 records that ruling, which of the two is dead and
      which guards a live guarantee, and what the case below does and does not cover of it. Read D10
      before assuming either of them is tidy-up.
      This file is the right home for the new case rather than `tests/TableDraftJsonEditor.spec.tsx`
      because the case has to drive a **column-form** edit and then read the header: this file mocks
      `DraftSchemaEditor` as a control that calls `draft.update(...)` and already has the
      `jsonToggle`/`openEditor`/`editColumnForm`/`saveButton`/`discardButton` helpers, whereas the
      JsonEditor spec mocks `DraftSchemaEditor` as an inert `<div>` that cannot drive a form edit.
      Add the case for the scenario `Opening the editor and
      leaving it does not change what the column form submits`: on a modifiable `PENDING` draft, open the
      editor via the toggle **without writing to the document**, assert the draft still reads as
      unchanged (the toggle, Manage access and Delete table still offered, no Save and no Discard),
      toggle the editor back off, then drive a column-form edit through that file's existing
      `DraftSchemaEditor` control mock and Save, and assert `defineTableSchema` was called with the
      column form's own body and `updateTable` was never called. That file already auto-mocks
      `@/src/app/[lang]/tables/actions` and already mocks `DraftSchemaEditor` as a control and
      `EntityJsonEditor` at the props boundary, so nothing new needs mocking; if the mocked draft is not
      materializable after the control's edit, Save is disabled by design — adjust the fixture, not the
      assertion. The regression this case exists for is `isDocumentChanged` comparing by reference
      instead of by value, which would make merely opening the editor mark the draft changed and make
      the toggle vanish under the author's cursor. Verify with
      `npx vitest run src/components/Analytics/Tables/tests --reporter=dot` from `apps/ai-dial-admin/`.
      The run still reports **two skipped tests** in `TableDraftJsonEditor.spec.tsx` — that is the
      expected result, not something to clean up.
- [x] 6.6 From `apps/ai-dial-admin/`, re-run the quality checks over the follow-up:
      `npm run lint 2>&1 | tail -30`, `npx prettier --check "src/**/*.{ts,tsx}" 2>&1 | tail -10`,
      `npm run typecheck`, and
      `npx vitest run --reporter=dot --coverage --coverage.reporter=text-summary`. Report anything that
      needs fixing rather than editing files this item does not own.
