## ADDED Requirements

### Requirement: Conversation detail route, access guard, and not-found handling

The system SHALL provide a per-conversation detail view at `/<lang>/conversations-trace/<chat_id>`, reached
by opening a row of the conversations log. The conversation id SHALL be carried in the path and MUST be
URL-encoded, since real ids are not opaque short tokens — they reach hundreds of characters and some contain
path separators and percent-encoded text.

The route SHALL apply the same analytics access guard as the conversations log and SHALL render the shared
forbidden view when access is denied, so the detail view cannot become a way around the gate.

The access guard SHALL resolve to "not forbidden" when the analytics service cannot be reached, rather than
rejecting. Callers await the guard before their own error handling, so a rejection escapes the page and
replaces the application shell instead of that page's load-error state.

When no conversation exists for the requested id the route SHALL render the application's not-found view.
An unknown id MUST NOT render an empty detail page, because every value on it would then read as unavailable
and the page would be indistinguishable from a conversation whose data is genuinely missing.

Returning to the conversations log is the application navigation's responsibility. The detail view MUST NOT
own a back control, so there is one way back rather than two that can disagree.

#### Scenario: Opening a conversation renders its detail view

- **WHEN** a conversation row in the log is opened
- **THEN** the detail view for that conversation renders
- **AND** the address carries the conversation id, URL-encoded

#### Scenario: A conversation id containing path separators survives the round trip

- **WHEN** a conversation whose id contains `/` or percent-encoded characters is opened
- **THEN** the detail view resolves that exact conversation

#### Scenario: Access is denied

- **WHEN** the analytics access guard denies access
- **THEN** the forbidden view renders instead of the detail view

#### Scenario: Unknown conversation id

- **WHEN** the requested conversation id matches no conversation
- **THEN** the not-found view renders

#### Scenario: The analytics service is unreachable

- **WHEN** the access guard's request to the analytics service fails to connect
- **THEN** the guard resolves to "not forbidden" and the route renders its own load-error state
- **AND** the application shell is not replaced by an error page

### Requirement: Single-conversation query over the conversations entity

The system SHALL provide a query builder returning a `StructuredQuery` over the entity `conversations` in
**row mode**, narrowed to exactly one `chat_id` by equality, requesting a single row.

The query SHALL select every stored column of the conversation rollup, so the detail view reads the full
available record rather than the subset the log's grid needs.

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

#### Scenario: The query carries no time bound

- **WHEN** the single-conversation query is built
- **THEN** it contains no predicate over `first_request_time` or `last_request_time`

#### Scenario: A conversation outside the log's period still resolves

- **WHEN** a conversation whose last activity precedes the log's selected period is opened
- **THEN** its detail view renders that conversation's values

#### Scenario: No sensitive column is requested

- **WHEN** the single-conversation query is built
- **THEN** its selected columns include no column the analytics service marks sensitive

### Requirement: Unavailable conversation values render an explicit placeholder

The detail view SHALL surface every field its layout defines, including fields no queried source can supply.
Such a field SHALL render its label together with an explicit unavailable marker. A field MUST NOT be
silently omitted, and its label MUST NOT be rendered with a blank value, so the difference between "this
system has no such data" and "this happens to be empty" stays visible to the reader.

The view SHALL distinguish three states, and MUST NOT collapse them onto one presentation:

- **unavailable** — no queried source carries the field at all;
- **empty** — a queried source carries the field and its value is absent for this conversation;
- **zero** — a queried source carries the field and its value is genuinely `0`.

A zero count SHALL render as a number. It MUST NOT render as the unavailable marker, since `0` ratings or
`0` failed requests are findings rather than gaps.

The marker SHALL be a single presentation used consistently across the view, and SHALL come from theme
tokens rather than literal colour values.

#### Scenario: A field with no source renders its label and the marker

- **WHEN** the detail view renders a field no queried source supplies
- **THEN** the field's label renders
- **AND** its value renders as the unavailable marker

#### Scenario: An empty value is distinguishable from an unavailable one

- **WHEN** a conversation has no project
- **THEN** the project field renders its own empty presentation, not the unavailable marker

#### Scenario: A zero value renders as a number

- **WHEN** a conversation has zero ratings
- **THEN** the rating counts render as `0` rather than as the unavailable marker

### Requirement: Conversation detail header identifies the conversation

The header SHALL lead with the conversation id as the view's heading. The rollup carries no conversation
title or summary, so the id is the only identifying value the view can state; a title field SHALL be
surfaced as unavailable rather than fabricated from other values.

