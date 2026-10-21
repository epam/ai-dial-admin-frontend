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

### D7. The toggle lives in the same permission arm Save does

*Files: `apps/ai-dial-admin/src/components/Analytics/Tables/TableDetailView.tsx`.*

Render `JsonToggle` (`src/components/EntityHeaderControls/JsonToggle/JsonToggle.tsx`) beside the Save
button, inside the same `!isActive && canModify` arm. (D9 later withdrew Save from the *unchanged*
header, so the two no longer sit side by side in every state — the toggle is an ordinary action and Save
belongs to the changed header. What this decision fixes is the permission arm both live in, which D9
does not move.) It already renders a `DialSwitch` labelled with
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

### D9. The draft header adopts `ChangedEntityButtons`, and "changed" is a built-DTO comparison

*Files: `apps/ai-dial-admin/src/components/Analytics/Tables/TableDetailView.tsx`,
`apps/ai-dial-admin/src/components/Analytics/Tables/use-draft-schema-form.ts`,
`apps/ai-dial-admin/src/components/Analytics/Tables/utils.ts`.*

Added as a follow-up: the shipped header renders `Save` + `JsonToggle` unconditionally and tracks no
changed state, so it does not follow the changed-entity convention every other entity view here does.
`EvaluatorDetailView.tsx` is the closest exemplar and this decision copies it line for line; the
differences are the two named below.

**What is reused, and what stays hand-rolled.** `ChangedEntityButtons`
(`EntityHeaderControls/Buttons/ChangedEntityButtons.tsx`) is used as-is, with `onDiscard`, `onSave`
and `disableSave`, exactly as both `EvaluatorDetailView` and `PipelineDetailFrame` use it. It owns the
Discard confirmation (`EntityView/Modals/Discard/Discard.tsx`) so the caller supplies no modal.
`SimpleButtonsWrapper` is **not** adopted: it owns Delete, the whole header row and the JSON toggle,
so adopting it would restructure the `ACTIVE` arm too, which the owner's boundary forbids. Both
exemplars reach for `ChangedEntityButtons` directly for the same reason.

The inline marker gate in `TableDetailView` — `useSaveValidationContext`,
`showEditorErrorNotifications`, the `onTryToSave` short-circuit — is therefore **not** removed. Only
`SimpleButtonsWrapper` contains that logic; `ChangedEntityButtons` does not, and both exemplars keep
their own `onTryToSave` beside it. This change makes `TableDetailView` the **fourth** consumer of the
same fifteen lines, which strengthens the extraction candidate already recorded under Non-Goals
without making it this change's business.

**What counts as changed.** `use-draft-schema-form.ts` gains `isChanged`, `reset` and `baselineDto`,
the shape `use-evaluator-form.ts` already exposes. The comparison is between **built DTOs**, as
`PipelineDetailFrame` does it, not between form objects: `createDraftSchemaForm` mints a fresh
`ColumnRow.id` per call (`nextColumnId()`), so `form` deep-compared against a re-derived baseline form
is *never* equal and `isChanged` would be permanently true. Comparing
`buildDraftSchemaDto(form, table.type)` against the same function applied to
`createDraftSchemaForm(table)` sidesteps ids entirely and is the honest question anyway — whether what
would be submitted differs from what is stored. The cost is that a half-typed, not-yet-valid column row
does not register as a change until it becomes submittable; accepted, because such a row cannot be
saved either.

