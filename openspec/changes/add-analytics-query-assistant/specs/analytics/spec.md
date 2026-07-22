## ADDED Requirements

### Requirement: Query Assistant feature flag derives from deployment config

The system SHALL expose a `queryAssistantEnabled: boolean` on the `FeatureFlags` object
(`models/feature-flags.ts`), initialized in the root layout (`app/[lang]/layout.tsx`) alongside the
other flags. It SHALL be `true` only when `ANALYTICS_ENABLED` resolves truthy (per `isValueTruthy`)
AND `process.env.DIAL_QUERY_ASSISTANT_DEPLOYMENT` is present (non-empty); otherwise `false`. The
`DIAL_QUERY_ASSISTANT_DEPLOYMENT` value is the assistant application's DIAL Core deployment id
(resource URL, stored raw with literal `/`) and SHALL be read server-side only.

#### Scenario: Flag true when analytics enabled and deployment set

- **WHEN** `ANALYTICS_ENABLED` is truthy and `DIAL_QUERY_ASSISTANT_DEPLOYMENT` is set to a non-empty value
- **THEN** `featureFlags.queryAssistantEnabled` is `true`

#### Scenario: Flag false when deployment unset

- **WHEN** `ANALYTICS_ENABLED` is truthy but `DIAL_QUERY_ASSISTANT_DEPLOYMENT` is unset or empty
- **THEN** `featureFlags.queryAssistantEnabled` is `false`

#### Scenario: Flag false when analytics disabled

- **WHEN** `ANALYTICS_ENABLED` is falsy
- **THEN** `featureFlags.queryAssistantEnabled` is `false` regardless of the deployment variable

### Requirement: Query Builder rail offers an AI view when the assistant is enabled

The Query Builder view switcher SHALL include a fourth mutually exclusive view — AI — alongside Form,
JSON, and SQL, rendered in the existing segmented control and marked with a spark icon. The AI option
SHALL be present only when `featureFlags.queryAssistantEnabled` is `true`. When the flag is `false` the
switcher SHALL offer exactly the existing three views. As with the other views, the switcher (and thus
the AI option) is available only once an entity schema has loaded.

#### Scenario: AI option shown when enabled

- **WHEN** the schema has loaded and `queryAssistantEnabled` is `true`
- **THEN** the view switcher offers Form, JSON, SQL, and AI

#### Scenario: AI option hidden when disabled

- **WHEN** the schema has loaded and `queryAssistantEnabled` is `false`
- **THEN** the view switcher offers only Form, JSON, and SQL and no AI option is present

#### Scenario: Selecting the AI view

- **WHEN** the user selects the AI view
- **THEN** the rail shows the AI panel and the current view is indicated as AI

### Requirement: AI panel accepts a plain-language prompt with suggestions

In the AI view the rail SHALL render a heading, an explanatory description, a multi-line text input for
a plain-language request, a set of suggested-prompt chips, and a "Generate query" action. Clicking a
suggested-prompt chip SHALL populate the text input with that prompt's text. The "Generate query"
action SHALL be disabled while the input is empty or a generation request is in flight. All text SHALL
be provided through i18n.

#### Scenario: Suggested prompt fills the input

- **WHEN** the AI view is shown and the user clicks a suggested-prompt chip
- **THEN** the text input is populated with that chip's prompt text

#### Scenario: Generate disabled when input empty

- **WHEN** the text input is empty
- **THEN** the "Generate query" action is disabled

#### Scenario: Generate disabled while in flight

- **WHEN** a generation request is in progress
- **THEN** the "Generate query" action is disabled and a loading indicator is shown

### Requirement: Generate calls the assistant and shows the proposed query

Activating "Generate query" SHALL send the user's request to the assistant application via the
`generateQuery` server action, which posts to the configured deployment's chat-completions endpoint on
DIAL Core (`QueryAssistantApi`, reusing `DIAL_CORE_API_URL` and Bearer auth). On success the system
SHALL extract the SQL from the assistant reply and display it read-only beneath the input with a copy
affordance. When the reply contains no SQL, the system SHALL display the assistant's text as an
explanation and SHALL NOT load anything. On failure the system SHALL surface an error notification
(header, message, and request id when available) and preserve any previously shown proposal.

#### Scenario: Successful generation shows SQL

- **WHEN** the user submits a request and the assistant returns a reply containing a fenced SQL block
- **THEN** the extracted SQL is shown read-only beneath the input with a copy control

#### Scenario: Reply without SQL shows explanation only

- **WHEN** the assistant reply contains no SQL block
- **THEN** the assistant text is shown as an explanation, no query is loaded, and any previously
  armed query is cleared so the toolbar Run action is disabled

#### Scenario: Generation failure notifies and preserves prior proposal

- **WHEN** the `generateQuery` action returns a failure
- **THEN** an error notification is shown and any previously proposed query remains displayed

### Requirement: SQL is extracted from the assistant reply

The system SHALL provide a pure `extractSql(content)` utility that returns the trimmed contents of the
last fenced code block tagged `sql` (case-insensitive) in the assistant message content. If no
`sql`-tagged block exists but an untagged fenced block does, that block SHALL be returned as a
fallback. If no fenced block exists, the utility SHALL return `null`. The utility SHALL be unit-tested.

#### Scenario: Extract the sql-tagged block

- **WHEN** the content contains prose and a ` ```sql … ``` ` block
- **THEN** `extractSql` returns the block's SQL text, trimmed, without the fences

#### Scenario: Last block wins

- **WHEN** the content contains more than one fenced SQL block
- **THEN** `extractSql` returns the contents of the last block

#### Scenario: No block returns null

- **WHEN** the content contains no fenced code block
- **THEN** `extractSql` returns `null`

### Requirement: A generated query loads automatically into the builder

A successfully generated query SHALL be loaded automatically — there is no separate Apply step. The
system SHALL translate the generated SQL into a structured query and, when the builder can represent
it, hydrate the builder state so that the Builder, JSON, and SQL views all reflect the generated query
and it can be viewed or edited there. When the query cannot be represented in the builder (or the
translation fails), the system SHALL keep the raw SQL runnable and visible in the SQL view. A hint
SHALL direct the user to switch views or use the toolbar Run action. The AI view SHALL remain active
after generation (no forced view switch).

#### Scenario: Generated query loads without an Apply step

- **WHEN** the assistant returns a query
- **THEN** it is loaded automatically and a hint directs the user to switch views or click Run, with no Apply action shown

#### Scenario: Representable query is visible in the other views

- **WHEN** a generated query can be represented in the builder and the user switches to the Builder, JSON, or SQL view
- **THEN** that view shows the generated query

#### Scenario: Run executes the loaded query

- **WHEN** a query has been generated in the AI view and the user clicks Run
- **THEN** the loaded query is executed and the result is shown in the result area

#### Scenario: Run disabled before a query is generated

- **WHEN** the AI view is active and no query has been generated
- **THEN** the toolbar Run action is disabled

#### Scenario: Changing the entity clears a generated query

- **WHEN** a query has been generated and the user selects a different entity
- **THEN** the generated query is cleared, the AI panel is reset, and the toolbar Run action is disabled

#### Scenario: Copy in the AI view copies the query

- **WHEN** a query has been generated in the AI view
- **THEN** the Copy action copies that SQL text
