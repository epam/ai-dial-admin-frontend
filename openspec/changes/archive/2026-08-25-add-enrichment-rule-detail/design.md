## Context

See proposal.md — Why. Three facts about the current code shape the approach:

- `useCreateRuleForm` holds a **flattened** `CreateRuleForm` — `ready_when` is spread into `idle` /
  `maxStaleness` / `costCeiling`, `evaluator_version` is a string with a `latest` sentinel, bindings carry
  client-side row ids. It covers 11 of a rule's ~25 members and has no inverse: the only constructor is
  `createEmptyForm()`.
- `analytics-data-api.ts` already exposes `getRule` and `updateRule`; only the server actions are missing.
- The repo has a rich shared entity-detail shell (`SimpleEntityHeader`, `PropertiesTabContent`,
  `DeleteConfirmationModal`), which **Analytics has so far declined**: `TableDetailView` is bespoke and
  Queries has no detail page at all.

## Goals / Non-Goals

**Goals:**

- One state shape and one set of controls behind both the create modal and the detail page.
- A save that cannot erase a member the console never presented.
- Resolution logic expressed once, extended from two lookups to three.

**Non-Goals:**

- Converging Analytics onto the shared entity-detail shell. Considered and declined below.
- A navigation guard for unsaved edits. The repo has no `beforeunload` or router blocker anywhere;
  introducing one for this page alone would be a new app-wide pattern smuggled in through a feature.

## Decisions

### State is the rule DTO, cloned and diffed — not a flattened form

The detail page holds `selectedRule: EnrichmentRule`, cloned from the loaded rule, and derives its edited
state with `isEqualSkippingUndefined(selectedRule, originalRule)`. This is the recipe every non-Analytics
detail page in the repo already follows (`Routes/View/View.tsx`, `Models/View/View.tsx`).

This is the load-bearing decision, because it **dissolves the full-replace erasure hazard structurally**.
`PUT /v1/rules/{id}` erases any omitted member; if state were a flattened projection covering 20 of 25
members, opening a rule that carries `filter_sql` and saving an unrelated edit would silently delete it.
When state *is* the rule object, unpresented members survive because nothing ever removed them — no
explicit merge step, no list of "form-owned keys" to keep in sync as the API grows.

*Alternative considered — extend `CreateRuleForm` to cover all 25 members, and merge form output over the
loaded rule at save time.* Rejected: the merge needs an explicit inventory of which keys the form owns, and
that inventory silently rots the moment the service adds a member. The failure mode is data loss with no
signal.

*Consequence:* the create modal moves onto the same shape (a `Partial<CreateRuleDto>` draft). Its observable
behaviour does not change, but `use-create-rule-form.ts` and its ~400-line spec are rewritten.

### Controls own their editing representation; shared state stays wire-shaped

Holding the DTO means state cannot hold a half-typed number or a `latest` sentinel. Each control therefore
takes a wire-format value and emits a wire-format value, keeping any transient representation internal —
which is already how `CronField` (its custom-expression toggle) and `DurationField` (parse on read, format
on write) work. Extending it: `OutputBindingsEditor` derives its row identity internally and emits
`OutputBinding[]`; numeric knobs hold the in-progress string and emit `number | undefined`.

This is what makes `RuleProperties({ rule, onChange, isModal })` possible as a single component — the
signature `QueryProperties` already uses in this area.

### Borrow the shell's mechanisms, not the shell

`SimpleEntityHeader` and `PropertiesTabContent` are generic and would work. The blockers are elsewhere:

- **Permissions.** `SimpleButtonsWrapper` gates on `!isReadOnlyAdmin`, while the rules listing gates on
  `isFullAdmin`. `AppContext.tsx:117,121` defines these as independent flags, not complements — a caller
  with neither role would be denied delete on the listing and offered save and delete on the detail page.
- **`DeleteConfirmationModal` is route-keyed in three places**: `deleteEntityMap`, the `name` memo (which
  resolves `displayName` and would render blank for a rule), and `getEntityPath` — a `switch (route)` whose
  result is what gets passed to the delete action, where `deleteRule` needs the raw id.

Each is fixable, but the fixes land in files every other entity view reads, and the payoff is a header row
plus a delete button the listing already provides. So: take `ChangedEntityButtons`, `DiscardModal`,
`SaveValidationContext`, and `isEqualSkippingUndefined` — none of which are route-keyed — and write a
bespoke header. Delete is not offered on the detail page.

