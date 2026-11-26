## ADDED Requirements

### Requirement: The trace listing pages by keyset in descending start order

The listing SHALL page, appending each page to those already shown, and SHALL NOT impose a fixed ceiling on
how much of a session can be reached.

**The order SHALL be descending by each trace's earliest recorded time, tie-broken by trace id descending.** The
trace that started last SHALL be on top, and older traces SHALL load below it. The tie-break is required because
equal start times with no discriminator make a page boundary arbitrary and therefore unstable.

**The listing SHALL page by keyset, never by offset.** Under a descending order a newly recorded trace sorts to
the front, so an offset would shift by one for every trace recorded since the first page and a later page would
re-serve rows already shown and skip others. Each page after the first SHALL instead be bounded by a cursor: the
earliest recorded time and the trace id of the last trace the previous page returned. A page SHALL hold only
traces that sort strictly after the cursor in the listing's order.

**The cursor bound SHALL be expressed over the aggregated start time, never over the underlying rows.** Filtering
the rows by the cursor time changes the computed start time of a trace whose rows straddle it, and that trace
reappears on the next page with a later start than it really has.

**A trace recorded after the listing loaded SHALL NOT be inserted into it.** It sorts before the first page's
cursor, so no later page reaches it; it appears when the session detail is loaded again.

**The listing SHALL discard a trace it has already loaded.** A late-arriving row can lower a trace's earliest
recorded time and move it past the cursor, so the same trace can be returned by two pages. Rejecting an
already-loaded trace id makes the duplicate impossible rather than unlikely.

**The number of cards rendered for one trace SHALL be bounded, and reaching that bound SHALL be disclosed.**
Traces exist whose root count runs into the dozens. Because a trace's own figures are not bounded by that cap,
a capped trace's totals legitimately exceed the sum of the cards on screen — so the listing SHALL state how
many further calls the trace records rather than truncating in silence.

#### Scenario: A page is appended rather than replacing what is shown

- **WHEN** the reader reaches the end of the loaded traces and a further page resolves
- **THEN** the new traces are appended below those already shown

#### Scenario: The order is descending with a tie-break

- **WHEN** a page of traces is requested
- **THEN** the query sorts descending by the trace's earliest recorded time
- **AND** the trace id, descending, is the tie-break key

#### Scenario: The newest trace is on top

- **GIVEN** a session whose traces started at 10:00, 10:05 and 10:10
- **WHEN** the listing loads
- **THEN** the trace that started at 10:10 is first and the trace that started at 10:00 is last

#### Scenario: The first page carries no cursor

- **WHEN** the first page of traces is requested
- **THEN** the query carries no cursor bound and no offset

#### Scenario: A later page is bounded by the previous page's last trace

- **GIVEN** the previous page's last trace has earliest recorded time T and trace id X
- **WHEN** the next page is requested
- **THEN** the query admits only traces whose earliest recorded time is before T, or equals T with a trace id before X
- **AND** that bound is applied to the aggregated start time, not to the rows' recorded time

#### Scenario: A trace recorded after the listing loaded does not shift later pages

- **GIVEN** the first page is loaded
- **AND** a new trace is recorded in the session
- **WHEN** the next page is requested
- **THEN** the page holds no trace already shown and skips none that sorts after the cursor

#### Scenario: An already-loaded trace is not rendered twice

- **WHEN** a page returns a trace id already loaded
- **THEN** that trace renders once

#### Scenario: A trace beyond the card cap discloses the remainder

- **WHEN** a trace records more roots than the card cap allows
- **THEN** the rendered cards are capped
- **AND** the trace states how many further calls it records

### Requirement: A trace of the session can be found by its exact trace id

The session detail SHALL offer a search field above the trace listing that finds a trace of **this session** by
its trace id. The match SHALL be exact: the field's value, trimmed of surrounding whitespace, SHALL equal the
trace id. A substring or prefix of an id SHALL NOT match. The hop log indexes the trace id for equality, so an
exact match stays cheap however long the session ran; a partial match would read every row of the session.

The search SHALL be scoped exactly as the paging query is — the session, its project and its padded window — so
a trace id from another session SHALL NOT be found here, even though it exists in the hop log.

A match SHALL show that trace alone, rendered as the listing renders it, with its own figures and cards. No
match SHALL state that the session has no trace with that id, distinct from the state of a session with no
traces at all. An empty or whitespace-only field SHALL apply no search. Clearing the field SHALL restore the
newest-first listing from its first page.

A failed search SHALL show the listing's load-error state, not the no-match state: a failed read is not evidence
that the trace is absent.

#### Scenario: An exact trace id shows that trace alone

- **GIVEN** the session records a trace with id X
- **WHEN** the reader enters X in the search field
- **THEN** the listing shows the trace X only, with its figures and cards

#### Scenario: Surrounding whitespace is ignored

- **WHEN** the reader enters X with leading and trailing spaces
- **THEN** the search matches the trace X

#### Scenario: A partial id does not match

- **GIVEN** the session records a trace with id X
- **WHEN** the reader enters the first eight characters of X
- **THEN** no trace is shown
- **AND** the listing states that the session has no trace with that id

#### Scenario: A trace of another session is not found

- **GIVEN** a trace with id Y is recorded in another session
- **WHEN** the reader enters Y in this session's search field
- **THEN** the listing states that the session has no trace with that id

#### Scenario: The search query is scoped like the paging query

- **WHEN** a search for X is requested
- **THEN** the query's filter names the session, its project, the padded window and the trace id X

#### Scenario: Clearing the search restores the listing

- **GIVEN** a search shows one trace
- **WHEN** the reader clears the field
- **THEN** the listing shows the session's traces newest-first from the first page

#### Scenario: A failed search is not reported as no match

- **WHEN** the search read fails
- **THEN** the listing shows its load-error state
- **AND** it does not state that the session has no trace with that id

## REMOVED Requirements

### Requirement: The trace listing pages by offset in ascending start order

**Reason**: The listing orders traces newest-first, which offset paging over a live table cannot serve soundly.
**Migration**: Replaced by "The trace listing pages by keyset in descending start order".
