## Context

See proposal.md — Why. Three constraints shape the approach.

**The service ships without compatibility in either direction.** The removed members are refused with
the field named, not ignored, so the console cannot straddle both shapes: whichever it writes, one of
the two services refuses it. The data-access service, the enrichment runner and the MCP server ship in
one maintenance window, and this work ships with them.

**Reads are already normalized, writes are not.** For pipelines the service reads the superseded stored
shape through aliases and answers exclusively in the new vocabulary — verified against the branch
running locally, where a pipeline registered with the old knob names comes back under the new ones. For
evaluators it does the opposite: a version registered before the change is served exactly as written,
so the console is the only place both shapes meet.

**Two facts the console cannot know.** An evaluator screen has no target table, so it cannot check an
output's name, type or value domain against the column that will receive it; and it has no trigger, so
it cannot tell which template placeholders are legal. Both were previously checkable because the
evaluator carried its own types. Neither is recoverable client-side — an evaluator is not bound to one
pipeline by anything in the API — so both become service-side failures surfaced on save.

## Goals / Non-Goals

**Goals:**

- One read model per entity, whatever shape the service answers in.
- Every control that survives keeps its current component; nothing is rebuilt for its own sake.
- Shared components are reused as they are — a mismatch is absorbed by the caller.

**Non-Goals:**

- Splitting `Pipeline` into separate authored and compiled types. See Open Questions.
- Any client-side approximation of a service-side rule the console lacks the data to evaluate.
- Touching the Analytics surfaces outside Evaluators and Pipelines.

## Decisions

### D1: Read the compiled projection everywhere, rather than one projection per surface

The service's default is now the authored declaration; the compiled projection adds the inlined
evaluator, grain key, version column, derived output mapping and resolved input. The console renders all
of those.

**Chosen:** ask for the compiled projection on both reads, listing and detail.

**Alternative — the authored projection for the form, compiled for the read-only panel.** This is what
the service's own reasoning suggests: the authored projection exists so a read-modify-write client
cannot launder a derived value into a declared one. Rejected because it doubles the detail page's reads
for one guarantee the console already has by other means — the read source's "declared or inherited"
distinction is recovered from the target table's own parent, not from the projection, in existing code.

**Consequence to watch:** the derived output mapping now arrives on every read, so it must join the
members stripped before a save, alongside the evaluator, grain key, version column and state.

**Measured constraint:** the inlined evaluator and grain key are resolved only when the listing is
**both** compiled and narrowed to one kind — a cross-kind compiled listing carries the derived mapping
but no inlined evaluator. The evaluator type badge therefore keeps exactly the behaviour the shipped
spec already describes: present under a single-kind listing, absent in the mixed one. No new backend
member is needed for it.

### D2: One evaluator model, resolved on read, written only in the new shape

**Chosen:** a read-side normalizer produces one model — current member first, superseded members as
fallback, empty where neither carries the value — and the request builder emits only the new shape.

This makes editing a superseded version work without a single conditional in the form, which is why no
read-only mode or shape badge is specified: there is nothing for the operator to act on.

For a superseded `llm` version the entry list and order come from `output_vars`; prose and value domain
come from the matching property of `response_schema`. **The order must not come from the schema** — its
key order is assigned by the store, and a stored schema whose keys were re-sorted by length is the
original defect this whole redesign answers.

**Alternative — block editing of a superseded version.** Rejected: it costs a mode and a badge to
prevent something that the normalizer makes correct anyway.

### D3: The request template moves to the JSON editor, giving up the never-reformatted guarantee

The shipped spec requires the template to be presented verbatim and submitted byte-identical, because
it is a string on the wire. A JSON editor re-serializes, so whitespace and key order change.

**Chosen:** edit it as a document and accept the re-serialization, with a text fallback when the value
does not parse. The member is a nested JSON document whose prompt content is the thing operators
actually edit; a single-line string field makes that impractical.

**Required fallback:** the service accepts the template whether or not it parses, so a version carrying
unparseable content must stay editable. Refusing to render it would make a live version unmaintainable
through the console.

### D4: The placeholder hint is one component with two callers

Both screens need the same thing — a list of `{{name}}` tokens, each in a state — for different
reasons: the evaluator screen documents the five group built-ins, the pipeline screen shows which
template placeholders a variable covers.

**Chosen:** one presentational component taking `{ name, state }[]`, each caller computing its own
states. Placed under the Analytics tree rather than in `Common/`: two callers in one feature area is
not yet a shared concern, and `Common/` components are not widened for a single feature.

The pipeline side extracts placeholders with the same pattern the service uses,
`/\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g`, and is presented only at row grain — at group grain the names are
the service's own built-ins and carry no relationship to the declared variables.

