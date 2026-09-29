## Context

`isBuilderRepresentable` is the single gate between a structured query and the visual builder: the SQL
→ Builder switch, JSON edits, AI runs and stored queries all ask it. The spec already demands that it
"cover every expression the builder would have to hold"; it drifted from `parseQuery` as the parser grew.

## Decisions

### Enumerate the lossy shapes rather than compare a round trip

A round-trip check (`buildQuery(parseQuery(q))` equal to `q`) would catch any future drift, but the
builder also _normalizes_ in ways that lose nothing: it wraps a bare predicate in a root `and`, derives an
alias for a call that arrives without one (renaming the references, see below), adds the implicit `count` to an aggregate query without
metrics, and reorders group-by entries ahead of metrics. Each of those would push a perfectly holdable
query — including most AI-generated SQL — out of the builder. Telling normalization from loss needs the
same per-shape knowledge as enumerating the losses, so the check enumerates them, and the tests pair each
rejected shape with a representable neighbour that must come back unchanged.

### `distinct` is judged where the toggle lives

Only an aggregate metric row has a Distinct toggle, so `isExprRepresentable` rejects the flag everywhere
and the `select` entry check re-admits it for an aggregate-mode call to a non-scalar function. Without a
catalog (the saved-queries grid) the function's group is unknown and the flag is taken at face value,
matching how that caller already treats calls.

### Rename references instead of rejecting unaliased calls

The service keeps an alias only where it is load-bearing, so `COUNT(*)` usually arrives with no `as` and
is sorted as `count`. Rejecting every query that references an unaliased call would push most AI SQL out
of the builder; adopting the service's name as the alias would replace the builder's readable names
(`Row count`) with `count`. The parse keeps the readable alias and rewrites the references, resolving
output names with a mirror of the service's `OutputColumnNaming` — explicit aliases first, then the
field name or lowercase function name, suffixed `_n`. The result column is renamed; the column it sorts
and filters on is the same.

### Column alias equal to its own name is allowed

A translator may name a plain column after itself; dropping such an alias loses nothing.

## Risks / Trade-offs

- Queries that used to open in the Builder with a piece silently missing now open in the JSON view. That
  is the intended direction, but a user used to editing them visually will see the written view instead.
