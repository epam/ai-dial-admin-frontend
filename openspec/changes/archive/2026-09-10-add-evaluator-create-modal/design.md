# Design — register an evaluator from the Evaluators listing

Written to be read in slices. Every section names the files it governs in its first line; find your
section by grepping your own paths. Only §9 and §10 (alternatives, risks) are worth reading if you did
not write the code.

All paths are relative to `apps/ai-dial-admin/`.

## §1 The file map

| File | State | What it holds |
|---|---|---|
| `src/constants/analytics/evaluators.ts` | modified | `EVALUATOR_NAME_PATTERN` |
| `src/utils/validation/evaluator-name-error.ts` | new | `getEvaluatorNameError` — format + uniqueness, pure |
| `src/utils/analytics/evaluator-created-message.ts` | new | `getEvaluatorCreatedMessage` — the created-vs-appended branch, pure |
| `src/components/Analytics/Evaluators/use-create-evaluator-form.ts` | new | the modal's draft, validity and DTO build |
| `src/components/Analytics/Evaluators/CreateEvaluatorPopup.tsx` | new | the modal: markup, submit, notifications |
| `src/components/Analytics/Evaluators/EvaluatorsView.tsx` | modified | the gated header control, open state, refresh |
| `src/constants/i18n.ts`, `src/locales/en.ts` | modified | seven new `AnalyticsEvaluators*` keys |

Reused **unchanged**, and not in any item's scope: `createEvaluator`
(`src/app/[lang]/evaluators/actions.ts`), `buildEvaluatorDto` / `isEvaluatorShapeValid`
(`src/utils/analytics/evaluator-dto.ts`), `EvaluatorVarsEditor.tsx`, `withStrandedOption`
(`Evaluators/utils.ts`), `EVALUATOR_VAR_TYPES`, `src/app/[lang]/evaluators/page.tsx`.

`page.tsx` is deliberately **not** touched — see §5.

## §2 The name validator — `src/utils/validation/evaluator-name-error.ts`, `src/constants/analytics/evaluators.ts`

This is the seam that makes the duplicate-name rule decidable without a request. It follows
`getAnalyticsIdentifierError` in `src/utils/validation/analytics-table-error.ts` exactly — same
signature shape, same `FieldError | null` return, same "blank returns null" rule — because that is the
house pattern for an inline-validated identifier in a create modal, and `CreateTablePopup.tsx` is the
call-site precedent.

```ts
export const getEvaluatorNameError = (
  value: string,
  existingNames: string[],
  t: Translate,
): FieldError | null
```

Order of checks, first violation wins:

1. blank after trim → `null`. Emptiness is carried by the field's required marker and the disabled
   submit, not by an inline error. Same rule as the sibling validator, stated there in prose.
2. does not match `EVALUATOR_NAME_PATTERN` →
   `{ type: ErrorType.FORBIDDEN_CHARS, text: t(AnalyticsEvaluatorsI18nKey.NameInvalid) }`. The length
   cap is inside the pattern (`{0,63}` after the first character = 64 total), so there is no separate
   `ErrorType.LENGTH` arm.
3. `existingNames.includes(trimmed)` →
   `{ type: ErrorType.EXISTING, text: t(AnalyticsEvaluatorsI18nKey.NameTaken) }`.

`EVALUATOR_NAME_PATTERN = /^[a-z][a-z0-9_-]{0,63}$/` goes in `src/constants/analytics/evaluators.ts`
(values, not types — the constants/models split in `code-standards.md`). It is a **copy** of
`PIPELINE_NAME_PATTERN` in `Pipelines/Common/use-pipeline-form.ts`, not an import: that module is a
`'use client'` hook and a pure util must not depend on it. Carry a comment saying the two are the same
console convention and that a third occurrence should be lifted into one shared constant.

Why a new i18n key rather than `ErrorI18nKey.SnakeCaseIdentifier`: that string says "letters, digits or
underscores", and this pattern also admits `-`. Reusing it would state a rule the code does not enforce.

## §3 The created-vs-appended message — `src/utils/analytics/evaluator-created-message.ts`

One pure function, because the branch has three arms and `code-standards.md` forbids a nested ternary,
and because the version number reaching `t()` is the only part of the appended-version scenario a unit
test can observe (the suite's mocked `t()` returns the key and drops its params, so a component test
can prove the key and only a util test with its own `t` spy can prove the number).