The heading SHALL keep the full id reachable when it is too long to display, and SHALL offer a means of
copying it, since the id is the value a reader carries to another tool.

The header SHALL state the conversation's project, its request count, the span between first and last
activity, and how long ago the last activity was. It SHALL surface a model field as unavailable — the rollup
does not carry `deployment`.

The header MUST NOT carry rating counts or a back control. Ratings belong with the panel that lists them, so
the same figures are not stated twice in different places, and returning to the log is the application
navigation's job rather than a control this view owns.

The request count SHALL be labelled as requests, not as turns. The rollup's count is a count of usage-log
rows, one per proxy hop, and a single turn fans out into many hops — so labelling it as turns would overstate
the figure, by two orders of magnitude on real conversations. The view MUST NOT present it as a turn count.

Numeric, currency and time values in the header SHALL carry the same formatting those value types carry in
the conversations log, so the same conversation reads identically in both places.

#### Scenario: The heading is the conversation id

- **WHEN** the detail view renders
- **THEN** the conversation id is the heading
- **AND** a title field renders as unavailable

#### Scenario: A long conversation id stays reachable and copyable

- **WHEN** the conversation id is too long to fit the heading
- **THEN** it is truncated, its full value remains reachable, and it can be copied

#### Scenario: The header carries no ratings and no back control

- **WHEN** the detail view renders
- **THEN** the header shows no rating counts and no control for returning to the log

#### Scenario: The header states the conversation's facts

- **WHEN** the detail view renders
- **THEN** the header states the project, the request count, the activity span and the time since last
  activity
- **AND** it renders a model field as unavailable

#### Scenario: The request count is not labelled as turns

- **WHEN** the header renders the rollup's count of usage-log rows
- **THEN** it is labelled as requests
- **AND** it is not labelled as turns

#### Scenario: Header values match the log

- **WHEN** the same conversation is read in the log and in the detail view
- **THEN** its token, cost and activity values are formatted identically in both

### Requirement: Conversation turns come from the earliest hop of each trace

The detail view SHALL derive a conversation's turns from the usage log, taking one turn per trace and
identifying the turn's entry hop as the trace's **earliest** request.

The entry hop MUST NOT be identified by an absent parent span. A chain's true first hop is frequently not
recorded in this table, so most conversations have **no** hop with a null parent span and that rule finds
nothing at all — leaving the view with no turns and no transcript.

A turn's cost SHALL be summed from each hop's own cost, not from the cost figure that already covers
everything a hop initiated; summing the latter across a chain double-counts.

The turn query MUST NOT name the request or response body columns. Those columns are heavy, and naming them
in a per-conversation read makes the turn list as slow as a transcript read.

The view SHALL state the turn count from these root hops, alongside the rollup's request count and under a
distinct label. The two differ by orders of magnitude — a measured conversation records 930 usage-log rows
across 3 turns — so presenting either alone would misstate the conversation.

Each turn SHALL carry its own model, token total and cost. A root hop's cost covers the whole chain beneath
it, so the turn's figure accounts for the calls it caused, not only itself.

The turn list SHALL be bounded, and the view MUST NOT page through it.

#### Scenario: One turn per trace

- **WHEN** the detail view loads a conversation whose usage log records many hops across a few traces
- **THEN** one turn renders per trace
- **AND** each turn reports its own hop count, token total and cost

#### Scenario: Turns resolve when no hop has a null parent span

- **WHEN** every hop of a conversation records a parent span
- **THEN** its turns are still identified, one per trace
- **AND** the transcript is still read

#### Scenario: A turn's cost is not double-counted

- **WHEN** a turn fans out into a chain of hops
- **THEN** its cost is the sum of each hop's own cost, not of the chain-inclusive figure

#### Scenario: Turn count and request count are both stated, distinctly labelled

- **WHEN** a conversation records 930 usage-log rows across 3 turns
- **THEN** the header states 3 under a turns label
- **AND** it states 930 under a requests label

#### Scenario: The turn query reads no body column

- **WHEN** the turn list is requested
- **THEN** the query names neither the request body nor the response body column

### Requirement: Conversation message content is sample data, and says so

The detail view SHALL render a conversation as user and assistant messages, and those messages SHALL be
**sample content**, not the conversation's stored message text.

Whenever sample messages render, the view SHALL display a persistent notice stating that the messages are
samples and that the surrounding turn, token and cost figures are real. The notice MUST be visible without
interaction and MUST NOT be the only cue in a tooltip or title attribute: sample content presented as real
traffic on an analytics page would misrepresent what the system recorded.

