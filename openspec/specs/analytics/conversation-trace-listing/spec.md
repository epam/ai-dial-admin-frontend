# Analytics Conversation Trace Listing

## Purpose

One conversation's page: route, guard and not-found handling, the header, the side panels and their provenance, and the trace listing that groups by trace and cards by root span. A single span's bodies are `analytics/conversation-trace-detail`.

## Requirements

### Requirement: Conversation detail route, access guard, and not-found handling

The system SHALL provide a per-session detail view at `/<lang>/conversations-trace/<client_session_id>`, reached
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

### Requirement: A conversation query names only fields the entity's schema reports

The analytics service rejects a query that names a field its entity does not carry, and it rejects the
**whole query** rather than returning the columns it does have. A projection is therefore all-or-nothing:
one field the deployment lacks yields no rows at all, so a page that hardcodes its field list fails
entirely instead of rendering with one column empty.

The entity's fields are not fixed across deployments. The session rollup, the turn rollup and the
insight enrichment are catalog objects provisioned per instance rather than shipped with the service, so
an instance can carry an older set than the frontend knows about.

The conversations views SHALL therefore treat the fetched entity schema as the authority on what may be
named. Each view SHALL distinguish two classes of field:

- **required** — the fields without which the view cannot render its curated columns at all. These SHALL
  be named unconditionally.
- **optional** — every field added beyond that core. An optional field SHALL be named **only** when the
  fetched schema reports it.

When the schema cannot be fetched, the query SHALL name the required fields alone. A failed schema fetch
is not evidence that an optional field exists, and guessing costs the whole page rather than one column.

The schema SHALL be read **server-side**, on the route that renders the view, so the first paint already
knows which fields exist. A view MUST NOT issue its first data query before that answer is available.
The single-conversation query alone SHALL wait on it: the reads that name no optional field — the
conversation's feedback and its turns — SHALL stay parallel with the schema read rather than queue behind
it.

This rule governs the projection, and the same gate SHALL govern a filter and a sort key. A predicate or an
ordering naming a field the entity does not carry is rejected with the whole query exactly as a projection is,
so the allow-lists that decide which columns may sort and filter SHALL be derived from the schema-gated column
set rather than from a list held independently of it. A list maintained separately would drift the moment a
column is dropped for a lagging instance, and the failure would be the whole page rather than one control.

#### Scenario: An optional field the schema does not report is not named

- **WHEN** the conversations list query is built and the schema does not report the conversation title
- **THEN** the select does not name `session_insights.title`
- **AND** it names every required field
- **AND** the query returns rows

#### Scenario: An optional field the schema reports is named

- **WHEN** the schema reports the conversation title
- **THEN** the select names `session_insights.title`

#### Scenario: A failed schema fetch falls back to the required fields

- **WHEN** the entity schema cannot be fetched
- **THEN** the query names the required fields only
- **AND** it names no optional field

#### Scenario: One lagging field does not cost the whole view

- **WHEN** the instance carries the session rollup but not the insight enrichment
- **THEN** the conversations list renders its rows
- **AND** the detail view renders its header, panels and figures

#### Scenario: The detail route reads the schema server-side

- **WHEN** the conversation detail route renders
- **THEN** it fetches the `sessions` entity schema on the server
- **AND** the single-session query is built from the fields that schema reports
- **AND** the feedback and turn reads are issued without waiting for it

### Requirement: Unavailable conversation values render an explicit placeholder

The detail view SHALL surface every field its layout defines. A field the view's layout defines but no
queried source supplies SHALL render its label together with an explicit unavailable marker. A field MUST NOT
be silently omitted, and its label MUST NOT be rendered with a blank value, so the difference between "this
system has no such data" and "this happens to be empty" stays visible to the reader.

The layout SHALL NOT define a field the platform does not record at all. An unavailable marker states "no
queried source carries this yet"; a field for a quantity DIAL never records is not pending but absent, and
presenting it invites the reader to expect a value that will never arrive. Such a field SHALL be removed from
the layout together with its label, rather than rendered as permanently unavailable.

The view SHALL distinguish three states, and MUST NOT collapse them onto one presentation:

- **unavailable** — no queried source carries the field at all;
- **empty** — a queried source carries the field and its value is absent for this conversation;
- **zero** — a queried source carries the field and its value is genuinely `0`.

The fetched row itself SHALL decide between the first two. The service returns every projected column in
every row, `null` where the cell is null — so a key **absent** from the row is a field that was never
projected, because the instance does not carry it, and SHALL render as unavailable; a key present and `null`
is a field the record simply has no value for, and SHALL render as empty. The view MUST NOT treat the two as
one: a deployment that lacks a column and a conversation that lacks a value are different findings, and only
the first is a reason to expect nothing there ever.

A zero count SHALL render as a number. It MUST NOT render as the unavailable marker, since `0` ratings or
`0` failed requests are findings rather than gaps.

A zero SHALL instead render as the unavailable marker where the measured quantity cannot be zero in a
conversation that occurred — an elapsed duration being the case in hand, since a conversation that ran took
time. There the zero records that the backend did not measure the value, not that the value was nothing, and
rendering it as a number would state a finding the data does not support. This rule SHALL apply wherever the
value is presented, so the grid and the detail view state the same thing about the same conversation.

A value supplied by a conversation-insight enrichment is a fourth case and SHALL NOT use any of the three
presentations above. The enrichment runs per conversation and can be absent — the evaluator has not processed
the conversation yet — or partial, flagged `truncated`, when the conversation exceeded its budget. An absent
enrichment value SHALL read as **not yet evaluated**: it MUST NOT render as a zero, as a dash meaning "none",
or as any placeholder implying the evaluator looked and found nothing. Coverage is sparse and stays sparse —
under a quarter of conversations carry an insight row — so this is the common case, not an edge one.

Where such a value **labels** the conversation, an absent or blank one SHALL degrade to the unavailable marker
and MUST NOT degrade to the conversation id. Both surfaces that render a title render the id alongside it, so
substituting one for the other states the id twice and reads as though the conversation were named after its
own hash.

