## REMOVED Requirements

### Requirement: Conversation turn list comes from the turns rollup and discloses its bound

**Reason**: The rollup's population is `length(chat_id) > 0`, and Core writes the conversation header per
request, so a trace whose root span carries no header is summed without it. Every figure this requirement
names — hop count, token total, cost, duration — is short by the root's own contribution for that shape, and
the root's status, endpoint and message count are absent altogether. The requirement also fixes the listing's
unit as a turn defined by the rollup, which cannot describe one client call; that is what the replacement
requires. Its bound-disclosure rule is superseded by paging.

**Migration**: The listing is rebuilt over `dial_usage_log` by the three queries defined under **The trace
listing is resolved by three queries whose scopes are one invariant**. The `turns` entity is no longer read by
this view. The prohibition this requirement carried — that the frontend MUST NOT maintain a second definition
of the listing's unit — is preserved and strengthened: the unit is now defined once, as a root span grouped by
trace, in **The conversation trace listing groups by trace and cards by root span**.

### Requirement: A turn is titled by the question it answered

**Reason**: The title was derived from the assembled transcript, which coupled the listing to a body read.
That coupling is what made a body-read failure blank the listing, and it is why the transcript could not be
loaded on demand. Cards now carry no body-derived content at all.

**Migration**: A card is identified from its own row under **A card is identified by its own recorded call,
not by message text** — the deployment it called, falling back to the request endpoint. The
ellipsis-tooltip rule for long values is preserved there. The transcript's own per-message presentation is
unchanged; only the listing stops reading it.

## ADDED Requirements

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
chat-id-scoped rollup omits.

**The paging query** SHALL group the hop log by trace, filtered by the conversation's chat id, the
conversation's project, and a padded day range. It SHALL return exactly three things: the trace ids of the
page, each trace's earliest recorded time as the ordering key, and each trace's latest recorded time. It MUST
NOT return figures — nothing consumes them, and a figure resolved under a chat-id filter is the defect this
change removes.

**The root query** SHALL return **every** root span of the page's traces, located by trace id, and MUST NOT be
filtered by chat id. It SHALL project only cheap columns: the trace and span ids, the recorded time, the
operation duration, the success flag and response status, the token total, the chain price and the call's own
price, the chat id, the request endpoint, the event kind, the request message count, the deployment, and the
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
padded window, with no chat id and no project — differing only in the root-span predicate and in reading rows
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
admissible on the paging query only because that query is already restricted to rows carrying the chat id, and
a trace's chat-id-carrying rows are single-project. On the other two it is destructive: a trace's
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
- **AND** it names neither the chat id nor the project

#### Scenario: The paging query carries the project and the chat id

- **WHEN** a page of traces is requested
- **THEN** the query's filter names the conversation's chat id, its project, and the padded day range

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
- **AND** it names neither the chat id nor the project

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

## MODIFIED Requirements

### Requirement: The conversation detail view switches between Chat and Trace

The detail view SHALL offer a switch between two views of one conversation: **Chat**, the recorded
transcript, and **Trace**, the conversation's traces. The switch SHALL indicate which view is current, SHALL
be reachable by keyboard, and SHALL NOT navigate away from the conversation.

Choosing a view is a **local** change and SHALL re-render only the region the switch governs. The
conversation's header and the supporting panels beside the view do not depend on which view is showing, and
SHALL NOT re-render when it changes. Opening a hop chain is the exception, and only because the header gives
way to the trace's own identity.

**The detail view SHALL open on Trace.** The trace listing renders from the conversation's own recorded
calls and needs no body read, so it is the view that can always be shown; the transcript depends on body
columns this caller may not be able to read and on rows that may not reconstruct.

**The Trace view SHALL land on the trace listing**, grouped by trace and carded by root span as
**The conversation trace listing groups by trace and cards by root span** defines, each card stating its own
recorded time, duration, status, own figures and rating counts, and each opening its trace's hop chain.
Landing on Trace MUST NOT open a hop chain directly: the reader has not chosen a trace, and picking one for
them presents an arbitrary default as the answer.

A conversation whose trace listing is empty SHALL render the listing's own empty state rather than refusing
the switch — the view still has something to say about why there is nothing to open. A failed listing read
SHALL be reported as a failure there, distinctly from an empty listing.

**The transcript's body read SHALL be issued when the reader switches to Chat, not when the page opens.**
While that read is outstanding the Chat view SHALL show a loading state, and the switch SHALL remain usable.
A body read that fails SHALL state so **inside the Chat view**, leaving the Trace view and the rest of the
page intact. Reading the transcript on page open made a body-read failure the whole page's failure, on a page
whose landing view does not depend on it.