*Alternative considered — adopt the full shell (A).* Legitimate if Analytics should converge on the repo
standard, and roughly a day of extra care rather than a redesign. Declined because that is a larger
decision than one page should make. *Alternative considered — follow `TableDetailView` (B).* Rejected:
Tables is immediate-apply and has no dirty state, save, or discard to copy, so B means hand-rolling all
four.

### Layout is flat sections, not tabs

Both Analytics pages that exist are flat, and a flat page has no tab-switch event to guard — which is why
the guard is a non-goal rather than an omission. Sections use `Accordion` (ui-kit 2.0): identity and
binding, trigger, read scope, bindings, execution, state, and a read-only facts block.

### `source` is inferred as follows-or-pinned, and the inference is shown

The service resolves a declared `source` and a defaulted one into the same response, and the only way to
express "follows" is to omit `source` from the request. Saving therefore forces a decision **whether or not
the control is rendered** — making the field read-only would not dodge it, only hide it.

The rule: omit `source` when it equals the target's `source_table`, send it otherwise. Wrong only when
someone deliberately pinned the exact table that was already the default, and the damage there is an
un-pin that stays invisible until `source_table` changes.

Since the inference is unavoidable, the control renders it as an explicit follow/pin choice so an operator
can see and correct the guess. `target.source_table` is already resolved for other reasons, so this costs
no extra request.

### The trigger branch is constructed, never carried over

The one place where "preserve what we loaded" is wrong. The service rejects a member that does not belong
to the selected trigger kind with HTTP 422 rather than ignoring it, so switching `schedule → on_ingest`
must actively drop `trigger_cron`. The existing `buildDto` already constructs the branch from the selected
kind rather than deleting from a copy; that shape survives the refactor.

### Resolution becomes a chain, extracted from form state

`useRuleResolution` resolves evaluator → target → source. The third leg is new and is not parallel: the
read source is the rule's `source` or the target's `source_table`, so it cannot start until the target
lands.

```
evaluator@version ──► input_vars, output_vars, type
target_enrichment ──► columns (output bindings), grain_key, source_table
                                                      │
source (declared or defaulted) ◄──────────────────────┘
        └──► columns (input bindings, SQL predicates, order_by), version_column
```

Output bindings read the **target's** columns; input bindings and every predicate read the **source's**.
Conflating them is the likeliest way to get this wrong. The modal uses the same hook with the source leg
unused.

## Risks / Trade-offs

- **Rewriting the shipped modal's state in PR 1 risks regressing behaviour that is already in review.** →
  The modal's spec is behavioural, not structural; keep every existing assertion and let it gate the
  refactor. PR 1 lands no new modal behaviour, so any diff in the spec is a signal, not an expected churn.
- **The `source` inference silently un-pins a rule deliberately pinned to its default table.** → Surface
  the inference in the control rather than applying it invisibly, so the case is visible to anyone who
  opens the rule. No API affordance exists to do better.
- **Preserving unpresented members means the console can send back a member it does not understand.** →
  That is the intended behaviour and is strictly safer than dropping it; a member the service later
  rejects surfaces as a save failure with the service's own message.
- **Permissions diverge from the shared shell's convention.** → Deliberate: matching the listing's
  `isFullAdmin` matters more than matching a shell this page does not use. Stated in the spec so it is not
  read as an oversight.
- **Four sequential PRs leave the detail page incomplete for three of them.** → Acceptable because the
  DTO-shaped state makes every intermediate state non-destructive: a member with no control yet is
  preserved, not erased. This is what makes the staging safe.

## Migration Plan

No data migration. The four PRs stack: PR 1 must merge before the rest are meaningful, but each is
independently revertable, and reverting any of PRs 2–4 leaves the earlier ones correct — a removed control
means its member is preserved untouched rather than lost.

## Open Questions

- The service's group fetch maximum (`ENRICHMENT_GROUP_FETCH_MAX_ROWS`, default 2000) is not exposed on any
  read endpoint. PR 3 validates `member_select.limit` against the documented default and surfaces the
  service's rejection when a deployment configures a lower one. Answering this properly needs a backend
  affordance and does not change the specs or the task breakdown.
