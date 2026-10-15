## MODIFIED Requirements

### Requirement: Session detail side panels and their provenance

The detail view SHALL present its supporting fields as labelled panels: the session's insights, token
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
  `sessions` or the entity the session's ratings are read from, and SHALL NEVER name an
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

The **insights panel** SHALL present the session's insight enrichment. Which of its fields the panel
presents is fixed by the enrichment's own schema rather than enumerated here — see "The insights panel's
field set is derived from the enrichment's schema". It SHALL take the **insight** provenance colour and
SHALL name `sessions` as its source, per the rule above. It MUST NOT restate the session's title,
which is the view's heading.

The insights panel SHALL render **only where the session carries an insight row**. Where it does not,
the view SHALL state in the panel's place, in text, that the session has not been evaluated — and MUST
NOT render the panel with its fields marked unavailable. The enrichment runs per session and reaches a
minority of them, so a panel of unavailable markers would be the common case rather than the exception, and
it would state a shape the record does not have. The statement SHALL distinguish _not yet evaluated_ from
_this instance carries no insight enrichment at all_: the first is a session the evaluator has not
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

The usage panel SHALL state prompt tokens, completion tokens, the cache hit, total cost and the recorded
durations from the rollup, laid out as headline figures rather than a label-and-value list. It SHALL NOT state
a total token count: the total is the sum of two figures the panel already states, and a reader tuning a
session acts on the split and on the cache share rather than on their sum. Monetary values SHALL carry the
emphasis money carries elsewhere in the app, which is independent of the panel's source colour.

**The cache hit SHALL be the share of the session's prompt tokens that the rollup records as served from the
prompt cache**, stated as a percentage. A session whose recorded cached count is zero against a positive prompt
count SHALL state `0%`, because a reported zero is a measurement: no cache hit. A session for which the rollup
reports no cached count, or no positive prompt count, SHALL state the figure as unavailable rather than as `0%`,
because a provider that reported nothing has not reported a miss. On an instance whose `sessions` entity has no
cached-token column the figure SHALL be unavailable and the detail read SHALL still succeed. The figure SHALL
carry a keyboard-reachable caveat: the rollup sums prompt tokens over every hop, so work an application
mediates is counted more than once in the numerator and the denominator alike, and the share describes the
summed hops rather than the user's own prompts.

A panel field whose value cannot be read at face value SHALL carry a caveat stating why, and that caveat
SHALL be reachable by keyboard. A field label is not focusable, so a caveat attached to it by hover alone is
unreachable for a keyboard or screen-reader user; the caveat SHALL therefore be exposed through a focusable
control whose accessible name carries it. A `title` attribute alone does not satisfy this.

The recorded durations are two such fields. `duration_ms` sums a session's hop durations, and an outer
hop's duration already contains the hops it called, so a session whose turns fan out into chains reads
longer than the time it actually took. `avg_duration_ms` averages per **hop** rather than per turn, so it is
not the average turn. Each SHALL state its own caveat: the two figures are wrong in different ways, and one
shared note would misdescribe whichever it did not name. The view MUST NOT describe either as elapsed time.
This restates a caveat previously carried only by the sessions grid's Duration column, which no longer
exists — the figures remain on this panel, so the statement has to as well.

Every panel that presents label-and-value rows rather than headline figures — the insights panel — SHALL render
them in **one register** — one type treatment, one row rhythm, one alignment — regardless of which source the values came
from. The rail's panels all list fields of the same record, so a treatment reserved for one of them states a
difference in kind the record does not have; the panels are already distinguished by their heading and their
provenance colour, which is what that distinction is for. Monospace in particular SHALL NOT appear in a
value: it is this feature's mark for a catalog identifier naming an entity the page queried, and a
session id, a user hash or a trace id is a value of the record rather than a name in the catalog.

A value in that register SHALL occupy **one line** whatever its length, and a value too long for its column
SHALL be clamped rather than allowed to reflow. Nothing bounds an insight value, so a few long fields
allowed to wrap would take most of a panel whose point is that every
field is visible at once — the row rhythm is what makes the list scannable. A clamped value's full content
SHALL remain reachable, on hover and through the trigger's accessible name; a `title` attribute alone does
not satisfy this. Clamping SHALL apply only where the value actually overflows, so a value that fits carries
no dead affordance.

The metadata panel SHALL present the whole of the session's record as the schema-grouped fields stated in "The
metadata panel presents the session's record as the groups the schema defines", and among them SHALL state the
session id, the anonymized user identifier, the project, the first activity time, the successful-request count,
the session's **trace ids** and the deployments that served the session, all from the rollup. A field the
rollup carries SHALL NOT be rendered as unavailable: the panel states what the record holds, and marking a
recorded field as absent misreports the data the view already fetched.

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