The view MUST NOT read the request or response body columns. Those columns are `heavy` and encrypted at
rest and reach megabytes in a single row, while the route re-renders on every view — so the message text the
system records is not available to this view at an acceptable cost.

Sample content SHALL be derived from the conversation's identity, so one conversation always renders the
same exchange. Content that varied between views would read as changing data rather than as sample content.

The number of sample turns SHALL equal the conversation's real turn count — never more — so every assistant
message carries the real figures for its turn. Padding the transcript to fill the column would leave later
messages with no figures beside them, and those figures are the part of this region that is real. A
conversation with no turns SHALL render no messages and no notice, falling back to stating that message
content is unavailable.

A failed turns query SHALL be reported as a failure and MUST NOT be presented as a conversation that
recorded no messages. Both states render an empty transcript, and reporting an outage as an absence would
state something false about the conversation.

#### Scenario: Messages render as sample content with a visible notice

- **WHEN** the detail view renders a conversation that recorded turns
- **THEN** user and assistant messages render
- **AND** a visible notice states that the messages are samples and the figures beside them are real

#### Scenario: No body column is ever requested

- **WHEN** the detail view loads a conversation
- **THEN** no query it issues references the request body or response body column

#### Scenario: The same conversation always renders the same exchange

- **WHEN** the same conversation is opened twice
- **THEN** its messages are identical

#### Scenario: Sample turns match the real turn count

- **WHEN** a conversation recorded three turns
- **THEN** three user messages and three assistant messages render

#### Scenario: A conversation with no turns shows no sample content

- **WHEN** a conversation has no turns
- **THEN** no messages and no sample notice render
- **AND** the view states that message content is unavailable

#### Scenario: A failed turns query is not reported as an absence of messages

- **WHEN** the turns query fails
- **THEN** the transcript states that the turns could not be loaded
- **AND** it does not state that message content was never recorded

#### Scenario: Every assistant message carries its turn's real figures

- **WHEN** a conversation's messages render
- **THEN** each assistant message shows its turn's real token total, cost and call count
- **AND** no assistant message renders without them

### Requirement: Conversation detail side panels and their provenance

The detail view SHALL present its supporting fields as labelled panels: token and cost usage, feedback, and
record metadata. Each panel SHALL carry an icon coloured by its source, so the panels are distinguishable at
a glance rather than by reading their headings.

Each panel SHALL name the entity it reads from, and MUST NOT overstate it. **Every** panel SHALL have a real
source: the view MUST NOT present a panel no queried entity populates, because a panel of nothing but
unavailable markers states a shape the system does not record. A panel MUST NOT be labelled as
enrichment-derived: the view queries no enrichment, and the analytics deployment defines none over the
conversation rollup.

The usage panel SHALL state prompt tokens, completion tokens, total tokens, total cost and the recorded
durations from the rollup, laid out as headline figures rather than a label-and-value list. Monetary values SHALL carry the emphasis
money carries elsewhere in the app, which is independent of the panel's source colour.

The metadata panel SHALL state the conversation id, the anonymized user identifier, the project, the first
activity time and the successful-request count from the rollup, and SHALL surface trace, deployment and
region fields as unavailable.

Panel provenance colours SHALL come from theme tokens, and every provenance value the view can render SHALL
map to a colour, so a newly added source cannot render unstyled.

#### Scenario: Panels render with their sources named

- **WHEN** the detail view renders
- **THEN** the usage, feedback and metadata panels render
- **AND** each names the entity it reads from

#### Scenario: The usage panel reports real values

- **WHEN** a conversation has recorded token usage and cost
- **THEN** the usage panel states its prompt tokens, completion tokens, total tokens and total cost

#### Scenario: No panel is populated entirely by unavailable markers

- **WHEN** the detail view renders
- **THEN** every panel it renders has a real source entity

#### Scenario: No panel claims an enrichment

- **WHEN** the detail view renders
- **THEN** no panel is labelled as enrichment-derived

#### Scenario: The metadata panel marks what the rollup lacks

- **WHEN** the detail view renders
- **THEN** the metadata panel states the conversation id, user identifier, project, first activity and
  successful-request count
- **AND** it renders trace, deployment and region as unavailable

### Requirement: Conversation detail feedback reads the rating source

The detail view SHALL read this conversation's ratings from the feedback source and SHALL state, **in the
feedback panel**, how many were positive and how many negative. A conversation with no ratings SHALL state
zero in both directions rather than rendering them as unavailable.

