## Context

See proposal.md — Why. Two constraints shape the approach:

- **The kind is not known before the first read.** A detail route carries a name, not a kind, so the
  console cannot pick the projection the service will honour until it has an answer in hand.
- **The refusals are the service's contract, not a bug.** Its own code states the rationale: a
  requested projection a read cannot honour is answered with an error rather than with the unresolved
  object under the compiled name, because a consumer cannot tell that object apart from an enrichment
  pipeline which genuinely resolves no members. That closes a silent-data-loss path, so the fix belongs
  on this side.

## Goals / Non-Goals

**Goals:**

- Keep every pipeline surface readable for both kinds.
- Keep the resolved members on the surface that renders them — the detail page of an enrichment
  pipeline.
- Keep the change inside the API layer, so no component, server action, page or model moves.

**Non-Goals:**

- Restoring the resolved read source to the listing grid (see Decisions — third).

## Decisions

**The listing names no projection, rather than scoping itself to one kind.**

`?kind=enrich&view=compiled` is served, so the listing could have become two requests — the declaration
for every kind, plus the compiled enrichment feed — merged per row. Rejected: the grid renders the
declared inputs and the declared evaluator name and version, and all three are carried by the
declaration. A second request per page load, plus merge code and its tests, would buy one cell's worth
of resolution in a case that does not currently occur (below).

**The detail read chooses its projection from the kind in the first answer.**

The alternative was speculative: ask for `compiled`, and on a 422 re-read as `source`. Rejected on two
counts — it makes the ordinary path for a non-enrichment pipeline a failed request that lands in the
service's logs and in any error-rate alarm built on them, and it couples the client to a status code
where it can read the kind directly.

A third option was to pass the kind down from the listing the detail page already fetches for its
`takenTargets`. Rejected: it makes a correct read of one pipeline depend on a successful listing of all
of them, and that listing is deliberately best-effort — its failure currently costs an empty
`takenTargets` and nothing more.

**A failed compiled read is reported, not downgraded to the declaration.**

The detail view renders an absent `grain_key` or `version_column` as "not set". For an enrichment
pipeline both are always resolvable, so presenting the declaration in place of a failed compiled read
would state something false where reporting the failure states something true. This is the same
principle the service applied in refusing the projection outright.

**The inputs cell renders the declared source, and an inherited one shows as an em dash.**

This is the one behavior the fix gives up, and it is a spec change rather than an implementation
detail — see the delta. It bites only an enrichment pipeline that declared no input of its own; its
resolved source stays one click away on its own detail page, which does ask for the compiled
projection. Confirmed against the dev registry: every enrichment pipeline registered there declares its
input, and its resolved source is identical to the declared one, so the cell renders today exactly as it
did before. Should an inherited-source pipeline be registered later and the em dash prove confusing, the
two-request merge above is the remedy, and it is additive.

## Risks / Trade-offs

- **An inherited read source stops being visible in the listing** → It remains on the pipeline's own
  page. No such pipeline exists in the dev registry today, and the spec delta states the new behavior
  rather than leaving the grid quietly diverging from a requirement.
- **An enrichment pipeline's detail page now costs two requests** → Both are registry reads against a
  small table, issued server-side while the page renders, and only for the kind that needs the second
  one. An aggregate pipeline drops from one refused request to one served request.
- **The console now depends on `kind` in the declaration being trustworthy** → It is the discriminator
  the service uses for every kind-scoped rule it has, and it is present in both projections.

## Migration Plan

None. No stored state, no API surface of our own, and no user-visible setting changes. The fix is
forward-compatible with the service's previous behavior: `view=source` and `?kind=enrich&view=compiled`
were both served before the gates were added, so the console works against either version of the
service.
