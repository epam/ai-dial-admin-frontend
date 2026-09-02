## MODIFIED Requirements

### Requirement: Single-conversation query over the conversations entity

The system SHALL provide a query builder returning a `StructuredQuery` over the entity `sessions` in
**row mode**, narrowed to exactly one `client_session_id` by equality, requesting a single row.

The query SHALL select every stored column of the session rollup **the fetched schema reports**, so the
detail view reads the full available record rather than the subset the log's grid needs. Every selected
column SHALL be **named explicitly**. A column the service marks `heavy` is excluded from a default
projection, so a query that relied on the default would silently return no value for it; `traces` is such a
column, and the detail view renders it.

The query SHALL take the schema's reported fields from the caller rather than enumerating a field list of
its own, per "A conversation query names only fields the entity's schema reports". The columns the view has
always read are required; every column added since — `traces`, the cache, cached-prompt and reasoning token
counts, the chain cost, and the insight columns — is optional. With no schema available the query SHALL name
the required set alone.

The query SHALL name **every** column the insight enrichment exposes, discovered from the enrichment
namespace the schema qualifies those columns with rather than from a field list held in the frontend. An
enumerated list cannot follow the enrichment: a column the evaluator gains is one the detail view cannot
render at all, and the reader has no way to tell that from a conversation the evaluator never reached. The
failure is worse than absence when a column is *superseded* — the enumerated pair keeps being named and
comes back null, while the pair that replaced it is never asked for, so the panel reports the evaluator as
silent on a conversation it labelled.

No column SHALL be withheld for the **kind** of column it is. The enrichment's own bookkeeping — which
evaluator produced a row, and from what input — was previously excluded as not describing the conversation,
and that exclusion is removed: those columns are what separate a conversation the current evaluator has not
reached from one it labelled and found nothing in, which no descriptive column can say about itself. The
rule's only test is the enrichment namespace, so no category of column has to be recognised for it to hold.

A column the enrichment exposes that the detail view cannot render as a value SHALL be excluded — one the
schema types as an object or an array. The exclusion SHALL be decided by what the schema reports about the
column rather than by its name, so a column newly typed is classified with no frontend change. A sensitive
column needs no separate treatment here: the rule against referencing one governs every column this query
names. The enrichment exposes no column of either kind today, so this is a guard against one being added
rather than a filter that removes anything.

The selected set SHALL include the rollup's enrichment columns where the schema reports them, whose exposed
names are qualified flat names containing a dot. The query SHALL send such a name whole rather than treating
the dot as a path.

The query MUST NOT carry a time bound. The log's list query bounds `last_request_time` to the selected
period, but a detail view is addressed by id and SHALL resolve regardless of which period the log was
showing — a deep link or a bookmark MUST NOT fail because a conversation falls outside the current window.

The query MUST NOT reference any column the analytics service marks sensitive. Sensitive columns are removed
from the query model for callers without the elevated role, so referencing one would fail as an unknown
field for those callers rather than being refused cleanly, making the whole view unavailable to them.

#### Scenario: The query is narrowed to one conversation by id

- **WHEN** the single-session query is built for a conversation id
- **THEN** it queries the `sessions` entity in row mode
- **AND** it filters on that id by equality and requests one row

#### Scenario: The heavy trace column is named explicitly

- **WHEN** the single-session query is built
- **THEN** its select names `traces`
- **AND** the projection is explicit rather than a default or wildcard projection

#### Scenario: The insight columns are selected

- **WHEN** the single-session query is built and the schema reports the insight columns
- **THEN** its select names `session_insights.title`
- **AND** it names every other column the schema reports under that enrichment namespace
- **AND** it names them whether or not the frontend has a definition for them

#### Scenario: An insight column the frontend has never heard of is still named

- **WHEN** the schema reports an insight column no frontend list enumerates
- **THEN** the select names it
- **AND** naming it required no change to a frontend field list

#### Scenario: No insight column is withheld for its category

- **WHEN** the schema reports insight columns the enrichment stamps for its own bookkeeping rather than to
  describe the conversation
- **THEN** the select names them like any other column of the namespace
- **AND** no category of insight column is excluded