- **WHEN** the detail view renders a session carrying an insight row
- **THEN** the insights, usage, feedback and metadata panels render
- **AND** each names the entity it reads from

#### Scenario: The usage panel reports real values

- **WHEN** a session has recorded token usage and cost
- **THEN** the usage panel states its prompt tokens, completion tokens, cache hit and total cost
- **AND** it states no total token count

#### Scenario: A cache hit is a share of prompt tokens

- **WHEN** a session's rollup records cached prompt tokens against a positive prompt token count
- **THEN** the cache hit states the cached count as a percentage of the prompt count

#### Scenario: A reported zero is a miss, not an absence

- **WHEN** a session's rollup records a cached prompt token count of zero against a positive prompt count
- **THEN** the cache hit states `0%`

#### Scenario: An unreported cached count is unavailable

- **WHEN** a session's rollup carries no cached prompt token count
- **THEN** the cache hit is marked unavailable
- **AND** it does not state `0%`

#### Scenario: An instance without the cached-token column still renders the session

- **WHEN** the `sessions` entity reports no cached-token column
- **THEN** the detail view renders with the cache hit marked unavailable
- **AND** the detail read does not fail

#### Scenario: The cache hit carries a keyboard-reachable caveat

- **WHEN** the usage panel renders the cache hit
- **THEN** it carries a caveat that prompt tokens are summed over every hop
- **AND** the caveat is reachable by keyboard and exposed to assistive technology

#### Scenario: No panel is populated entirely by unavailable markers

- **WHEN** the detail view renders
- **THEN** every panel it renders has a real source entity

#### Scenario: The insights panel states the evaluator's reading

- **WHEN** a session carries an insight row
- **THEN** the insights panel states what the enrichment recorded for it
- **AND** it does not restate the session's title

#### Scenario: An unevaluated session gets a statement, not a panel of dashes

- **WHEN** the detail view renders a session the insight enrichment carries no row for
- **THEN** no insights panel renders
- **AND** the view states in text that the session has not been evaluated
- **AND** no insight field renders as an unavailable marker

#### Scenario: An instance without the enrichment says so distinctly

- **WHEN** the detail view renders on an instance whose schema reports no insight column
- **THEN** the view's statement distinguishes an absent enrichment from an unevaluated session

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

- **WHEN** the usage panel renders a session's duration and average duration
- **THEN** each figure carries a caveat explaining what its value actually measures
- **AND** each caveat is reachable by keyboard and exposed to assistive technology
- **AND** neither figure is described as elapsed time

#### Scenario: An identifier never names an enrichment

- **WHEN** the detail view's panels and the log's provenance line render for an instance carrying the insight
  enrichment
- **THEN** every monospace catalog identifier names only an entity the page queries
- **AND** none of them names `session_insights`

#### Scenario: No panel claims an enrichment

- **WHEN** the metadata panel renders a field the session-insight enrichment supplies
- **THEN** the panel still names `sessions` as its source
- **AND** no panel is labelled as enrichment-derived

#### Scenario: The row panels share one value register

- **WHEN** the panels that present label-and-value rows render
- **THEN** they share one type treatment, row rhythm and alignment
- **AND** no value is rendered in monospace
- **AND** a value longer than its column is clamped to one line, with its full content reachable on hover
  and exposed to assistive technology

#### Scenario: The metadata panel marks what the rollup lacks

- **WHEN** the detail view renders
- **THEN** the metadata panel's groups state the session id, user identifier, project, first activity,
  successful-request count, trace ids and the session's deployments
- **AND** it marks none of those the rollup carries as unavailable

#### Scenario: Trace ids are not presented as a turn order

- **WHEN** a session's rollup records several trace ids
- **THEN** the metadata panel lists them without turn numbers or ordinal labels
- **AND** the panel states no turn count derived from how many it lists

#### Scenario: The successful-request label states what it counts

- **WHEN** the metadata panel renders
- **THEN** its successful-request label states that a turn counts when at least one of its hops succeeded

### Requirement: Single-session query over the sessions entity

The system SHALL provide a query builder returning a `StructuredQuery` over the entity `sessions` in
**row mode**, narrowed to exactly one `client_session_id` by equality, requesting a single row.

The query SHALL select every stored column of the session rollup **the fetched schema reports**, so the
detail view reads the full available record rather than the subset the log's grid needs. Every selected
column SHALL be **named explicitly**. A column the service marks `heavy` is excluded from a default
projection, so a query that relied on the default would silently return no value for it; `traces` is such a
column, and the detail view renders it.

