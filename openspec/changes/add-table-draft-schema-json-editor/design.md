## Context

See `proposal.md` — Why. This section carries only what shapes the approach; each **Decision** below
names the files it governs in its first line, so a developer run for one task can grep its own paths
and read that section alone.

What already exists, measured by reading it:

- `apps/ai-dial-admin/src/components/Analytics/Tables/TableDetailView.tsx` renders `TableProperties`,
  which renders `DraftSchemaEditor` on a non-`ACTIVE` table. The header's `!isActive` arm is a single
  `DialPrimaryButton` (`disabled={!draft.canMaterialize}`, `onClick={onSubmitDefineSchema}`) shown under
  `canModify`. The tab strip renders only when `analyticsEnabled && isActive`, so a draft screen has no
  tabs to withdraw — the pipeline editor's tab-strip juggling does not apply here.
- `use-draft-schema-form.ts` holds `DraftSchemaForm` (UI shape) and derives `buildDto(): DraftSchemaDto`
  and `canMaterialize` from it. It has no `description` or `tag_order`, and neither does
  `DraftSourceSchemaDto`/`DraftEnrichmentSchemaDto`.
- The same editor pattern shipped twice: `EvaluatorDetailView.tsx` and
  `Analytics/Pipelines/Common/PipelineDetailFrame.tsx`. Both hold `isEditorEnabled` state, swap
  `JsonToggle` in the header, read `jsonErrors` from `SaveValidationContext`, and route Save through an
  `onTryToSave` that turns markers into notifications via `showEditorErrorNotifications`. Reuse that
  wiring verbatim; the three differences are in D1, D3 and D4.
- `EntityJsonEditor` (`src/components/EntityTabs/JsonEditor/JsonEditor.tsx`) re-creates its Monaco model
  whenever the `entity` prop is not **identically** the object it last handed up through
  `setSelectedEntity` (`lastEntityFromEditorRef`). The enrichment-rule change measured what happens
  when that guard is broken: a remount per keystroke, the cursor thrown to the top, and a trailing space
  impossible to type. This is the single sharpest constraint on the wiring (D2).
- `src/app/[lang]/tables/[id]/page.tsx` has no `SaveValidationContextProvider`. `Tables/EnumValuesField.tsx`
  mounts its own provider around a popup; that one is unrelated and stays as it is.

## Goals / Non-Goals

**Goals**

- The editor a reader already knows from the evaluator and pipeline pages, with no table-specific
  variation that the table's own shape does not force.
- A pure, separately testable function for the document → two-request split, so the paste rules are
  provable without React.
- `EntityJsonEditor` and `SaveValidationContextProvider` reused with no new prop and no edit.

**Non-Goals**

- Extracting the now three-times-duplicated toggle/marker wiring into a shared harness. The pipeline
  design deferred it at two consumers; a third consumer is the point at which it becomes worth doing,
  but doing it inside this change would rewrite two pages that are not this change's subject. Recorded
  here as the next candidate, not started.
- Mapping an edited document back into `DraftSchemaForm` (see D1).
- A read-only JSON view for a caller who cannot modify the table (see D7).

## Decisions

### D1. The two surfaces hold independent state, and Save follows the active one

*Files: `apps/ai-dial-admin/src/components/Analytics/Tables/TableDetailView.tsx`.*

`PipelineDetailFrame` passes `setSelectedEntity={form.replaceDraft}`, so the document flows back into the
form and both surfaces stay one draft. That is unavailable here: `DraftSchemaForm` is a UI projection
(column rows, string selects) with no inverse of `createDraftSchemaForm`, and — decisively — it can
represent neither `description`/`tag_order` nor the pass-through members the paste rules require. A
document round-tripped through the form would silently lose exactly the members this change exists to
carry.

So `TableDetailView` holds one additional state, the document, seeded on first entry into editor mode
from `buildDraftDocument(table, draft.buildDto())`. After that seed the form and the document are
independent, and Save dispatches on which surface is active — the editor's document through the
two-request path (D4), the column form through today's single `defineTableSchema` call, unchanged.