This forces one small extraction: `buildDto` must be callable on an arbitrary form, so its body moves
to a pure `buildDraftSchemaDto(form: DraftSchemaForm, type: AnalyticsTableType): DraftSchemaDto` in
`Tables/utils.ts` (utils.md's placement) and the hook's `buildDto` delegates to it. Behaviour-preserving:
the 18 existing cases in `tests/use-draft-schema-form.spec.ts` are its regression.

In the view, `storedDocument = buildDraftDocument(table, draft.baselineDto)` — the same name and role
`PipelineDetailFrame` gives it — serves twice: as the document baseline and as what Discard restores.
So no extra seed state is introduced, and the combined flag is

```
isChangeBarShown = !isActive && canModify && (draft.isChanged || isDocumentChanged || hasJsonErrors)
```

with `hasJsonErrors = isEditorEnabled && Boolean(jsonErrors?.length)` — the exemplars' `hasJsonErrors`
term, which exists because `EntityJsonEditor` forwards only a *successful* parse, so a broken document
can otherwise read as unchanged. `!isActive` is in the expression rather than implied by where the JSX
sits: it makes the owner's ACTIVE boundary structural instead of incidental.

**Discard.** `dispatch({ type: ValidationActionType.Reset })` **before** the two resets — the comment in
`EvaluatorDetailView.onDiscard` records why: `EntityJsonEditor` keeps its editor id across the remount,
so a stale marker would hold the change bar up on its own. Then `draft.reset()`, then
`setDraftDocument(storedDocument)` when a document exists. Handing a different object reference is what
makes the restore visible: `EntityJsonEditor` re-seeds and bumps `editorInstanceKey` precisely when
`entity !== lastEntityFromEditorRef.current`, which is the documented "remount when `entity` is reset
externally (e.g. discard)" path, and the inverse of the guard D2 depends on. Setting the document to
`null` instead would look correct and do nothing — the seeding effect returns early on a null `entity`
and Monaco would keep showing the discarded text.

Edge examined: discarding a form-only change hands back the *same* `storedDocument` reference the
document already holds, so no remount happens. That is correct — the document did not change — and is
called out here because it looks like a missed reset.

**What Save does.** Its behaviour and its gate are unchanged —
`disableSave={!isEditorEnabled && !draft.canMaterialize}`, which is exactly `SimpleButtonsWrapper`'s
`isDisableSave = isEditorEnabled ? false : !isValid` with this screen's own validity source, so
`ChangedEntityButtons` needs no new prop. What changes is where Save lives: it moves inside
`ChangedEntityButtons` while the draft is changed, and it is **not rendered at all** while the draft is
unchanged. The header's false branch therefore loses Save along with nothing else — it keeps Manage
access, Delete table and the toggle — and the whole header takes the shape `SimpleButtonsWrapper`
already has: `isChanged ? <ChangedEntityButtons …/> : <ordinary actions + toggle>`. An unchanged entity
offers no Save anywhere else in this console, and this screen now follows that.

**The owner's decision, and what it costs.** The first draft of D9 kept Save in the unchanged header,
arguing that Save here materializes the table rather than persisting an edit, so an untouched `FAILED`
draft should stay re-submittable. The owner decided otherwise: Save is shown when there are changes that
make saving meaningful, and disabled when something required is missing. The `FAILED` re-submit argument
was put to him explicitly, together with a compromise (Save shown when changed **or** when the status is
`FAILED`), and he chose his rule without the exception. The accepted consequence, recorded here so a
later reader does not mistake it for an oversight: **an untouched `FAILED` draft can no longer be
re-submitted — its author must first make an edit that either surface registers as a change.** The delta
pins it with its own scenario, "An untouched FAILED draft offers no Save", and the Risks section records
what would falsify the trade-off.

No new i18n keys: `ChangedEntityButtons` renders `ButtonsI18nKey.Discard`/`Save` and the modal renders
`EntitiesI18nKey.DiscardChanges*` itself. No live region either — the header swap is itself persistent
visible text, and no other consumer of this convention announces it.

**Testing notes**, so they are not rediscovered: `DraftSchemaEditor` is mocked as an inert `<div>` in
both existing Tables specs, so a case that needs a column-form edit must mock it as a control that
calls its `draft.update(...)` prop. `createPortal` is mocked inline suite-wide, so the Discard
confirmation renders in place and is reachable by role. `test-setup.tsx` mocks `SaveValidationContext`
suite-wide, so a case that needs markers needs the spec-local `vi.mock` that
`TableDraftJsonEditor.spec.tsx` already sets up. And `t()` returns keys, so the Save button's accessible
name stays `ButtonsI18nKey.Save` once the header has swapped — but seven existing cases query it on an
*untouched* draft, where there is now no Save at all, so they need a change made first; task 6.4 names
them.

### D10. The withdrawn toggle retires the "leave and re-enter the editor" scenario

*Files: `openspec/changes/add-table-draft-schema-json-editor/specs/analytics/tables/spec.md`,
`apps/ai-dial-admin/src/components/Analytics/Tables/tests/TableDraftJsonEditor.spec.tsx`,
`apps/ai-dial-admin/src/components/Analytics/Tables/tests/TableDraftChangedHeader.spec.tsx`.
No source file changes under this decision — `TableDetailView.tsx` is untouched by it.*

**The contradiction.** Task 6.4 found, while writing tests, that two parts of this change's own delta
could not both hold. "JSON editor for a table draft" said the document is not re-seeded "when the
editor is re-opened after being toggled off" and pinned it with the scenario *Leaving and re-entering
the editor keeps the edited document* (edit the document, toggle off, toggle on, see it as you left
it). D9 then withdrew the JSON-editor toggle as soon as **either** surface changes. Editing the
document makes the draft changed, which withdraws the toggle, which makes the toggle-off/toggle-on
round trip unreachable: `JsonToggle` renders only in `isChangeBarShown`'s false branch, and no other
control flips `isEditorEnabled`. 6.4 left the two affected tests `test.skip` rather than rename them
into something weaker, which was the right call — the premise, not the test, was wrong.

**The ruling, and whose it is.** The owner was given two options: retire the stale scenario, or keep
the toggle inside the changed bar. The argument for keeping it was that a stray character would
otherwise lock the author into the editor, with only Save or a Discard that throws away both surfaces.
He rejected that argument in these words: *"это правильное следствие случайный символ чаще всего с
json будет подсвечен потому что поломает схему, тут все ожидаемо"* — a stray character in JSON is
usually flagged as a parse error, so being held in the editor until it is fixed is the expected
consequence, not a trap. **So the toggle stays withdrawn while the draft is changed, and the stale
scenario goes.** Do not reintroduce the toggle into the changed header.

**What replaced it in the delta.** The scenario is retired, not reworded in place: what it asserted
(an edited document survives leaving and returning) describes a path that cannot be walked. The
guarantee underneath it — an in-progress document is never silently re-seeded — keeps its own
scenario, *An in-progress document survives a re-render*. In its slot the delta now carries *Opening
the editor and leaving it does not change what the column form submits*, which is the same
independence claim on the one path that is still reachable: open the editor without editing (the draft
must stay **unchanged**, so the toggle must still be there), toggle off, edit the column form, save,
and see `defineTableSchema` alone. That case is worth keeping because `isDocumentChanged` compared by
reference rather than by value would make merely opening the editor mark the draft changed and make
the toggle vanish under the author's cursor — a real regression class with no other test on it.

The requirement's prose was corrected to match: seeding happens **once** and is never repeated except
by Discard, but that is now recorded as a statement about the implementation, because a later entry
into the editor is reachable only from an unchanged draft, where a seed and a re-seed are identical.
The same paragraph now says where the two surfaces' independence remains observable — in what a save
from each surface submits.

**The two skipped tests stay skipped, and nothing tracks them.** Both live in
`apps/ai-dial-admin/src/components/Analytics/Tables/tests/TableDraftJsonEditor.spec.tsx`, left
`test.skip` by task 6.4 with their bodies and their explanatory comments intact:

1. `'leaving and re-entering the editor shows the document as the author left it'`
2. `"a document edit leaves the column form's own submission unchanged"`

An earlier revision of task 6.7 had them deleted. **The owner ruled otherwise, three times and
unambiguously** — the skips are not this change's work (*«сделаем отдельной задачей, не в этом
ченже»*), **no ticket was filed** for them (*«не делай тикетов никаких»*), and 6.7 was narrowed to the
replacement case alone (*«сузить 6.7, скипы не трогаем»*). So they remain in the tree exactly as they
are, and **nothing outside this repository records that they exist**: this paragraph is the only
tracking there is. A later reader who wants them addressed has to open a task for them deliberately.

