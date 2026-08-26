## Context

See `proposal.md` — Why. The behaviour this design implements is in
`specs/analytics/spec.md`.

Three constraints from the existing code shape everything below:

1. **The Tables console is a direct structural precedent.** `src/app/[lang]/tables/` +
   `src/components/Analytics/Tables/` + `AnalyticsDataApi` already implement a listing page, a
   create popup, a detail route, and a 403 guard against the same service. Reusing that shape is not
   merely convenient — a locally-correct screen that invents its own is a review failure in this
   repo.
2. **`Rules` is already taken.** `src/components/Rules/` is the entity access-rule editor and
   `RuleFolderProvider` sits in the root provider stack. Nothing here may be called `Rules`
   unqualified.
3. **The listing response is unusually heavy.** Verified against the dev instance: every rule inlines
   its fully resolved evaluator, and an `llm` evaluator carries its entire `request_template` and
   `response_schema`. One rule on that instance is ~4KB of prompt text. The grid reads
   `evaluator.{name, version, type}` and nothing else.

## Goals / Non-Goals

**Goals:**

- One listing + one modal that follow the Tables console's file and data-flow shape closely enough
  that the deferred detail page slots in without rework.
- Contain every API trap (§ the spec's endpoint requirement) in the server layer, so no component
  can reintroduce an empty `enabled` parameter or the wrong response envelope.
- Build the four bespoke controls as self-contained, individually testable components with no
  dependency on the create modal, since the detail page will mount the same four.

**Non-Goals:**

- No new state-management dependency. The modal's cross-field derivation is a hook with local state,
  consistent with `use-draft-schema-form.ts` next door.
- No client-side SQL parsing or validation anywhere in this change.
- No shared "rule form" abstraction spanning the modal and the future detail page. That abstraction
  should be extracted from two concrete implementations, not guessed at from one.

## Decisions

### Route and component naming: `enrichment-rules`

`ApplicationRoute.AnalyticsEnrichmentRules = '/enrichment-rules'`,
`src/components/Analytics/EnrichmentRules/`, `AnalyticsEnrichmentRulesI18nKey`.

*Alternative considered:* `/rules` + `Analytics/Rules/`, matching the API path. The component
directory would not collide (it is namespaced under `Analytics/`), but the top-level route and the
menu label would — the app already has an unrelated access-rules concept, and breadcrumb/menu
resolution matches on the first path segment. The API-path mismatch costs one mapping in the API
class; the naming collision would cost every future reader.

### The listing server action projects the DTO before it crosses to the client

`getRules()` maps each rule to a listing-shaped object carrying `evaluator` reduced to
`{name, version, type}`. The full evaluator stays on the server.

*Alternative considered:* pass the raw DTO through, as the tables actions do. Rejected on payload:
the tables listing is already projected *by the service* (`column_count`, no `columns`), whereas the
rules listing is not, and a rule's inlined `llm` evaluator is the single largest object this feature
touches. Projecting also makes the spec's "no per-row evaluator request" property structurally true
rather than merely observed.

Consequence for the deferred detail page: it uses `getRule(id)` and receives the full DTO. The
listing model and the rule model are therefore two types, not one — `EnrichmentRuleListItem` and
`EnrichmentRule`.

### Narrowing is the grid's job, not a toolbar's

Every data column stays sortable and filterable through `AgGridWrapper`'s `defaultColDef`, which
already sets `floatingFilter: true` with `agTextColumnFilter`. Because the listing is unpaged those
controls act on the whole registry, so a separate toolbar would duplicate them.

*Alternative considered:* a server-side filter toolbar (`enabled` tri-state + an `updated_since`
preset), refetching through the server action. Built first, then removed — it narrowed the same data
the grid narrows, in a second place, with a second state to keep coherent.

The API layer keeps both filters (see the endpoint contract), since they are part of the documented
endpoint and a future saved-view or the detail page may drive them.

### The `enabled` filter is a three-state enum, never a boolean

```ts
enum RuleEnabledFilter { All = 'all', Enabled = 'enabled', Disabled = 'disabled' }
```

The parameter is built in the API class, which appends `enabled` only for the two non-`All` members.
A `boolean | undefined` would let `undefined` interpolate into an empty string somewhere downstream
— precisely the 400 the service returns. Making "all" a *named member* rather than an absence means
the omission is an explicit branch that a unit test can pin.

### The modal's resolution graph lives in one hook

`use-create-rule-form.ts` owns the form object, the derived values, and two caches
(`Map<string, Evaluator>` keyed `name@version`, `Map<string, AnalyticsTable>` keyed by table name)
held in refs. It exposes `{form, setField, resolved, isPending, errors, canSubmit, buildDto}`.

```
 form.evaluator_name ─┐
 form.evaluator_version ─┴─▶ resolveEvaluator(key) ─▶ resolved.evaluator
                                                        ├─ .type      → gates input/output binding rules
                                                        └─ .output_vars → OutputBindingsEditor options

 form.target_enrichment ────▶ resolveTable(name) ────▶ resolved.target
                                                        ├─ .columns        → OutputBindingsEditor options
                                                        └─ .grain.grain_key → derived group_by
```

Concentrating this in one hook keeps `CreateRulePopup` a layout component and makes the derivation
unit-testable without rendering Monaco, AG Grid, or a portal — the cost discipline the testing rules
ask for.

### `buildDto()` constructs from the trigger kind rather than deleting from a full object

The service rejects a member that does not belong to the selected trigger with 422, and the form
retains values from abandoned branches by design (switching kind and back must not lose work). So
the DTO is built by *adding* the selected branch's members to the required five, never by copying the
form and `delete`-ing the others.

*Alternative considered:* keep the form itself branch-shaped, discarding values on kind change.
Rejected: it makes an accidental kind change destructive, and the spec explicitly requires the
opposite behaviour for the output-bindings editor.

### Excluding already-bound target enrichments

Computed in the client hook as `enrichmentTables.filter(t => !takenTargets.has(t.name))`, where
`takenTargets` comes from the rules listing the view already holds — no extra request. When the
resulting set is empty the control says so rather than rendering an empty select.

*Alternative considered:* let the 409 teach the user. Rejected — a 409 arrives after the whole form
is filled. The 409 handler stays anyway, because the exclusion set can be stale by submit time.

### Cron validation is field-count plus shape, not a full parser

The control validates that a custom expression has exactly six whitespace-separated fields and that
each field matches the cron field grammar (digits, `*`, `,`, `-`, `/`, and the month/day-of-week
names). It does not attempt to compute a next-fire time.

*Alternative considered:* add a cron library for full parsing and a "next fire" preview. Rejected for
this change: no cron dependency exists in the repo today, and adding one to guard a field the backend
never parses is a dependency decision that deserves its own justification. Six-field arity is the
error that actually bites — a five-field expression is *silently a different schedule* under a
six-field reader — and arity is exactly what a small pure function catches. If a preview is wanted
later, the library lands then, behind the same control.

*Note on why the UI validates at all:* the service checks only presence/absence of `trigger_cron`.
Garbage saves with a 201 and fails inside the runner. There is no server-side backstop to fall
through to.

### The output-bindings editor invalidates rather than clears

Rows are held as `{column, var, id}` with a stable id. On a change to the evaluator, version, or
target table, the editor recomputes the available option sets and derives per-row errors; it never
writes to a row's values. Suppression of already-chosen values is computed per row as
`options.filter(o => !chosenElsewhere.has(o))`.

The duplicate guard is load-bearing rather than cosmetic: the service does **not** reject a duplicate
column or variable, it silently drops a binding. An unguarded duplicate therefore produces a rule
that writes less than the operator specified, with no error anywhere.

### Duration values: a pure codec, separate from the control

`utils/analytics/duration.ts` exposes `parseDuration(value): {amount, unit} | null` and
`formatDuration({amount, unit}): string`, handling the short form (`^(\d+)(ms|s|m|h|d)$`) and
recognising the ISO-8601 `PT…` form on the way in. The control renders a number + unit pair when
`parseDuration` succeeds and a raw text input when it returns `null`.

Keeping the codec pure means the round-trip cases — including the "written by hand through the API"
fallback — are unit tests over a function, not component tests over a form.

### Full-admin gating only

Rule DTOs carry no `permissions` object, unlike table DTOs, so there is no per-rule capability to
consult and no analogue of `useAnalyticsTablePermissions` to write. Gating reads `isFullAdmin` from
`AppContext` directly at the two decision points (create action, delete action).

## Risks / Trade-offs

- **The listing links to a detail route this change does not create.** → Accepted deliberately: the
  follow-up change adds `/enrichment-rules/[id]`. Until it lands the name cell resolves to a 404. The
  alternative — a non-navigating name cell that later becomes navigable — churns the spec and the
  tests for one intermediate release. Sequencing the two changes closely is the mitigation.

- **The type-match flag on an output binding can disagree with the service.** The mapping between
  ClickHouse column types and evaluator variable types is not one-to-one. → The flag is advisory and
  never blocks submission; the service stays the authority, and its `message` is rendered verbatim on
  rejection.

- **The excluded-targets set is computed from a listing that can be stale.** → The 409 path is
  implemented and tested, not just the exclusion.

- **`generation` moves for reasons other than a rule edit.** Renaming a source's version column bumps
  `generation` and `updated_at` for every rule reading that source. → The listing presents
  `generation` as a plain value and this change builds nothing on top of it (no "changed since you
  looked" affordance), so there is nothing to be wrong. Worth recording because a future
  change-detection feature must not read it as "someone edited this rule".

- **Cron arity validation will reject an expression a user pasted from a five-field tool** (crontab,
  most online builders). → The error message states the six-field requirement explicitly, and the
  presets cover the common schedules without hand-authoring.

- **Delete has no undo and the service returns 204.** → Danger-variant confirmation naming the rule,
  matching the tables catalog. Deleting a rule does not touch the enrichment table or its rows.

## Open Questions

- **Whether the six-field cron control should eventually show a next-fire preview.** Deferrable: it
  is additive inside `CronField`, changes no DTO and no spec scenario, and depends on a dependency
  decision (a cron library) that is not needed for correctness now.
- **Whether `updated_since` should later offer an absolute datetime alongside the relative presets.**
  Deferrable for the same reason — the wire format is an ISO instant either way.