Each assistant message SHALL also show the ratings attributed to its turn. Attribution SHALL be by time — a
rating belongs to the last turn that had started when the rating was submitted — because the feedback source
records no trace identifier and its trace and span columns are not queryable. This is an approximation and
MUST NOT be presented as an exact join: a rating left after a later turn began is attributed to that later
turn.

The feedback panel SHALL list the conversation's individual ratings with their direction and the time each
was recorded, most recent first.

Each listed rating SHALL surface a comment field as unavailable. The feedback source's comment column is
marked sensitive, so requesting it would make the view unavailable to callers without the elevated role.

When more ratings exist than the view requested, the panel SHALL say the list is partial rather than
presenting it as complete.

#### Scenario: Rating counts render with the ratings they summarise

- **WHEN** a conversation has positive and negative ratings
- **THEN** the feedback panel states the count in each direction

#### Scenario: An unrated conversation reports zero

- **WHEN** a conversation has no ratings
- **THEN** the feedback panel states zero in both directions

#### Scenario: An assistant message shows its turn's ratings

- **WHEN** a rating was submitted after a turn began and before the next turn began
- **THEN** that turn's assistant message shows it in the matching direction

#### Scenario: Individual ratings are listed

- **WHEN** a conversation has ratings
- **THEN** the feedback panel lists each with its direction and recorded time, most recent first

#### Scenario: A listed rating's comment is marked unavailable

- **WHEN** the feedback panel lists a rating
- **THEN** its comment renders as unavailable

#### Scenario: A partial rating list says so

- **WHEN** a conversation has more ratings than the view requested
- **THEN** the panel states that the list is partial

### Requirement: A turn's trace opens in place, with a selectable span tree

Each assistant message SHALL offer a control opening that turn's trace. The trace SHALL replace the
transcript **within the same view** and SHALL offer a control returning to the transcript. Opening a trace is
a read of one turn and MUST NOT navigate away from the conversation.

While a trace is open the conversation's header SHALL be replaced rather than kept above it. The trace states
its own identity and its own figures, and two stacked headers would leave the reader unsure which of them the
figures belong to.

The trace SHALL render one row per recorded hop, nested by the parent-span relationship. A hop whose parent
is absent from the result SHALL be rendered as a root rather than dropped: a chain's first hop is frequently
recorded elsewhere, so dropping such hops would hide most of a trace. Nesting depth SHALL be bounded so a
deep chain cannot indent rows out of view.

Each hop SHALL state its name, its request method and path, a category, its duration and its own cost, and
SHALL be selectable. Categories SHALL be derived from the recorded event kind, except that a **failed** hop
SHALL be categorised by its failure whatever its kind — on a trace the reader is looking for what broke.
Every category SHALL map to a colour from theme tokens and SHALL be named in a legend.

Selecting a hop SHALL show its detail beside the tree: its category and status, its offset from the start of
the trace, its duration, its tokens and cost, its endpoint, its upstream, its calling deployment and its HTTP
status. The detail MUST NOT show request or response bodies — the same heavy-column constraint that applies
to the transcript applies here.

The trace SHALL state its own latency, token total, cost, hop count and status. Latency SHALL be the longest
hop rather than the sum, because hops of one trace overlap, and cost SHALL sum each hop's own cost rather
than the chain-inclusive figure.

The hop list SHALL be bounded and SHALL say so when it was cut short. A trace's hop count reaches into the
hundreds.

#### Scenario: Opening a turn's trace replaces the transcript in place

- **WHEN** the trace control on an assistant message is used
- **THEN** that turn's span tree renders in place of the transcript
- **AND** the trace states the turn it belongs to and its own trace id
- **AND** a control returns to the transcript

#### Scenario: Hops nest by their parent span

- **WHEN** a trace records a hop that called another hop
- **THEN** the called hop renders nested beneath its caller

#### Scenario: A hop whose parent is absent is still shown

- **WHEN** a hop records a parent span that is not itself in the result
- **THEN** that hop renders as a root rather than being dropped

#### Scenario: A failed hop is categorised by its failure

- **WHEN** a hop did not succeed
- **THEN** it is categorised as an error rather than by its event kind

#### Scenario: Selecting a hop shows its detail

- **WHEN** a hop is selected
- **THEN** its category, status, offset, duration, tokens, cost, endpoint, upstream, caller and HTTP status
  render beside the tree
- **AND** no request or response body renders

#### Scenario: Trace latency is the enclosing hop, not the sum

- **WHEN** a trace records overlapping hops
- **THEN** its stated latency is the longest hop's duration

#### Scenario: A truncated hop list says so

- **WHEN** a trace records more hops than the view requested
- **THEN** the view states that the list is partial