Seeding **only on first entry** (not on every entry, as the pipeline frame does) is deliberate: the
pipeline can re-seed because its form is the source of truth, while here a re-seed would discard
hand-authored JSON that no other surface holds. The converse staleness is a risk, recorded below.

### D2. The document is handed to `EntityJsonEditor` as `entity` and stored exactly as received

*Files: `apps/ai-dial-admin/src/components/Analytics/Tables/TableDetailView.tsx`.*

Pass `entity={document}` and `setSelectedEntity={setDocument}` with no `ignoredFields`. The identity
guard then holds by construction: `EntityJsonEditor` stores the merged object in
`lastEntityFromEditorRef` and hands the same reference to `setDocument`, so the next render's `entity`
**is** that object and the seeding effect returns early — no remount, no cursor reset.

This is why the transform must not be applied on the way in (D3): normalizing the object before storing
it would make `entity !== lastEntityFromEditorRef.current` on every accepted keystroke and reproduce the
enrichment-rule bug. It is also why nothing should wrap the setter in a `useMemo`-derived object.

If that guard turns out not to hold in practice, the fallback is `EntityJsonEditor`'s text-controlled
mode (`text` + `onChangeText`), which skips the seeding effect entirely; it is a supported prop pair on
the shared component, so the fallback still needs no change to it. Deciding between the two is the
judgment named on task 3.1.

### D3. The drop/unpack transform is a pure function applied at submit time

*Files: `apps/ai-dial-admin/src/components/Analytics/Tables/draft-document.ts` (new),
`apps/ai-dial-admin/src/models/analytics/table.ts`.*

Two pure functions, no React, no i18n:

- `buildDraftDocument(table, schema): DraftTableDocument` — the seed: the column form's
  `DraftSchemaDto` plus `description` and `tag_order` taken from the table (`table.tag_order ?? []`,
  `table.description ?? ''`, so both keys are visible and editable in the document even on a table that
  has neither; both are merge-patch no-ops when unchanged).
- `splitDraftDocument(document): { update: UpdateTableDto; schema: DraftSchemaDto }` — one destructure
  does the whole job:

  the seven read-only/identity members and `grain` are destructured out and discarded, `description`
  and `tag_order` are destructured into `update`, and `...rest` becomes `schema` with the unpacked
  `grain_key`/`cardinality` spread **before** `rest` so a flat member already in the document wins over
  the nested object. `cardinality` is omitted when the nested object does not carry it.

The dropped-member list therefore exists as a destructuring pattern rather than as a constant array;
nothing else needs it, and a list plus a filter loop would be two things to keep in step instead of one.

`DraftTableDocument` goes in `models/analytics/table.ts` beside the DTOs it composes, as
`DraftSchemaDto & { description?: string; tag_order?: string[] }` widened with an index signature for the
pass-through members — the document is not a wire DTO and must not be typed as if it were, because both
request bodies are subsets of it.

Applying the transform at submit rather than on paste is the manager's recorded decision, and D2 is the
mechanical reason it is also the only cheap option.

### D4. Save in editor mode is `updateTable` then `defineTableSchema`, and form mode is untouched

*Files: `apps/ai-dial-admin/src/components/Analytics/Tables/TableDetailView.tsx`.*

`onSubmitDocument`: split the document, `await updateTable(name, update)`; on failure call the existing
`notifyFailed(res)` and return without sending the schema; on success delegate to the existing
`onDefineSchema(schema)`, which already raises the success notification and reloads. Both server actions
are already exported from `src/app/[lang]/tables/actions.ts`; `updateTable` is today called only from
`TablesView`, and this adds a second caller of the same action, not a new endpoint.

Form-mode Save keeps calling `onSubmitDefineSchema` and sends only the schema request. The column form
has no metadata field, so a `PUT` from there could never change anything, and a failed `PUT` would
suppress the `POST` — a new way for today's working path to fail. The delta pins this with its own
scenario so a later widening is caught.

### D5. A broken document blocks the save through notifications, not a disabled button