**The switch's gating and the transcript's content states resolve at different times, and the view SHALL NOT
conflate them.** Whether this caller can read body columns at all is a **schema** fact: it is resolved from
the entity schema before any body query is issued, so it is known when the switch first renders and it
SHALL gate the Chat option there. Whether the transcript is aged out, not reconstructable, or was never
recorded are **data** facts about the rows themselves: they are resolved by the body read, so they SHALL be
stated inside the Chat view after the switch. Gating up front, content states inside.

The per-turn trace control on each assistant message SHALL keep its current behaviour: it opens a turn's hop
chain directly, without passing through the list.

Returning from a hop chain SHALL land on the view it was opened from. A reader who reached a hop chain from
the trace list and is returned to the transcript has been moved somewhere they were not, and has to find their
way back to the list to continue.

Where the Chat view is not offered — because the schema reports no usable body column, for either of the two
reasons a column can be missing — the switch SHALL still be rendered, with the Chat option disabled and its
reason stated, rather than removed. A control that disappears leaves the reader unable to tell an unavailable
view from a view that does not exist.

**In that state the view SHALL open on Trace**, not on the disabled Chat option. Opening on it makes the same
option current and unselectable at once, which is the expected path for every caller below FULL_ADMIN: the
disabled segment is not focusable, so keyboard navigation within the switch has no starting point, and the data
that *is* available has to be discovered.

The Chat option SHALL remain enabled whenever the transcript is merely **empty**. An aged-out, not
reconstructable or never-recorded transcript is a Chat view with something to say, and disabling the switch
would replace that statement with silence.

#### Scenario: Switching views keeps the conversation

- **WHEN** the user switches from Chat to Trace
- **THEN** the hop chain renders in place
- **AND** the page does not navigate away from the conversation

#### Scenario: The current view is indicated

- **WHEN** either view is shown
- **THEN** the switch indicates which of the two is current

#### Scenario: A caller without the body columns opens on the Trace view

- **WHEN** the schema reports no usable body column
- **THEN** the detail opens on the Trace view
- **AND** the Chat option is rendered, disabled, with its reason stated

#### Scenario: A per-turn control opens the trace on that turn

- **WHEN** the trace control on an assistant message is used
- **THEN** that turn's hop chain opens directly

#### Scenario: Switching to Trace lists the conversation's traces

- **WHEN** the user switches to Trace from the view switch
- **THEN** the conversation's traces render, one card per recorded root span, each stating its own figures
- **AND** no hop chain is opened and no hop read is issued

#### Scenario: A trace in the list opens its hop chain

- **WHEN** a card of the trace listing is activated
- **THEN** that trace's hop chain opens

#### Scenario: A conversation with no turns switches to an empty list

- **WHEN** the user switches to Trace on a conversation whose trace listing is empty
- **THEN** the trace listing states that no traces were recorded
- **AND** the switch is not refused

#### Scenario: Returning from a hop chain lands on the view it was opened from

- **WHEN** a hop chain opened from the trace list is closed
- **THEN** the Trace view is shown, still listing the traces
- **AND** a hop chain opened from an assistant message returns to the transcript instead

#### Scenario: An unavailable Chat view is disabled, not hidden

- **WHEN** the schema reports no usable body column
- **THEN** the switch renders with the Chat option disabled and its reason stated

#### Scenario: Choosing a view does not re-render the page around it

- **WHEN** the user switches between Chat and Trace
- **THEN** the conversation's header does not re-render
- **AND** the supporting panels beside the view do not re-render

#### Scenario: An empty transcript keeps the Chat view enabled

- **WHEN** the transcript is aged out, not reconstructable, or was never recorded
- **THEN** the Chat option stays enabled
- **AND** selecting it shows the statement for that cause

#### Scenario: The detail view opens on the trace listing

- **WHEN** a conversation's detail view loads and this caller can read body columns
- **THEN** the Trace view is current
- **AND** no body read has been issued

#### Scenario: The transcript's body read is issued on switching to Chat

- **WHEN** the user switches to Chat for the first time
- **THEN** the body read is issued at that point
- **AND** the Chat view shows a loading state until it resolves

#### Scenario: The Chat view fetches the figures it displays

- **WHEN** the transcript resolves
- **THEN** figures for the traces it covers are requested for that view
- **AND** they are not read from the listing's loaded pages

#### Scenario: A failed body read leaves the trace listing usable

- **WHEN** the transcript's body read fails
- **THEN** the Chat view states that the transcript could not be read
- **AND** the Trace view still lists the conversation's traces
- **AND** the page does not render its whole-page error state

#### Scenario: A schema-gated Chat option is decided without a body read

- **WHEN** the switch first renders
- **THEN** whether the Chat option is enabled was resolved from the entity schema
- **AND** no body query was issued to decide it

#### Scenario: An empty transcript's cause is stated after the switch, not before