The marker SHALL be a single presentation used consistently across the view, and SHALL come from theme
tokens rather than literal colour values.

#### Scenario: A field with no source renders its label and the marker

- **WHEN** the detail view renders a field no queried source supplies
- **THEN** the field's label renders
- **AND** its value renders as the unavailable marker

#### Scenario: A field the platform does not record is not presented

- **WHEN** the detail view renders
- **THEN** it presents no field for a conversation's region, because DIAL records none
- **AND** no label for it appears in any panel

#### Scenario: An empty value is distinguishable from an unavailable one

- **WHEN** a conversation has no project
- **THEN** the project field renders its own empty presentation, not the unavailable marker

#### Scenario: A zero value renders as a number

- **WHEN** a conversation has zero ratings
- **THEN** the rating counts render as `0` rather than as the unavailable marker

#### Scenario: An impossible zero renders as unavailable

- **WHEN** a conversation's recorded duration is `0`
- **THEN** it renders as the unavailable marker rather than as a zero duration
- **AND** the grid and the detail view render it the same way

#### Scenario: A missing insight title degrades to the marker, not to the id

- **WHEN** a conversation has no insight row, or its title is blank
- **THEN** the title renders as the unavailable marker
- **AND** the conversation id is not rendered in its place
- **AND** the id remains stated once, in its own line of the same cell

#### Scenario: An absent insight value is not presented as a finding

- **WHEN** the Topics column renders a conversation the evaluator has not processed
- **THEN** the cell renders empty
- **AND** it states no zero, no dash and no "none"

#### Scenario: A field the payload never carried is unavailable, not empty

- **WHEN** the metadata panel renders a conversation whose row carries no `traces` key, because the instance
  does not expose that column
- **THEN** the trace field renders as the unavailable marker
- **AND** a field present in the row with a `null` value renders as empty instead

### Requirement: Conversation detail header names the conversation and states its turn count

The header SHALL lead with the conversation's **title** as the view's heading, and SHALL state the
conversation **id** in the meta row alongside its project, turn count, activity span and time since last
activity. A heading names the thing on the page; the id addresses it. Leading with the id made every
conversation's heading a hash, and the reader who needs the id needs to copy it rather than read it.

The id SHALL keep its full value reachable when it is too long to display, and SHALL offer a means of copying
it, since the id is the value a reader carries to another tool. Those affordances follow the id into the meta
row rather than staying with the heading.

The title SHALL be read from the conversation-insight enrichment. Where the enrichment carries no row for the
conversation, or its title is blank, the heading SHALL render the unavailable marker and MUST NOT render the
id in its place — the id is already stated in the meta row, and repeating it as the name states one value
twice. The marker MUST NOT stand as the heading's only content for assistive technology: a heading whose text
is a dash names nothing, so it SHALL carry an accessible name stating that the conversation is untitled. The
title MUST NOT be fabricated from other values.

A title computed from a `truncated` input SHALL be stated exactly as any other title is, and the header MUST
NOT qualify it with a truncation caveat. The flag holds for most titled conversations, so a caveat rendered on
nearly every one of them, and what it reported was a property of the evaluator's input budget rather than
anything about the conversation the reader is looking at.

The header MUST NOT state the conversation's deployments. The metadata panel states them, and one fact
presented in two places gives the reader no way to tell which is authoritative — the same reason the turn
count is stated once and the rating counts are left to the panel that lists them.

The header MUST NOT state a **model** field. The rollup carries no conversation-level model column;
`deployments` names every deployment that handled any hop — routers, applications, MCP toolsets and embedding
deployments alongside the models — and which of them is a model is not derivable from the array. The view MUST
NOT synthesize the set either: the turn rollup's `models` column is the authoritative billed set but is **per
turn**, no server-side union over it is expressible, and a union taken over the view's bounded turn list would
understate a conversation longer than that bound, the same error the turn-count rule already forbids.
Presenting a real model set requires a conversation-level field the rollup does not yet carry.

The header MUST NOT carry rating counts or a back control. Ratings belong with the panel that lists them, so
the same figures are not stated twice in different places, and returning to the log is the application
navigation's job rather than a control this view owns.

The turn count SHALL be read from the rollup's `turn_count` and labelled **turns**. It SHALL be stated
**once**: the header MUST NOT carry a second count of the same quantity under a different label.
`turn_count` counts distinct traces, so turn, request and trace name one quantity — a header stating both a
turns figure and a requests figure presents one fact as two, and gives the reader no way to tell which is
authoritative.

The header's turn count MUST NOT be derived from the loaded turn list. That list is bounded, so on a
conversation longer than the bound the derived figure is the bound itself, stated as though it were the
conversation's length.

Numeric, currency and time values in the header SHALL carry the same formatting those value types carry in
the conversations log, so the same conversation reads identically in both places.

#### Scenario: The heading is the conversation's title

- **WHEN** a conversation's insight row carries a title
- **THEN** that title is the view's heading
- **AND** the conversation id is stated in the meta row

#### Scenario: An untitled conversation still has a named heading

- **WHEN** a conversation has no insight row, or its title is blank
- **THEN** the heading renders the unavailable marker
- **AND** the heading carries an accessible name stating the conversation is untitled
- **AND** the conversation id is not rendered as the heading

#### Scenario: A truncated title says so

- **WHEN** a conversation's insight row is flagged `truncated`
- **THEN** the title itself is stated as the heading, exactly as an untruncated title is
- **AND** the view states nothing about the title having been computed from part of the conversation

#### Scenario: The header states no deployments and no model

- **WHEN** a conversation's rollup records deployments including a router, an application and a model
- **THEN** the header states none of them
- **AND** it presents no model field
- **AND** the metadata panel remains where those deployments are stated

#### Scenario: A long conversation id stays reachable and copyable

- **WHEN** the conversation id is too long to fit the meta row
- **THEN** it is truncated, its full value remains reachable, and it can be copied

#### Scenario: The header carries no ratings and no back control

- **WHEN** the detail view renders
- **THEN** the header shows no rating counts and no control for returning to the log

#### Scenario: The header states the conversation's facts