#### Scenario: A descriptive insight field the schema omits is not named

- **WHEN** the schema reports the insight enrichment but does not report its resolution status
- **THEN** the select names the insight columns the schema does report
- **AND** it does not name `session_insights.resolution_status`
- **AND** the query returns a row

#### Scenario: A non-scalar insight column is excluded

- **WHEN** the schema reports an insight column typed as an array or an object
- **THEN** the select does not name it
- **AND** the exclusion follows the schema's own report rather than a list of column names

#### Scenario: An instance without the enrichment still resolves a conversation

- **WHEN** the single-session query is built and the schema reports no insight column
- **THEN** its select names none of them
- **AND** it names the conversation's own stored columns
- **AND** the detail view renders

#### Scenario: The query carries no time bound

- **WHEN** the single-session query is built
- **THEN** it contains no predicate over `first_request_time` or `last_request_time`

#### Scenario: A conversation outside the log's period still resolves

- **WHEN** a conversation whose last activity precedes the log's selected period is opened
- **THEN** its detail view renders that conversation's values

#### Scenario: No sensitive column is requested

- **WHEN** the single-session query is built
- **THEN** its selected columns include no column the analytics service marks sensitive

### Requirement: Conversation detail side panels and their provenance

The detail view SHALL present its supporting fields as labelled panels: the conversation's insights, token
and cost usage, feedback, and record metadata. Each panel SHALL carry an icon coloured by its source, so the
panels are distinguishable at a glance rather than by reading their headings.

Each panel SHALL name the entity it reads from, and MUST NOT overstate it. **Every** panel SHALL have a real
source: the view MUST NOT present a panel no queried entity populates, because a panel of nothing but
unavailable markers states a shape the system does not record.

A panel MUST NOT name an enrichment as its source. The analytics service exposes an enrichment's columns as
columns of the entity they enrich, and the view queries the entity — so a panel that reads an
enrichment-derived field still reads `sessions`, and naming the enrichment would present an internal
composition of the entity as a separate thing the view queried.

This is one half of a rule the whole feature follows, and the two halves SHALL NOT be conflated:

- A **catalog identifier**, rendered in monospace, claims **the entity the page queried**. It SHALL name
  `sessions` or the entity the conversation's ratings are read from, and SHALL NEVER name an
  enrichment — in a panel's source, in a page header's provenance line, or anywhere else an identifier
  appears. It is stated as the entity's role rather than as a fixed name so that the rule does not have to
  be restated when the rating source changes.
- A **readable origin label** claims **where a value came from**, which is a different question and decides
  whether an empty cell means "not recorded" or "not yet evaluated". It SHALL distinguish an enrichment from
  the rollup it decorates.

Where both registers describe the same origin they SHALL carry the same provenance colour, so an identifier
and a label for one source cannot appear to disagree. Where they describe **different** origins — a panel
reading an enrichment through the entity that exposes it — the two registers SHALL be free to differ: the
panel's identifier states the entity queried while its colour states the enrichment the values came from.
A panel's identifier and its colour are therefore two independent claims, and the view MUST NOT derive one
from the other. Deriving the colour from the identifier would paint an enrichment-sourced panel as the
rollup, which is the mis-attribution the two registers exist to prevent.

The **insights panel** SHALL present the conversation's insight enrichment. Which of its fields the panel
presents is fixed by the enrichment's own schema rather than enumerated here — see "The insights panel's
field set is derived from the enrichment's schema". It SHALL take the **insight** provenance colour and
SHALL name `sessions` as its source, per the rule above. It MUST NOT restate the conversation's title,
which is the view's heading.

The insights panel SHALL render **only where the conversation carries an insight row**. Where it does not,
the view SHALL state in the panel's place, in text, that the conversation has not been evaluated — and MUST
NOT render the panel with its fields marked unavailable. The enrichment runs per conversation and reaches a
minority of them, so a panel of unavailable markers would be the common case rather than the exception, and
it would state a shape the record does not have. The statement SHALL distinguish *not yet evaluated* from
*this instance carries no insight enrichment at all*: the first is a conversation the evaluator has not
reached, the second is a capability the deployment does not have, and a reader cannot act on the two the
same way.

