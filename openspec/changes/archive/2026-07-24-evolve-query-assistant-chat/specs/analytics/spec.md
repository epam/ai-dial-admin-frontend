## MODIFIED Requirements

### Requirement: AI panel accepts a plain-language prompt with suggestions

In the AI view the rail SHALL render a heading, an explanatory description, a conversation transcript,
a multi-line text input for a plain-language request, and a Send action. While the transcript is empty
the rail SHALL additionally render a set of suggested-prompt chips; once at least one message has been
sent the chips SHALL no longer be shown. Clicking a suggested-prompt chip SHALL populate the text input
with that chip's prompt text. The Send action SHALL be disabled while the input is empty or a
generation request is in flight. All text SHALL be provided through i18n.

#### Scenario: Suggested prompt fills the input

- **WHEN** the AI view is shown, the transcript is empty, and the user clicks a suggested-prompt chip
- **THEN** the text input is populated with that chip's prompt text

#### Scenario: Suggestions hidden once a conversation has started

- **WHEN** at least one message has been sent in the AI view
- **THEN** the suggested-prompt chips are no longer shown

#### Scenario: Send disabled when input empty

- **WHEN** the text input is empty
- **THEN** the Send action is disabled

#### Scenario: Send disabled while in flight

- **WHEN** a generation request is in progress
- **THEN** the Send action is disabled and a loading indicator is shown

### Requirement: Generate calls the assistant and shows the proposed query

Activating Send SHALL append the user's request as a new message in the visible transcript and call
the `generateQuery` server action with the full accumulated `messages[]`, which posts to the configured
deployment's chat-completions endpoint on DIAL Core (`QueryAssistantApi`, reusing `DIAL_CORE_API_URL`
and Bearer auth). On success the assistant's reply SHALL be appended as a new message in the
transcript, rendered as-is (no SQL extraction applied to the rendered text). When the reply contains an
extractable SQL block, that message additionally renders the extracted SQL read-only with its own Copy
and Run actions (see "Each assistant message with extracted SQL offers inline Run and Copy"). On
failure the system SHALL surface an error notification (header, message, and request id when
available); the just-sent user message SHALL remain visible in the transcript and no assistant message
SHALL be appended, so the user can retry or continue the conversation without losing what they asked.

#### Scenario: Successful generation appends to the transcript

- **WHEN** the user submits a request and the assistant returns a reply
- **THEN** the user's request and the assistant's reply both appear as new messages in the transcript

#### Scenario: Reply without SQL is a plain conversational turn

- **WHEN** the assistant reply contains no SQL block
- **THEN** the assistant's message is shown in the transcript with no Run or Copy action, and any
  previously loaded query is left untouched

#### Scenario: Generation failure notifies and preserves the transcript

- **WHEN** the `generateQuery` action returns a failure
- **THEN** an error notification is shown, the user's just-sent message remains in the transcript, and
  no assistant message is appended

### Requirement: SQL is extracted from the assistant reply

The system SHALL provide a pure `extractSql(content)` utility that returns the trimmed contents of the
last fenced code block tagged `sql` (case-insensitive) in a single message's content. If no
`sql`-tagged block exists but an untagged fenced block does, that block SHALL be returned as a
fallback. If no fenced block exists, the utility SHALL return `null`. The utility SHALL be unit-tested.
It SHALL be applied independently to each assistant message in the conversation, so a conversation with
several assistant turns can have several messages each carrying their own extracted SQL (or none).

#### Scenario: Extract the sql-tagged block

- **WHEN** a message's content contains prose and a ` ```sql … ``` ` block
- **THEN** `extractSql` returns the block's SQL text, trimmed, without the fences

#### Scenario: Last block wins within a message

- **WHEN** a single message's content contains more than one fenced SQL block
- **THEN** `extractSql` returns the contents of that message's last block

#### Scenario: No block returns null

- **WHEN** a message's content contains no fenced code block
- **THEN** `extractSql` returns `null` for that message

#### Scenario: Extraction is independent per message

- **WHEN** a conversation has multiple assistant messages, some with SQL blocks and some without
- **THEN** each message's extraction result reflects only that message's own content

## REMOVED Requirements

### Requirement: A generated query loads automatically into the builder