```ts
export const getEvaluatorCreatedMessage = (version: number | undefined, t: Translate): string
```

- `version === 1` → `t(AnalyticsEvaluatorsI18nKey.EvaluatorCreated)`
- `version == null` → `t(AnalyticsEvaluatorsI18nKey.EvaluatorCreatedVersionUnknown)` — never guess a
  number, the rule *Saving creates the next version after the latest* already sets
- otherwise → `t(AnalyticsEvaluatorsI18nKey.EvaluatorCreatedAsVersion, { version })`

Use `== null` for the missing case (`code-standards.md`), so `0` — which the service cannot return but
the type admits — falls into the appended arm rather than the created one.

## §4 The form state — `src/components/Analytics/Evaluators/use-create-evaluator-form.ts`

A **new** hook beside `EvaluatorsView`, not a widening of `use-evaluator-form.ts`; §9 says why. Shape
mirrors `Pipelines/Common/use-pipeline-form.ts`: state plus derived validity plus a `buildDto`, no JSX,
no fetching.

```ts
interface Params {
  existingNames: string[];
}

export interface CreateEvaluatorFormState {
  draft: CreateEvaluatorDto;
  onChange: (patch: Partial<CreateEvaluatorDto>) => void;
  nameError: FieldError | null;
  isValid: boolean;
  buildDto: () => CreateEvaluatorDto;
}

export const useCreateEvaluatorForm = ({ existingNames }: Params): CreateEvaluatorFormState;
```

- Initial draft: `{ name: '', type: EvaluatorType.Llm, output_vars: [] }`. `llm` is the default because
  it is the type that needs the most authoring, and `EvaluatorVarsEditor` renders its own empty text and
  `+ Variable` for an empty list, so an empty `output_vars` needs no seeded blank row.
- `onChange` is a patch merge, `setDraft((prev) => ({ ...prev, ...patch }))` — the same one-liner
  `use-evaluator-form.ts` uses.
- **A type change is `onChange({ type })` and nothing else.** It clears no member. Two reasons: flipping
  to `sql` and back must not discard a typed model (a scenario), and the request is rebuilt at submit
  anyway (§4.1). The *presentation* is what withdraws the forbidden controls.
- `nameError = getEvaluatorNameError(draft.name, existingNames, useI18n())`, computed on each render —
  a regex and an array scan over a listing-sized array, not worth memoising (`components.md` §8).
- `isValid = isEvaluatorShapeValid(draft) && !nameError`. `isEvaluatorShapeValid` is reused unchanged,
  which is what keeps one POST with one notion of a valid shape; do not re-implement its per-type rules
  here and do not relax its "at least one output variable for `llm` too".
- `buildDto = useCallback(() => buildEvaluatorDto({ ...draft, name: draft.name.trim() }), [draft])`.
  `useCallback` for referential stability, since it is passed down. `buildEvaluatorDto` does not trim a
  name, and the spec requires the trimmed value on the wire and in the uniqueness comparison.

### §4.1 Why the type switch cannot carry a forbidden member

`buildEvaluatorDto` (`src/utils/analytics/evaluator-dto.ts`, unchanged) already:

- deletes `preset`, `model`, `params`, `request_template`, `input_vars`, `response_schema` when
  `draft.type === EvaluatorType.Sql`;
- restates each output variable's expression under `sql` for a `sql` draft and `jsonata` otherwise, via
  `getVarExpression` — so an expression typed under one type survives the flip and lands under the right
  member;
- drops every empty member.

So the request is a function of the **selected type at submit time**, not of the edit history. The only
obligation on the modal is to call `buildDto()` and never post `draft`.

## §5 The listing — `src/components/Analytics/Evaluators/EvaluatorsView.tsx`

Three additions and no restructuring. The component keeps rendering `rows` **straight from props** — it
gains no local copy of the row data.

1. `const { isFullAdmin } = useAppContext();`
2. `const [isCreateOpen, setIsCreateOpen] = useState(false);`
3. In the existing header row, beside the `<h1>`, gated exactly as `Pipelines/PipelinesView.tsx` gates
   its own — **§11 supersedes the label**, which is `t(ButtonsI18nKey.Create)`:
   `{isFullAdmin && <DialPrimaryButton label={t(AnalyticsEvaluatorsI18nKey.CreateEvaluator)}
   iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />} onClick={() => setIsCreateOpen(true)} />}`.
   Hidden, not disabled — the delta states why. The empty state gets nothing.
