## ADDED Requirements

### Requirement: The request side reads the whole request, rebuilt by the service where it stores deltas

An instance can store a chat request body as a delta of its parent turn: `request_body` then holds only the
messages the parent did not have, without the system keys, `tools` and `cache_control` markers it shares with
it. Decoding that value as the request would state a wrong message list, wrong role counts and no tools, with
nothing to tell the reader the request is cut. The service publishes the whole request as a second column,
`request_body_full`, and the status of its reconstruction as a third, `request_body_rebuild`; under whole
storage `request_body_full` returns the stored body and the status reads `stored`.

Every reader of the request side — the envelope, one message in full, the raw view, and the MCP, protocol and
embedding facts — SHALL read `request_body_full` together with `request_body_rebuild` wherever the fetched
hop-log schema reports `request_body_full`, and SHALL NOT read `request_body` there. Where the schema does not
report `request_body_full`, the request side SHALL be read from `request_body`, exactly as before; which column
is read SHALL be decided from the fetched schema alone, under **The hop body columns are schema-gated for two
independent reasons**, and the frontend MUST NOT carry a setting for the service's storage mode.

The request side SHALL be readable when the schema reports either request column. Both are `sensitive` and
`heavy`, so they are absent below FULL_ADMIN on the same terms as `request_body`, and the request tab is
withheld on the same terms.

`request_body_full` SHALL be read only for the one hop being inspected. It MUST NOT be projected by the
sessions listing, the trace tree or any query over more than one hop: each rebuilt row costs the service extra
reads. It MUST NOT appear in a filter, a sort, a grouping or an aggregate of any query this page issues.

A rebuilt body is the same JSON as the original request but not the same bytes — key order and whitespace may
differ. Sizes the inspector states for a request SHALL be measured on the body it decoded, and the inspector
MUST NOT compare that body or its size against `request_body_bytes`, `response_body` or any other stored value.

#### Scenario: A delta-stored hop states its whole request

- **WHEN** the schema reports `request_body_full` and a multi-turn session's later hop is opened
- **THEN** the Request tab lists every message of that turn's request, its per-role counts and its tools
- **AND** the list matches what the same hop states on an instance that stores the body whole

#### Scenario: An instance without the rebuilt column reads the stored body

- **WHEN** the fetched schema reports `request_body` but not `request_body_full`
- **THEN** the request side is read from `request_body`
- **AND** no query this page issues names `request_body_full` or `request_body_rebuild`

#### Scenario: The rebuilt column is never filtered, sorted or listed in bulk

- **WHEN** the trace view and its listing load and a hop is opened
- **THEN** `request_body_full` appears only as a projection of the one-hop body read
- **AND** no filter, sort, grouping or aggregate names it

### Requirement: A partially rebuilt request states that it is incomplete

The service rebuilds a request by walking its chain of parent turns, and a chain can be cut: the ancestors are
older than the service's lookup window, or a per-read cap on rounds or ancestors was reached on a very deep
session. It then returns the stored delta in `request_body_full` and reports `request_body_rebuild` as
`partial`. Without reading the status, a cut body looks the same as a whole one.

When the status is `partial`, the request side SHALL decode and render what was returned — its messages, role
counts, parameters and raw view — and SHALL state visibly, on the Request tab, on the Chat tab and in the raw view, that
the request is incomplete because its earlier turns could not be recovered. It is an expected state of the record,
not a failure of this console: it MUST NOT render as an error, MUST NOT replace the messages with an empty or
failed state, and MUST NOT be presented as the whole request. The statement SHALL be programmatically
associated with the content it qualifies, so assistive technology reads it with the request rather than as a
detached notice.

A status of `stored` or `rebuilt` SHALL render no such statement. A `NULL` status is a row with no stored body
and SHALL resolve exactly as a hop that recorded no request does today. Any other status the service reports
SHALL render no statement and SHALL NOT fail the read.

#### Scenario: A cut chain renders with an incomplete statement

- **WHEN** a hop's `request_body_rebuild` is `partial`
- **THEN** the Request tab renders the messages and role counts that were returned
- **AND** it states that the request is incomplete
- **AND** no error state is shown

#### Scenario: The raw view of a cut chain says it is incomplete

- **WHEN** the reader switches a `partial` hop's request to raw mode
- **THEN** the raw body is shown with the same incomplete statement

#### Scenario: The Chat tab of a cut chain says it is incomplete

- **WHEN** the reader opens the Chat tab of a `partial` hop
- **THEN** the turns that were returned render with the same incomplete statement

#### Scenario: A whole or rebuilt request carries no statement

- **WHEN** a hop's `request_body_rebuild` is `stored` or `rebuilt`
- **THEN** the Request tab shows no incomplete statement

## MODIFIED Requirements

### Requirement: The inspector reads bodies in tiers, and never ships one whole

Every read and decode stays server-side, exactly as the retained payload requirement states. The inspector
SHALL honour it by reading in **three tiers**, so that what crosses to the browser is bounded by what the
reader has actually asked to see:

1. **On opening a hop** — an envelope: the parameters, the per-role counts, and one entry per message giving
   its role, position and size, with its text and the arguments of anything it called each clamped to a stated
   length.
2. **On opening one message** — that message in full: its text and the arguments of anything it called, for
   that message alone.
3. **On switching to raw mode** — the body as read, clamped to a stated budget. On the request side that is the
   whole request where the service rebuilds it, under **The request side reads the whole request, rebuilt by
   the service where it stores deltas**, and the stored body elsewhere.

Every tier SHALL read the same request column, so the message a tier-2 read returns is the one the envelope
numbered at that position.

**A clamp SHALL state that it clamped, and by how much.** Silent truncation in an observability tool produces
a reader who believes they have read the whole request. Where tier 3 clamps, the response SHALL state the
size read alongside the size delivered.

**The envelope SHALL be bounded as a whole, not only per message.** A request of 56 messages — the average for
the messages dialect — clamped individually can still assemble into a payload larger than the rail will ever
show, so the envelope SHALL carry a total budget and SHALL state when it was reached. Past that budget a
message SHALL keep its role, position, size and the **names** of anything it called — the facts a reader
decides from — and give up only its text and its arguments, which tier 2 fetches one message at a time.

Sizes and counts SHALL be computed server-side from the body read. They are the numbers that let a reader
decide what to open, so they SHALL be present even for a message whose text was clamped away entirely.

#### Scenario: Opening a hop ships an envelope, not a body

- **WHEN** a hop is opened
- **THEN** what reaches the browser carries per-message roles, positions, sizes and clamped texts
- **AND** it carries no whole request or response body

#### Scenario: Opening one message fetches only that message

- **WHEN** the reader opens the full text of one message
- **THEN** that message's text and tool-call arguments are read server-side and returned
- **AND** no other message's value is returned with it

#### Scenario: A message opened from a rebuilt envelope is the one it numbered

- **WHEN** the envelope was read from the rebuilt request and the reader opens the message at one of its positions
- **THEN** the returned message is the one the envelope listed at that position

#### Scenario: A clamped raw body states what was withheld

- **WHEN** the raw body exceeds the delivered budget
- **THEN** the raw view states the size read and the delivered size
- **AND** it states that the content was clamped

#### Scenario: An envelope that reaches its total budget says so

- **WHEN** a request carries more messages than the envelope budget admits
- **THEN** the envelope states that it was clamped
- **AND** every message still carries its role, position and size
- **AND** a message past the budget still names anything it called, without its arguments