**They are not the same kind of skip, and treating them alike gets it wrong.**

- The **first is dead**. It asserts the retired toggle-off/toggle-on round trip, which no longer
  exists as a claim in the delta and cannot be walked in the UI. Nothing is lost by its being skipped;
  the guarantee underneath it — an in-progress document is never silently re-seeded — is held by the
  live sibling case `'an unrelated re-render leaves the edited document alone'`. If it is ever
  un-skipped it should be deleted, not repaired.
- The **second is alive but unproven**. Its claim — *a document edit leaves the column form's own
  submission unchanged* — is a guarantee this delta still makes (the paragraph above pins the two
  surfaces' independence to what each save submits, and *Saving from the column form sends only the
  schema request* states it). It is skipped only because its **mechanics** used the withdrawn toggle
  to reach the column form's Save, not because its claim went away. **While it stays skipped that
  guarantee is unproven by test**, except for the part the replacement case picks up.

**Exactly how much the replacement case picks up.** The new case in
`tests/TableDraftChangedHeader.spec.tsx` opens the editor **without writing to the document**, toggles
off, edits the column form and saves. So it proves the independence claim for a document that has been
**seeded into state but never edited**: a non-null `draftDocument` does not leak into the column form's
submission, and `defineTableSchema` goes out alone with the form's own body. **What stays uncovered is
the same claim with a document whose content diverges from the seed** — the author types into the
editor, leaves, and saves from the form. Nothing in the code distinguishes the two (the form path reads
`draft.buildDto()` and never touches `draftDocument`), but that is an argument from the implementation,
not a test, and it is the whole of the residual. That state is currently unreachable through the UI —
once the document is edited the toggle is gone — so the residual becomes observable only if D10's
reversal is ever taken and the toggle returns to the changed bar. At that moment the second skipped
test becomes both reachable and repairable, and it should be repaired rather than deleted.

