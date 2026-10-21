## Context

See `proposal.md` — Why. What shapes the approach is the surrounding machinery, which already answers most of
this change's hard questions:

- `buildConversationSpansQuery` carries a literal list of hop-log columns. Safe today only because none of
  them is flagged sensitive — the service drops a sensitive column from its query model entirely, so naming
  one rejects the whole query as an unknown field, which would cost the reader the span tree.
- The conversations-trace server action already fetches the hop-log entity schema through
  `withEntitySchemaCache` to resolve the body grant, so the schema is a read the page performs regardless.
- `hopBodyFields` is the working precedent for resolving a projection against that schema by column name.
- The schema carries everything a grouped presentation needs: `display_name`, `description`, `type`, `tag`,
  plus the entity's own tag order, and the `heavy` flag that marks the body columns.
- `ConversationTermList` is the rail's one label-and-value register, with `FieldCaveat` already wired to a
  schema-supplied description; `FullscreenViewer` is already a popup around Monaco with a copy control.

## Goals / Non-Goals

**Goals:**

- One source of truth for which fields exist: the fetched schema, resolved once into both the projection and
  the group descriptions.
- A rail whose structure is stable across a change of selected span, while its content follows the span.
- No new read, no new component in `Common/`, no new props on a shared component.

**Non-Goals:**

- Reworking the bodies section, the tree or the trace header. Only the rail's content and its labels change.
- A general-purpose "entity record viewer". The resolver is specific to the hop log's span row; the query
  builder keeps its own field-grouping helpers.

## Decisions

### The schema widens a base projection rather than replacing it

The span read projects `base ∪ (schema fields − heavy − base)`, where `base` is the current literal list.

Alternatives considered: (a) pure schema-driven projection — rejected because a failed schema read would then
yield an empty projection and cost the reader the whole tree, for a failure that has nothing to do with the
spans; (b) keep the literal list and append only a hand-picked set of new columns — rejected because it
reintroduces the maintenance the change exists to remove, and it cannot present a column this frontend has
never heard of.

The base list carries an invariant worth a test of its own: **every column in it must be one the service
publishes to any caller**. A sensitive column added to it would break the read for every non-administrator,
and the failure would be invisible on a local stack, where the sensitive gate fails open by design
(`security.mode=none`).

### Sensitive columns are presented where the service returned them

The rail and the JSON dump state `request_tags`, `jwt_claims`, `user_email` and the two JWT name claims
whenever the fetched schema carries them — that is, for a full administrator. Accepted by the owner: the
trace pages are administrator surfaces, and an administrator can read the same columns with a query.

The frontend still performs no access check of its own — which columns exist remains the schema's answer.

The sibling `isOfferable` in the same file does filter `!field.sensitive` for the conversations grid, which
reads like a contradiction until you check the schema: `sessions` flags no column sensitive, so that filter
withholds nothing today and is a guard rather than a policy the rail departs from. The personal data lives in
the hop log alone.

### The resolver is one pure function beside `hopBodyFields`

`conversation-column-catalog.ts` gains a span-field resolver taking the schema's fields and returning the
projection plus an ordered list of group descriptors, each carrying its tag, its fields' published names,
labels and descriptions, and its field types. One function, because the projection and the grouping must not
be able to disagree about which fields exist: two resolvers would be two answers, and the header count sits
on top of both.

Matching is by column name as `hopBodyFields` does it, so a bare column and the same column published
qualified by an enrichment resolve the same way.

The query builder's own `tagOf` helper is left where it is. Two call sites is not the rule of three, and
pulling it into shared ground would touch a feature this change has no business in.

### Emptiness is one predicate, used by both the count and the row

A single pure predicate decides whether a field has a value, and both the preview and the row rendering call
it — a row deciding it by an empty formatted string states a metered zero as `0`. `null`, an empty string and an empty array are empty. **A reported zero is empty only for
the metered tags** — token usage, cost and performance — where a core predating a column stores zero for
"not reported"; the same zero on a request-message count is a real count. Duration is among them because a
hop that reports no duration stores the same zero, and `formatHopDuration` already treats it that way. Tying that exception to the tag rather than to a
list of column names keeps it true for a metered column this frontend has not seen yet.