- **WHEN** the detail view renders
- **THEN** the header states the title as its heading, and the id, the project, the turn count, the activity
  span and the time since last activity in its meta row

#### Scenario: The turn count is stated once, from the rollup

- **WHEN** the detail view renders a conversation whose `turn_count` is 911
- **THEN** the header states 911 under a turns label
- **AND** it states no second count of turns, requests or traces under any other label

#### Scenario: The header count is unaffected by how many turns loaded

- **WHEN** a conversation's `turn_count` is 911 and the view loads only the first 200 turns
- **THEN** the header states 911
- **AND** it does not state 200

#### Scenario: Header values match the log

- **WHEN** the same conversation is read in the log and in the detail view
- **THEN** its token, cost and activity values are formatted identically in both

### Requirement: The conversation trace listing groups by trace and cards by root span

The listing SHALL present a conversation's recorded activity as **traces**, and within a trace one **card per
root span** — a span whose parent span id is null. Trace-level figures SHALL attach to the trace; a card's own
figures SHALL be read from that card's own row. The two registers are not interchangeable: the trace states
what the whole chain consumed, the card states what that one call did itself.

A trace SHALL belong to the conversation when **any** of its rows carries the conversation's chat id. Core
writes the conversation header per request, so the header routinely lands on a child row while the root
carries none — the ordinary shape for agent clients, verified in Core's source and measured across sampled
traces. The listing MUST NOT require the header on the root span itself. Requiring it is a stricter rule that
drops whole conversations from the listing, which is the defect this requirement replaces.

Where a trace records exactly one root span — the overwhelming majority — the trace and its card SHALL
collapse into a **single row**, so the grouping is invisible until a trace genuinely records more than one
client call. Two cards under one trace SHALL appear only where more than one root was recorded.

The root span carrying the conversation's own call SHALL be identified as the root carrying the chat id where
one does, and otherwise as the trace's sole root. That is a **labelling** rule, not a selection rule: every
root renders as a card, and the rule only decides which card is the conversation's own call. No trace records
two roots carrying the chat id, and where no root carries it there is exactly one root.

A trace whose root span is not found SHALL still render from its trace-level figures, stating that the entry
call was not recorded, rather than being omitted from the listing.

A card SHALL be labelled by the trace it belongs to and MUST NOT be labelled with a turn number. The data
records no turn index, and numbering the rows presents an ordinal the source does not carry as though it were
recorded.

Service calls — title generation and similar — SHALL be shown rather than filtered out. They are real
recorded calls that consume tokens and cost, and hiding them would leave a trace's figures exceeding the sum
of its cards with nothing on screen to account for the difference.

A repeated send SHALL render as two cards, since it is two recorded calls.

#### Scenario: A trace is listed when any of its rows carries the conversation header

- **WHEN** a trace's root span carries no chat id and one of its child rows carries the conversation's
- **THEN** that trace is listed
- **AND** its card is read from the root span's own row

#### Scenario: A single-root trace renders as one row

- **WHEN** a trace records exactly one root span
- **THEN** the trace and its card render as a single row
- **AND** no grouping affordance is rendered for it

#### Scenario: A trace recording two client calls renders two cards

- **WHEN** a trace records a client root and a Core-internal root
- **THEN** two cards render under that one trace
- **AND** each states its own recorded time, duration, status and own figures

#### Scenario: A trace whose root was not recorded still renders

- **WHEN** no root span is found for a listed trace
- **THEN** the trace still renders from its trace-level figures
- **AND** it states that the entry call was not recorded

#### Scenario: A card carries no turn number

- **WHEN** the listing renders
- **THEN** no card is labelled with a turn number
- **AND** each card is labelled by its trace

### Requirement: The trace listing is resolved by three queries whose scopes are one invariant

The listing SHALL be resolved over the live hop log by three queries, and by no rollup. A rollup is refreshed
periodically while the hop log is written live, and the listing's correctness now depends on rows a
session-id-scoped rollup omits.

**The paging query** SHALL group the hop log by trace, filtered by the session id, the
conversation's project, and a padded day range. It SHALL return exactly three things: the trace ids of the
page, each trace's earliest recorded time as the ordering key, and each trace's latest recorded time. It MUST
NOT return figures — nothing consumes them, and a figure resolved under a session-id filter is the defect this
change removes.

**The root query** SHALL return **every** root span of the page's traces, located by trace id, and MUST NOT be
filtered by session id. It SHALL project only cheap columns: the trace and span ids, the recorded time, the
operation duration, the success flag and response status, the token total, the chain price and the call's own
price, the session id, the request endpoint, the event kind, the request message count, the deployment, and the
**project id**.

The project id SHALL appear in the root query's **projection** and MUST NOT appear in its **filter**. The
Core-internal marker is a comparison against the conversation's project, so the value has to be read; filtering
on it would drop the very rows the marker exists to identify. One name, required in one clause and forbidden in
the other, is where a reader tidying this query will go wrong, so the distinction SHALL be stated where the
query is built.

**The figures query** SHALL group the page's traces by trace and event kind, and MUST NOT be filtered by chat
id. It SHALL yield each trace's span count, token total, price total, its per-kind breakdown for the chips,
its failed-hop count, and the set of response ids the trace recorded.

**The root query and the figures query SHALL be scoped identically** — the page's trace ids and the same
padded window, with no session id and no project — differing only in the root-span predicate and in reading rows
rather than groups. This SHALL be verified as **one** invariant rather than as two filter lists compared by
eye. Divergence between these two scopes is the mechanism that produced every arithmetic correction this
design removes: when the figures cover rows the roots do not, a trace's totals stop reconciling with its cards
and the gap has to be patched field by field.

**Dropping the chat id from the figures query is what makes the figures correct without correction.** Scoped
by trace, the span count, tokens and price are simply the trace's own. There SHALL be no compensating
adjustment — no increment to a span count, no addition of a root's value to a sum — because there is nothing
left to compensate for.

