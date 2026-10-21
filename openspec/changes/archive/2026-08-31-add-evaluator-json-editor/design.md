## Context

See `proposal.md` — Why. What shapes the approach is the state the evaluator view already holds.

`useEvaluatorForm` keeps its draft as a `CreateEvaluatorDto` — the wire shape itself, not an
intermediate form model. That is unusual here: the rule form keeps a `RuleDraft` and the table draft
form keeps flat control values, both of which need a mapping in each direction. The evaluator needs
none, which is most of why this change is small.

Three pieces of the existing machinery are load-bearing and are reused rather than re-implemented:

- `EntityJsonEditor` (`components/EntityTabs/JsonEditor/JsonEditor.tsx`) — the generic editor every
  entity view uses. Takes `entity`, `setSelectedEntity`, `ignoredFields`, `readonly`; reports Monaco
  markers into `SaveValidationContext`; remounts Monaco when `entity` changes identity from outside.
- `SaveValidationContext` — collects markers per editor instance and cleans up on unmount. Mounted
  **per page**, not globally.
- `JsonToggle` — the `DialSwitch` plus divider, already labelled from `EntitiesI18nKey.JSONEditor`.

Constraints worth stating because they are easy to get wrong:

- `EntityJsonEditor` calls `useJsonEditorValidation()` unconditionally, before consulting `readonly`.
  A page without `SaveValidationContextProvider` throws even for a caller who only reads.
- `useEvaluatorForm.onChange` **merges** a `Partial<CreateEvaluatorDto>` over the previous draft. It is
  the right shape for a form, where each control sends its own member, and the wrong shape for an
  editor, which sends the whole definition at once.
- Evaluator writes are append-only. The service rejects both `PUT` and `DELETE` on a version as
  immutable, so a mis-registered version cannot be removed. Nothing here may reduce the ceremony
  around registering one.

## Goals / Non-Goals

**Goals:**

- One draft behind both presentations, so what the JSON holds is what gets submitted.
- One write path, so the same JSON produces the same request either way.
- Editor mode behaves as it does everywhere else in the console: the JSON is the view, and leaving the
  mode is how the caller gets the rest of the page back.
- No new validation layer, and no new i18n key for the toggle.

**Non-Goals:**

- Extracting a reusable "JSON editor for an analytics detail view" harness. The rules change will be
  the second consumer; see Decisions.
- Changing anything about how the form itself presents members.
- A JSON schema for the evaluator definition (see `proposal.md` — Non-goals).

## Decisions

### The editor edits the shared draft; it is not its own text buffer

`EntityJsonEditor` also has a controlled-text mode (`text` + `onChangeText`, used by
`TestSuites/RequestTemplate/tabs/BodyTab`). Using it here would mean the editor owns a string, and
submission would `JSON.parse` it and post the result directly — no draft involvement, so no merge
problem and no need for a replacing setter.

Rejected. Posting the parsed JSON directly skips the per-type assembly step, so JSON carrying both
`type: sql` and a `model` would reach the service and come back 422, where the same JSON submitted from
the form registers successfully without `model`. Two things follow: one input would mean two different
requests depending on which presentation submitted it, and the second behaviour
contradicts an existing scenario in the analytics spec (`The Properties tab presents the version's
definition as a form` → *Changing the type changes what is submitted*). The 422 is arguably the more
honest answer, but it is a change to the evaluator write contract's observable behaviour and does not
belong in a change about adding an editor.

### `buildEvaluatorDto` becomes spread-and-subtract, like the rule builder

It is currently an allow-list: a fresh object is built by copying `name`, `type`, `output_vars` and, for a
non-sql type, six more. Anything else on the draft is silently discarded.

That is fine while the only writer is a form whose controls set exactly those members. It is not fine with
an editor, and it fails in a way that reads as the editor being broken rather than as a limit: `isChanged`
compares assembled requests, so an edit that only introduces a member produces two identical requests, no
change is reported, and the Discard/Save pair never appears. The caller types into the document and
nothing happens.

So it inverts to the shape `buildRuleDto` already has — spread the draft, then delete the read-only
members, delete the llm-only members when the type is `sql`, and prune empties. The exceptions stay
exactly what they were; only the default flips from "drop unless named" to "carry unless excluded".

The alternative — keep the allow-list and specify that the editor can only edit members the console
already names — was rejected. It leaves the failure looking like a bug (an edit that neither applies nor
errors), and it removes most of the reason to have an escape hatch: `params` typing would still be fixed,
but nothing else would be reachable.

One behaviour beyond the editor changes with it: a member the service returns that this console does not
type now survives a save from the fields too, where today it is dropped. That is the same guarantee the
analytics spec already states for rules, so it aligns the two rather than inventing a rule.