## MODIFIED Requirements

### Requirement: Read-only conversations grid

The conversations view SHALL render a grid of six visible columns — conversation, project, turns, activity,
tokens, cost — plus the Rating column. No column SHALL be sortable, and no column SHALL offer a filter control
of its own — neither a floating filter row nor a filter menu in the header. Per-column filtering stays off even
though the page itself has filters: the page's filters are query predicates over the whole result, whereas a
column filter narrows only the pages already fetched, and would report that narrowed view as the complete
answer. Ordering is fixed by the query, most recent last activity first.

The grid SHALL obtain its rows page by page from the backend and MUST NOT be handed a superset to narrow, and
no grid-level filter model SHALL be set from the page's filter state. While the first page of a new filter
state is in flight the view SHALL show a loading indicator, so the empty state cannot flash between a filter
change and its rows. When the result holds no rows the view SHALL render a no-data state rather than an empty
grid body.

The conversation column SHALL keep the full conversation id reachable when it is too long to display, since
real ids are not uniformly short and can run to hundreds of characters. Truncation MUST NOT be the only
presentation of the value.

Numeric and currency columns SHALL carry the same formatting these value types carry elsewhere in the app.
The grid SHALL use a taller row than the app's shared default, since its cells stack two lines.

The page header SHALL be the title alone, with no status badge of its own — the Analytics navigation group
already marks the whole area as preview.

Rows SHALL be openable, navigating to that conversation's detail view. Opening a row is a read, not a
mutation of the result, so it does not make the grid writable: sorting and per-column filtering stay off.
The grid SHALL indicate that its rows are openable rather than leaving the affordance undiscoverable, and
SHALL honour the app's convention for opening a row in a new tab. The conversation id SHALL be URL-encoded
into the detail address, since real ids contain path separators and percent-encoded text.

The grid SHALL carry a provenance band above the column headers, grouping every column under the data source
it comes from, and a column MUST NOT be able to leave its group when moved.

Every column SHALL belong to exactly one group: an unattributed column would imply a provenance the page has
not stated. Group labels SHALL name the actual source of the columns beneath them and MUST NOT overstate it —
a column read from a source table MUST NOT be labelled as enrichment-derived, and no group SHALL be attributed
to a source the page does not query. Each group SHALL carry a tooltip naming its source precisely. Colours
SHALL come from theme tokens, never literal values, and every provenance value SHALL map to a colour, so a
newly added one cannot render unstyled.

The band and the column-header row SHALL each carry their own height, and the band label SHALL be separated
from the column header beneath it.

#### Scenario: Every column is attributed to a source

- **WHEN** the grid renders
- **THEN** a band above the column headers groups the columns by source
- **AND** every column belongs to exactly one group
- **AND** the conversation, project, turns, activity, tokens and cost columns are attributed to
  `conversations`, and the Rating column to `rate_analytics`

#### Scenario: No group claims an enrichment the page does not query

- **WHEN** the grid renders
- **THEN** no provenance group is labelled as enrichment-derived
- **AND** no group tooltip says its values are samples

#### Scenario: Groups survive column movement

- **WHEN** a column is dragged
- **THEN** it cannot be moved out of its provenance group

#### Scenario: Rows render from the fetched pages

- **WHEN** the grid has fetched a page of conversations
- **THEN** one grid row renders per conversation, most recent last activity first

#### Scenario: A long conversation id stays reachable

- **WHEN** a conversation id is too long to fit its column
- **THEN** the cell truncates it and the full value remains reachable

#### Scenario: Opening a row navigates to the conversation

- **WHEN** a grid row is opened
- **THEN** that conversation's detail view is navigated to, with its id URL-encoded in the address

#### Scenario: Opening a row in a new tab

- **WHEN** a grid row is opened with the app's new-tab modifier
- **THEN** the conversation's detail view opens in a new tab and the grid keeps its fetched pages

#### Scenario: Sorting is disabled

- **WHEN** a column header is clicked
- **THEN** the row order does not change and no sort indicator appears

#### Scenario: No filter control is reachable

- **WHEN** the grid renders
- **THEN** no floating filter row appears beneath the header row
- **AND** no column header offers a filter control, so no client-side filter can be applied

#### Scenario: Empty result renders the empty state

- **WHEN** the result holds zero conversations
- **THEN** the no-data content renders instead of an empty grid body

#### Scenario: Loading replaces the grid rather than the empty state showing

- **WHEN** the first page of a new filter state is in flight
- **THEN** a loading indicator renders in place of the grid
- **AND** the no-data content is not shown