**The figures query has a second call site, and the invariant SHALL hold at both.** The transcript states each
answer's own figures, so the Chat view SHALL resolve figures for the traces **its own transcript covers**,
scoped by those trace ids and a window padded from their own earliest and latest recorded times, with no chat
id and no project. It MUST NOT read them from whatever the listing happens to have paged in: the listing loads
a page at a time, so a message whose trace lies beyond the loaded pages would lose its figures, and which
messages were complete would depend on how far the reader had scrolled a different view. Each view SHALL fetch
what it displays; overlapping reads between the two are acceptable and SHALL NOT be avoided by sharing state
between them.

A narrower filter at that second call site reintroduces every correction this design removes, inside the Chat
view instead of the listing. The scope invariant SHALL therefore be asserted for both call sites, not only for
the listing's.

**The conversation's project SHALL filter the paging query and MUST NOT filter the other two.** It is
admissible on the paging query only because that query is already restricted to rows carrying the session id, and
a trace's session-id-carrying rows are single-project. On the other two it is destructive: a trace's
Core-internal calls are recorded under Core's own project while the client's rows carry the conversation's, so
filtering by the conversation's project deletes exactly the cards and the rows this design added. That
deletion is silent — the figures query would still count what the root query dropped — so the reason SHALL be
recorded where the queries are built, not only in this spec.

No query in the listing path SHALL name a request body or a response body column. Bodies are heavy, and
naming one makes the listing as slow as a transcript read.

The listing MUST NOT be gated on a schema probe of its own: it names no optional field.

#### Scenario: The figures query carries no conversation filter

- **WHEN** the listing's figures are requested for a page of traces
- **THEN** the query's filter names the page's trace ids and the padded window
- **AND** it names neither the session id nor the project

#### Scenario: The paging query carries the project and the chat id

- **WHEN** a page of traces is requested
- **THEN** the query's filter names the session id, its project, and the padded day range

#### Scenario: The root query and the figures query agree on scope

- **WHEN** both queries are built for the same page
- **THEN** their filters are equal but for the root-span predicate
- **AND** that equality is asserted as one property rather than as two enumerated filter lists

#### Scenario: A trace's totals reconcile with its cards without adjustment

- **WHEN** a trace records a client root, three children and a Core-internal root
- **THEN** the trace's span count is five
- **AND** no increment is applied to it for a root missing from the conversation's row set

#### Scenario: No listing query reads a body column

- **WHEN** any of the three queries is built
- **THEN** it names neither a request body nor a response body column

#### Scenario: The root query projects the project id but does not filter on it

- **WHEN** the root query is built
- **THEN** its projection names the project id
- **AND** its filter does not

#### Scenario: The Chat view resolves figures for its own transcript's traces

- **WHEN** the transcript resolves and covers traces beyond those the listing has paged in
- **THEN** figures are requested for the transcript's own trace ids
- **AND** every answer states its trace's figures regardless of how far the listing has been scrolled

#### Scenario: The second call site is held to the same scope invariant

- **WHEN** the figures query is built for the transcript's traces
- **THEN** its filter names those trace ids and a padded window derived from them
- **AND** it names neither the session id nor the project

### Requirement: The trace listing's time bounds are padded whole UTC days

Every time bound in the listing path SHALL be expanded to whole days in **UTC**, and SHALL then be padded by
one further day at each end.

Whole days are the right granularity because the hop log is partitioned by UTC day, so widening a bound to a
day boundary costs nothing while a narrower bound saves nothing.

UTC is required because the partition is a UTC day. Rounding to a **local** day widens the lower bound
harmlessly but narrows the upper one — a local end-of-day falls hours short of the UTC day's end — and rows in
that gap are dropped with no error.

**Padding by a further day is required, and rounding to the containing day is not sufficient.** A root span
begins before its children, by tens to hundreds of milliseconds and with no stated upper bound, and a
Core-internal root fires when its parent completes — measured at 36 seconds after the parent's last child on
one trace, and longer for long-running calls. A bound taken from the rows a chat-id-scoped query can see and
rounded to the containing day therefore has **zero** margin at exactly the boundary these offsets straddle: a
root recorded at 23:59:59.7 falls outside a window that starts at 00:00:00.0 of its child's day.

The bounds SHALL be derived from the **page's** traces rather than from the conversation's own span. A
conversation-wide window would make the figures query read one partition per day of the conversation's life on
every page fetch; the page's own window is minutes wide, and stays one to three partitions after padding
however long the conversation ran.

This SHALL be asserted by a query-shape test, and the assertion SHALL cover the **padding**, not only the
UTC-ness. A test that checks only that a bound falls on a UTC day boundary passes a query that still clips.

#### Scenario: A day bound is padded beyond the containing day

- **WHEN** a window is derived from a page whose traces were recorded at 12:00 UTC on one day
- **THEN** the lower bound is the start of the previous UTC day
- **AND** the upper bound is the end of the following UTC day

#### Scenario: A root recorded just before midnight is inside the window

- **WHEN** a root span is recorded at 23:59:59.7 UTC and its first child at 00:00:00.1 UTC the next day
- **THEN** both rows fall inside the derived window

#### Scenario: The window is derived from the page, not the conversation

- **WHEN** a page of traces spanning ten minutes is fetched from a conversation that ran for a year
- **THEN** the window covers those ten minutes plus the padding
- **AND** it does not span the conversation's activity

#### Scenario: The shape test asserts the padding

- **WHEN** the listing's query-shape test runs
- **THEN** it fails a query whose bounds are the containing UTC day without padding

### Requirement: The trace listing pages by offset in ascending start order

The listing SHALL page, appending each page to those already shown, and SHALL NOT impose a fixed ceiling on
how much of a conversation can be reached.

**The order SHALL be ascending by each trace's earliest recorded time, tie-broken by trace id.** The ascending
direction is not cosmetic: it is what makes offset paging sound here. The listing reads a live table, so rows
arrive between one page fetch and the next; ordered ascending, a newly recorded trace sorts past the last page
fetched and the offsets already consumed do not shift. The tie-break is required for the same reason — equal
start times with no discriminator make a page boundary arbitrary and therefore unstable.

