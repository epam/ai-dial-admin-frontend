## Context

See `proposal.md` — Why. The service side is done and deployed to dev, so this is repair under a contract
that already changed, not a migration the console can pace.

What shapes the approach:

- **The console already has the right seams.** `utils/analytics/rule-dto.ts` keeps a typed list of members
  the API refuses on write and strips them before sending, rebuilds the trigger branch from the selected
  kind rather than carrying it over, and infers follow-versus-pin for the read source. All three concepts
  survive the merge unchanged; only their contents move. The reshape is therefore mostly re-pointing
  existing machinery, not inventing it.
- **The aggregate authoring surface has no counterpart today.** Group keys, measures and freshness are new
  controls, and measures is the largest single piece of new work in the change.
- **`BaseApi` already distinguishes a refusal from a failure** — a `403` resolves to no value, any other
  failure to a null — but `app/[lang]/enrichment-rules/actions.ts` collapses both with `?? null`, so the
  distinction never reaches a page.
- **The rename is wide**: 64 files reference the feature, about 10k lines of source and 5k of tests.
- **The function catalog is already fetched** by the query builder from `GET /v1/queries/functions`, and
  `models/analytics/query-function.ts` already carries `group`, `args[].optional` and `distinct_supported` —
  every fact the measure editor needs to decide what to offer.

## Goals / Non-Goals

**Goals.** One list and one detail page serving both kinds, with the kind branch confined to a single place.
A shared subtree that neither kind's section has to know about. The aggregate section authored in the same
visual language as the rest of the form. A read the service refuses reported as a refusal.

**Non-Goals.** Any change to the query builder. Any new shared component in `src/components/Common/`. Any
attempt to interpret runtime state into a health verdict — the console presents what the service reports.

## Decisions

### D-1: The kind branch sits above the view, not inside it

The intent was one view rendering a shared frame and picking a section by kind. **A React hook cannot be
called conditionally**, and each kind's form is a hook — so a single view would have to call both, or call
one through a branch, and neither is allowed. The branch therefore sits one level up.

`PipelineDetailView` picks `EnrichDetailView` or `AggregateDetailView` by kind and does nothing else. Each of
those calls its own form hook and composes the same `PipelineDetailFrame`, passing its transform section as
children. The frame never asks which kind it is holding, so everything below the branch stays
kind-independent — the property the original decision was after. The create modal splits the same way, over a
shared `CreatePipelineShell`.

Four further branches are unavoidable and are stated so they are not rediscovered as bugs: `buildPipelineDto`
assembles a different member set per kind, validation requires a different set per kind, the candidate
targets are enrichment tables for one kind and source tables for the other, and the read scope offers
follow-or-pin only where there is a parent to follow.

*Rejected:* one section component with conditionals throughout. It reads as less code on the day it is
written and becomes the same registry-shaped confusion the service has just spent a change removing.

### D-2: A shared subtree plus one subtree per kind

```
components/Analytics/Pipelines/
  PipelinesView.tsx            listing, both kinds
  PipelineDetailView.tsx       the one branch; the frame lives in Common/
  Common/                      shared by both kinds
  Enrich/                      evaluator, bindings, member select, execution knobs
  Aggregate/                   group keys, measures, freshness
```

`Pipelines/Common/` is a feature-local shared bucket, following `QueryBuilder/Common/`, and is distinct from
`src/components/Common/`, which stays reserved for domain-free building blocks per the component rules §4.
Nothing from this change is pushed into `src/components/Common/` or `Analytics/Common/`: every piece of it
carries pipeline-domain knowledge.

### D-3: The form is composed, not flagged

`useRuleForm` is 140 lines serving one kind. It splits into `use-pipeline-form` holding the members both
kinds share — identity, target, read scope, trigger, enabled — and two thin hooks that add their own members
and their own validation on top. `buildPipelineDto` splits the same way: one shared assembly plus a per-kind
contribution.

The alternative — one hook carrying every member of both kinds with a `kind` flag guarding each — puts the
two declarations in one state object where nothing stops a member of one kind leaking into the other's
request, which is exactly the thing the service answers `422` for.

### D-4: The aggregate editors are authored in the form language, not borrowed from the query builder

The query builder has visually similar sections and a set of generic-looking building blocks. They are not
reusable here. `SectionBlock` renders a `bg-layer-3` card with an uppercase tiny caption and a colour marker
and accepts no `className`; `CompactSelect` and `CategorizedFieldDropdown` bake `font-mono dial-tiny-text`
and a 26px trigger into their markup. That is the query canvas's visual language; the pipeline detail page is
a labelled form built on `DialSelectField`. Making one component serve both would mean adding presentation
props to a component to fit a second caller, which this repo does not do.

**Decided: reuse from the existing rule pages instead**, where the language already matches — the accordion
section wrapper, the SQL predicate field, the cron control — and author `GroupKeysEditor` and `MeasuresEditor`
as new components patterned on `OutputBindingsEditor`: rows with stable ids, a select per column, a delete
control per row, commit on change. That editor shape has four instances in the feature already.

*Rejected:* promoting the query builder's blocks into a shared location. It would require the styling props
above, and it drags a working, unrelated surface into this change's blast radius for no behavioural gain.

