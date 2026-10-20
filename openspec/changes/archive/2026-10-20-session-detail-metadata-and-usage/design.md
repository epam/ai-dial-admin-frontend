## Context

See proposal.md for motivation. The session detail rail is `SessionDetailRail.tsx`: Insights, then the
panels of `SESSION_DETAIL_PANELS` (Usage, Metadata) through `SessionFieldRows`, then Feedback. The Usage and
Metadata panels are curated lists of `SessionsField` columns resolved by `resolveSessionField`. The span rail
beside the transcript already does what the Metadata panel should: `spanFields()` turns the entity schema into
tag groups and a projection, `SpanFieldsSection` / `SpanGroupPanel` render one open group at a time, and
`SessionSpanDetail` opens the record in the shared viewer with `ViewerContentType.Json`.

`buildSessionDetailQuery` projects `Object.values(SessionsField)` filtered by `availableSelectFields`, plus the
insight columns discovered from the schema. `getSessionDetail` already receives `schemaFields`. The `sessions`
schema marks `traces` as heavy and tags its columns `identity`, `client`, `principal`, `response`,
`token-usage`, `cost`, `performance`, `deployment`, `insight`, `risk` and `system`. It reports
`cached_prompt_tokens`, `cache_creation_tokens` and `reasoning_tokens` beside prompt and completion tokens.

## Goals / Non-Goals

**Goals:**

- One schema-to-groups derivation serving both rails, so a tag or field rule is stated once.
- Metadata groups, copy and the JSON dump without a new read and without new props on shared `Common/*`
  components.

**Non-Goals:**

- Replacing the span rail's row component or its group behaviour.
- Making the detail projection unbounded: heavy columns stay out.

## Decisions

**1. Generalise the schema-to-groups step; do not copy it.** `spanFields()` mixes two jobs: the group
derivation (skip heavy and unreadable fields, bucket by tag, label by `columnHeaderName`) and the span-specific
base projection. Extract the first into a function both callers use; `spanFields()` keeps its base-list
fallback on top of it, and a new `sessionFields()` does the same for `sessions`. _Alternative:_ a second copy
for sessions. Rejected: two copies of the tag rules drift, and the schema's tags are the contract.

**2. The detail query projects the curated list and then what the schema reports beyond it.** On a failed
schema read the query keeps today's required set, as `spanFields()` does with `SPAN_BASE_FIELDS`, so the page
costs the groups and not the session. The extra names come from `sessionFields()`: every reported column that is
not `heavy` and not an insight column. `sensitive` is deliberately not a test: the service removes a sensitive
column from the schema for a caller without the elevated role, so a column that arrived is one this caller may
read, and the selection is built from that same schema. The existing single-session requirement forbade naming a
sensitive column outright; it is modified to name one only where the schema reports it, the rule the log's
column picker already follows. `heavy` is excluded because the read is one row and those are the expensive
columns; `traces`, which is heavy, is read regardless because the panel states it. _Alternative:_ keep
sensitive columns out. Rejected: it hid the user's email and name from the roles entitled to them. The cost is
that the dump, which gets pasted into tickets, carries them for those roles.

**3. The Metadata panel is the span rail's field groups, rendered by the span rail's own component.**
`SpanFieldsSection` (and through it `SpanGroupPanel`) is used as it is, inside the Metadata panel, so the two
rails share one control and one row. Its row type widens from a span row to any record, and it takes an optional
`isRecord` and a map of the column each closed group previews (`SESSION_GROUP_SUMMARY_FIELD`: the hop log's
choices plus the caller group previewing the user name), which the session passes. The panel sits in `SessionDetailPanel` with `isFramed={false}` while groups
exist, because `SpanFieldsSection` draws its own frame and two would nest. _Alternatives:_ rows in the
label-and-value register on a disclosure shared with the span rail (tried first: a second, different-looking copy
of a control the span rail already has); keeping the curated rows above the groups (tried next: every Metadata
value was stated twice). The span-rail rows wrap and are monospace, which the insights panel's register forbids,
so the panel is deliberately not a row panel and the spec says so.

**4. The Metadata rows are gone; their fields are in their groups, and nothing else is withheld.** Session id,
first activity and trace ids sit under identity, project and user under principal, successful turns under
response, deployments under deployment. The groups omit only the insight columns, which the insights panel
presents, and the record states a column the Usage panel shows in headline form again in full, because the
headline rounds it (`2.2 M`) and one of the figures, the cached count, appears there only as a share. The
alternative, deduplicating against the panels, hid exact values and was dropped. Where this view names a column
more exactly than the catalog does, `SESSION_FIELD_LABEL_KEY` overrides the label — the successful-turns row
must say that one successful hop is enough. `traces` is catalogued heavy and is read regardless, because the
panel states it. The span rail's rule that a zero in a metered column means "not reported" is the hop log's, so
the session's rows turn it off (`isRecord`): a rollup's zero is a sum.

**5. Cache hit is a derived figure with its own resolution path.** `resolveSessionField` formats one column. The
cache hit divides two, so it gets a dedicated field format that reads `cached_prompt_tokens` and
`prompt_tokens`, returns `Unavailable` when either is null or the prompt count is not positive, and `0%` only
for a reported zero. `CachedPromptTokens` joins `SessionsField` and `OPTIONAL_DETAIL_SELECT_FIELDS`, so an
instance without the column drops it from the select instead of failing the query, and the figure reads as
unavailable. The percentage is rounded to a whole number below 100 and shown with one decimal under 10%, so a
small share does not read as `0%`; the zero case is exact.

**6. Copy is a control on every group row.** `SpanFactRow` takes an optional `copyText` and renders the repo's
`Common/CopyButton` beside the value, which names its control from the row label and confirms through the
notification container (`.claude/rules/a11y.md` counts it as the live region). The text copied is the formatted
value, not the clamped display, with list values joined by a comma and a space. Only the session's panel passes
`isRecord`, so the span rail is unchanged.

**7. The dump is the detail row, verbatim.** `SessionDetailRow` is already in memory, so the JSON control opens
`ViewerContentType.Json` with `JSON.stringify(session)` the way `SessionSpanDetail` does. No key is added, no
field is filtered, and no query is issued.

**8. The card start uses the existing date-time formatter.** `formatDateTimeToLocalString` already exists beside
`formatTimeToLocalString`; the card swaps one call. The unavailable marker path is unchanged.

## Risks / Trade-offs

[A schema with many columns makes the Metadata panel long] → Groups are collapsed with one open at a time, and
the rail already scrolls; the panel's summary line per closed group keeps it scannable.

[Projecting the whole schema widens the detail read] → Heavy columns are excluded, the read is one row, and the
span read already does this per trace.

[A group and a curated panel state the same figure with different formatting] → Decision 4 omits what the Usage
panel and the insights panel state; the dump is the only place both appear.

[A role-gated field appears for one reader and not another] → Intended: the schema filters by role and the
view does not infer presence.

[A tag with no label shows the schema's raw spelling] → Accepted, as on the span rail; a label is added to the
tag-label map when a tag matters.

## Open Questions

- Whether the card should show the date on every card or only when it differs from the previous card. The spec
  requires a date on each card; a later change can collapse repeats without changing the requirement.
