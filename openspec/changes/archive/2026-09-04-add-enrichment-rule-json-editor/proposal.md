## Why

An enrichment rule carries members the detail page presents no control for. `buildRuleDto` already
carries them through untouched — the rule form was built that way on purpose, because `PUT /v1/rules/{id}`
is a full replace and an omitted member is erased. So the console can round-trip a member it does not
understand, but it cannot let anyone **read or change** one. The only way to see what a rule actually
holds is to call the service directly.

Every other editable entity in the console answers this with a JSON editor toggle, and the evaluator
detail page gained one in the change archived as `2026-08-31-add-evaluator-json-editor`. This applies the
same pattern to the second, and last, analytics entity that can take it.

Rules were deliberately split out of that change rather than shipped alongside it. The reason is the
full replace: on an evaluator a mistaken document registers a new version and leaves the old one intact,
while on a rule it overwrites the rule in place, and a member left out is gone. That risk deserved its own
review rather than riding along with an append-only entity.

## What Changes

- The rule detail view gains a **JSON editor toggle** in the identity row, offered to every caller. The
  editor is read-only for a caller who may not save, matching how the fields are already gated.
- **The document is the assembled request, not the form draft.** The rule form keeps a `RuleDraft` and
  derives the request on save; the editor shows what will be sent. Full replace makes that the honest
  choice — the document *is* the request body — at the cost of the operator seeing `source` normalized
  away in Follow mode and empty members dropped on entry.
- **Editor mode takes the whole view.** Below the identity row there is only the document: the read-only
  facts panel, the fields, the status badge, and the enable/disable action are all withdrawn. Reaching
  any of them means leaving the editor.
- The identity row keeps the rule name plus whichever control applies — the toggle when nothing is
  pending, Discard/Save when something is. They alternate; they are never both present.
- Both the editor and the fields edit **one** draft and submit through **one** path, so the same document
  produces the same request either way.
- Monaco's parse errors block submission and are reported per line, with the Save control staying enabled
  and refusing on use. They also raise the Discard/Save pair on their own, because text that does not
  parse never reaches the draft — without that a caller whose first edit breaks the document is offered
  no way out and no way to find out what is wrong. No rule-specific validation is added: the form's own
  checks, including the `target_enrichment` uniqueness check against the other rules, stop gating the
  save in editor mode, and the service's refusal is what surfaces instead.
- **BREAKING for the operator, and accepted deliberately**: removing a member from the document erases it
  from the rule. Deleting `evaluator_version` unpins the rule from its evaluator version with no error at
  all, because the service accepts that request. This is specified rather than guarded — see Impact.

## Capabilities

### New Capabilities

None. This applies an established console pattern to an entity the analytics spec already owns.

### Modified Capabilities

- `analytics`: adds requirements covering the rule JSON editor — what the document contains, who may open
  versus edit it, what the mode withdraws, how saving and validation behave in it, and the erasure that
  full replace makes possible. Extends the existing enrichment-rule requirements rather than replacing
  them; in particular `Saving replaces the rule whole without discarding unpresented members` continues to
  hold and is what makes the editor's carry-through work.

## Impact

**Code**

- `apps/ai-dial-admin/src/components/Analytics/EnrichmentRules/RuleDetailView.tsx` — toggle state and
  placement, the body swap, the save gates. The whole action cluster currently sits inside
  `{isFullAdmin && (…)}`, so the toggle has to move out of it for a read-only caller to reach the editor.
- `apps/ai-dial-admin/src/utils/analytics/rule-dto.ts` — `buildRuleDto` throws on `draft.name?.trim()`
  when the name is not a string. See below.
- `apps/ai-dial-admin/src/app/[lang]/enrichment-rules/[id]/page.tsx` — must be wrapped in
  `SaveValidationContextProvider`. `EntityJsonEditor` calls `useJsonEditorValidation()` unconditionally,
  before consulting `readonly`, so the page throws without it even for a caller who only reads.

**A defect this change has to fix, not merely avoid**

`RuleDetailView` computes `isChanged` by calling `buildRuleDto` **directly in render**, not inside a
`useMemo`. Once a document can hold anything that parses, a pasted `"name": 5` reaches
`draft.name?.trim()` and throws during render, which the error boundary turns into a blank page — taking
the unsaved document with it. `?.` guards a missing value, not a value of the wrong type.

There are six such call sites across two files, not one, and three of them hide behind a trigger kind — which is why a
first pass over the function found only the name. `trigger_cron` is trimmed only for a `schedule` rule;
`member_select.prefer_sql` and `ready_when.signal` only for a `group` one. A sweep across all three
trigger kinds finds all four. The remaining two are in `use-rule-form.ts`, which runs its own checks on
every render: the same name trim, and a `?? []` on `output_bindings` that does not save a value which is a
string. Everything else is safe — the assembly spreads rather than iterating, and reads other members
without calling methods on them.

**What is already in place and must not be re-done**

- `buildRuleDto` is already spread-and-subtract, so a member the console does not name already survives a
  save. `buildEvaluatorDto` had to be inverted to reach that state; this one is there.
- `ignoredFields` is unnecessary. `id` is not in the request body — the route addresses the rule and
  `CreateRuleDto` has no `id` — and `toRuleDraft` already strips every read-only member. Renaming is a
  legitimate in-place rename here, unlike the evaluator, where a changed name forks the entity.
- There is no Delete control on this page to withdraw; deletion lives in the listing.

**The erasure, stated as a decision**

No confirmation dialog and no diff of disappearing members. The operator is editing the request body and
the console presents it as such. Guarding it would mean either a prompt on every save or a comparison the
fields themselves do not perform, and it would put the rule editor out of step with every other JSON
editor in the console. The consequence is specified with a scenario so a later reader finds a decision
rather than an oversight.

## Non-goals

- **Analytics tables.** No full-object write exists: an active table changes only through scoped schema
  patches, and a draft source table carries an irreversible invariant.
- **Extracting a shared harness.** The evaluator change's design.md planned to extract the provider and
  marker-gate wiring once a second consumer existed. That plan is dropped: the few lines are duplicated so
  this change touches only rules. See design.md.
- **Any change to the enable/disable flow.** It keeps reading the stored rule rather than the draft, and
  its existing `ToggleBlockedByEdits` guard is untouched — in editor mode the action is simply absent.