4. At the end, `{isCreateOpen && <CreateEvaluatorPopup existingNames={rows.map((row) => row.name)}
   onClose={() => setIsCreateOpen(false)} onCreated={() => router.refresh()} />}`.

### §5.1 The refresh path, and why it is `router.refresh()`

`router.refresh()` re-runs the server component `src/app/[lang]/evaluators/page.tsx`, which is
`dynamic = 'force-dynamic'`. That page is where the used-by join lives: one `getPipelines({ kind:
Enrich })`, `toEvaluatorUsage`, `toEvaluatorRows`. Re-running it is the only refresh that yields the
created evaluator with a **real** `usedBy: 0` while leaving the join exactly where *The used-by count is
derived from one pipelines listing and never guesses zero* puts it, and while issuing no per-row request.

Two facts make this work rather than merely sound plausible, both verified by reading the code rather
than assumed:

- `router.refresh()` after a mutation is the established house pattern — ~30 call sites, including
  `Evaluators/EvaluatorDetailView.tsx` itself, `Datasets/View/View.tsx`, `Models/View/View.tsx`.
- A new `rows` prop does reach the grid. `EvaluatorsView` passes no `isLiveData`, so
  `Grid/AgGridWrapper.tsx` takes its default imperative path: the effect at its `useEffect` on
  `[columnDefs, gridApi, rowData, …]` calls `setGridColumnsState`, which calls
  `gridApi.updateGridOptions({ columnDefs, rowData })`. There is no stale-row-model trap here.

`useRouter` is already imported in this file for row navigation, so the refresh adds no new dependency.
In tests `next/navigation` is mocked per-spec (`test-setup.tsx` supplies a bare `vi.fn()`), so a spec
that asserts the refresh must return `{ push, refresh }` from its own `useRouter` mock — the existing
`EvaluatorsView.spec.tsx` mock returns `{ push }` only and must be extended.

## §6 The modal — `src/components/Analytics/Evaluators/CreateEvaluatorPopup.tsx`

```ts
interface Props {
  existingNames: string[];
  onClose: () => void;
  onCreated: () => void;
}
```

One component, no shell split: `CreatePipelineShell` exists because two pipeline kinds share a frame,
and an evaluator has one. Body order, which is also the tab order:

1. `DialInput` `id="create-evaluator-name"`, `labelProps={{ label: t(Name), required: true }}`,
   `error={form.nameError?.text}`, `invalid={Boolean(form.nameError)}` — the `CreateTablePopup.tsx`
   shape. The ui-kit input owns the error's association with the field; do not hand-roll a `<span>`
   beside it.
2. `DialRadioGroup` `elementId="create-evaluator-type"`, `fieldTitle={t(Type)}`,
   `orientation={RadioGroupOrientation.Column}`, buttons `{ id: EvaluatorType.Llm, name: t(EvaluatorTypeLlm) }`
   and `{ id: EvaluatorType.Sql, name: t(EvaluatorTypeSql) }`, `activeRadioButton={form.draft.type}`,
   `onChange={(id) => form.onChange({ type: id as EvaluatorType })}` — the shape
   `CreatePipelinePopup.tsx` uses for a pipeline's kind. **Type comes before the members that depend on
   it**, which is the requirement, not a layout preference.
3. Only when the type is not `sql` (keyed on `sql`, as `EvaluatorProperties.tsx` is, so a type the
   service adds later degrades to showing what it can):
   - `DialSelectField` `id="create-evaluator-preset"`, options
     `withStrandedOption([{ value: EvaluatorPreset.ChatCompletion, label: EvaluatorPreset.ChatCompletion }], draft.preset)`;
   - `DialInput` `id="create-evaluator-model"`.
4. An output-variables section — **§11 supersedes the `emptyText` and the required message below**:
   `<section aria-label={t(SectionOutputVars)}>` with an `<h2>` and
   `<EvaluatorVarsEditor id="create-evaluator-output-var" title={t(SectionOutputVars)} vars={draft.output_vars ?? []}
   hasExpression emptyText={t(NoOutputVars)} onChange={(output_vars) => form.onChange({ output_vars })} />`,
   followed by `{!(draft.output_vars ?? []).length && <span className="text-error dial-tiny-text">{t(OutputVarsRequired)}</span>}`.
   The section wrapper, the `hasExpression` flag and the required message are lifted verbatim from
   `EvaluatorProperties.tsx`, so the two surfaces cannot disagree about the same editor.
   `EvaluatorVarsEditor` takes **no new prop** for this caller: any mismatch is absorbed by this
   wrapper's own markup (the `use-dont-edit-shared-components` house rule).