The panel's summary SHALL render as prose rather than as a label-and-value row: it is several sentences
describing what happened, and the schema declares no bound on its length. It SHALL carry no label of its
own — the panel's heading already names what the panel is — and SHALL be omitted where the record carries no
value for it. This is the one field the panel presents in a register of its own.

No other field SHALL be singled out by a presentation of its own. A value whose vocabulary is closed renders
as readable words in the same value register as every other field, and the panel MUST NOT distinguish one
with a badge, a colour or a rank. The evaluator's vocabulary is declared on the service side and can gain a
value, and its fields are discovered rather than enumerated — so styling two of them would leave every other
closed-vocabulary field, and every one added later, looking like a lesser kind of value for no reason the
record supports.

The usage panel SHALL state prompt tokens, completion tokens, total tokens, total cost and the recorded
durations from the rollup, laid out as headline figures rather than a label-and-value list. Monetary values SHALL carry the emphasis
money carries elsewhere in the app, which is independent of the panel's source colour.

A panel field whose value cannot be read at face value SHALL carry a caveat stating why, and that caveat
SHALL be reachable by keyboard. A field label is not focusable, so a caveat attached to it by hover alone is
unreachable for a keyboard or screen-reader user; the caveat SHALL therefore be exposed through a focusable
control whose accessible name carries it. A `title` attribute alone does not satisfy this.

The recorded durations are two such fields. `duration_ms` sums a conversation's hop durations, and an outer
hop's duration already contains the hops it called, so a conversation whose turns fan out into chains reads
longer than the time it actually took. `avg_duration_ms` averages per **hop** rather than per turn, so it is
not the average turn. Each SHALL state its own caveat: the two figures are wrong in different ways, and one
shared note would misdescribe whichever it did not name. The view MUST NOT describe either as elapsed time.
This restates a caveat previously carried only by the conversations grid's Duration column, which no longer
exists — the figures remain on this panel, so the statement has to as well.

Every panel that presents label-and-value rows rather than headline figures SHALL render them in **one
register** — one type treatment, one row rhythm, one alignment — regardless of which source the values came
from. The rail's panels all list fields of the same record, so a treatment reserved for one of them states a
difference in kind the record does not have; the panels are already distinguished by their heading and their
provenance colour, which is what that distinction is for. Monospace in particular SHALL NOT appear in a
value: it is this feature's mark for a catalog identifier naming an entity the page queried, and a
conversation id, a user hash or a trace id is a value of the record rather than a name in the catalog.

A value in that register SHALL occupy **one line** whatever its length, and a value too long for its column
SHALL be clamped rather than allowed to reflow. Nothing bounds an insight value and most metadata values are
opaque identifiers, so a few long fields allowed to wrap would take most of a panel whose point is that every
field is visible at once — the row rhythm is what makes the list scannable. A clamped value's full content
SHALL remain reachable, on hover and through the trigger's accessible name; a `title` attribute alone does
not satisfy this. Clamping SHALL apply only where the value actually overflows, so a value that fits carries
no dead affordance.

The metadata panel SHALL state the conversation id, the anonymized user identifier, the project, the first
activity time, the successful-request count, the conversation's **trace ids** and the deployments that served
the conversation, all from the rollup. A field the rollup carries SHALL NOT be rendered as unavailable: the
panel states what the record holds, and marking a recorded field as absent misreports the data the view
already fetched.

The trace ids SHALL be read from the rollup's `traces`. Their order is the rollup's own — ascending by id,
not by turn — so the panel MUST NOT present them as a turn sequence or number them as turns. The panel MUST
NOT derive a turn count from the array's length: the length is not queryable and the array is subject to the
same bound as any projected value, so `turn_count` remains the count of record and the header remains where
it is stated.

The successful-request field's label SHALL state what `success_count` counts — a turn in which **at least one
hop** succeeded. Labelling it as an unqualified success count would read as "the turn succeeded", which is a
stronger claim than the rollup makes: a turn whose entry hop failed after a nested hop succeeded is counted.

Panel provenance colours SHALL come from theme tokens, and every provenance value the view can render SHALL
map to a colour, so a newly added source cannot render unstyled.

