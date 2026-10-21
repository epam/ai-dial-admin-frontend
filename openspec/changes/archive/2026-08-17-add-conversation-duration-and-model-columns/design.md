## Context

See proposal.md — Why. The design-relevant state:

- The grid's curated columns live in `BASE_CONVERSATIONS_TRACE_COLUMNS`; the rest are derived from the entity
  schema by `buildConversationColumnCatalog`, which drops `array` and `object` types outright.
- The list query projects `CURATED_SELECT_FIELDS` plus whichever schema-driven columns are visible. A field
  that is not projected arrives `undefined`, and making a column visible restarts paging.
- `TagsCellRenderer` already renders a string array as pills with a width-aware `+N` badge, and
  `TOPICS_COLUMN` shows the established wiring: `cellRendererParams` supplies `items`, `tooltipValueGetter`
  supplies the full list.
- `deployments` holds every deployment that handled a hop. Measured on 2011 real conversations: 49% include at
  least one orchestrating deployment, 17% an application resource path, 10% an embedding, 6% a toolset path.

## Goals / Non-Goals

**Goals:**

- Two curated columns whose values are present on first paint, with no second round trip.
- A models presentation that is honest about being an approximation and never empties a cell.
- Reuse of the existing pill renderer rather than a second array-cell pattern.

**Non-Goals:**

- Teaching the column catalog to render arrays generally (see proposal — Non-goals).
- Any change to the rollup pipeline or the analytics service.
- Reworking how `TagsCellRenderer` measures overflow.

## Decisions

### Narrowing lives in a pure util, not in the renderer

A single exported helper takes the recorded array and returns the array to render as pills. It is
deterministic, has no React dependency, and is where all three exclusion rules and the empty-fallback live.

The renderer stays `TagsCellRenderer` unchanged; the column's `cellRendererParams` calls the helper.

*Why:* the exclusion rules are the part most likely to be wrong and most in need of tests — the 69/14/2 split
in the proposal is a claim that should be pinned by cases, not by manual inspection. A pure function makes
each rule a one-line test. *Alternative rejected:* a bespoke `ModelsCellRenderer` holding the rules, which
would put branch-heavy logic behind a rendering test and duplicate the overflow measurement already solved.

### Substring containment is scoped to one conversation's own values

The wrapping rule compares each value only against the other values of the same row, never against a global
list of known router names.

*Why:* a deployment name is only evidence of wrapping relative to what it wrapped in that conversation. A
global list would need maintaining and would misfire on unrelated deployments that happen to share a name
fragment. *Alternative rejected:* a name-pattern list of known router prefixes, which encodes one
deployment's naming convention into the frontend and rots the moment someone adds a router named differently.

### Application and toolset detection uses the resource-path prefix, not a name pattern

`applications/…` and `toolsets/…` are DIAL resource paths, so the prefix is structural rather than a
guess — unlike orchestrator detection, which has no structural signal in the array.

*Why:* it is exact for those two kinds, which is why the spec states them as certainties and the substring
rule as an approximation. The three rules deliberately do not carry equal confidence, and the code should not
present them as if they did.

### Fallback returns the recorded array, not an empty cell or a marker

When narrowing removes everything (2% of conversations: application-only or embedding-only), the column
renders the unnarrowed values.

*Why:* those conversations genuinely were served by an application; naming it is more useful than an em dash
that implies nothing is recorded. *Alternative rejected:* the unavailable marker, which would collide with the
meaning the same marker carries for duration in this change — there it means "the backend did not measure
this", and reusing it for "we filtered everything out" would make one symbol mean two different things in
adjacent columns.

### Duration formatting is a util alongside the existing cost and count formatters

`conversation-formatting.ts` already owns the grid's value formatting; duration joins it, including the
zero-to-marker rule so grid and detail panel cannot diverge.

*Why:* the spec requires both surfaces to state the same thing about the same conversation, which is only
guaranteed if one function decides it.

### Duration is sortable and filterable; models is neither

Duration follows the numeric curated columns exactly (`numericColumn`, `baseNumberFilter`, entries in
`SORTABLE_CONVERSATION_FIELDS` / `FILTERABLE_CONVERSATION_FIELDS` / `CONVERSATION_FIELD_VALUE_TYPE`).

The models column sets `sortable: false` and `filter: false` explicitly rather than relying on omission from
those lists. `translateConversationSortModel` and `translateConversationFilterModel` already drop unlisted
fields, so an accidental sort would be silently discarded — a header that offers an affordance which does
nothing is worse than one that offers none.

### Keyboard access to the overflowed values

`tooltipValueGetter` is pointer-driven, so the `+N` values would otherwise be mouse-only, which
`.claude/rules/a11y.md` rules out for a hover-only affordance.

`DialEllipsisTooltip` does not fit despite being the repo's usual answer: it wraps single-line text truncated
by CSS and only opens when that text overflows, whereas this cell truncates a row of pills by JS measurement.
The pattern that does fit is the same rule's grouping guidance — a `role="group"` container whose `aria-label`
carries the conversation's complete recorded list. An AG Grid cell takes keyboard focus, so focusing it
announces every value including the ones the narrowing dropped, with no pointer and no second tooltip
mechanism.

*Note:* the existing `TOPICS_COLUMN` columns have the same gap. This change fixes it for the new column and
does not retrofit the others.

## Risks / Trade-offs

- **The narrowing is wrong on ~14% of conversations** (an orchestrator with no shared name fragment survives
  into the pills) → the spec states this as intended behaviour rather than a defect, the tooltip keeps the
  full record visible, and the exact fix (a `parent_deployments` rollup measure) is recorded in the proposal
  as a follow-up.
- **A future deployment naming convention breaks the substring rule** → the rule is one pure function with
  its own tests; replacing it does not touch the column, the query, or the renderer.
- **`deployments` widens the projection for every page fetch** → it is a small string array on a rollup row,
  and the alternative (fetching on demand) would force a paging restart the moment the column is shown.
- **`turn_count` semantics changed under the existing spec** → the backend now counts distinct traces, so the
  Turns tooltip in `en.ts` currently misdescribes the column. Corrected here because the MODIFIED requirement
  would otherwise carry a statement known to be false; the copy fix is a task.
- **Zero-duration rows dominate today** (1895 of 1999 locally) → they render as the unavailable marker, so the
  column looks sparse until enough post-2026-08-12 data accumulates. This is correct, not a defect, and
  resolves itself.