Value formatting is a second pure function keyed by the schema's `type`, with the field's tag as a second
input so a cost column reads through `formatSignificantCost` rather than as a plain number: timestamp to the local instant with
sub-second precision, array joined, decimal and integer through the existing number formatters. Both live in
`utils/analytics/` with unit tests, per `utils.md`.

### Group state lives in the rail, and is chosen-versus-active

`ConversationSpanDetail` is not remounted when the selection changes — `ConversationTraceView` renders it
with a changed `node` prop — so a `useState` in the rail survives the change, and the requirement that the
open group persists costs nothing structural.

The hook follows `useSpanBodyTabs`: it holds what the reader last chose and derives what is actually open,
so a chosen tag the current schema no longer reports degrades to nothing open rather than to a group that
cannot be found. This is the same chosen-versus-active split the bodies tabs use, for the same reason.

### Presentation reuses what exists

- Group container: a disclosure of its own — button with `aria-expanded` / `aria-controls` over a
  `role="region"` — carrying a caret and the group's name, in the same muted register as the rows below it.
  Not ui-kit's `Accordion`: it renders `title` inside a `truncate` span under an `overflow-hidden` container,
  so anything but a bare string is clipped rather than laid out, and its framed card per group reads as
  thirteen unrelated things where the question is one.
- The section is one bounded flex column, so **every group carries `shrink-0`**. Without it a group gives up
  its height and its open content collapses to nothing while the header stays — how this first shipped, and
  invisible to jsdom, which is why a CSS-level test guards it.
- Rows: one register for the whole rail — `SpanFactRow`, a label over its value with a rule beneath — used
  by the facts above the groups and by the fields inside them. Not `ConversationTermList`: its label-beside-
  value row clamps to one line, and most of what the hop log records is a long identifier, an endpoint or a
  routing path. The schema's `description` is not rendered, so the resolver does not carry it.
- JSON: `FullscreenViewer` as published — ui-kit `DialPopup` (generation 1.0) around Monaco with a
  `CopyButton` — titled by the span's own label. A popup of our own on `Popup` (generation 2.0) was tried
  first, to carry a note about the bodies in its frame; it rendered light-on-light with a zero-height editor,
  because part of the 2.0 palette is undefined by the themes service and falls back to a light one. The note
  was dropped rather than reinstated elsewhere: the dump holding only recorded columns is the requirement,
  and the bodies section is one tab strip away.
- The note that the bodies are presented elsewhere goes in the popup's own frame, never as a key in the JSON
  — the dump is pasted into tickets and queries, where an invented key is a defect.

### Labels

The rail stops reusing `TraceTokens` / `TraceCost`. New keys name the span's own figures, and the group
headers get their own key set with a fallback to the raw tag for a tag this release has never seen — the one
place the frontend holds knowledge about tags, and the fallback is what keeps it from going stale silently.
The groups carry no heading of their own above them: the panel's position under the rail's own facts is what
says what it holds, and a fourth label there was a line of chrome per span.

## Risks / Trade-offs

- **A wide instance makes the span read wider** → The projection excludes heavy columns, which is exactly the
  set the service itself leaves out of a wildcard projection; what remains is scalar columns whose cost is row
  width, not extra requests.
- **The sensitive gate fails open locally** → A non-administrator's experience cannot be reproduced on a local
  stack with security disabled. Mitigation: a unit test on the resolver with a schema that omits the sensitive
  columns, plus the base-list invariant test; neither depends on a running service.
- **Thirteen group headers is a long rail on a narrow viewport** → Single-expand keeps the open content to one
  group, and the headers are one line each. If it still reads long, the ordering — schema tag order first —
  puts identity and principal before provenance and system.
- **A group that is always empty on this instance is still listed** → Accepted: the set of groups follows the
  schema so the rail's structure does not move under the reader, and the count states the emptiness in one
  glance rather than in a column of dashes.
- **`FullscreenViewer` hardcodes its portal id** and the bodies section already mounts one through
  `CodeViewer` → Unverified whether two mounted instances sharing that id interfere; only one can be open at a
  time, so the exposure is at mount. Check during implementation and, if it bites, mount the rail's popup
  only while open.