**A newest-first order MUST NOT be introduced while the listing pages by offset.** Under a descending order a
new trace sorts to the front and displaces every row after it, so a later page re-serves rows already shown
and skips others. Newest-first is admissible only via keyset paging on the ordering key, which requires the
cursor bound to be expressed over the **aggregated** start time: filtering the underlying rows by the cursor
instead changes the computed start time of a trace straddling it, and that trace reappears on the next page.
The sort direction SHALL therefore be treated as a constraint with a precondition, not as a display option.

**The listing SHALL discard a trace it has already loaded.** A late-arriving row can lower a trace's earliest
recorded time and move it relative to a page boundary, which both offset and keyset paging expose. Rejecting
an already-loaded trace id makes the duplicate impossible rather than unlikely.

**The number of cards rendered for one trace SHALL be bounded, and reaching that bound SHALL be disclosed.**
Traces exist whose root count runs into the dozens. Because a trace's own figures are not bounded by that cap,
a capped trace's totals legitimately exceed the sum of the cards on screen — so the listing SHALL state how
many further calls the trace records rather than truncating in silence.

#### Scenario: A page is appended rather than replacing what is shown

- **WHEN** the reader reaches the end of the loaded traces and a further page resolves
- **THEN** the new traces are appended below those already shown

#### Scenario: The order is ascending with a tie-break

- **WHEN** a page of traces is requested
- **THEN** the query sorts ascending by the trace's earliest recorded time
- **AND** the trace id is the tie-break key

#### Scenario: An already-loaded trace is not rendered twice

- **WHEN** a page returns a trace id already loaded
- **THEN** that trace renders once

#### Scenario: A trace beyond the card cap discloses the remainder

- **WHEN** a trace records more roots than the card cap allows
- **THEN** the rendered cards are capped
- **AND** the trace states how many further calls it records

### Requirement: A card is identified by its own recorded call, not by message text

A card SHALL be identified by the deployment its call named, falling back to the request endpoint where the
deployment is not recorded. A pass-through root records neither a deployment nor an event kind, but does
record its endpoint, its status, its duration and its request message count — so the endpoint is what names
it, and such a card is legible without the other three.

**A card MUST NOT carry body-derived content.** No message text, no question, no excerpt. This is what
separates the listing from the transcript: with no body-derived field on a card, the listing renders without a
body read, and a body read that fails cannot empty it.

A card SHALL state its own recorded time, its own duration, its own status, its own token total and its own
price, each from its own row. Its price SHALL be stated as a pair — what the call spent itself against what
its chain spent — so a call that is free itself but expensive downstream reads as exactly that. The chain
figure SHALL be the root's own recorded chain price, which equals the sum of its subtree's own prices.

A card's status SHALL come from its own success flag and response status. Whether the trace contains failures
elsewhere SHALL be stated as a trace-level fact and MUST NOT be presented as this card's status.

Long values SHALL be truncated with the shared ellipsis-tooltip control, so a long endpoint stays reachable.

#### Scenario: A card is named by its deployment

- **WHEN** a card's root records a deployment
- **THEN** the card is titled by that deployment

#### Scenario: A pass-through card is named by its endpoint

- **WHEN** a card's root records no deployment and no event kind
- **THEN** the card is titled by its request endpoint
- **AND** it still states its status, duration and request message count

#### Scenario: No card carries message text

- **WHEN** the listing renders
- **THEN** no card states a question, a message or any body-derived excerpt

#### Scenario: A free call with downstream spend reads as a pair

- **WHEN** a root records no price of its own and a chain price of $0.02895
- **THEN** the card states its own spend as unavailable and its chain spend as $0.02895

#### Scenario: A card's own facts are labelled apart from its trace's figures

- **WHEN** a card renders beside its trace's figures
- **THEN** each of its own facts is labelled with what it states — its own tokens, its own cost, the chain
  cost — so none can be read as a trace figure
- **AND** no two of those labels name the same quantity

#### Scenario: A trace states its figures once, however many cards it has

- **WHEN** a trace records more than one client call
- **THEN** its span count, tokens and price are stated once for the trace
- **AND** they are not repeated on each of its cards

#### Scenario: A card's status is its own, not its trace's

- **WHEN** a card's own call succeeded and another hop in its trace failed
- **THEN** the card states success
- **AND** the failure is stated as a trace-level fact

### Requirement: A trace's system requests are marked as such

A card whose root is recorded under a **different project than the conversation's** SHALL be marked as a
**system request** — a call the platform made rather than the client. Core makes its own service calls —
title generation and similar — under its own project, while the client's rows carry the conversation's, so
the projects differing is a categorical signal rather than an inference.

The marker's wording SHALL claim no more than the predicate establishes. The predicate is a project
mismatch, so the marker names *who did not make the call* rather than naming Core specifically; and the call
it marks is a real billed one, stated with its own duration, tokens and cost, so the wording MUST NOT imply
the call is internal bookkeeping.

The marker MUST NOT be derived from the size or shape of a request. The observable pattern for such calls —
two messages, a small request, a smaller response — is a heuristic that a new client breaks, and it says
nothing about who made the call.

The project the marker compares against MUST NOT be hard-coded. Core's own project is deployment
configuration, and a fixed name silently stops marking anything on an instance configured differently.

**The marker SHALL ship with the two-card presentation, not after it.** A trace's figures include its
system requests, so a trace's total legitimately exceeds its client card's chain total — measured at
$0.0291008 against $0.02895 on one trace, the $0.0001508 difference being title generation. Unmarked, that
difference reads as an arithmetic fault; marked, it reads as the platform's own overhead, itemised.

The marker SHALL agree with the labelling rule that names a trace's own client call. The two are independent
statements about the same card and MUST NOT be allowed to disagree.

#### Scenario: A system request is marked

- **WHEN** a card's root is recorded under a project other than the conversation's
- **THEN** that card is marked as a system request

#### Scenario: A client call sharing the conversation's project is not marked

- **WHEN** a trace's sole root carries no chat id but carries the conversation's project
- **THEN** that card is not marked as Core-internal

#### Scenario: The marker is not a size heuristic

- **WHEN** a client call records two messages and a small body
- **THEN** it is not marked as Core-internal on that basis alone

#### Scenario: A trace total exceeding its client card is explained