#### Scenario: Panels render with their sources named

- **WHEN** the detail view renders a conversation carrying an insight row
- **THEN** the insights, usage, feedback and metadata panels render
- **AND** each names the entity it reads from

#### Scenario: The usage panel reports real values

- **WHEN** a conversation has recorded token usage and cost
- **THEN** the usage panel states its prompt tokens, completion tokens, total tokens and total cost

#### Scenario: No panel is populated entirely by unavailable markers

- **WHEN** the detail view renders
- **THEN** every panel it renders has a real source entity

#### Scenario: The insights panel states the evaluator's reading

- **WHEN** a conversation carries an insight row
- **THEN** the insights panel states what the enrichment recorded for it
- **AND** it does not restate the conversation's title

#### Scenario: An unevaluated conversation gets a statement, not a panel of dashes

- **WHEN** the detail view renders a conversation the insight enrichment carries no row for
- **THEN** no insights panel renders
- **AND** the view states in text that the conversation has not been evaluated
- **AND** no insight field renders as an unavailable marker

#### Scenario: An instance without the enrichment says so distinctly

- **WHEN** the detail view renders on an instance whose schema reports no insight column
- **THEN** the view's statement distinguishes an absent enrichment from an unevaluated conversation

#### Scenario: A closed-vocabulary value renders as a readable badge

- **WHEN** the insights panel renders a resolution status of `partially_resolved`
- **THEN** it reads as readable words rather than the underscored token
- **AND** it renders in the same value register as every other field, with no badge of its own

#### Scenario: An unrecognised vocabulary value still renders

- **WHEN** the insights panel renders a sentiment value no frontend list enumerates
- **THEN** its text renders as recorded
- **AND** the value is neither dropped nor presented differently from a recognised one

#### Scenario: The insights panel is coloured by the enrichment and identified by the entity

- **WHEN** the insights panel renders
- **THEN** its monospace source identifier names `sessions`
- **AND** its icon carries the insight provenance colour rather than the rollup's

#### Scenario: A duration figure carries a keyboard-reachable caveat

- **WHEN** the usage panel renders a conversation's duration and average duration
- **THEN** each figure carries a caveat explaining what its value actually measures
- **AND** each caveat is reachable by keyboard and exposed to assistive technology
- **AND** neither figure is described as elapsed time

#### Scenario: An identifier never names an enrichment

- **WHEN** the detail view's panels and the log's provenance line render for an instance carrying the insight
  enrichment
- **THEN** every monospace catalog identifier names only an entity the page queries
- **AND** none of them names `session_insights`

#### Scenario: No panel claims an enrichment

- **WHEN** the metadata panel renders a field the conversation-insight enrichment supplies
- **THEN** the panel still names `sessions` as its source
- **AND** no panel is labelled as enrichment-derived

#### Scenario: The row panels share one value register

- **WHEN** the insights panel and the metadata panel both render label-and-value rows
- **THEN** the two present their rows in the same type treatment, row rhythm and alignment
- **AND** no value is rendered in monospace
- **AND** a value longer than its column is clamped to one line, with its full content reachable on hover
  and exposed to assistive technology

#### Scenario: The metadata panel marks what the rollup lacks

- **WHEN** the detail view renders
- **THEN** the metadata panel states the conversation id, user identifier, project, first activity,
  successful-request count, trace ids and the conversation's deployments
- **AND** it marks none of them as unavailable, because the rollup carries every field it lists

#### Scenario: Trace ids are not presented as a turn order

- **WHEN** a conversation's rollup records several trace ids
- **THEN** the metadata panel lists them without turn numbers or ordinal labels
- **AND** the panel states no turn count derived from how many it lists

#### Scenario: The successful-request label states what it counts

- **WHEN** the metadata panel renders
- **THEN** its successful-request label states that a turn counts when at least one of its hops succeeded

## ADDED Requirements

### Requirement: The insights panel's field set is derived from the enrichment's schema

The insights panel SHALL present **every** field of the insight enrichment that the fetched schema reports
and the record carries a value for — not an enumerated subset. The field set SHALL be derived from the
schema, so a field the enrichment gains renders with no frontend release and a field it drops stops
rendering with none either.

