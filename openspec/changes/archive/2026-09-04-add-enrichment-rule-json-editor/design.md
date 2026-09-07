## Context

See `proposal.md` — Why. What shapes the approach is how much of this already exists.

The archived change `2026-08-31-add-evaluator-json-editor` built the same editor over the evaluator detail
page and settled the behaviour: one draft behind both presentations, one write path, the mode taking the
whole view, the toggle giving way to Discard/Save once something is pending, Monaco's markers gating the
save. This change repeats that shape on rules. Its design decisions are not re-argued here; only where
rules differ.

Three differences do the work:

- **`buildRuleDto` is already carry-through.** It spreads the draft and subtracts, with a comment saying
  that is what stops a full-replace PUT from erasing unpresented members. `buildEvaluatorDto` had to be
  inverted to reach that; here there is nothing to invert, and the editor's ability to introduce a member
  falls out of code that already exists.
- **The draft is not the request.** `useRuleForm` holds a `RuleDraft`; the request is derived on save —
  trigger-owned members rebuilt from `trigger_kind`, `source` dropped when the rule follows its target,
  empty members dropped. The evaluator's draft *was* the DTO, so that change had no such choice to make.
- **The save overwrites in place.** An evaluator save appends an immutable version; a rule save replaces
  the rule. That is the whole reason these were separate changes.

## Goals / Non-Goals

**Goals:**

- The same editor behaviour a reader already knows from the evaluator page, with no rule-specific
  variation that is not forced by the rule's own shape.
- A document that is literally the request body, so what is read is what is sent.
- No new validation, no new i18n key for the toggle, no change to the enable/disable flow.

**Non-Goals:**

- Extracting the shared wiring — see Decisions.
- Guarding erasure. Specified in the delta as behaviour, not deferred.
- Anything about the rules listing, or about tables.

## Decisions

### The document is seeded on entry, not derived per render

`EntityJsonEditor` decides whether to re-create the Monaco model by comparing `entity` **by identity**
against the object it last handed up. The evaluator satisfies that by passing the draft straight back —
what goes down is what came up. Deriving the document instead breaks it: `buildRuleDto` opens with
`{ ...draft }`, so the object going down is never the one that came up, and the model is re-created on
every accepted keystroke.

Measured before the fix: two mounts for one edit, the previous node detached, and `"two words "` coming
back as `"two words"` — the re-seeded buffer is the re-normalized request, so a trailing space cannot be
typed and the cursor returns to the top on every character. A `useMemo` does not help; the memo's output
still is not the object the editor handed up.

So the document is state, seeded from the assembled request when the editor opens and re-seeded only when
the rule underneath is replaced — a discard, or the re-read after a save. Between those the buffer belongs
to the caller. The normalization the next decision accepts therefore happens once, on entry, which is what
the delta says.

### The document shows the request, not the draft

The two candidates are the `RuleDraft` the form holds and the `CreateRuleDto` the save derives from it.
The DTO wins because the save is a full replace: the body and the rule are the same object, so a document
that is anything other than the body would mean the caller edits one thing and the console sends another.
It also makes the erasure honest — a member absent from what you are looking at is a member absent from
the rule.

The cost is visible on entry rather than hidden: a rule following its target opens without `source`, and
members left empty are absent rather than blank. Both are specified.

On leaving the editor the document is mapped back through the same shape the form reads, so the fields
show what the document held. `getSourceMode` already resolves an absent `source` to Follow, which is what
makes that direction lossless for the one member the DTO drops on purpose.

### The grouping key keeps its guard in both presentations

Bypassing the form's checks in editor mode is deliberate, with one exception. `group_by` is trigger-owned:
always deleted, then rebuilt from `grainKey`, which the target resolves asynchronously. Unresolved, it is
blank and the empty-member prune removes it — and the save is a full replace, so the grouping key is
erased. The fields never allowed that, because `isValid` requires a resolved grain key for a group rule;
bypassing them must not open it. The check is kept explicitly rather than falling out of `form.isValid`,
so that the exception is visible.