**Reason**: Superseded by "Running a message's query loads it into the builder and executes it" and
"Toolbar Run and Copy are not shown in the AI view." Auto-loading the newest generation only made sense
when one proposal existed at a time; with a full conversation holding several candidate queries, loading
is now an explicit, per-message action (Run) rather than an automatic side effect of generating.
**Migration**: None for other views or the transport — this only changes when/how a query reaches the
Builder/JSON/SQL views from the AI view. Operators now click Run on the specific message whose query
they want to load and execute, instead of it loading automatically after the newest generation.

## ADDED Requirements

### Requirement: Each assistant message with extracted SQL offers inline Run and Copy

An assistant message whose content yields a non-null result from `extractSql` SHALL render that SQL
read-only beneath the message, with its own Copy action and its own Run action. A message with no
extracted SQL SHALL render neither action. The Run action SHALL be disabled while any message's Run is
already in progress (translating or executing), and SHALL also be disabled on the message that is
currently the loaded query (see "Running a message's query loads it into the builder and executes it")
— that disabled state is the only indicator of which message is current; there is no separate badge.

#### Scenario: SQL-bearing message shows Run and Copy

- **WHEN** an assistant message has extracted SQL
- **THEN** that message renders the SQL read-only with a Copy action and a Run action

#### Scenario: Plain message shows neither action

- **WHEN** an assistant message has no extracted SQL
- **THEN** that message renders no Copy action and no Run action

#### Scenario: Run disabled while another run is in progress

- **WHEN** a message's Run has been clicked and its translate-and-execute is still in flight
- **THEN** every message's Run action in the transcript is disabled until it completes

#### Scenario: Run disabled on the currently loaded message

- **WHEN** a message's query is the currently loaded query
- **THEN** that message's Run action is disabled, while other SQL-bearing messages' Run actions remain
  enabled

### Requirement: Running a message's query loads it into the builder and executes it

Clicking a message's Run action SHALL translate that message's SQL into a structured query and, when
the builder can represent it, hydrate the builder state so the Builder, JSON, and SQL views all reflect
it; when the query cannot be represented (or translation fails), the raw SQL SHALL remain runnable and
visible in the SQL view instead. In the same action, the system SHALL execute the query (via the
structured or SQL execution path, matching whichever form was loaded) and show the result in the
existing result area. The AI view SHALL remain active after Run (no forced view switch). The message
whose Run was most recently clicked SHALL have its Run action disabled to indicate it is the currently
loaded query (see "Each assistant message with extracted SQL offers inline Run and Copy") — no separate
visual badge is used.

#### Scenario: Representable query loads and runs

- **WHEN** the user clicks Run on a message whose query the builder can represent
- **THEN** the Builder, JSON, and SQL views are hydrated with that query, the query executes, and the
  result appears in the result area

#### Scenario: Non-representable query still runs via SQL

- **WHEN** the user clicks Run on a message whose query the builder cannot represent (or translation
  fails)
- **THEN** the raw SQL remains visible and runnable in the SQL view, and the query still executes via
  the SQL path

#### Scenario: Running an earlier message updates which query is loaded

- **WHEN** a later message's Run was previously clicked and the user then clicks an earlier message's
  Run
- **THEN** the earlier message's Run action becomes disabled, the later message's Run action becomes
  enabled again, and the Builder/JSON/SQL views and any subsequent toolbar-independent Copy reflect the
  earlier query instead

#### Scenario: Changing the entity clears the conversation and loaded state

- **WHEN** a query has been run from the AI view and the user selects a different entity
- **THEN** the conversation is cleared entirely (no messages remain, so no Run action is disabled or
  present)

### Requirement: Toolbar Run and Copy are not shown in the AI view

When the AI view is active, the Query Builder toolbar SHALL NOT render its Run action or its Copy
action; the entity selector and time filter controls remain. Running and copying a query in the AI view
happens only through the per-message actions on the transcript.

#### Scenario: Toolbar Run hidden in AI view

- **WHEN** the AI view is active
- **THEN** the toolbar does not show a Run action

#### Scenario: Toolbar Copy hidden in AI view

- **WHEN** the AI view is active
- **THEN** the toolbar does not show a Copy action

#### Scenario: Entity and time controls remain available

- **WHEN** the AI view is active
- **THEN** the entity selector and time filter controls are still shown and usable