Frame: `DialFormPopup open portalId="create-evaluator" size={PopupSize.Md}`,
`header={t(CreateEvaluatorTitle)}`, `submitLabel={t(ButtonsI18nKey.Create)}`,
`disableSubmitButton={!form.isValid || isSubmitting}`, `onSubmit={() => void onSubmit()}`,
`onClose={onClose}`. `PopupSize.Md` because the output-variable row is three fields plus a delete
button — `Sm` would crowd it.

Submit, following `CreatePipelineShell.tsx` line for line except for the message branch:

```
if (!form.isValid || isSubmitting) return;
setIsSubmitting(true);
const res = await createEvaluator(form.buildDto());
setIsSubmitting(false);

if (res.success) {
  showNotification(getSuccessNotification(getEvaluatorCreatedMessage(res.response?.version, t)));
  onCreated();
  onClose();
  return;
}

showNotification(getErrorNotification(
  res.errorHeader || t(AnalyticsEvaluatorsI18nKey.CreateEvaluatorFailed),
  res.errorMessage,
  res.requestId,
));
```

`onCreated()` before `onClose()`, as `CreatePipelineShell` does. On the failure path neither is called,
so the modal stays open with its state — that is the "keeps the modal open" scenario, and it is a
consequence of not calling `onClose`, not of extra code.

## §7 The keys — `src/constants/i18n.ts`, `src/locales/en.ts`

Eight keys, appended to `AnalyticsEvaluatorsI18nKey` and to the `AnalyticsEvaluators` block. Everything
else the modal needs already exists: `Name`, `Type`, `Preset`, `Model`, `SectionOutputVars`,
`NoOutputVars`, `OutputVarsRequired`, `AddVariable`, `VarName`, `VarType`, `VarExpression`,
`EvaluatorTypeLlm`, `EvaluatorTypeSql`, and `ButtonsI18nKey.Create`.

| Key | English |
|---|---|
| `CreateEvaluator` | `Create evaluator` |
| `CreateEvaluatorTitle` | `Create evaluator` |
| `CreateEvaluatorFailed` | `Could not create the evaluator.` |
| `NameInvalid` | `Must start with a lowercase letter, then lowercase letters, digits, '_' or '-', up to 64 characters.` |
| `NameTaken` | `An evaluator with this name is already registered. Add a version to it from its own page instead.` |
| `EvaluatorCreated` | `Evaluator created` |
| `EvaluatorCreatedAsVersion` | `An evaluator with this name already existed, so version {version} was registered instead.` |
| `EvaluatorCreatedVersionUnknown` | `The evaluator was registered. The console could not read which version was created.` |

`Created` ('Version created') and `CreateFailed` ('Could not create the version.') are the detail page's
and stay as they are — on the listing the subject is the evaluator, not a version.

**Insert by anchoring on a single pure-ASCII line.** Both files carry em dashes and curly apostrophes
elsewhere, and an `Edit` spanning them comes back smart-quoted and un-compilable (this cost a whole item
on a previous change). The two anchors, each verified unique with `grep -c`:

- `src/constants/i18n.ts`: `  RuleResolvedVersion = 'AnalyticsEvaluators.RuleResolvedVersion',`
- `src/locales/en.ts`: `    RuleResolvedVersion: 'Resolves to',`

## §8 Accessibility

- The header control is a `DialPrimaryButton` with a visible label, and its `IconPlus` is decorative
  inside a labelled control — spread `BASE_BUTTON_ICON_PROPS` exactly as `PipelinesView` does.
- The inline name error rides `DialInput`'s `error` + `invalid` pair, which is what associates it with
  the field. A bare sibling `<span>` would be visible and unannounced.
- No new live region. Success and failure both go through `NotificationContext`, whose container is the
  live region (`a11y.md`); adding a second one here would double-announce.
