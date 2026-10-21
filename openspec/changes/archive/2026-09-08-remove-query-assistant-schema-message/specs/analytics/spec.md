## ADDED Requirements

### Requirement: Generate sends the transcript and shows the proposed query

Activating Send SHALL append the user's request as a new message in the visible transcript and call
the `generateQuery` server action with the accumulated transcript — the user and assistant turns and
nothing else — which posts to the configured deployment's chat-completions endpoint on DIAL Core
(`QueryAssistantApi`, reusing `DIAL_CORE_API_URL` and Bearer auth). The admin console SHALL NOT add a
message of its own to the request: the assistant deployment owns its system prompt and resolves any
schema it needs through its own tools. Because the console sends no schema, no row data and no value
read out of the queried store can reach the assistant deployment by construction.

On success the assistant's reply SHALL be appended as a new message in the transcript, rendered as-is
(no SQL extraction applied to the rendered text). When the reply contains an extractable SQL block, that
message additionally renders the extracted SQL read-only with its own Copy and Run actions (see "Each
assistant message with extracted SQL offers inline Run and Copy"). On failure the system SHALL surface an
error notification (header, message, and request id when available); the just-sent user message SHALL
remain visible in the transcript and no assistant message SHALL be appended, so the user can retry or
continue the conversation without losing what they asked.

#### Scenario: Successful generation appends to the transcript

- **WHEN** the user submits a request and the assistant returns a reply
- **THEN** the user's request and the assistant's reply both appear as new messages in the transcript

#### Scenario: The request carries the transcript and nothing else

- **WHEN** the user submits a request
- **THEN** the messages sent are exactly the visible transcript, beginning with its first turn and ending
  with the user's request
- **AND** no system message is present

#### Scenario: No schema and no row data are sent

- **WHEN** any request is sent to the assistant
- **THEN** the request carries no entity name, no field list, and no value read out of the queried store

#### Scenario: Reply without SQL is a plain conversational turn

- **WHEN** the assistant reply contains no SQL block
- **THEN** the assistant's message is shown in the transcript with no Run or Copy action, and any
  previously loaded query is left untouched

#### Scenario: Generation failure notifies and preserves the transcript

- **WHEN** the `generateQuery` action returns a failure
- **THEN** an error notification is shown, the user's just-sent message remains in the transcript, and
  no assistant message is appended

### Requirement: The SQL editor reads the selected source from the builder context

Every part of the query builder that needs the selected entity, its fields, or the served function
catalog SHALL read them from the shared query-builder context rather than receive them as props, so a
single value decides which source is in play. This SHALL include the SQL editor's schema-aware
autocomplete. The AI panel SHALL NOT be among them: it sends no source information, so it reads no
source at all and the toolbar selection SHALL NOT change what it sends.

#### Scenario: SQL autocomplete follows the selected source

- **WHEN** the user selects a different source and opens the SQL view
- **THEN** the editor's completions offer that source's fields

#### Scenario: The assistant request is independent of the selected source

- **WHEN** the user selects a different source and sends a request to the assistant
- **THEN** the messages sent are unchanged by that selection

## MODIFIED Requirements

### Requirement: A saved query's primary source

A saved query's `source` is a set of entities, so every surface that needs exactly one entity — the
server-side schema prefetch, the toolbar's source selector, and the SQL editor's autocomplete — SHALL
use the query's **primary source**, derived in one place from the
stored query alone: the structured body's `entity` when the query carries a structured body,
otherwise the first element of `source`. Because the service sorts `source` alphabetically, the
primary source of a composite SQL query is its alphabetically first entity: an arbitrary but stable
pick, chosen so field autocomplete keeps working rather than being switched off for composite
queries.

The frontend SHALL NOT infer a primary source from the SQL text, and SHALL NOT merge the schemas of
several sources into one field list. A query with neither a structured body nor a non-empty `source`
SHALL resolve to no primary source, and the page SHALL then load no schema rather than requesting
one for an empty entity name.

#### Scenario: A structured body's own entity is the primary source

- **WHEN** a saved query carries a structured body targeting `dial_usage_log` and a one-element `source`
- **THEN** its primary source is `dial_usage_log`

#### Scenario: A single-source SQL body resolves to that source

- **WHEN** a saved query carries a SQL body and a one-element `source`
- **THEN** its primary source is that element

#### Scenario: A composite SQL body resolves to its first source

- **WHEN** a saved query carries a SQL body joining two entities, so `source` holds both sorted alphabetically
- **THEN** its primary source is the first of the two
- **AND** the fields offered to the SQL autocomplete are that entity's fields only

#### Scenario: No source at all loads no schema

- **WHEN** a saved query carries neither a structured body nor a non-empty `source`
- **THEN** no entity schema is requested
- **AND** the builder renders without fields rather than reporting a failed schema load

## REMOVED Requirements

### Requirement: The query assistant is given the selected source and its columns

**Reason**: The assistant deployment owns its own system prompt and reaches the analytics catalog through
its own tools, so it discovers the entity list and any entity's schema without being told. Sending a
client-built schema message duplicated that and grew every request body in proportion to the selected
entity's column count.

**Migration**: None for callers — the server action's signature is unchanged and it still sends whatever
message list it is given. For users: the entity selected in the toolbar no longer reaches the assistant, so
a request that depends on a particular source SHALL name that source in its own text. The schema-only
privacy guarantee this requirement carried is preserved by "Generate sends the transcript and shows the
proposed query", which forbids sending schema at all.

### Requirement: Generate calls the assistant and shows the proposed query

**Reason**: Replaced by "Generate sends the transcript and shows the proposed query". The request no longer
leads with a schema system message, so the requirement's message ordering and its "The schema message leads
the request" scenario no longer describe the system.

**Migration**: None. The server action, endpoint, auth, transcript rendering, SQL extraction, and failure
handling are unchanged; only the composition of the message list changes.

### Requirement: The selected source is read from the builder context

**Reason**: Replaced by "The SQL editor reads the selected source from the builder context". The AI panel no
longer reads the selected source, so the requirement's scope and its "The assistant follows the selected
source" scenario no longer describe the system.

**Migration**: None. The SQL editor's context-reading obligation carries over unchanged.