### `useEvaluatorForm` gains a replacing setter beside the merging one

`replaceDraft` sets the draft wholesale. `onChange` stays exactly as it is — the form's controls depend on
merge semantics.

It is the hook's own `setDraft`, exposed under an intention-revealing name and keeping the setter's type
(`Dispatch<SetStateAction<CreateEvaluatorDto>>`). Narrowing it to `(next: CreateEvaluatorDto) => void`
reads better in isolation but costs a cast at the call site, because `EntityJsonEditor` types
`setSelectedEntity` as the React setter — `BodyTab` casts for exactly this reason. Keeping the wider type
is the cheaper of the two, and the name still stops a control reaching for a bare state setter.

`isChanged` and `isValid` are derived from the draft, so both keep working in editor mode with no
change — `isChanged` compares assembled DTOs, which is what makes the Save control appear.

### The DTO module is made total over arbitrary parsed JSON

Both exported functions in `evaluator-dto.ts` run while the page renders — `useEvaluatorForm` derives
`isChanged` and `isValid` from them. Until this change their only caller was a form whose controls could
only produce well-typed values, so `draft.model?.trim()` and `(vars ?? []).filter(...)` were safe. The
editor removes that guarantee: `{"model": 5}` and `{"output_vars": {}}` are valid JSON, and either throws a
`TypeError` **inside render**, which the error boundary turns into a blank page — taking the unsaved
document with it. The `?.` guards do not help; they cover a missing value, not a value of the wrong type.

So the module narrows instead of asserting: a `trimmed()` that yields `''` for a non-string, and an
`asVars()` that yields `[]` for a non-list and drops non-object entries. A wrongly typed value then reads
as absent for validation while still being carried to the request, so the service is what refuses it.

Guarding at the boundary instead — refusing to forward a parse whose shape is wrong — was rejected: the
shape it would have to check is the service's contract, the console has no schema for it (the one Monaco
schema is `{type: 'object', additionalProperties: true}`), and a guess at it would reject documents the
service accepts.

### The name is protected with `ignoredFields`, not by overriding at submission

`ignoredFields={['name']}` is the mechanism the console already uses for exactly this
(`IMAGE_IGNORED_FIELDS = ['id']`, `CONTAINER_IGNORED_FIELDS = ['name', '$type']`).
`mergeWithIgnoredFields` restores the protected member from the previous entity on every parse, so the
draft never holds a changed name at all.

Preferred over `{...draft, name: evaluator.name}` at submission time because the draft stays correct
throughout: `isChanged` cannot flip from a name edit alone, and the fields presentation cannot be
reached holding a name the form is not allowed to show. The member stays visible in the JSON — same as
`Containers` — which reads as a fact about the entity rather than a field that was hidden.

### The identity row follows `SimpleButtonsWrapper`'s three-way branch

`SimpleButtonsWrapper` resolves the same slot three ways, and the evaluator row adopts it verbatim:

```
isReadOnlyAdmin  → the toggle, always
isChanged        → Discard + Save, and no toggle
otherwise        → the actions + the toggle
```

The consequence worth naming is the middle branch: once the draft differs from the stored version the
toggle is gone, so a caller who has started editing cannot switch presentations — the way out is
Discard or Save. This is not a limitation to work around, it is what stops a pending change from being
parked behind a presentation the caller toggled away from, where neither the fields nor the JSON show
it and only the Save control hints that something is unsaved.

It also means the form-to-JSON and JSON-to-form round trip is only reachable with nothing pending. The
shared draft still matters — it is what makes the JSON hold the values the fields held, and what makes
a deletion in the JSON reach the request — but "edit here, look there" is not a flow this change
offers, and the specs do not claim it.

For the evaluator row this maps onto what is already there: the existing
`isFullAdmin && form.isChanged` guard around `ChangedEntityButtons` becomes the middle branch, and the
toggle takes the other two. A caller who is not a full admin therefore always sees the toggle and never
the buttons, which is the read-only branch.

### The tabs are withdrawn in the view, not delegated to `HeaderTabs`

`HeaderTabs` already implements the core rule — `showTabs = isReadOnlyAdmin || !isEditorEnabled` — so
passing `isEditorEnabled` through would be the smaller diff. It is not used, because of the
`isReadOnlyAdmin` disjunct: a caller with read-only rights keeps the tabs on screen while the content
below them is the JSON regardless of which tab is active, so the tabs are inert. In the console's
other entity views that is a corner, since the editor is mainly a full admin's tool there. Here the
toggle is offered to every caller by design, which would make it the common case.