- `EvaluatorVarsEditor` already gives each row `role="group"` with an `aria-label`, and labels only the
  first row's fields with an `aria-label` fallback on the rest. Nothing to add.
- Every control gets a real `id`, so every one is reachable by label in a test — which is also how the
  specs below query them (`getByRole`, `getByLabelText`), never `data-testid`.

## §9 Alternatives rejected

**Refreshing by calling `getEvaluators()` from the client, as `PipelinesView.reload` does.** Rejected:
`getEvaluators()` returns `EvaluatorSummary[]` with no `usedBy`, so every row — not only the new one —
would come back with an unknown count, and the requirement forbids exactly that. It is the shape a
reader will expect by analogy with pipelines, which is why the delta and this section both say no to it
explicitly.

**Refreshing by fetching both listings from the client and re-running `toEvaluatorUsage` /
`toEvaluatorRows` there.** Rejected: it works, and it puts the used-by join in two places that must
agree forever, for a page that is already `force-dynamic`. The spec's own words are "derived from a
single pipelines-listing fetch the page makes on the server".

**Inserting the created row optimistically.** Rejected: `usedBy: 0` would be honest but
`created_at` and `latest_version` would be invented, and the append-a-version race (§3) would put a row
on screen that claims version 1 of a new evaluator when the service actually appended version 7 to an
existing one.

**Reusing `use-evaluator-form.ts`.** Rejected: its `Params` requires an `Evaluator` and an
`EvaluatorSummary`, and everything it derives — `isChanged` against the stored version, `reset` to it,
`nextVersion` from the summary — is meaningless before the evaluator exists. Making `evaluator`
optional would add a create mode to a hook the detail page depends on, to serve one new caller. The two
hooks share what actually matters: `buildEvaluatorDto` and `isEvaluatorShapeValid`, both untouched.

**A `CreateEvaluatorShell` mirroring `CreatePipelineShell`.** Rejected: that shell exists because two
pipeline kinds share one frame. One evaluator modal needs no seam, and an empty abstraction is harder to
read than the component it wraps.

**Clearing `preset` and `model` from the draft when the type flips to `sql`.** Rejected: it makes the
flip destructive, which is a worse failure than the one it prevents, and it prevents nothing —
`buildEvaluatorDto` already deletes those members for a `sql` draft, and it is the single place the wire
shape is decided.

**Asking the service whether a name is taken.** Rejected: no endpoint answers it. `POST` reads a known
name as "append a version" and returns 201, and `GET /v1/evaluators/{name}` answering 200 would only
re-derive what the listing already holds while adding a request and a race. The uniqueness check is
client-side by necessity, not by preference — which is why the residual race is reported rather than
prevented.

**A notification for the duplicate name.** Rejected: #3551 and #3580 were both filed as bugs for
exactly that, in exactly this situation.

## §10 Risks

**The `version`-based message is a heuristic, not a fact.** A response carrying version 1 for a name
that genuinely existed is impossible (the service would return `latest_version + 1`), but a *first*
registration whose response the console cannot parse falls into the "version unknown" arm and reads as
a hedge. It shows up first as an operator asking why a plain create reported an unnamed version.

**The used-by zero depends on `router.refresh()` actually re-running the page.** If a future change adds
caching or drops `dynamic = 'force-dynamic'` from `src/app/[lang]/evaluators/page.tsx`, the created row
appears with a stale or missing count and no test fails — the unit tests hand `rows` in as a prop. This
is the one thing worth a browser check, and it is why the browser scenario list is what it is.

**`existingNames` is as fresh as the page load.** Between load and submit somebody else can register the
name. That is the race the spec reports rather than prevents; if it turns out to matter more than
expected, the next step is a service-side conflict answer, not more client checks.

**The pattern is stricter than the registry.** If the dev registry already holds a name this pattern
would reject — an uppercase letter, a dot — nothing breaks (no name is re-validated, nothing renames),
but an operator cannot create a *new* name in that style. It would show up as a request to relax the
pattern, and the fix is the constant in `src/constants/analytics/evaluators.ts` alone.

**Two i18n surfaces and one smart-quote hazard.** §7's anchors are the mitigation; the post-check is
that `grep -c "‘\|’"` on `src/locales/en.ts` matches `git show HEAD:…` and that the diff shows
insertions and zero deletions.

## §11 Correction after the owner reviewed the running modal — `EvaluatorsView.tsx`, `CreateEvaluatorPopup.tsx`, `src/constants/i18n.ts`, `src/locales/en.ts`