- **WHEN** the transcript is aged out, not reconstructable, or was never recorded
- **THEN** the Chat option was enabled before the switch
- **AND** the cause is stated inside the Chat view once the body read resolves

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

### Requirement: A turn's trace opens in place, stating the turn's own figures

Each assistant message SHALL offer a control opening that turn's trace, and the view switch SHALL offer the
Trace view for the conversation. The trace SHALL replace the transcript **within the same view** and SHALL
offer a control returning to the transcript. Opening a trace is a read of one turn and MUST NOT navigate away
from the conversation.

While a trace is open the conversation's header SHALL be replaced rather than kept above it. The trace states
its own identity and its own figures, and two stacked headers would leave the reader unsure which of them the
figures belong to.

**Ordering.** The events SHALL be ordered by the recorded time of the hop that produced them, and every row
SHALL state its own absolute recorded time. Measured over a 251-hop trace, no child hop began before its
parent and all 25 tied timestamps were between siblings — never between an ancestor and a descendant — so a
tie means genuine concurrency and any stable order among tied hops is honest. Hops from different parts of a
trace **interleave**: one sampled hop's children spanned 22.8 s with 11 hops from elsewhere starting inside
that window, so the view MUST NOT present any group of hops as a contiguous block of time.

**Durations are not claimed.** The view MUST NOT render a hop duration, a duration bar, an offset from the
start of the trace, or any other per-hop wall-clock figure. All 251 hops of the sampled trace reported a
duration of zero: DIAL clamps its own measurement at zero, so on a current producer a reported zero is a real
sub-millisecond operation, but a core predating the field omits it and the non-nullable fallback stores zero
— on that producer version zero is indistinguishable from "not reported", and the view cannot tell the two
apart. Ordering and absolute times are the only temporal claims the data supports. This is a property of the
producer, and the view SHALL NOT compensate for it.

Every row SHALL be typed, named, and — where it stands for a recorded hop — selectable. A **failed** hop
SHALL be typed by its failure whatever its kind: on a trace the reader is looking for what broke. The failure
rule SHALL be one predicate shared by the row and its detail, so a row typed as an error can never open a
detail reporting success.

**An MCP hop SHALL be named by what it did.** The trace SHALL project the hop's MCP method and its tool-call
name and SHALL label the hop by the tool it called where one is recorded, falling back to the method and only
then to the server name. Labelling an MCP hop by its server name alone leaves the tool invisible, which is
the one thing a reader opening a retrieval hop is looking for.

The trace MUST NOT present its MCP hops as the complete set of tools the model requested. A tool the calling
application implements internally never crosses a network boundary and is never logged: over one measured
trace, 43 of 48 requested tool calls produced exactly one MCP row each and 6 produced none, so the recorded
set under-reports model intent by roughly one call in eight. Every MCP-backed call did produce a row — no
rows are missing — so the view SHALL neither claim completeness nor report a missing row as an error.

**A hop's routing chain SHALL be shown where recorded.** The hop log carries the execution path as an
ordered list naming the deployments a request was routed through, application first and model last. Where
present it SHALL be rendered as that chain.

Selecting a hop SHALL show its detail beside the stream: its category and status, its recorded time, its
tokens and cost, its endpoint, its upstream, its calling deployment, its HTTP status, its MCP method and tool
where recorded, and its routing chain where recorded. Its decoded request and response text SHALL be read on
demand for that hop alone, under **A hop's own request and response are read on demand** — a raw body MUST
NOT reach the client in any case.

**Colour SHALL never be the only thing distinguishing one kind of row from another.** Every row states its
type as text, so the rail colour is redundant by construction and the view SHALL NOT rely on a legend to
make its rows readable. Every colour SHALL come from a theme token that the project's palette defines: a
class naming a token the palette does not carry renders nothing at all, silently.

**The trace SHALL state the figures the listing states for it, and MUST NOT re-derive them from the hops it
read.** Its token total, cost, span count and status SHALL come from the same trace-level figures the
listing's group renders, and the opened root's own figures SHALL come from the same root row its card
renders, so the drawer and the card it was opened from cannot disagree. Summing the hops instead is wrong
whenever the hop read is bounded, which is precisely when a trace is large enough for a reader to open it:
one measured 384-hop trace read 300 hops and summed to 700 106 tokens and $1.01 against the trace's own
3 667 333 and $3.68 — a figure that is neither the trace's nor recognisably a part of it.

The status SHALL likewise be the trace's failed-hop count rather than a failure seen among the hops read, for
the same reason: a failure past the bound would otherwise render the trace as OK.