### Wrongly typed members are narrowed where they are trimmed

`buildRuleDto` calls `draft.name?.trim()`, and `RuleDetailView` calls `buildRuleDto` **in render** — not
inside a `useMemo` — to derive `isChanged`. A pasted `"name": 5` therefore throws during render and the
error boundary blanks the page, losing the document. `?.` covers a missing value, not a value of the
wrong type.

There are four such sites across two files, and three of them are reachable only under a particular
trigger kind — `trigger_cron`
for `schedule`, `member_select.prefer_sql` and `ready_when.signal` for `group`. A sweep that fixes the
trigger kind finds only the name and reads as "one narrow guard"; sweeping all three kinds finds all four.
Worth stating because the cheap check is the misleading one.

`use-rule-form.ts` needs the same treatment and is easy to miss: it runs `isValid`, `isCronValid` and the
stranded-binding scan on every render, outside any `useMemo`, so guarding the assembly alone still leaves
the page able to blank. `?? []` there does not save `output_bindings` holding a string, and a `null` entry
faults the scan.

Two of the changes in `rule-dto.ts` are **not** throw guards, and were miscounted as such at first: nothing
downstream calls a method on `member_select.order_by` or on a non-object `ready_when`. `Array.isArray` and
the object check there change behaviour — such a value is dropped rather than carried — so each carries an
assertion about what it drops rather than about an absence of faults.

Everything else is safe — the assembly spreads rather than iterating and reads other members without
calling methods on them — so the fix is a `trimmed()` helper at the trimming sites plus `Array.isArray`
and an entry filter where the bindings are read, not a rewrite.

The helper is copied rather than shared with `evaluator-dto.ts`, which has an identical one, and copied
again into the form hook. Sharing it would pull the evaluator module into this PR for a single line,
against the same reasoning that keeps the wiring duplicated.

Moving the `isChanged` computation into a `useMemo` would not help — it would still run during render.
The guard belongs in `rule-dto.ts`, where the values are touched.

### The wiring is duplicated, not extracted

The evaluator change's design.md said extraction would happen once a second consumer existed, and this is
that consumer. The plan is dropped on purpose: extracting now means this PR also rewrites the evaluator
page, which is still in review, and the shared part is a provider on the page plus a handful of lines
reading `jsonErrors` before opening the save. The duplication is small and visible; a premature harness
over two pages that differ in their surrounding controls is not.

That earlier change is archived and is not edited to reflect this. The record of why the plan changed
lives here instead.

### The toggle moves out of the full-admin guard

The rule page currently wraps its whole action cluster in `{isFullAdmin && (…)}`, so a caller without
rights sees no controls at all. The toggle has to sit outside that, with the editor read-only, for the
read path the delta requires. The Discard/Save pair stays inside it.

## Risks / Trade-offs

- **A member is erased by a keystroke and nothing says so.** → Accepted and specified rather than
  mitigated; the reasoning is in the delta so it reads as a decision. The narrowest real case —
  `evaluator_version` — carries its own scenario, since it fails silently rather than loudly.
- **The document is the DTO, so entering the editor visibly normalizes the rule.** → Specified, and the
  alternative was worse: a document that is not what gets sent.
- **The form's uniqueness check on `target_enrichment` is bypassed.** → Intended; the service enforces it
  and its refusal surfaces the same way every other failed save does.
- **Duplicated wiring drifts from the evaluator's copy.** → Real, and the reason to keep the copy small
  and identical. A third consumer would be the point to extract.
- **Monaco markers arrive asynchronously**, so the change bar appears a beat after the document breaks.
  → Inherited from the evaluator page, not introduced here.
- **Monaco does not run under jsdom.** → Component tests stub it. The evaluator change learned that
  stubbing the *whole* editor hides the path between the typed document and the request; one spec here
  stubs only `JsonEditorBase` so the real `EntityJsonEditor` runs.
