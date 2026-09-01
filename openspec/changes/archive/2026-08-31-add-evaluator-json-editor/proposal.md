## Why

The evaluator Properties form cannot express every value `POST /v1/evaluators` accepts, because
`params` values are typed by guessing. The form edits `params` as key/value **string** rows and
recovers the type from the text: a value that parses as a finite number becomes a number, everything
else stays a string. So a knob whose value is the string `"1.0"` or `"007"` is registered as `1` and
`7`, and a boolean knob is registered as the string `"true"` — neither can be corrected from the
console at all.

This is a typing gap, not an argument against the existing key/value editor: `params` really is a flat
map of a handful of model knobs, read and changed one at a time, and the form is the right way to do
that. What is missing is the escape hatch every other editable entity in the console already has — a
JSON editor toggle for the cases the form's controls cannot represent. The analytics entities have
none.

Evaluators are the cheapest and safest place to add it. `useEvaluatorForm` already holds a
`CreateEvaluatorDto` as its draft, so the editor and the form edit the same object with no conversion
layer, and the write is append-only: `POST /v1/evaluators` registers a new version and never mutates
an existing one, so a mistaken save cannot damage what is already there.

## What Changes

- The evaluator detail view gains a **JSON editor toggle**, rendered next to the version switcher and
  visible to every viewer. In the editor the whole definition is edited as one block of JSON.
- The editor is **read-only for anyone who is not a full admin**, matching the gating the Properties
  form already applies (`isDisabled={!isFullAdmin}`).
- Once there are unsaved changes the **toggle is withdrawn** and Discard/Save take its place, exactly
  as elsewhere in the console. Leaving the editor is discarding or registering, not toggling back, so a
  pending change cannot be parked behind a presentation the caller switched away from.
- The editor is a **mode, not a panel**: while it is open the JSON is the whole view below the
  identity row, and the tabs are withdrawn — for every caller, including one with read-only rights, who
  in the console's other entity views keeps inert tabs on screen. Reaching the fields, the version
  facts, or the referencing rules means leaving the editor. Disabling it returns to the tab that was
  active.
- Saving from the editor uses the **existing** save path unchanged: the same `Save as new version`
  button, the same confirmation popup naming the predicted next version, the same
  `createEvaluator(form.buildDto())` call. JSON mode introduces no second write path.
- `name` is protected from edits in the editor. The analytics spec already requires that `name` be
  non-editable *for any caller* on the Properties tab, precisely because posting a different name
  registers version 1 of a separate evaluator; the editor is a second presentation of the same tab and
  inherits that rule rather than reopening it.
- **Assembling the request changes from an allow-list to carry-through.** `buildEvaluatorDto` currently
  builds a fresh object copying the nine members the console names, so anything else on the draft is
  discarded. That makes the editor unable to introduce a member — and worse, since change detection
  compares assembled requests, an edit that only added one reported *no change*, leaving no Save control
  to press. It becomes spread-and-subtract, matching `buildRuleDto`.
- In JSON mode the form-shape check (`isEvaluatorShapeValid`) stops blocking save, and Monaco's own
  parse errors block it instead, reported as per-line notifications. This matches how every existing
  JSON editor in the app behaves (`isEditorEnabled ? false : !isValid`); no evaluator-specific
  validation is added, and contract violations continue to surface as the service's 422.

## Capabilities

### New Capabilities

None. The JSON editor toggle is an established pattern (see `platform-keys`, `platform-models`); this
change applies it to an entity the analytics spec already owns.

### Modified Capabilities

- `analytics`:
  - **Adds** a requirement covering the evaluator JSON editor — what the JSON contains, who may open
    versus edit it, which members are protected, how it interacts with the tabs, and how saving
    and validation behave in that mode.
  - **Modifies** `Evaluator facts and params are presented as fields, not as a blob`. That requirement
    currently forbids presenting `params` as a JSON document without qualification, and one of its
    scenarios asserts the absence of a single JSON document. Both remain true of the form, which is
    what the requirement is about, but read literally they would forbid the editor. The requirement is
    restated to scope the prohibition to the form presentation.

  One existing requirement is deliberately **left unchanged**, because the editor inherits it rather
  than altering it: `request_template` is never reformatted, since a string round-trips through
  `JSON.stringify`/`JSON.parse` byte-identically. The requirement placing the identity row above the
  tabs also stands as written — its scenarios all describe the page with the editor off, and the
  identity row is exactly what the editor mode keeps.

## Impact

**Code**

- `apps/ai-dial-admin/src/components/Analytics/Evaluators/EvaluatorDetailView.tsx` — toggle state,
  toggle placement, body swap, save gating.
- `apps/ai-dial-admin/src/utils/analytics/evaluator-dto.ts` — `buildEvaluatorDto` becomes
  spread-and-subtract. The form path is unaffected, since its controls only ever set members the console
  names; what changes is that an unnamed member now round-trips instead of being dropped, which is the
  guarantee the rules spec already makes for `buildRuleDto`.
- `apps/ai-dial-admin/src/components/Analytics/Evaluators/use-evaluator-form.ts` — the hook exposes
  only `onChange`, which merges a `Partial<CreateEvaluatorDto>` over the previous draft. The editor
  hands back a whole replacement object, so a member deleted in JSON would survive the merge. The hook
  needs a second, replacing setter alongside the merging one.
- `apps/ai-dial-admin/src/app/[lang]/evaluators/[name]/page.tsx` — must be wrapped in
  `SaveValidationContextProvider`. `EntityJsonEditor` calls `useJsonEditorValidation()`
  unconditionally, before any read-only check, so the page throws without the provider even for a
  viewer who never edits.

**Behavior already covered by existing code, listed so it is not re-implemented**

- `isChanged` is computed by comparing built DTOs, so it reports editor changes with no change.
- `readonly` on `EntityJsonEditor` already ORs with `useIsReadOnlyAdmin()`.
- `wordWrap: 'on'` is already the editor default, so a multi-thousand-character `request_template`
  wraps rather than forcing a horizontal scroll.

**Known consequence to document rather than prevent**

The llm-only members are dropped from the submission when `type` is `sql`, because the service answers
422 for them rather than ignoring them. This is already specified — `The Properties tab presents the
version's definition as a form` carries the scenario — and it is invisible in the form, where the
controls are simply hidden. In the editor the operator can see `model` and `params` in the document,
switch `type` to `sql`, save, and find them absent from the new version.

This is why the editor edits the shared draft and submits through the same assembly step, rather than
posting the parsed document directly. Posting the document as typed would surface the contradiction as
the service's 422 — arguably more honest — but it would make the same document produce a different
request depending on which mode it was saved from, and it would contradict the existing scenario.

## Non-goals

- **Enrichment rules.** The same toggle for rules is a separate change. Rules are written by a
  full-replace `PUT` whose `apply()` sets every member unconditionally, so an omitted member is
  erased — deleting `evaluator_version` silently unpins the rule from its evaluator version. That risk
  deserves its own review rather than riding along with an append-only entity.
- **Analytics tables.** No full-object write exists: an active table is changed only through scoped
  schema patches (`add`/`drop`/`rename`/`update`), and a draft source table carries an irreversible
  invariant (a half-set identity/version pair materializes a permanently unscannable table).
- **A JSON schema for evaluator documents.** No entity in the app supplies one; Monaco is configured
  once, globally, with a single `type: object` schema. Adding per-entity schemas is a separate concern.
- **Any change to the evaluator write contract.** No new endpoint, no version deletion (the service
  rejects both `PUT` and `DELETE` on a version as immutable), no editing of a historical version.