Recorded after items 1-7 shipped and were verified. This section **supersedes** §5's item 3 (the header
label), §6's item 4 (the output-variables section) and one row of §7's key table. Nothing else in this
document changes, and no decision in §9 is reversed.

### §11.1 The principle the owner stated

> We show an error once the error has been made; when the form has not been touched, we do not show an
> error, we just disable submit.

The shipped modal broke this in one place: it stated *Declare at least one output variable.* the moment it
opened, before the operator had done anything. That is a rule announced as a mistake. The delta now carries
the principle as prose under *The listing's create modal presents the members registration requires and
nothing else*, so the next form over this surface inherits it rather than rediscovering it.

The inline **name** error is not affected and stays. `getEvaluatorNameError` already returns `null` for a
blank value and the delta already carries *A blank name is not reported as an inline error*, so the name
field obeys the principle as built. The duplicate-name error in particular must stay inline: a duplicate
surfacing without an inline reason was filed twice (#3551, #3580), and `EvaluatorService.register` reads a
colliding name as "append version N+1" to somebody else's evaluator — a mistake worth reporting the moment
it is made.

### §11.2 Why the message is deleted rather than touch-gated

Touch-gating would need a `hasTouchedOutputVars` flag threaded from the editor's `onChange` into the
wrapper. It buys one message on one path: add a variable, then remove it. Every other route to an empty
list is the modal's initial state, which is exactly the state the message must not comment on — and a
submit attempt cannot reach it, because the submit is disabled while the list is empty. So the state
machine would exist to serve a path the operator has to construct deliberately. Submit stays disabled;
that is the whole feedback. If this turns out to be too quiet, the cheap next step is the touched flag, and
it is a change to `CreateEvaluatorPopup.tsx` alone.

The empty-state text (`NoOutputVars`, *No output variables declared.*) goes for the same reason at one
remove: with no message beside it, a line of grey text stating the obvious about an empty section that
already shows an **Add variable** button is noise. The section renders the button and nothing else.

### §11.3 The `emptyText` mismatch, and where it is absorbed

`emptyText: string` is **required** on `EvaluatorVarsEditor`'s `Props`
(`src/components/Analytics/Evaluators/EvaluatorVarsEditor.tsx:22`) — checked, not assumed. Making it
optional would be a change to a shared editor to fit one caller, which `use-dont-edit-shared-components`
forbids just as it forbids adding a prop. So the mismatch is absorbed in the wrapper: the modal passes
`emptyText=""`, and the editor's `{!vars.length && <span …>{emptyText}</span>}` renders an empty span —
present in the DOM, carrying no text, announced as nothing. `EvaluatorProperties.tsx` keeps passing
`t(NoOutputVars)` and is untouched.

That call deserves a one-line comment at the call site, because an empty string looks like an oversight and
is not one.

Rejected: dropping `EvaluatorVarsEditor` when the list is empty and rendering the modal's own add-variable
button instead. It removes the empty span, and it duplicates the button and the shape of the row the editor
appends — two places that must agree about what a fresh variable is.

### §11.4 The header label

`AnalyticsEvaluatorsI18nKey.CreateEvaluator` ('Create evaluator') is replaced by the existing
`ButtonsI18nKey.Create` ('Create', `src/constants/i18n.ts:378`). The listing's header already names the
page, so the button naming the entity again is redundant, and 'Create' is what the rest of the console's
page-level create controls say. The delta never fixed the wording — it says only that *a create control is
present in the page header* — so this is a code and i18n change, not a spec change.

### §11.5 Exactly one key becomes dead — a correction to §7

`CreateEvaluator` is the only one of §7's eight keys that loses its last reference. It is removed from both
files.

`OutputVarsRequired` and `NoOutputVars` **stay, and were never this change's keys to remove.** Both are
pre-existing on `development`, and both are still used by `EvaluatorProperties.tsx` (lines 134 and 138) on
the detail page, which this change does not touch. §7 already listed them under "everything else the modal
needs already exists"; verified by grep across `src/` and against `git show development:…` before writing
the task.

`CreateEvaluatorTitle` also stays — it is the modal's own header (`CreateEvaluatorPopup.tsx:82`) and is a
different string from a button label, even though today both read 'Create evaluator'.