**The hop read SHALL be scoped by trace id alone, and MUST NOT be scoped by chat id.** Scoping it by the
conversation header excludes exactly the rows the listing counts — a root carrying no header, and the
Core-internal calls recorded under the trace — so the drawer would contradict the card that opened it.
Measured on one trace, the card states two hops while a header-scoped read returns one, and the root the card
describes is absent from its own span tree. No trace carries two distinct non-empty chat ids, so trace id
alone cannot draw in another conversation's rows.

The hop list SHALL be bounded and SHALL say so when it was cut short. A trace's hop count reaches into the
hundreds, and one observed turn recorded 1226 hops. The bound SHALL NOT be raised to accommodate such a
turn: filtering and on-demand disclosure are the answer, since a read large enough for the worst turn is a
read that punishes every other one.

**Opening a trace SHALL always leave the loading state, whatever the read does.** A read that rejects rather
than returning a failed result — the service unreachable, the session gone — SHALL open the trace stating that
it could not be read, not leave a loading indicator in place of the view. **A loading indicator SHALL NOT be
shown over an already-opened trace**, since a loaded chain beneath one reads as a chain that never loaded.

**An enrichment that fails SHALL NOT discard a read that succeeded.** The decoded model outputs that type the
stream's rows are an enrichment of the hop read, not a part of it: where resolving them fails or throws, the
hops SHALL still render, with their model-call rows typed generically. Rejecting the whole read would tell the
reader the trace could not be read while its rows were already in hand.

#### Scenario: A rejected trace read still leaves the loading state

- **WHEN** the trace read rejects
- **THEN** no loading indicator remains
- **AND** the trace states that it could not be read

#### Scenario: Opening a turn's trace replaces the transcript in place

- **WHEN** the trace control on an assistant message is used
- **THEN** that turn's event stream renders in place of the transcript
- **AND** the trace states the turn it belongs to and its own trace id
- **AND** a control returns to the transcript

#### Scenario: A turn's figures are the same in the list and in its trace

- **WHEN** a trace is opened from the trace listing
- **THEN** the tokens, cost and span count stated above the hop chain equal those the listing states for it
- **AND** they do not change when the hop chain is clipped by its bound

#### Scenario: The shortcut attributes each message to its own turn

- **WHEN** the whole conversation is assembled from one entry hop's body
- **THEN** each message carries the trace id of the turn that produced it
- **AND** the newest turn's figures appear only beneath the newest turn's answer

#### Scenario: Hops render in the order they were recorded

- **WHEN** a turn records hops at different times
- **THEN** their rows render in ascending order of recorded time

#### Scenario: No hop states a duration

- **WHEN** the trace renders its hops
- **THEN** no hop shows a duration, a duration bar or an offset from the start of the trace
- **AND** each hop shows its own absolute recorded time

#### Scenario: A failed hop is typed by its failure

- **WHEN** a hop did not succeed
- **THEN** it is typed as an error rather than by its event kind
- **AND** its detail reports the same verdict as its row

#### Scenario: An MCP hop is named by the tool it called

- **WHEN** an MCP hop records a tool-call name
- **THEN** the hop is labelled by that tool
- **AND** the query that fetched it named the MCP method and tool-call columns

#### Scenario: An MCP hop with no tool call falls back to its method

- **WHEN** an MCP hop records a method but no tool-call name
- **THEN** the hop is labelled by that method

#### Scenario: A routing chain renders as a chain

- **WHEN** a hop records an execution path of an application followed by a model
- **THEN** the hop's detail shows that chain in that order

#### Scenario: Selecting a hop shows its detail

- **WHEN** a hop is selected
- **THEN** its category, status, recorded time, tokens, cost, endpoint, upstream, caller and HTTP status
  render beside the stream
- **AND** its MCP method, tool and routing chain render where recorded
- **AND** no raw request or response body value reaches the client

#### Scenario: Every row states its type in words

- **WHEN** the stream renders its rows
- **THEN** each row states its type as text rather than by colour alone

#### Scenario: A failed enrichment still renders the hops

- **WHEN** resolving the decoded model outputs throws
- **THEN** the hops that were read still render
- **AND** the view does not state that the trace could not be read

#### Scenario: The trace states no latency derived from hop durations

- **WHEN** the trace states its own figures
- **THEN** they include its token total, its cost, its hop count and its status
- **AND** no stated figure is derived from a hop's recorded duration

#### Scenario: A clipped hop list says so

- **WHEN** the hop read is bounded below the turn's recorded hop count
- **THEN** the view states that the list is partial

#### Scenario: The span tree contains the root the card describes

- **WHEN** a card whose root carries no conversation header is opened
- **THEN** that root appears as a span in the tree
- **AND** the hop read's filter names the trace id and not the chat id

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
are the evaluation's own bookkeeping, and the detail view reads none of them.

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
- **AND** it names no `provenance`-tagged bookkeeping field of the enrichment

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