*Files: `apps/ai-dial-admin/src/components/Analytics/Tables/TableDetailView.tsx`.*

`onTryToSave` follows both precedents exactly: in editor mode with `jsonErrors.length`, call
`showEditorErrorNotifications(jsonErrors, showNotification, t)`, dispatch
`ValidationActionType.SetJsonEditorNotifications`, and return. The Save button's `disabled` becomes
`!isEditorEnabled && !draft.canMaterialize`.

Gating is not optional: `EntityJsonEditor` forwards only a *successful* parse, so while the text is
broken the stored document is the last good one, and an ungated Save would silently send stale content.
A `disabled` button was the alternative and is worse — the cause would be invisible, and a control
disabled without a stated reason is exactly what the a11y rules push back on.

### D6. The provider goes on the page; the existing view spec gets a context mock

*Files: `apps/ai-dial-admin/src/app/[lang]/tables/[id]/page.tsx`,
`apps/ai-dial-admin/src/app/[lang]/tables/tests/detail-page.spec.tsx` (new),
`apps/ai-dial-admin/src/components/Analytics/Tables/tests/TableDetailView.spec.tsx`.*

Wrap the rendered `TableDetailView` in `SaveValidationContextProvider`, exactly as
`app/[lang]/evaluators/[name]/page.tsx` does. `notFound()` still throws before the wrapper, so the
not-found branch is unchanged.

The consequence to plan for: `TableDetailView` will call `useSaveValidationContext()` unconditionally,
which **throws** without a provider, and `tests/TableDetailView.spec.tsx` renders the view bare at ~40
sites. The fix is one added `vi.mock('@/src/context/SaveValidationContext', …)` block at the top of that
spec — the convention `Pipelines/tests/PipelineJsonEditor.spec.tsx` already established (it mocks the
module, including the provider as a pass-through, and hands out a controllable `jsonErrors`). Wrapping
40 render calls in a provider is the alternative and is 40 edits for the same effect.

The new page spec mirrors `app/[lang]/evaluators/tests/detail-page.spec.tsx`: assert the returned element
is the provider and that the view under it receives the expected props, and keep the `notFound` branch.

### D7. The toggle is offered exactly where Save is offered

*Files: `apps/ai-dial-admin/src/components/Analytics/Tables/TableDetailView.tsx`.*

Render `JsonToggle` (`src/components/EntityHeaderControls/JsonToggle/JsonToggle.tsx`) beside the Save
button, inside the same `!isActive && canModify` arm. It already renders a `DialSwitch` labelled with
`EntitiesI18nKey.JSONEditor`, so it is reachable by role and needs no new i18n key.

The rule page put its toggle *outside* the full-admin guard to give a reader a read-only document view.
That is rejected here: a draft's whole content is already on screen in the column form, so a read-only
JSON view of it answers no requirement, and offering it would mean rendering the editor in a branch
whose surrounding permission cluster does not otherwise render.

No new i18n keys anywhere in this change: the success path reuses `AnalyticsTablesI18nKey.TableActive`,
failures reuse `notifyFailed`'s `AnalyticsTablesI18nKey.ActionFailed`, the toggle reuses
`EntitiesI18nKey.JSONEditor`.

### D8. Which spec file proves what

*Files: `apps/ai-dial-admin/src/components/Analytics/Tables/tests/draft-document.spec.ts` (new),
`apps/ai-dial-admin/src/components/Analytics/Tables/tests/TableDraftJsonEditor.spec.tsx` (new),
`apps/ai-dial-admin/src/components/Analytics/Tables/tests/TableDetailView.spec.tsx`.*

- `draft-document.spec.ts` — the seed shape per kind and every paste rule (the seven dropped members,
  the grain unpack, flat-wins-over-nested, the pass-through). Pure, no rendering.
- `TableDraftJsonEditor.spec.tsx` — the view's editor mode. Mock the `SaveValidationContext` module for a
  controllable `jsonErrors` and mock `EntityJsonEditor` to capture its props and expose a button that
  calls `setSelectedEntity`, as `PipelineJsonEditor.spec.tsx` does; assert on the recorded bodies of the
  mocked `updateTable`/`defineTableSchema` and on their call order (`mock.invocationCallOrder`).