The query SHALL take the schema's reported fields from the caller rather than enumerating a field list of
its own, per "A session query names only fields the entity's schema reports". The columns the view has
always read are required; every column added since — `traces`, the cache, cached-prompt and reasoning token
counts, the chain cost, and the insight columns — is optional. With no schema available the query SHALL name
the required set alone.

The query SHALL name **every** column the insight enrichment exposes, discovered from the enrichment
namespace the schema qualifies those columns with rather than from a field list held in the frontend. An
enumerated list cannot follow the enrichment: a column the evaluator gains is one the detail view cannot
render at all, and the reader has no way to tell that from a session the evaluator never reached. The
failure is worse than absence when a column is _superseded_ — the enumerated pair keeps being named and
comes back null, while the pair that replaced it is never asked for, so the panel reports the evaluator as
silent on a session it labelled.

No column SHALL be withheld for the **kind** of column it is. The enrichment's own bookkeeping — which
evaluator produced a row, and from what input — was previously excluded as not describing the session,
and that exclusion is removed: those columns are what separate a session the current evaluator has not
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
showing — a deep link or a bookmark MUST NOT fail because a session falls outside the current window.

The query SHALL name a column the analytics service marks sensitive only where the fetched schema reports it.
Sensitive columns are removed from the query model for callers without the elevated role, so naming one the
caller's schema does not report would fail as an unknown field for those callers rather than being refused
cleanly, making the whole view unavailable to them; a column the schema does report is one this caller may read.
With no schema available the query names the required set alone, which holds none.

#### Scenario: The query is narrowed to one session by id

- **WHEN** the single-session query is built for a session id
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
  describe the session
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

#### Scenario: An instance without the enrichment still resolves a session

- **WHEN** the single-session query is built and the schema reports no insight column
- **THEN** its select names none of them
- **AND** it names the session's own stored columns
- **AND** the detail view renders

#### Scenario: The query carries no time bound

- **WHEN** the single-session query is built
- **THEN** it contains no predicate over `first_request_time` or `last_request_time`

#### Scenario: A session outside the log's period still resolves

- **WHEN** a session whose last activity precedes the log's selected period is opened
- **THEN** its detail view renders that session's values

#### Scenario: No sensitive column is requested

- **WHEN** the single-session query is built and the schema reports no column the analytics service marks
  sensitive
- **THEN** its selected columns include none

#### Scenario: A sensitive column the schema reports is requested

- **WHEN** the single-session query is built and the schema reports a column marked sensitive
- **THEN** its selected columns include that column

## ADDED Requirements

### Requirement: A trace card states when its call started as a date and a time

A card SHALL state the start of its own recorded call as a date and a time in the reader's locale, not as a
time of day alone. The listing is ordered by start and a session can span days, so a time of day repeats across
the session and leaves two cards a day apart looking adjacent. Where the card has no recorded start it SHALL
state the unavailable marker.

#### Scenario: A card on another day is told apart

- **WHEN** a session has traces started on two different days
- **THEN** each card's start states its date as well as its time

#### Scenario: A card without a recorded start

- **WHEN** a card's root records no start
- **THEN** the card's start is marked unavailable

### Requirement: The metadata panel presents the session's record as the groups the schema defines

The metadata panel SHALL present the session's record as collapsible groups — one group per tag the `sessions`
schema reports, in the order the schema reports them — and SHALL carry no other presentation of the record's
fields, so a field is stated once, in the group of its tag. It SHALL present them the way the span rail
presents a span's fields, with the same group control and the same rows, rather than in the label-and-value
register of the insights panel: it is the same kind of content as the span rail's, and a reader moving between
the two sees one control. The set of fields SHALL be discovered from the schema and not enumerated, so a column
the service adds reaches the panel without a release, and a tag this release has no label for SHALL be presented
under the schema's own spelling. One group SHALL be open at a time, and a header SHALL state whether it is
expanded and what it controls.

A closed caller group SHALL preview the user's name, so the reader sees who called without opening it; where
the session records no name the group previews its first stated field, as every group does. The other groups
preview as the span rail's do.

Where this view states a column more exactly than the catalog names it, the row SHALL carry this view's label:
the successful-request row, in particular, keeps the label that states what `success_count` counts.