- **WHEN** a trace's price total exceeds its client card's chain price
- **THEN** a Core-internal card accounts for the difference

### Requirement: The trace listing's structural assumptions are asserted, not assumed

The listing's correctness rests on properties of the recorded data that hold today and are not enforced by the
source. Each SHALL be expressed as a guard that **fails loudly** when the data stops satisfying it, rather
than as a comment or a note. A structural assumption left implicit is one that turns into a silently wrong
figure when the shape of the data changes.

The guarded properties SHALL be:

1. **One conversation per trace.** No trace carries two distinct non-empty chat ids. This is what licenses
   locating rows by trace id alone, in the root query, the figures query and the hop read.
2. **One project among a trace's labelled rows.** This is what licenses filtering the paging query by the
   conversation's project.
3. **At most one Core-internal root per trace.** This bounds the ordinary two-card presentation.
4. **Exactly one root where no root carries the chat id.** This is what makes "otherwise the trace's sole
   root" a total rule rather than a choice among candidates.
5. **The labelling rule agrees with the Core-internal marker.** A trace carrying both a chat-id-bearing root
   and another root under the conversation's own project would split them; no such trace is recorded, so the
   agreement is guarded rather than relied upon.

A guard tripping SHALL be surfaced as a fault to be investigated, and MUST NOT be handled by silently choosing
one of the candidates.

#### Scenario: A trace carrying two conversations trips a guard

- **WHEN** a trace is observed carrying two distinct non-empty chat ids
- **THEN** the guard fails
- **AND** the listing does not silently attribute the trace to one of them

#### Scenario: A second unlabelled root under the conversation's project trips a guard

- **WHEN** a trace carries a chat-id-bearing root and another root under the conversation's own project
- **THEN** the guard for the labelling rule fails

#### Scenario: The ordinary shapes trip no guard

- **WHEN** the listing renders a single-root trace, and a trace with a client root plus one Core-internal root
- **THEN** no guard fails

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

### Requirement: Conversation detail feedback reads the rating source

The detail view SHALL read this conversation's ratings from the rating source and SHALL state, **in the
feedback panel**, how many were positive and how many negative. A conversation with no ratings SHALL state
zero in both directions rather than rendering them as unavailable.

Those figures SHALL come from an **aggregate scoped to the conversation**, not from counting the rows the
panel loaded. The listed ratings are bounded, so counting them reports the bound rather than the conversation:
a conversation with more rated responses than the view requested would state the count of the ones on screen
while presenting it as the conversation's total. The figures SHALL therefore be exact regardless of how many
the panel lists, and the list's own bound SHALL be disclosed separately.

The negative figure SHALL be composed on the same terms as the grid's — the zero and negative counts
together — and SHALL carry the same keyboard-reachable caveat where part of it is not attributable to a
captured submitted form.

The feedback panel SHALL list the conversation's rated **responses**, most recently rated first. The rating
source rolls a response's rate events into one row per rated response, so the list's grain is the response
rather than the individual event: a response rated more than once appears once. Each listed entry SHALL state
its direction, and the time it was rated. Where a response's first and last rating times differ, the entry
SHALL state the window rather than a single time, so a re-rated response does not present its latest rating as
its only one.

An entry whose response carries more than one distinct rating value SHALL state that its own ratings
disagree. The source reports that condition directly, and a single direction shown for such a response would
present one side of a contested rating as the response's verdict.

Each entry SHALL state how many comments its response carries. The comment **count** is catalogued
non-sensitive and is therefore stated for every caller. The comment **text** is catalogued sensitive, so it
SHALL be named only when the fetched schema reports it — the same gate the transcript's body columns use —
and an entry SHALL distinguish a response with no comments from one whose comment text this caller may not
read. An entry MUST NOT render a comment as flatly unavailable where the count says there is one.

Each card, and each assistant message, SHALL also show the ratings attributed to its trace, and attribution
SHALL be an **exact join on the response id**. The trace's figures query resolves the set of response ids the
trace recorded, and the rating source is grained by response id, so the two join directly.

Attribution MUST NOT fall back to time. The former rule — a rating belongs to the last trace that had started
when the rating was submitted — is not stable under a paged listing: it is evaluated over the traces loaded
so far, so a rating submitted after the last loaded trace attaches to that trace and then moves to a
different card once the next page arrives. A figure that changes because the reader scrolled is worse than an
absent one.

A rating whose response id matches no loaded trace SHALL therefore go unattributed rather than being placed
by time. The panel's own figures come from an aggregate scoped to the conversation rather than from what the
listing attributed, so such a rating is still counted — it is left unplaced on a card, not lost.

When more rated responses exist than the view requested, the panel SHALL say the list is partial rather than
presenting it as complete. That disclosure is about the **list**; the panel's direction figures are exact and
SHALL NOT be qualified by it.

#### Scenario: Rating counts render with the ratings they summarise

- **WHEN** a conversation has positive and negative ratings
- **THEN** the feedback panel states the count in each direction

#### Scenario: The counts are exact, not the loaded subset

- **WHEN** a conversation has more rated responses than the panel lists
- **THEN** the stated direction counts cover every rated response of the conversation
- **AND** they are not derived from the listed entries

#### Scenario: An unrated conversation reports zero

- **WHEN** a conversation has no ratings
- **THEN** the feedback panel states zero in both directions

#### Scenario: An assistant message shows its turn's ratings

- **WHEN** a rated response's id is among those the turn's trace recorded
- **THEN** that turn's assistant message shows it in the matching direction
- **AND** the attribution does not depend on when the rating was submitted

#### Scenario: Individual ratings are listed

- **WHEN** a conversation has ratings
- **THEN** the feedback panel lists each rated response with its direction and rating time, most recently
  rated first
- **AND** a response rated more than once appears as one entry rather than one per event

#### Scenario: A re-rated response states its window, not one time

- **WHEN** a listed response's first and last rating times differ
- **THEN** the entry states the window rather than a single time

#### Scenario: A contested response says its ratings disagree

- **WHEN** a listed response carries more than one distinct rating value
- **THEN** the entry states that its ratings disagree