So the view gates the tabs row itself on `!isEditorEnabled`, uniformly and without consulting the
caller's rights, and swaps the whole tabbed region — the facts section, the fields, and the rules grid
alike — for the JSON. `activeTab` is left untouched while the editor is open, which is what returns the
caller to the tab they came from.

`HeaderTabs` is otherwise unchanged: fixing its disjunct would alter every entity view in the console
and belongs in its own change, not in one adding an editor to one page.

### The save gate is replicated locally, not extracted

`SimpleButtonsWrapper.onTryToSave` is the core gate: on markers present, raise a notification per
marker and do not submit. The evaluator view uses `ChangedEntityButtons` directly and cannot reach it,
so the same few lines are written in the view, reusing `showEditorErrorNotifications`.

Extraction is deferred to the rules change, which needs the same gate and the same provider wiring.
Designing a shared harness now would mean designing it for one real consumer and one predicted one,
and the rule view differs in ways that would shape it — a delete action, a status badge, an
enable/disable toggle that reads the stored entity rather than the draft.

Concretely, two guards relax in editor mode: `onSave`'s leading `if (!form.isValid || isSaving)` and
the Save control's `disabled`. Both become "shape check applies only when the fields are on screen".

### Monaco's markers, not a forced flag, decide that the change bar is due

`EntityJsonEditor` forwards only a **successful** parse to `setSelectedEntity`, so text that does not parse
never reaches the draft. Deriving the change bar from the draft comparison alone therefore strands a caller
whose first edit breaks the document: no Save to be told what is wrong, no Discard to back out, and the
Save-refuses-with-line-numbers path unreachable because the control is not rendered at all.

The core views solve this by passing `setIsChanged` and letting the editor force it from its catch block.
That needs `isChanged` to be settable state; here it is derived (`useMemo` over assembled DTOs), and the
editor only ever forces it **true** — so the view would have to decide when to clear it, and a document
repaired back to the stored version would keep the bar up with nothing to save.

So the trigger is `jsonErrors` from `SaveValidationContext` instead: the same markers the save gate already
reads. It is derived rather than stored, so it clears itself the moment the document parses, and it is
exactly the condition under which the refusal path must be reachable. The cost is that markers arrive
asynchronously, so the bar appears a beat after the document breaks.

### Discard clears the validation state before resetting, as the core branch does

`SimpleButtonsWrapper` dispatches `ValidationActionType.Reset` before calling `onDiscard`. Since the change
bar can now be held up by markers alone, dropping that dispatch would make clearing it depend on Monaco
re-publishing an empty marker set for the remounted model — and `EntityJsonEditor` keeps its editor id
across that remount, because the remount key sits on its child, so a stale entry has nothing to evict it.
The failure would be a change bar with nothing to save and no toggle to leave by.

### Discard and version switching rely on the editor's own remount

`EntityJsonEditor` bumps an internal key whenever `entity` arrives with a different identity than the
last value it produced itself, which remounts Monaco. `form.reset()` builds a fresh object from
`toEvaluatorDraft(evaluator)`, so both discard and a version switch (the existing
`useEffect(() => reset(), [reset])`, where `reset` is keyed on `evaluator`) satisfy that condition —
including after the caller typed invalid JSON, where the draft was never updated.

`Roles/View` additionally keeps a `discardKey` to force the remount. Nothing in the evaluator flow
appears to need it; if a test shows the editor holding stale text after a discard, adding the same key
is the fix.

Unsaved editor edits are dropped when the version switches. That is the existing behaviour for the
form, and the reason that effect exists — the editor inherits it rather than changing it.

## Risks / Trade-offs

- **A member deleted in the JSON is silently restored, because `onChange` was wired instead of
  `replaceDraft`.** This is the one wiring mistake that produces no error and no visible symptom until
  someone checks the registered version → the spec carries a scenario for it
  (*A member deleted in JSON is not resurrected*), so it is covered by a test rather than by
  review attention.
- **Monaco markers arrive asynchronously.** A caller who breaks the JSON and submits immediately could
  in principle pass the gate while `jsonErrors` is still empty, in which case the last successfully
  parsed draft is submitted rather than what is on screen. This is inherited from every existing JSON
  editor in the console, not introduced here → not addressed in this change; noted so it is not
  mistaken for new behaviour if it surfaces.
- **The editor bypasses the shape check, so JSON can be submitted that the form would have
  blocked.** Intended, and specified → the service's 422 is the backstop, reported the same way every
  other failed registration is.
- **Registering a version is irreversible.** → The confirmation popup and its predicted next version
  are reused unchanged; the editor adds no path that skips them.
- **Monaco does not run under jsdom.** → Component tests mock
  `@/src/components/EntityTabs/JsonEditor/JsonEditor`, as several existing specs already do, and assert
  the props it receives; the editor's own behaviour is covered by its own spec.