The panel SHALL leave out a column the service marks `heavy`, because the detail read is one row and a heavy
column is the expensive one to transfer, with one exception: the trace ids, which the panel is required to state,
remain read. It SHALL leave out the insight columns, which the insights panel presents. It SHALL NOT leave out a
column because another panel states it in another form: the usage panel states token counts in compact form,
which rounds them, so the groups state the counts exactly, and the dump states them again. A reported zero in a
rollup is a sum, not an unmetered call, so a zero in a token, cost or duration group SHALL be stated as zero and
not as unavailable. A column the service marks sensitive SHALL be presented, in a group and in the dump, only
where the fetched schema reports it: the service removes such a column from the schema for a caller without the
elevated role, so a column that arrived is one this caller may read.

Where the schema could not be read and so no group can be formed, the panel SHALL say so in text and SHALL still
offer the record as JSON, because the record the detail read returned does not depend on the schema.

#### Scenario: Fields are grouped by the schema's tags

- **WHEN** the detail view renders for an instance whose schema tags its columns
- **THEN** the metadata panel presents one group per reported tag, in the schema's order
- **AND** each group lists the fields reported under that tag
- **AND** no field is presented outside a group

#### Scenario: The panel reads as the span rail's field groups do

- **WHEN** the metadata panel and the span rail's field groups are both on screen
- **THEN** their groups use the same control and the same rows

#### Scenario: A column the schema adds appears without a release

- **WHEN** the schema reports a column this frontend has no entry for
- **THEN** the column renders in the group of its tag under the schema's own label

#### Scenario: A closed caller group previews the user's name

- **WHEN** the metadata panel renders with its groups closed and the session records a user name
- **THEN** the caller group previews that name

#### Scenario: A caller group without a name previews its first field

- **WHEN** the session records no user name
- **THEN** the caller group previews its first stated field

#### Scenario: The successful-request row keeps its qualified label

- **WHEN** the group holding the successful-request count is open
- **THEN** its label states that a turn counts when at least one of its hops succeeded

#### Scenario: A figure the usage panel states is also stated exactly

- **WHEN** the usage panel states a token count in compact form
- **THEN** the token usage group states the same count exactly

#### Scenario: A reported zero is stated as zero

- **WHEN** the rollup records a zero in a token, cost or duration column
- **THEN** its group states zero
- **AND** it does not mark the field unavailable

#### Scenario: A sensitive column the schema reports is presented

- **WHEN** the schema reports a column marked sensitive
- **THEN** the detail query names it
- **AND** a group and the dump present it

#### Scenario: A sensitive column the schema does not report is not presented

- **WHEN** the schema does not report a column marked sensitive for the caller
- **THEN** the detail query does not name it
- **AND** no group and no dump presents it

#### Scenario: An unreadable schema leaves the record available as JSON

- **WHEN** the sessions schema could not be read
- **THEN** the metadata panel says the schema could not be read
- **AND** its JSON control still presents the record

### Requirement: A metadata value can be copied

Each value a metadata group's row presents SHALL offer a control that copies it to the clipboard. The control SHALL
have an accessible name that states which value it copies, SHALL be reachable by keyboard, and SHALL confirm
the outcome through the application's notification, which is announced to assistive technology, rather than
through the control's own name. A value too long for its column is
clamped for display; the copy SHALL carry the full value. A list value SHALL be copied as its items separated by
a comma and a single space. A value marked unavailable SHALL offer no copy control, because there is nothing to
copy.

#### Scenario: A clamped value is copied in full

- **WHEN** the reader activates the copy control of a value that is clamped for display
- **THEN** the clipboard holds the whole value

#### Scenario: A copy states its outcome to assistive technology

- **WHEN** the reader activates a copy control
- **THEN** a notification announces that the value was copied
- **AND** the control's own accessible name is unchanged

#### Scenario: An unavailable value offers no copy

- **WHEN** a field is marked unavailable
- **THEN** its row has no copy control

### Requirement: The session's record is available as a JSON dump

The metadata panel SHALL offer a control that presents the session's whole record as JSON in the shared viewer,
in a popup over the page rather than inline. The dump SHALL hold every field the detail read returned, including
those the groups omit as stated elsewhere, keyed by the column names the schema reports and not by display
labels. A field with no value SHALL appear with the value it was read as. The dump SHALL carry no key of this
console's own making and SHALL require no additional read.

#### Scenario: The dump opens and holds the whole record

- **WHEN** the reader activates the JSON control
- **THEN** a popup presents the session's record as JSON
- **AND** it includes the fields the groups omit as stated elsewhere

#### Scenario: The dump is keyed by published column names

- **WHEN** the dump is presented
- **THEN** each key is the column name the schema reports, with its qualification
- **AND** no key is a display label

#### Scenario: The dump issues no read

- **WHEN** the reader activates the JSON control
- **THEN** no query is issued
