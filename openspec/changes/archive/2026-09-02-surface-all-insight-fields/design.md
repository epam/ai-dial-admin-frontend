## Context

See proposal.md — Why. Two constraints shape the approach, both already present in the code:

- The detail route **already fetches the `sessions` entity schema** on page open, and already passes what
  it reports into the detail query builder so an instance carrying an older field set is not sent a name it
  does not have. The field descriptors the panel needs — display name, description, declared type — are in
  that same response and are currently discarded, only the names being kept.
- The conversations grid **already derives a column's header from the schema** (`columnHeaderName` in
  `conversation-column-catalog.ts`): `display_name`, falling back to the field name in readable words with
  the enrichment namespace dropped. Labelling a schema-discovered field is therefore a solved problem in
  this codebase, not a new one this change has to invent.

## Goals / Non-Goals

**Goals:**

- One source of truth for "which insight fields exist" — the fetched schema — read once, on the server.
- The panel's field list, its labels, its hints and its value formatting all derive from that one source,
  so they cannot disagree with each other or with the grid's catalog.

**Non-Goals:**

- No second schema fetch on the client. The page has the schema; the client gets a reduced, serializable
  form of it.
- No per-field styling, ordering or grouping rules for the newly surfaced fields. Schema order, one
  register. Anything richer is a later change with a design of its own.
- No caching, batching or query-shape change beyond the added column names.

## Decisions

### 1. The insight field set is reduced on the server, into a descriptor list

The route already holds `AnalyticsEntitySchema`. A pure util reduces it to
`ConversationInsightField[]` — `{ name, label, hint?, type }` — filtering to the enrichment namespace and
dropping what the panel cannot render as a value — a column the schema types as an object or an array. A
sensitive column needs no test here: the query's own rule already forbids naming one. Neither kind exists in
this enrichment today, so both are guards rather than active filters. That list is passed to the client tree
as an ordinary prop.

Alternatives considered:

- **Enumerate the row's own `session_insights.*` keys in the panel.** Needs no plumbing at all and is
  self-consistent with what was fetched. Rejected: it yields a name and a value and nothing else — no
  display name, no description for the hint, and no declared type, so closed-vocabulary values could not be
  rendered as words and every label would be a raw column name.
- **Fetch the schema again from the client.** Rejected: a second round trip for data already in hand, and
  a second cache to reason about.

The descriptor's `label` comes from the existing `columnHeaderName`, reused rather than reimplemented, so a
field's label in the panel and its header in the grid catalog cannot drift apart.

### 2. Labels and hints come from the schema, not from an i18n key