The replacement case also carries a guard the skipped pair never had: `isDocumentChanged` compared by
reference instead of by value would make merely *opening* the editor mark the draft changed and make
the toggle vanish under the author's cursor. That regression class has no other test on it.

**The residual case, and how to reverse this cheaply.** One case was flagged to the owner and he did
not object to it: a *deliberate* switch — an author who pastes a document and wants to consult the
column form before finishing. If that is ever reported, the reversal is small and it is this decision,
not D9's rule, that gets undone. The mechanism: `ChangedEntityButtons`
(`EntityHeaderControls/Buttons/ChangedEntityButtons.tsx`) already renders a `children` slot between
Discard and Save (line 54), so `JsonToggle` can be passed into the changed bar with **no new prop on
any shared component** — which is why it was a live option rather than a rewrite. Restoring the
scenario would then mean un-skipping the second of the two tests above, whose body is still in the
tree; the first would be deleted rather than restored, because its claim is retired for good.

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
  this change does not own. D9 makes this the fourth consumer, which strengthens the case without
  changing the answer for this change.
- **Adopt `SimpleButtonsWrapper` for the whole table header** (D9) — rejected: it owns Delete, the
  header row and the JSON toggle, so it would restructure the `ACTIVE` arm the owner ruled out of scope.
  Both existing consumers of the convention in Analytics use `ChangedEntityButtons` directly.
- **Show the changed header for JSON-document edits only, leaving the column form's header as it is**
  (D9) — rejected: a header that swaps for one surface of one screen and not the other is exactly the
  invented shape `AGENTS.md` warns about, and it would leave the two surfaces of the same draft
  behaving differently for no reason a reader could infer.
- **Compare `DraftSchemaForm` objects to decide `isChanged`** (D9) — rejected: `createDraftSchemaForm`
  mints a fresh `ColumnRow.id` per call, so the comparison is never equal and the change bar would be
  stuck on. Built-DTO comparison, as `PipelineDetailFrame` does it, has no ids in it.
- **Discard by setting the document to `null` so the next entry re-seeds** (D9) — rejected: with a null
  `entity` the editor's seeding effect returns early and Monaco keeps showing the discarded text, so the
  discard would appear to do nothing while the editor is open.
- **Leave the editor and return to the column form on Discard** (D9) — rejected: neither exemplar
  changes the active surface on discard, and an author who discards a document expects to see it
  restored rather than to be moved.
- **Keep Save in the unchanged header so an untouched `FAILED` draft stays re-submittable** (D9's first
  draft) — rejected by the owner, who ruled that Save is shown when there are changes that make saving
  meaningful and disabled when something required is missing. The `FAILED` re-submit argument was put to
  him with a compromise (Save when changed **or** `FAILED`) and he chose his rule without the exception.
  What it costs is recorded in D9 and under Risks.
