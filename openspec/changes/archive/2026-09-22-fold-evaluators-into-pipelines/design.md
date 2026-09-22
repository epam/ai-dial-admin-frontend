## Context

See `proposal.md` — Why. What shapes the approach here is that the console already holds every editor this
change needs; they are mounted on the wrong page. `OutputsEditor`, `AllowedValuesField`,
`EvaluatorParamsEditor` and the request-template editor were built against an evaluator draft, and the
enrichment section of a pipeline already carries `VariablesEditor`, the trigger editors and the Advanced
knobs against a pipeline draft. The fold makes one draft out of two.

Three constraints bound the work:

- **The service refuses rather than ignores.** `evaluator_name`, `evaluator_version` and a top-level `vars`
  are 400s at the binding after the fold, and `transform.*` members are 422s on an aggregate declaration.
  There is no shape that satisfies both the pre-fold and the folded service, so nothing here can be made
  backwards-compatible.
- **`use-pipeline-resolution` already resolves tables.** The target's columns — what the outputs editor now
  needs — are the same read the inputs editor's read source comes from, cached per key for the life of the
  surface.
- **Two typecheck gates at zero**, app source and spec files. A deletion this wide is caught by them rather
  than by tests: every dangling import, every removed i18n key and every fixture still shaped like an
  `Evaluator` surfaces as a type error.

## Goals / Non-Goals

**Goals:**

- One draft, one form, one save path for an enrichment pipeline and its transform.
- Move the existing editors rather than rewrite them; behaviour changes only where the spec says it does.
- Spend the target resolution the console already pays for on the outputs editor.
- Leave the pipeline's shared frame — identity, facts, trigger, state, JSON editor, save bar —
  kind-independent, as it is.

**Non-Goals:**

- A compatibility mode, feature flag or dual shape that works against a pre-fold ADAS.
- Reworking the aggregate section, the trigger editors or the JSON editor beyond the members they name.
- Any new resolution, cache or context. The two table reads stay the only ones.

## Decisions

### D1 — Move the editors; do not rewrite them

`OutputsEditor`, `AllowedValuesField`, `EvaluatorParamsEditor` and `outputs.ts` move to
`components/Analytics/Pipelines/Enrich/` with their tests, and their props are re-pointed from an evaluator
draft to `transform`. The row-state pattern they use — ids the wire shape has no room for, re-seeded only
when the prop says something the rows do not — is the same pattern `VariablesEditor` uses, so the two sit
beside each other coherently.

*Alternative considered:* rewriting the outputs editor around the new column-bound name control. Rejected:
the drag-reorder, the refinement selection and the duplicate-name check are unchanged by this spec, and
rewriting them puts working behaviour back through review for no behavioural gain. The name control is one
field of the row.

### D2 — One form hook, not a nested one

`use-evaluator-form` folds into `use-enrich-form`. The transform is a member of the pipeline draft, not a
draft of its own.

*Alternative considered:* keeping a nested `use-transform-form` composed into the enrich form. Rejected:
"has this pipeline changed" is already a single question the detail page answers for the save bar and the
discard guard (*Unsaved pipeline edits are tracked and discardable*), and a second draft makes it two
questions whose answers can disagree — the JSON editor's entry gate reads exactly that flag.

### D3 — Target columns arrive as props, resolved by the existing hook

`use-pipeline-resolution` loses its evaluator branch and keeps its table branch; the enrichment section
passes the resolved **target**'s columns to the outputs editor and the resolved **read source**'s columns to
the inputs editor, each with the readiness flag the inputs editor already takes.

*Alternative considered:* a context providing the resolved tables to the whole section. Rejected: two props
in one place, and `.claude/rules/components.md` puts a context behind a demonstrated prop-drilling problem
rather than ahead of one.

### D4 — Exclude provenance columns by tag, not by name

The outputs editor filters out columns whose `tag` is `system`, rather than a hard-coded list of provenance
names.

The provenance set is the service's and it moves: `pipeline_generation` was added by this very ADAS change,
and `evaluator_version` is now a column nothing writes. A name list in the console would have to be edited
in lock-step with the service and would silently offer a new provenance column in the window before it was.
The `system` tag is what the query builder already groups fields by, so the vocabulary is not new.

### D5 — A defaulted prose is a placeholder, never a value

Where an output's bound column carries a `description`, the prose control shows it as placeholder text and
the request carries no prose for that output.

*Alternative considered:* pre-filling the control with the column's description. Rejected: the operator
would save it back as an authored value, which freezes a copy of the description into the declaration —
exactly the duplication the service removed by defaulting at composition time. A later edit of the column
would then stop reaching the prompt, silently.

The distinction has to be visible, not just semantic: placeholder styling, and no dirty state from
rendering it.

### D6 — The value list and the column's enum domain are alternatives, not a pair

The value-list refinement is offered only where the bound column declares **no** `enum_values`; where it
declares one, the section shows that domain as a read-only fact instead.