- `TableDetailView.spec.tsx` — the added context mock, plus the regression that a form-mode Save calls
  `defineTableSchema` and never `updateTable`.

Note for whoever edits `TableDetailView.spec.tsx`: it already mocks `JsonEditorBase` as a textarea
labelled `rows-json` for the write-rows popup. Do not reuse that label for the draft editor; the new
spec mocks `EntityJsonEditor` one level higher and does not need it.

## Alternatives rejected

- **Round-trip the document through `DraftSchemaForm` so both surfaces stay one draft** (the pipeline
  precedent) — rejected in D1: the form cannot represent `description`, `tag_order` or a pass-through
  member, so the round trip would delete the members this change adds.
- **Re-seed the document on every entry into editor mode** — rejected in D1: it discards hand-authored
  JSON that nothing else holds.
- **Apply the drop/unpack transform to the document as it is parsed, so the editor shows what will be
  sent** (the reading the proposal's scenarios took) — rejected by the manager's recorded decision and
  independently by D2: storing a normalized copy breaks `EntityJsonEditor`'s identity guard and
  re-creates the Monaco model on every keystroke.
- **Rewrite the editor's text after a paste** — same reason, plus it moves the author's cursor.
- **Send `PUT` on every draft save, including from the column form** (the proposal's original sentence) —
  superseded by the manager's decision and pinned by a scenario: the form cannot change metadata, so the
  only thing a `PUT` there adds is a way for the working path to fail.
- **Disable Save while the document has parse markers** — rejected in D5; the cause would be invisible.
- **A read-only editor for a caller without `modify`** — rejected in D7.
- **A `DRAFT_DOCUMENT_DROPPED_FIELDS` constant plus a filter loop** — rejected in D3; the destructure is
  the same rule in one place.
- **Extract the shared toggle/marker wiring now** — rejected in Non-Goals; it would rewrite two pages
  this change does not own.

## Risks / Trade-offs

- **The document goes stale against the column form.** An author who opens the editor, toggles back,
  edits the form, and returns to the editor sees the document as it was seeded. → Accepted, and the
  asymmetry is deliberate: the stale state is fully visible on screen (the editor shows what it will
  send), whereas re-seeding would silently destroy JSON that exists nowhere else. Both surfaces submit
  only what they display, so nothing is sent that the author cannot see.
- **JSON edits are stranded by toggling to the column form and saving from there.** The document is kept,
  not discarded, so the edits are one toggle away — but a form-mode Save will not include them. →
  Accepted; the alternative (locking the toggle once the document is dirty) invents a mode the two prior
  editors do not have. Worth revisiting if it is reported.
- **An unconditional `PUT` fires even when the metadata is unchanged**, so a metadata-service failure can
  block a schema submission that would otherwise have succeeded. → Accepted; it is the manager's ordering
  decision, the request is a merge-patch no-op, and the failure is reported with the service's own error
  rather than swallowed.
- **`EntityJsonEditor`'s identity guard is load-bearing and invisible.** Nothing in the type system stops
  a later refactor from deriving the `entity` prop and reintroducing the per-keystroke remount, and jsdom
  cannot see it because Monaco is mocked. → Mitigated by D2's comment obligation at the call site and by
  the browser task, which is the only place a real Monaco runs.
- **`tag_order: []` on the seed of a table that has tags.** The seed reads the table's stored value, so
  this only happens if the stored value is absent; but an author who deletes the key from the document
  gets "leave unchanged", while an author who empties the array gets "clear". → That is the endpoint's
  documented semantics (`UpdateTableDto` in `models/analytics/table.ts`) and the document is the request,
  so it is stated rather than hidden.
- **Delta size.** The two MODIFIED requirements are restated in full, as the house format demands; the
  edits inside them are two sentences and two scenarios. Reviewers should diff against
  `openspec/specs/analytics/tables/spec.md` rather than read the restatement as new text.