The one thing that does cross over is not visual: the served function catalog, read through the existing
client method.

### D-5: The measure function list is derived from the catalog, never enumerated

`MeasuresEditor` offers the catalog's `aggregate` group, narrowed to functions whose non-optional argument
count is at most one. Both facts are already on the served `QueryFunction`. The `distinct` qualifier is
offered only where `distinct_supported` is set, and the column control is withheld only for a function that
declares **no argument at all**.

That last clause is narrower than it first looks, and getting it wrong is a live bug rather than a
hypothetical: `count` declares one *optional* argument, so withholding the column on optional arity hides
the control while still offering `distinct` — which then blocks the save with nothing on screen to fix it.
Every rollup in the registry uses that shape (`count(distinct trace_id)`), and the detail page would
misrepresent the declaration it is showing.

The arity rule is the service's own refusal restated: an aggregate needing two arguments cannot be expressed
as a measure, and a declaration carrying one is stored and then fails on every run, with the reason recorded
only in its state. Deriving the rule rather than listing function names means the next such function is
covered without a frontend change.

*Rejected:* a hardcoded function list. It goes stale silently on a catalog change, and it would have to
encode the arity rule as a list of names rather than as the rule itself.

### D-6: The refusal signal is carried, not re-derived

`BaseApi` already returns no value for a `403` and a null for every other failure. The server actions stop
collapsing the two, and the pages render `Page403` on a refusal and the load-failure console on a failure.

This is deliberately not implemented by probing the caller's role in the console. The role that grants
pipeline reads is the service's to decide and is expected to change; a console-side role check would then be
a second, stale copy of the rule. Reading the service's own answer needs no change when it changes.

### D-7: `name` replaces `id` as the addressed identity

The detail route, every link into it, and the delete and patch calls all key on `name`. The name field
becomes read-only on the detail page — the service refuses a changed name — and the create form validates it
against the service's identity grammar rather than only for non-blankness, because a name that fails the
grammar is now a rejected registration rather than an accepted one.

`PipelineKind`, `TriggerKind`, `TruncUnit` and `FreshnessMode` are TypeScript enums per the code standards,
not string-literal unions: each is a fixed value set that appears at runtime in a select's options and in a
DTO.

### D-8: The read-only member list is shared and typed against the DTO

`READ_ONLY_MEMBERS` loses `id` and gains `state`; the rest carry over. It stays typed against the pipeline
model so a member rename fails at compile time rather than at runtime — the property that makes it safe now
matters more than it did, because the service answers `400` naming an unrecognised member where it used to
drop one silently.

The same strictness is why the JSON editor's document must exclude derived members: what the caller sees is
what is sent, and a `state` object left in the document is a failed save.

### D-9: Follow-versus-pin survives, on a list

The read source is now `inputs`, a list. The service resolves a followed input and echoes it back, and
sending it back **declares** it, which is validated more strictly than following. The existing inference —
an input equal to the target's `source_table` means following, and is omitted — carries over unchanged in
meaning and is re-pointed at the list's single element.

This is the one place where a mechanical rename would introduce a real regression: carrying `inputs` through
untouched, as a full-replace caller naturally would, silently converts every following pipeline into a
pinned one.

## Risks / Trade-offs

- **A wide rename quietly dropping behaviour** → the rename is by symbol, and the existing test suites move
  with the code rather than being rewritten; the permission suites in particular are kept rather than
  retired.
- **The service restoring read-only reads while the console has removed the read-only presentation** →
  the presentation is explicitly kept (D-6 and the spec's saving requirement). Restoring access then needs
  no console change at all.
- **A read-modify-write echoing a derived member and failing the save** → one typed list, one strip, one
  assembly path, shared by the fields and the JSON editor alike.
- **The aggregate editors having no exemplar in this feature** → they are patterned on an editor that exists
  four times over, and the measure editor's decisions are all derived from served data rather than invented.
- **The listing growing a kind column that reads as a filter** → kind is a column with the grid's own
  filtering, not a new toolbar; the page deliberately has no filter toolbar today and does not gain one.

## Migration Plan

No data migration and no coordinated deploy: the service change is already live on dev, so the console is
catching up. Sequenced so the broken page is repaired first and the new surface lands on top:

1. **Transport and model** — the client, the models, the DTO assembly and the list-item projection. Nothing
   renders yet; the suites for these are unit tests.
2. **Rename and route** — directory, filenames, i18n keys, route enum, breadcrumbs, menu, and the evaluator
   pages that link into the feature. The old route stops existing.
3. **Shared frame and the enrichment section** — the detail page repaired against the new contract, the
   runtime state section, and the refusal fallback. At the end of this step the feature works again.
4. **The listing over both kinds** — the kind column and the per-kind em dashes.
5. **The aggregate section** — group keys, measures, freshness, and the create modal's kind choice.

Rollback is per step: each is independently revertable, and no step leaves the console reading an endpoint
that does not exist except between steps 1 and 3, which ship together.

## Open Questions

None blocking. One thing deliberately left to the service: whether a read-only admin regains pipeline reads,
and when. The console's behaviour is specified for both outcomes, so neither answer changes this design.
