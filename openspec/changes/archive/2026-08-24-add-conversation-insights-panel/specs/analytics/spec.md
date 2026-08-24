## MODIFIED Requirements

### Requirement: Single-conversation query over the conversations entity

The system SHALL provide a query builder returning a `StructuredQuery` over the entity `conversations` in
**row mode**, narrowed to exactly one `chat_id` by equality, requesting a single row.

The query SHALL select every stored column of the conversation rollup **the fetched schema reports**, so the
detail view reads the full available record rather than the subset the log's grid needs. Every selected
column SHALL be **named explicitly**. A column the service marks `heavy` is excluded from a default
projection, so a query that relied on the default would silently return no value for it; `traces` is such a
column, and the detail view renders it.

The query SHALL take the available field names from the caller rather than enumerating a field list of its
own, per "A conversation query names only fields the entity's schema reports". The columns the view has
always read are required; every column added since — `traces`, the cache, cached-prompt and reasoning token
counts, the chain cost, and the insight columns — is optional. With no schema available the query SHALL name
the required set alone.

The insight enrichment's **descriptive** fields SHALL all be named where the schema reports them, not a
subset of them: the conversation's title, its summary, its sentiment and sentiment score, its topic and
topics, its language and its resolution status. A descriptive insight field the query does not name is a
field the detail view cannot render at all, and the reader has no way to tell that from a conversation the
evaluator never reached. The enrichment's `provenance`-tagged fields are not covered by this rule — they
are the evaluation's own bookkeeping, and only `truncated` is read, to state the heading's caveat.

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

- **WHEN** the single-conversation query is built for a conversation id
- **THEN** it queries the `conversations` entity in row mode
- **AND** it filters on that id by equality and requests one row

#### Scenario: The heavy trace column is named explicitly

- **WHEN** the single-conversation query is built
- **THEN** its select names `traces`
- **AND** the projection is explicit rather than a default or wildcard projection

#### Scenario: The insight columns are selected

- **WHEN** the single-conversation query is built and the schema reports the insight columns
- **THEN** its select names `conversation_insights.title`
- **AND** it names the summary, sentiment, sentiment score, topic, topics, language and resolution status
- **AND** it names `conversation_insights.truncated`

#### Scenario: A descriptive insight field the schema omits is not named

- **WHEN** the schema reports the insight enrichment but does not report its resolution status
- **THEN** the select names the descriptive insight fields the schema does report
- **AND** it does not name `conversation_insights.resolution_status`
- **AND** the query returns a row

#### Scenario: An instance without the enrichment still resolves a conversation

- **WHEN** the single-conversation query is built and the schema reports no insight column
- **THEN** its select names none of them
- **AND** it names the conversation's own stored columns
- **AND** the detail view renders

#### Scenario: The query carries no time bound

- **WHEN** the single-conversation query is built
- **THEN** it contains no predicate over `first_request_time` or `last_request_time`

#### Scenario: A conversation outside the log's period still resolves

- **WHEN** a conversation whose last activity precedes the log's selected period is opened
- **THEN** its detail view renders that conversation's values

#### Scenario: No sensitive column is requested

- **WHEN** the single-conversation query is built
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
enrichment-derived field still reads `conversations`, and naming the enrichment would present an internal
composition of the entity as a separate thing the view queried.

This is one half of a rule the whole feature follows, and the two halves SHALL NOT be conflated:

- A **catalog identifier**, rendered in monospace, claims **the entity the page queried**. It SHALL name
  `conversations` or the entity the conversation's ratings are read from, and SHALL NEVER name an
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

The **insights panel** SHALL present the conversation's insight enrichment: its summary, its sentiment, its
resolution status, its topic and topics, and its language. It SHALL take the **insight** provenance colour
and SHALL name `conversations` as its source, per the rule above. It MUST NOT restate the conversation's
title, which is the view's heading.

The insights panel SHALL render **only where the conversation carries an insight row**. Where it does not,
the view SHALL state in the panel's place, in text, that the conversation has not been evaluated — and MUST
NOT render the panel with its fields marked unavailable. The enrichment runs per conversation and reaches a
minority of them, so a panel of unavailable markers would be the common case rather than the exception, and
it would state a shape the record does not have. The statement SHALL distinguish *not yet evaluated* from
*this instance carries no insight enrichment at all*: the first is a conversation the evaluator has not
reached, the second is a capability the deployment does not have, and a reader cannot act on the two the
same way.

The panel's summary SHALL render as prose rather than as a label-and-value row: it is two or three sentences
describing what happened, and a value slot sized for a figure would truncate it. The two fields whose values
form a closed vocabulary — sentiment and resolution status — SHALL render as badges, so the reader can scan
them rather than read them, and SHALL render their values as readable words rather than as the raw
underscored token the evaluator emits. A value the frontend holds no styling for SHALL render as a neutral
badge carrying that value's text, never dropped and never styled as though it were a recognised one: the
evaluator's vocabulary is declared on the service side and can gain a value without a frontend release.

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
- **THEN** the insights panel states its summary, sentiment, resolution status, topic, topics and language
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
- **THEN** it renders as a badge reading readable words rather than the underscored token

#### Scenario: An unrecognised vocabulary value still renders

- **WHEN** the insights panel renders a sentiment value the frontend holds no styling for
- **THEN** a neutral badge carrying that value's text renders
- **AND** the value is neither dropped nor styled as a recognised one

#### Scenario: The insights panel is coloured by the enrichment and identified by the entity

- **WHEN** the insights panel renders
- **THEN** its monospace source identifier names `conversations`
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
- **AND** none of them names `conversation_insights`

#### Scenario: No panel claims an enrichment

- **WHEN** the metadata panel renders a field the conversation-insight enrichment supplies
- **THEN** the panel still names `conversations` as its source
- **AND** no panel is labelled as enrichment-derived

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