#### Scenario: A listed rating's comment is marked unavailable

- **WHEN** the feedback panel lists a response carrying comments and the schema reports no comment text column
- **THEN** the entry states how many comments the response carries
- **AND** the comment text renders as unavailable to this caller rather than as absent
- **AND** that is distinguished from a response carrying no comments at all

#### Scenario: Comment text is read where the schema reports it

- **WHEN** the schema reports the comment text column
- **THEN** the query names it and the entry renders the comment

#### Scenario: A response with no rating value is labelled neither way

- **WHEN** a listed response's rate events carried no rating value at all
- **THEN** the entry states that it carries no rating value
- **AND** it is labelled neither positive nor negative, matching the figures that count it in neither

#### Scenario: The comment count is stated alongside a readable comment

- **WHEN** a listed response carries three comments and this caller may read the comment text
- **THEN** the entry states the count as well as the text
- **AND** the text is not presented as the response's only comment

#### Scenario: A conversation-wide figure is not announced as period-scoped

- **WHEN** the detail view's rating figures render
- **THEN** their accessible names state the conversation's ratings without claiming a selected period
- **AND** the grid's own figures, which are period-bounded, keep an accessible name that says so

#### Scenario: A partial rating list says so

- **WHEN** a conversation has more rated responses than the view requested
- **THEN** the panel states that the list is partial
- **AND** the panel's direction figures are not qualified by that disclosure

#### Scenario: A card's ratings are joined by response id

- **WHEN** a rated response's id is among those a loaded trace recorded
- **THEN** that trace's card shows the rating in the matching direction

#### Scenario: An unmatched rating is left unplaced rather than guessed

- **WHEN** a rated response's id matches no loaded trace
- **THEN** no card is credited with that rating
- **AND** the feedback panel's direction figures still count it

#### Scenario: Attribution does not move when a further page loads

- **WHEN** a rating is attributed to a trace and a further page of traces is appended
- **THEN** the rating stays on the same card

### Requirement: The conversation detail view presents its traces without a view switch

The conversation detail view SHALL present the conversation's **traces** and SHALL NOT offer a view switch.
The transcript is no longer a view of its own: a conversation's readable exchange is the request history of
its entry span, which the trace's own Chat tab states in the place where everything else about that trace is
stated.

The detail body SHALL render the trace listing, grouped by trace and carded by root span as
**The conversation trace listing groups by trace and cards by root span** defines, each card opening its
trace's hop chain. The conversation's header and the supporting panels beside the listing SHALL be
unaffected, and no body read SHALL be issued when the page opens.

A conversation whose trace listing is empty SHALL render the listing's own empty state, and a failed listing
read SHALL be reported as a failure there — both exactly as they already are.

Closing an open hop chain SHALL return to the trace listing.

No page of the console SHALL offer a conversation-level transcript, and none SHALL state that one is
unavailable: an option that no longer exists is not an option to explain.

#### Scenario: The detail view opens on its traces

- **WHEN** a conversation's detail view loads
- **THEN** the trace listing renders
- **AND** no view switch is offered
- **AND** no body read has been issued

#### Scenario: A trace in the list opens its hop chain

- **WHEN** a card of the trace listing is activated
- **THEN** that trace's hop chain opens

#### Scenario: Closing a hop chain returns to the listing

- **WHEN** an open hop chain is closed
- **THEN** the trace listing renders again

#### Scenario: A conversation with no traces states so

- **WHEN** a conversation's trace listing is empty
- **THEN** the listing states that no traces were recorded

#### Scenario: A caller without the body columns still gets the listing

- **WHEN** the schema reports no usable body column
- **THEN** the trace listing renders unchanged
- **AND** no statement about an unavailable transcript is made

### Requirement: A trace opens in place, stating its own figures and each span's

A trace SHALL be opened from the trace listing, and SHALL replace the listing **within the same view** with a
control returning to it. Opening a trace is a read of one trace and MUST NOT navigate away from the
conversation.

While a trace is open the conversation's header SHALL be replaced rather than kept above it. The trace states
its own identity and its own figures, and two stacked headers would leave the reader unsure which of them the
figures belong to.

**Ordering.** The rows SHALL be ordered by the recorded time of the span each stands for, and every row SHALL
state its own absolute recorded time. Measured over a 251-span trace, no child span began before its parent and
all 25 tied timestamps were between siblings — never between an ancestor and a descendant — so a tie means
genuine concurrency and any stable order among tied spans is honest. Spans from different parts of a trace
**interleave**: one sampled span's children spanned 22.8 s with 11 spans from elsewhere starting inside that
window, so the view MUST NOT present any group of spans as a contiguous block of time.

**A span's recorded duration SHALL be stated where the producer reported one, and a reported zero SHALL be
treated as no report.** Duration is recorded on effectively every span: over 325 455 spans in one measured
week, 51 reported zero — 0.016%, all in a single event-kind bucket — while `llm_call`, `embedding`, `mcp` and
`route` reported a minimum above zero and not one zero between them. The zero-handling rule is why a zero is
not rendered as `0 ms`: DIAL clamps its own measurement at zero, so on a core predating the field the
non-nullable fallback also stores zero, and the view cannot tell a real sub-millisecond operation from an
unreported one. **An offset from the start of the trace, and any duration bar drawn to scale against the
turn, SHALL NOT be rendered** — spans interleave, so a bar would assert a timeline the ordering rule refuses
to claim.

Every row SHALL be typed, named, and — where it stands for a recorded span — selectable. **A failed span SHALL
keep its kind and carry its failure beside it**, never instead of it, under **A turn renders as a tree of
spans**. The failure rule SHALL be one predicate shared by the row and its detail, so a row marked as failed
can never open a detail reporting success.

**An MCP span SHALL be named by its server and by what it did.** The trace SHALL project the span's MCP method
and its tool-call name, and the row SHALL state the server together with the tool it called where one is
recorded and with the method otherwise. Naming the span by its tool or method alone leaves the server
invisible, so two protocol messages of different servers in the same second cannot be told apart; naming it
by the server alone leaves the call invisible, which is the one thing a reader opening a retrieval span is
looking for. Both SHALL be stated.