This is the inverse of what the first draft of this change said, and the service is explicit: an output
declaring `values` for a column that already declares `enum_values` is rejected. The two members answer the
same question — what the closed set is — and the column wins whenever it has an answer, because its
declared order also assigns the numeric ids. So the existing free-entry list popup stays exactly as it is
for the plain-string case it was built for, and the enum case grows no control at all.

Rebinding a row from a plain column to an enum one drops the list it was carrying, rather than hiding a
member that would still be sent: a hidden `values` is a 422 the operator cannot see the cause of.

### D6a — The request template is a registration field, not a detail-page one

The create modal collects `transform.request_template` for an `llm` transform, against the general rule
that it collects only what registration requires. It does: `EnrichSpecValidator.requireValidLlmShape`
refuses a blank template on **every** write, and only the placeholder correspondence is deferred to
enable. An earlier draft of this change had the modal omit it, which would have made every `llm`
pipeline created through the console a 422.

The placeholder chips and the group-grain caption stay on the detail page — they are reference for a
template being refined, not part of declaring one.

### D7 — The legacy transform members are carried, never authored

A pipeline folded from a pre-fold evaluator may carry `transform.output_vars` and a stored
`transform.response_schema`. Both are part of the authored surface on `view=source` and are accepted on
`PATCH`; the console reads them, carries them through a save untouched, and offers no control for either.
Assembling a save never sends a stored `response_schema` together with a newly authored `outputs` — the
service refuses that pair with 422.

*Alternative considered:* normalising a legacy declaration into the current shape on read. Rejected: that
is a silent rewrite of someone's declaration performed by a form they opened to change something else, and
the service deliberately never rewrites those rows either.

### D8 — Delete the console page; do not keep a read-only archive

`GET /v1/evaluators` survives on the service. The console drops it entirely rather than keeping a read-only
listing.

*Alternative considered:* an archive page reachable from nothing. Rejected: it would carry the listing, the
version switcher, the Properties tab and their tests — the bulk of the deleted surface — to answer a
question that has a better answer on the pipeline (its Audit tab, attributed per revision, which the
evaluator registry never had). The pre-fold definitions remain readable through the API for anyone who
needs them.

### D9 — No feature flag, no dual shape; the PR waits for the service

The change ships as one PR that assumes the folded service, and it is merged only once ADAS has the fold on
a deployed environment.

*Alternative considered:* gating the new shape behind a flag so the console works against either service.
Rejected: it would double the pipeline model, the DTO mappers and their specs, and it buys nothing — the
pre-fold console breaks against a folded service just as hard, so there is no window in which one build
serves both. A flag would also have to be removed by a follow-up PR that is the size of this decision's
savings.

### D10 — i18n keys follow their surface

`AnalyticsEvaluatorsI18nKey` is deleted; the strings that move — output labels, params hints,
request-template labels, type badge — are re-declared under `AnalyticsPipelinesI18nKey` with the wording
they already have. Keys are not re-used across enums, so a moved string gets a new key rather than an
import across feature boundaries.

### D11 — The Analytics index's routing table is edited in the main spec

The `analytics/evaluators` row lives in `openspec/specs/analytics/spec.md`'s `## Purpose`, which a delta
cannot address. It is edited directly in the consolidated spec as part of this change, alongside the delta
that modifies the menu and API requirements.

## Risks / Trade-offs

- **The PR is unmergeable until ADAS deploys the fold** → Keep it as a draft PR, rebased; verify against a
  local ADAS built from `feat/fold-evaluators-to-pipelines` rather than against dev, which serves the
  pre-fold shape as of 2026-09-21.
- **A wide deletion can leave a live reference behind** → Both typecheck gates run on pre-commit and block
  CI, and the i18n keys are enum members, so a missed reference fails the build rather than rendering a raw
  key at runtime.
- **A stranded output name could be dropped silently on save** → It is kept as an invalid option and marked,
  which the inputs editor already does for a stranded column; the spec states it and a unit test pins it.
- **A wide target makes the column select long** → The domain is one table's columns, which is tens rather
  than hundreds; if it proves unusable, a searchable select is an additive change to one control.
- **An operator's bookmark to `/evaluators` now 404s** → Accepted deliberately rather than redirected to the
  pipelines listing, which answers a different question. The menu item is gone, so the path back is the
  page an operator now uses.

## Migration Plan

1. ADAS merges `feat/fold-evaluators-to-pipelines` and the Enrichment Runner ships in the same window; V41
   folds each enrich pipeline's resolved evaluator version into its own `spec`.
2. Verify the folded shape against a deployed environment — the `transform` block on `view=source`, the
   absent `evaluator` object and the derived `response_schema` on `view=compiled`.
3. Merge this change. No console-side migration exists: the console stores nothing, and every pipeline it
   reads is already folded by the service.
4. Rollback is the revert of this PR, and it is only valid while ADAS is also rolled back — a pre-fold
   console cannot read a folded declaration's transform.

## Open Questions

- Whether the column select needs a search affordance at the widest live target. Additive to one control and
  answerable after the first real use; it changes no spec and no task boundary.