### D5: Reordering reuses `DraggableItem`, not `DraggableList`

`DraggableList` takes `string[]`; an output entry is an object. `DraggableItem` takes arbitrary
children plus `id`/`findItem`/`moveItem`, which fits without modification.

**Chosen:** wrap each output row in `DraggableItem`. Neither shared component is changed.

**Known sharp edge:** its drag type is the literal `'column'`, shared by every list using it. Harmless
while a screen has one draggable list; a second one on the same screen would accept the first's items.

### D6: Function descriptions move into a tooltip on the option row

The catalog's aggregate descriptions run from one line to a full paragraph, and `SelectOption.description`
renders beneath the label, which makes the list unscannable.

**Chosen:** pass the signature as `labelNode` with the description in a tooltip on the whole row, and
stop passing `description`. Use the 1.0 tooltip, consistent with the rest of these forms, even though
the kit marks it superseded — a single 2.0 component inside 1.0 forms is a worse outcome than an old
one used consistently.

### D7: Measures are presented as the mapping they are

A measure maps a source column through an aggregate into a target column, and its name **is** the target
column. Presenting the name as free text makes a typo a service-side failure.

**Chosen:** the name becomes a select over the target's columns; the source column stays a select and
gains a placeholder stating that it defaults to the measure's name.

**Not chosen — hiding the source column when it could default.** Measured against the live registry the
two names coincide for well under half of the measures, so the control would be hidden for the majority
case.

**Density, not disclosure:** field labels move to a header stated once, the `where` predicate becomes a
single line that grows on focus, and the source note is stated once below the list. Nothing is hidden
behind an expander — a condition an operator cannot see is a condition they forget.

### D8: The console validates exactly one execution knob

The shipped spec's rule is that the console imposes no constraint the service does not. The sample
fraction is now the exception: the service refuses zero outright, naming `enabled: false` as the way to
express evaluating nothing, and refuses a value above one rather than reading it as a percentage.

**Chosen:** validate it client-side as `0 < x ≤ 1` with the console's own message, and leave the other
four unvalidated as before.

### D9: Readiness becomes three conditions, each with its own presets

The service requires at least one of three, and the console previously collected only two of them, with
durations entered as a number plus a unit select.

**Chosen:** three independently enabled conditions, the predicate among them, each duration offered as a
small set of presets appropriate to that condition plus a custom entry whose placeholder states the
accepted spelling. Disabling a condition keeps its value on screen and omits the member from the
request, so toggling is not destructive.

The predicate's failures need distinguishing: a reference to a sensitive column fails as an entitlement
error rather than a grammar one, and the two have different remedies.

## Risks / Trade-offs

- **The branch is not merged and may still move** → the contract was read from the branch and verified
  against it running locally; re-verify the request shapes against the merged service before the final
  gate.
- **No compatibility window** → nothing to mitigate at the console: ship in the same release, and expect
  local development against a service instance ahead of the console to break authoring until it lands.
- **Column/output type agreement is no longer checked anywhere before save** → accepted deliberately;
  the service checks it at composition and the console lacks the data. The cost is a later failure with
  a service message rather than an inline one.
- **The template is re-serialized on save** → scoped to one member, with a text fallback for content
  that does not parse; no other member gains this behaviour.
- **A duplicate output name is invisible to the service** → the request carries outputs keyed by name,
  so a duplicate is collapsed by the parser before validation. The form is the only place that can
  report it, which is why the spec requires it to.
- **Removing the two binding editors deletes their test suites** → their coverage does not transfer;
  the new variables and outputs editors need their own tests rather than adapted ones.

## Migration Plan

No data migration. Deployment order is the service, then the runner, then this console, within one
window; there is no state to roll back on the console side, so rollback is redeploying the previous
build alongside the previous service.

Evaluator versions stored in the superseded shape are migrated by hand against the new API, outside this
change. The console's fallback exists to keep them readable in the meantime, not to migrate them.

## Open Questions

- **Which members are stripped before a save, and how the enable toggle sends its change.** The toggle
  currently posts the whole stored document, which under the new contract fails on any derived member it
  carries. Two shapes are available — send only `enabled`, or keep posting the document with the derived
  members stripped — and the choice depends on whether a save from the detail page should re-declare the
  pipeline at all. Deferred with the user's agreement; it changes one call site and no requirement in
  these specs.
- **A contradiction in the service's own specification**, to be raised with that team rather than
  resolved here: `values` and `jsonata` are refused together, while the same document prescribes exactly
  that pair — a sentinel value mapped to NULL — as the way to express an output that may legitimately be
  absent. For a string column, whose domain can only come from `values`, the prescribed idiom is
  therefore unexpressible. Nothing in this change depends on the answer.