The trace MUST NOT present its MCP spans as the complete set of tools the model requested. A tool the calling
application implements internally never crosses a network boundary and is never logged: over one measured
trace, 43 of 48 requested tool calls produced exactly one MCP row each and 6 produced none, so the recorded
set under-reports model intent by roughly one call in eight. Every MCP-backed call did produce a row — no
rows are missing — so the view SHALL neither claim completeness nor report a missing row as an error.

**A span's routing chain SHALL be shown where recorded.** The span log carries the execution path as an
ordered list naming the deployments a request was routed through, application first and model last. Where
present it SHALL be rendered as that chain.

Selecting a span SHALL show its **facts** beside the tree — its kind and its outcome, its recorded time, its
duration where reported, its tokens and cost, its endpoint, its upstream, its calling deployment, its HTTP
status, its MCP method and tool where recorded, and its routing chain where recorded — while its **bodies**
render below the tree, under **The trace view splits the span tree from the selected span's bodies**. The
facts are reference values read once per hop; the bodies are the surface a reader works in, and the two SHALL
NOT compete for one column. Its request and response SHALL be read on demand for that span alone, under
**The inspector reads bodies in tiers, and never ships one whole** — a raw body MUST NOT reach the client
unread, and what does reach it SHALL be bounded and state its own clamp.

**Colour SHALL never be the only thing distinguishing one kind of row from another.** Every row states its
kind as text, so the rail colour is redundant by construction and the view SHALL NOT rely on a legend to
make its rows readable. Every colour SHALL come from a theme token that the project's palette defines: a
class naming a token the palette does not carry renders nothing at all, silently.

**The trace SHALL state the figures the listing states for it, and MUST NOT re-derive them from the spans it
read.** Its token total, cost, span count and status SHALL come from the same trace-level figures the
listing's group renders, and the opened root's own figures SHALL come from the same root row its card
renders, so the drawer and the card it was opened from cannot disagree. Summing the spans instead is wrong
whenever the span read is bounded, which is precisely when a trace is large enough for a reader to open it:
one measured 384-span trace read 300 spans and summed to 700 106 tokens and $1.01 against the trace's own
3 667 333 and $3.68 — a figure that is neither the trace's nor recognisably a part of it.

The status SHALL likewise be the trace's failed-span count rather than a failure seen among the spans read, for
the same reason: a failure past the bound would otherwise render the trace as OK. **No stated trace figure
SHALL be derived from a span's recorded duration**, whether or not durations are rendered per row: the span
read is bounded and the spans interleave, so neither a sum nor a span of them is the turn's latency.

#### Scenario: A rejected trace read still leaves the loading state

- **WHEN** the trace read rejects
- **THEN** no loading indicator remains
- **AND** the trace states that it could not be read

#### Scenario: Opening a trace replaces the listing in place

- **WHEN** a card of the trace listing is activated
- **THEN** that trace's tree renders in place of the listing
- **AND** the trace states the card it was opened from and its own trace id
- **AND** a control returns to the listing

#### Scenario: A turn's figures are the same in the list and in its trace

- **WHEN** a trace is opened from the trace listing
- **THEN** the tokens, cost and span count stated above the tree equal those the listing states for it
- **AND** they do not change when the span read is clipped by its bound

#### Scenario: Spans render in the order they were recorded

- **WHEN** a turn records spans at different times
- **THEN** their rows render in ascending order of recorded time
- **AND** each row states its own absolute recorded time

#### Scenario: A reported duration is stated

- **WHEN** a span reports a duration above zero
- **THEN** its row and its detail state that duration

#### Scenario: A reported zero duration is not stated as zero

- **WHEN** a span reports a duration of zero
- **THEN** no duration is rendered for it
- **AND** it is not rendered as zero milliseconds

#### Scenario: No timeline is drawn

- **WHEN** the tree renders a turn whose spans interleave
- **THEN** no row shows an offset from the start of the trace
- **AND** no duration bar is drawn to scale against the turn

#### Scenario: A failed span keeps its kind and states its failure

- **WHEN** a span did not succeed
- **THEN** its row states its kind of call and carries a failure marker beside it
- **AND** its detail reports the same verdict as its row

#### Scenario: An MCP span is named by its server and the tool it called

- **WHEN** an MCP span records a tool-call name
- **THEN** the row states the server and that tool
- **AND** the query that fetched it named the MCP method and tool-call columns

#### Scenario: An MCP span with no tool call is named by its server and its method

- **WHEN** an MCP span records a method but no tool-call name
- **THEN** the row states the server and that method

#### Scenario: Two protocol messages of different servers are distinguishable

- **WHEN** two toolsets each record an `initialize` span in the same second
- **THEN** each row names its own server
- **AND** the two rows are distinguishable from one another

#### Scenario: A routing chain renders as a chain

- **WHEN** a span records an execution path of an application followed by a model
- **THEN** the span's facts show that chain in that order

#### Scenario: Selecting a span shows its facts beside the tree and its bodies below it

- **WHEN** a span is selected
- **THEN** its kind, status, recorded time, tokens, cost, endpoint, upstream, caller and HTTP status render
  beside the tree
- **AND** its request, response and conversation render in the section below the tree
- **AND** its duration renders where the producer reported one
- **AND** its MCP method, tool and routing chain render where recorded
- **AND** no raw request or response body value reaches the client

#### Scenario: Every row states its type in words

- **WHEN** the tree renders its rows
- **THEN** each row states its kind as text rather than by colour alone

#### Scenario: The trace states no latency derived from span durations

- **WHEN** the trace states its own figures
- **THEN** they include its token total, its cost, its span count and its status
- **AND** no stated figure is derived from a span's recorded duration

#### Scenario: A clipped span list says so

- **WHEN** the span read is bounded below the turn's recorded span count
- **THEN** the view states that the list is partial

#### Scenario: The span tree contains the root the card describes

- **WHEN** a card whose root carries no conversation header is opened
- **THEN** that root appears as a row in the tree
- **AND** the span read's filter names the trace id and not the chat id