- **Keep the JSON-editor toggle inside the changed bar, through `ChangedEntityButtons`' `children`
  slot** (D10) — rejected by the owner. It was the cheap option technically (the slot exists, no new
  prop on a shared component), and the argument for it was that a stray character otherwise locks the
  author into the editor with only Save or a both-surfaces Discard as ways out. He ruled that being
  held there is the expected consequence, because a stray character in JSON is normally flagged as a
  parse error. The stale scenario was retired instead. D10 names the slot so the reversal stays cheap.
- **Reword "Leaving and re-entering the editor keeps the edited document" into something the withdrawn
  toggle still permits** (D10) — rejected as unfalsifiable: every reachable re-entry starts from an
  unchanged draft, where the seed and a re-seed are byte-identical, so no test could tell the rule from
  its negation. The reachable half of the claim went into a differently-titled scenario about a
  seeded-but-unedited document instead.
- **A `FAILED`-only exception — Save shown while unchanged if the status is `FAILED`** (D9) — rejected by
  the same ruling. It is also the cheapest reversal if the trade-off is falsified: one extra term in
  `isChangeBarShown`.

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
- **(D9) The JSON toggle is withdrawn while the column form is dirty**, so an author who starts typing
  columns and then decides to paste JSON must Discard first. → Accepted. It is what both exemplars do
  and what `SimpleButtonsWrapper` does, and it is the price of the two surfaces holding independent
  state (D1). It also *retires* the shipped risk directly above about JSON edits being stranded by a
  toggle-and-save: once either surface is dirty the toggle is gone, so the stranding path no longer
  exists. Worth revisiting only if an author reports the reverse annoyance.
- **(D9) `isChanged` lags a half-typed column row.** A row whose name is not yet a valid identifier
  produces no DTO change, so the header stays in its ordinary state until the row becomes submittable.
  → Accepted; nothing unsubmittable can be lost, and the alternative is an id-stripping form comparison
  that is more code for a worse question.
- **(D9, the owner's decision) An untouched `FAILED` draft cannot be retried.** A failed activation is
  frequently a ClickHouse condition rather than a wrong document, and re-submitting the same definition
  now requires making an edit first — typing into the document, or touching a column row and undoing it.
  → Accepted on the owner's ruling, with his argument recorded in D9. **What would falsify it:** authors
  routinely needing to re-submit an unchanged `FAILED` definition — a retry that begins with a no-op
  edit, or a request for a Retry action on the failure indication. The reversal is one extra term in
  `isChangeBarShown`.
- **(D9) The two existing Tables specs assert today's header, in seven cases.**
  `TableDetailView.spec.tsx` asserts Save present on an untouched `PENDING` table, asserts it disabled
  on one, and saves an untouched but complete draft from the column form; `TableDraftJsonEditor.spec.tsx`
  opens the editor and saves without editing in four cases, and one of its titles says "beside Save".
  Any case that toggles the editor *after* typing will also now find no toggle. → Mitigated by naming
  the reconciliation in task 6.4 rather than leaving a worker to discover seven red tests. None of them
  is a behaviour regression: each needs an edit inserted before it reaches the header.
- **(D10, the owner's ruling) An author cannot leave the editor once the document is dirty.** The only
  ways out are Save, or a Discard that restores both surfaces to the stored state — there is no
  "park the document and go look at the column form". → Accepted on the owner's ruling, whose reason is
  quoted in D10: a stray character in JSON is normally flagged as a parse error, so being held until it
  is fixed reads as expected rather than as a trap. **What would falsify it:** authors asking to consult
  the column form mid-edit — a paste followed by "what did the form say the ordering key was", a request
  to keep the toggle live, or a Discard used as a way to escape the editor rather than to undo. The
  reversal is D10's: pass `JsonToggle` into `ChangedEntityButtons`' `children` slot, and restore the
  retired scenario and its two tests.
- **Delta size.** The two MODIFIED requirements are restated in full, as the house format demands; the
  edits inside them are two sentences and two scenarios. Reviewers should diff against
  `openspec/specs/analytics/tables/spec.md` rather than read the restatement as new text.