A field's label and its explanatory hint SHALL be taken from what the schema reports for that field — its
display name, falling back to its readable field name with the enrichment namespace dropped, and its
description. A field this frontend has never heard of must still be labelled and explained, and no
translation key can exist for one.

The enrichment's own **bookkeeping** fields SHALL be presented alongside its descriptive ones and in the
same register — no field is withheld for the kind of field it is. Which evaluator produced a row, and from
what input, is what tells a reader whether an empty descriptive field means *the evaluator found nothing* or
*this row predates that field*, which no descriptive field can say about itself. This does not reopen the
header's rule: the header SHALL still state a title exactly as recorded and MUST NOT qualify it with a
truncation caveat, per "Conversation detail header names the conversation and states its turn count". A
fact stated as a field in a panel is not a caveat attached to a heading.

Whether the conversation carries an insight row at all SHALL be decided over the enrichment's **namespace
as a whole**, never over one named field. A record carrying no key for any field of the namespace has not
been reached by the enrichment on this instance; a record carrying those keys with a value in none of them
has been reached and produced nothing. Keying that test on a single field would make the panel's existence
depend on that field continuing to exist, and would report a conversation whose one field happens to be
blank as one the evaluator never reached.

A value SHALL render **in full**, wrapping where it is long, rather than being clipped to a fixed value
slot. The enrichment's fields range from a two-letter code to several sentences and the schema declares no
length for any of them, so which values are short is not something the panel can be told in advance.

A field the record carries no value for SHALL be omitted rather than rendered as an empty row. The
enrichment retains superseded fields and leaves them null on rows a later evaluator labelled, so rendering
every reported field unconditionally would fill the panel with blanks whose only meaning is "produced by a
later version" — the same noise the panel's unavailable-marker rule already refuses.

A value of a field the schema types as a **closed vocabulary** SHALL render as readable words rather than as
the raw underscored token the evaluator emits. The rule follows the schema's declared type rather than a
list of field names, so a field newly typed as a closed vocabulary reads as words with no frontend change.

#### Scenario: A field the frontend has never heard of still renders

- **WHEN** the schema reports an insight field no frontend list enumerates and the record carries a value
  for it
- **THEN** the panel renders it as a labelled value
- **AND** rendering it required no change to a frontend field list

#### Scenario: A field's label and hint come from the schema

- **WHEN** the panel renders an insight field the schema reports a display name and a description for
- **THEN** the field's label is that display name
- **AND** its description is offered as a keyboard-reachable hint

#### Scenario: A field the schema names but does not describe is still labelled

- **WHEN** the schema reports an insight field with no display name
- **THEN** the panel labels it from its field name, in readable words, without the enrichment namespace

#### Scenario: The enrichment's bookkeeping is stated in the panel

- **WHEN** a conversation's insight row carries the enrichment's own bookkeeping fields alongside its
  descriptive ones
- **THEN** the insights panel states them in the same register as the rest
- **AND** the view's heading still states the title with no truncation caveat attached to it

#### Scenario: A long value renders in full rather than clipped

- **WHEN** the panel renders an insight field whose value runs long
- **THEN** the value renders in full, wrapping, rather than clipped to a value slot

#### Scenario: A superseded field left null is omitted, not rendered blank

- **WHEN** a conversation's insight row carries no value for a field the schema still reports
- **THEN** that field does not render in the panel
- **AND** no empty or unavailable row is rendered in its place

#### Scenario: The panel's presence is decided over the namespace, not one field

- **WHEN** a record carries values for the enrichment's fields but none for the one the view reads as its
  heading
- **THEN** the insights panel renders those fields
- **AND** the conversation is not reported as unevaluated

#### Scenario: A record carrying the namespace with no values reads as unevaluated

- **WHEN** a record carries the enrichment's field keys and a value in none of them
- **THEN** the view reports the conversation as not yet evaluated
- **AND** it does not report the enrichment as absent from the instance

#### Scenario: A closed-vocabulary value row reads as words

- **WHEN** the insights panel renders a value row for a field the schema types as a closed vocabulary
- **THEN** its value reads as readable words rather than the raw underscored token