This is a deliberate, precedented exception to §10 of `components.md` ("all user-facing strings go through
next-international"). The rule is about text **this frontend authors**; a schema-reported display name is
**data**, and the whole point of the change is that a field the frontend has never heard of still renders
correctly. The grid's derived columns already take their headers this way. The panel's own chrome — its
heading, its absence statements, the unavailable marker — stays on i18n keys.

Consequence for tests: component specs assert schema-supplied label text directly, not an i18n key, because
`t()` is not involved. The panel's own chrome keeps being asserted by key, as everywhere else.

### 3. Value formatting follows the declared type, never the field name

- `timestamp` / `date` → the shared local date-time formatter, the same one the metadata panel uses.
- `enum` → readable words, via the same `readableWords` the badges already use.
- everything else → the recorded value as text.

A field newly typed by the service is formatted correctly with no frontend change, which is the same
principle the log's column catalog already follows for filters and cell types.

A value in a field the schema types as a plain `string` is **not** rewritten, even when it looks like a
machine token (`bug_fixing`). Rewriting on value shape rather than declared type would be a heuristic that
silently edits legitimate values — a file name, an identifier, a model name — and the honest rendering of a
plain string is what the record holds. The evaluator's own descriptions are carried as hints, so a reader
who needs the vocabulary has it.

### 4. One register, plus prose for the summary

Every field the descriptor list carries renders as a labelled value row, in schema order. Two exceptions,
and only two:

- the **summary** renders as prose with no label of its own. It is several sentences and the schema declares
  no length for it (measured on dev: 513 characters at the longest, 191 on average), so a label-and-value
  row is the wrong shape for it. It is addressed by name, deliberately;
- the **title** is not rendered at all, being the view's heading.

The **badges are removed**. Sentiment and resolution status rendered as coloured badges because those two
were the only closed-vocabulary fields the panel knew about. Once the field set is discovered rather than
enumerated that stops being true — the enrichment exposes closed-vocabulary fields for risk, scope, activity
and more — and styling two of them would mark every other one, and every one added later, as a lesser kind
of value for no reason the record supports. `SENTIMENT_BADGE_CLASS`, `RESOLUTION_BADGE_CLASS`,
`INSIGHT_BADGE_NEUTRAL_CLASS` and their two helpers go with them.

What the badges carried that is worth keeping is the *readable words* transform, and that survives on its
own terms: it now follows the schema's declared type, so every closed-vocabulary field gets it rather than
the two that had a colour map.

Values render in full and wrap rather than being clipped, because nothing bounds a field's length — the
60-word summary is an instruction in the evaluator's prompt, not a constraint on the column.

A descriptor whose value the record does not carry is skipped. The enrichment keeps superseded columns and
nulls them on rows a later evaluator labelled, so without this the panel fills with blank rows whose only
meaning is "this row is newer than that column" — the same noise the existing unavailable-marker rule
already refuses for an unevaluated conversation.

### 5. The panel's own presence is decided over the namespace, not over the title

`conversationInsightsState` currently keys on `session_insights.title`: absent key → the instance has no
enrichment, null or blank → not evaluated, otherwise → available. That is the last binding in the feature
that can *hide* data rather than merely style it — an instance whose enrichment stops reporting a title
would lose the whole panel, and a row whose title alone is blank is reported as one the evaluator never
reached.

It becomes a test over the descriptor list instead: no descriptor carries a key on the record →
unavailable; every descriptor's value is null or blank → not evaluated; otherwise available. The three
states and their two distinct statements are unchanged; only what decides between them is.

### 6. The descriptor list is threaded as a prop, not a context

`ConversationDetailView` → `ConversationDetailBody` → `ConversationDetailRail` → panel. Three hops, the
same way `bodyGrants` and `nowMs` already travel.

A context was considered and rejected: one consumer, a value that never changes for the life of the page,
and `ConversationDetailRail` is `memo`'d — a provider would add indirection without removing any. The array
is constructed **on the server** and only passed through client renders, so its identity is stable and the
memo keeps holding; nothing may rebuild it inside a client component.

### 7. What stops being a source of truth

`CONVERSATION_INSIGHT_FIELDS`, `resolveInsightFields` and the `ResolvedInsightFields` shape exist only to
feed this panel and are removed with it.

The insight entries of `ConversationsField` and
`DETAIL_INSIGHT_FIELDS` **stay**: they keep those columns in the detail query's *optional* set, which is
what stops the query naming a column an older instance does not report. They simply stop being the panel's
field list. `InsightTitle`, `InsightSummary` and `InsightTopics` also stay as named references — the
grid's identity column, the detail heading, the panel's prose register and the grid's topics filter each
read one by name.
`InsightSentiment` and `InsightResolutionStatus` lose their last named readers with the badges.

### 8. One row register, shared, rather than two panels styled alike

Rewriting the insights panel gave the rail a second row treatment: the metadata panel had monospace labels
and values separated by rules, the new insights rows had neither. Two lists of the same record's fields then
read as two kinds of surface, and the distinction the panels actually need — which source a group of values
came from — is already carried by the heading and the provenance colour.

The metadata panel adopts the insights treatment rather than the reverse. Monospace is a claim this feature
makes deliberately elsewhere: a catalog identifier naming an entity the page queried. A conversation id or a
user hash is a value of the record, not a name in the catalog, so rendering it in the identifier's type
blurs the one distinction the provenance rules exist to keep.

The register lives in `ConversationTermList` rather than in a shared class string, so the two panels cannot
drift apart under a later edit to one of them. `ConversationTerm.value` is a node, not a string, because a
metadata field's absence is presented differently from its content — the unavailable marker and the empty
marker are markup, and the insights panel, which omits an unvalued field outright, simply never passes one.

The metadata values stop being clamped to a tooltip. Wrapping is what the insights panel does because no
insight field declares a length bound; it is also the better answer for an identifier, which a reader wants
to select and copy rather than hover. The usage panel keeps its clamp — its figures are short and share a
row with a second column — which is now an explicit `isClamped` on `FieldValue` rather than an implication
of the layout.

## Risks / Trade-offs

- **A bad `display_name` from the service renders as-is.** → The fallback covers an *absent* one; a wrong
  one is the service's to fix, and the alternative — a frontend translation table — is exactly the thing
  that cannot follow the enrichment. Accepted, and the same trade-off the grid catalog already made.
- **The panel gets long.** The enrichment currently exposes roughly twice what the panel showed, and every
  populated field now renders. → Skipping unvalued fields removes most of it; the rail already scrolls. No
  cap is introduced, because a silent cap on a panel whose point is completeness would be the same defect in
  a new place.
- **A schema read that fails leaves the panel with no fields.** → Unchanged from today: with no schema the
  query names no insight column at all, the title comes back absent, and the view already states that the
  enrichment is unavailable rather than rendering an empty panel. Worth a test, not a mechanism.
- **Removing `resolveInsightFields` breaks its unit spec and the panel's spec.** → Both are rewritten
  against the new shape in the same change; neither has an external consumer.
- **Bookkeeping fields on screen could be read as a caveat on the title.** → They render in the panel's
  value register, and the header's rule against qualifying a title is restated in the spec delta so the two
  cannot be conflated later.
- **A wrapped trace id costs a second line in a 360px rail.** → Two lines of a value the reader came for,
  against one line ending in an ellipsis they cannot select. The rail already scrolls, and the fields that
  wrap are the few long ones rather than the whole panel. Accepted.
