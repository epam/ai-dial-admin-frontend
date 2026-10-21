## ADDED Requirements

### Requirement: Anthropic Messages support is read only from `interfaces`

Method selection SHALL rely solely on `interfaces` containing `anthropicMessages` to determine Anthropic Messages support.

A single-deployment response reports this support exactly one way. There is no features-flag
equivalent — unlike Responses API support, which Core also reports through
`features.responses_api` — so method selection SHALL NOT consult any `features` property when
deciding whether the selected target supports Anthropic Messages.

The deployment listing response carries no `interfaces` property, so support SHALL NOT be inferred
from any listing-backed deployment record.

An absent `interfaces` property means "not reported" and SHALL NOT be treated as "supports
nothing" beyond the Anthropic Messages group's own visibility, which this capability governs. In
particular, the `/chat/completions` method SHALL remain offered regardless of whether this signal
is present.

#### Scenario: Support read from the interfaces array

- **WHEN** a user opens method selection for a test suite whose target reports `interfaces`
  containing `anthropicMessages`
- **THEN** the Anthropic Messages method is offered

#### Scenario: A features property has no effect

- **WHEN** the selected target reports some `features` property set to a truthy value, and its
  `interfaces` either omits `anthropicMessages` or is absent
- **THEN** the Anthropic Messages method is not offered

#### Scenario: Chat completions unaffected by a reported signal set that omits it

- **WHEN** the selected target reports `interfaces` as `["openaiResponses"]`, with no
  `anthropicMessages` value
- **THEN** the `/chat/completions` method is still offered

#### Scenario: No interfaces reported leaves chat completions offered

- **WHEN** the selected target's record has no `interfaces` property
- **THEN** the `/chat/completions` method is offered and no Anthropic Messages method is

### Requirement: Anthropic Messages forms its own group, gated on reported support

Method selection SHALL present a distinct, labelled "Anthropic Messages" group listing the create-
message operation, ordered after the "Responses" group (when present) and before the group of
methods derived from the deployment's own routes.

The group SHALL render when either of the following holds, and SHALL be absent otherwise:

- the selected target reports `interfaces` containing `anthropicMessages`; or
- the test suite being edited already selects the Anthropic Messages create-message method.

The second condition exists so that a suite already configured against the Anthropic Messages
method keeps its selection visible and re-selectable even when the target stops reporting support.

#### Scenario: Group present when the interface is reported

- **WHEN** the selected target reports `interfaces` containing `anthropicMessages`
- **THEN** an "Anthropic Messages" group is rendered before the routes group

#### Scenario: Group absent when a reported interface set omits the Anthropic Messages value

- **WHEN** the selected target reports `interfaces` as `["chat", "openaiChatCompletions"]` and the
  suite does not select the Anthropic Messages method
- **THEN** no "Anthropic Messages" group is rendered

#### Scenario: Group absent when nothing is reported

- **WHEN** the selected target's record reports no `interfaces` entry for `anthropicMessages`, and
  the suite does not select the Anthropic Messages method
- **THEN** no "Anthropic Messages" group is rendered

#### Scenario: Saved selection keeps the group visible

- **WHEN** the suite being edited selects the Anthropic Messages method, and the selected target
  reports no `interfaces` entry for it
- **THEN** the "Anthropic Messages" group is rendered and the suite's selected method is shown as
  active

### Requirement: The group lists the single create-message operation

The "Anthropic Messages" group SHALL list exactly one operation, identified by its HTTP method and
its DIAL-relative URL:

| Operation | HTTP method | Relative URL |
| --------- | ----------- | ------------ |
| Create a message | `POST` | `/anthropic/v1/messages` |

The URL SHALL carry DIAL's `/anthropic/v1` prefix — in the stored pattern, in the seeded request
path, and in the displayed label alike. The prefix is what identifies a request as targeting DIAL's
Anthropic Messages passthrough, so that a deployment exposing its own unrelated `/messages` route is
not routed to the Anthropic Messages host. A path that omits the prefix SHALL therefore NOT be
recognised as the Anthropic Messages method.

#### Scenario: The create operation is offered

- **WHEN** the "Anthropic Messages" group renders
- **THEN** it lists the create-message operation, showing its `POST` HTTP method

#### Scenario: DIAL prefix carried on the request path

- **WHEN** a user selects the Anthropic Messages operation
- **THEN** the request path configured on the suite starts with `/anthropic/v1/messages`

#### Scenario: An unprefixed messages route is not the Anthropic Messages method

- **WHEN** a deployment exposes its own `/messages` route and a suite selects it, and the
  deployment reports no Anthropic Messages support
- **THEN** no "Anthropic Messages" group is rendered, and that route stays in the group derived
  from the deployment's own routes

### Requirement: Selecting the create operation configures a runnable request

Selecting `POST /anthropic/v1/messages` SHALL configure the suite's request with:

- a JSON request body containing `model` set to the selected target's deployment id, `max_tokens`
  set to a positive default, and `messages` containing one user message whose content is bound to a
  `user_message` template variable;
- a request body schema and a response body schema describing the operation, so the schema and
  parameter views have content to display;
- one response column named `answer` that extracts the response's textual output.

The response carries no single textual field: its `content` is an ordered array of blocks
discriminated by `type`, and the generated text lives in the `text` field of blocks whose type is
`text`, alongside any tool-use or thinking blocks. The `answer` column SHALL therefore extract from
`content`, and SHALL yield a single string where a response spreads its text across several blocks.

DIAL's Anthropic Messages endpoint is not parameterised on deployment id in its URL, so `model` in
the request body is the only means of directing the request at a specific deployment; it SHALL
therefore always be populated.

#### Scenario: Body seeded with the target's deployment id

- **WHEN** a user selects `POST /anthropic/v1/messages` for a target whose deployment id is
  `claude-3`
- **THEN** the request body contains `model` set to `claude-3`, a positive `max_tokens`, and a
  `messages` entry whose content is bound to the `user_message` template variable

#### Scenario: Answer column created

- **WHEN** a user selects `POST /anthropic/v1/messages`
- **THEN** the suite has a response column named `answer` extracting the text of the `text` blocks
  of the response's `content` array, joined into one string

#### Scenario: Answer column name is made unique

- **WHEN** a user selects `POST /anthropic/v1/messages` for a request in a chain where the name
  `answer` is already taken by another request's response column
- **THEN** the new column is given a non-conflicting name

### Requirement: The selected method is restored when a suite is reopened

When method selection opens for an existing suite, the Anthropic Messages method SHALL be shown as
active if the suite's configured HTTP method and URL pattern match it, across all groups. Reopening
a suite SHALL NOT re-seed its request configuration.

#### Scenario: A saved Anthropic Messages method is shown active

- **WHEN** a user reopens a suite configured against `POST /anthropic/v1/messages`
- **THEN** that operation is shown as the active method in the "Anthropic Messages" group

#### Scenario: Reopening preserves an edited request

- **WHEN** a user reopens a suite whose Anthropic Messages request body was edited by hand
- **THEN** the edited body is displayed unchanged

### Requirement: The seeded model follows the suite's target deployment

A suite configured against `POST /anthropic/v1/messages` SHALL have its request body `model` updated to the new deployment id whenever its target deployment is changed.

Because `model` in an Anthropic Messages create request selects the deployment, changing the
target without updating it would leave the suite invoking the previously targeted deployment while
displaying the new one, and would do so without error — `model` would still name a deployment that
exists.

#### Scenario: Changing the target updates the model

- **WHEN** a user changes the target of a suite configured against `POST /anthropic/v1/messages`
  from a deployment with id `claude-3` to one with id `claude-3-5`
- **THEN** the suite's request body `model` becomes `claude-3-5`

#### Scenario: Other methods' bodies are untouched

- **WHEN** a user changes the target of a suite configured against `/chat/completions`, a
  Responses API method, or a route-derived method
- **THEN** the suite's request body is left unchanged

#### Scenario: A hand-edited body keeps its other fields

- **WHEN** a user changes the target of a suite configured against `POST /anthropic/v1/messages`
  whose request body carries additional hand-added fields
- **THEN** only `model` changes and the other fields are preserved

### Requirement: Changing method warns about losing request configuration

The existing warning shown when changing an already-configured suite's method SHALL apply to the Anthropic Messages group identically to the other groups.

Selecting a different method replaces the suite's request configuration, so this warning carries
over unchanged rather than being re-implemented for the new group.

#### Scenario: Warning shown when changing to the Anthropic Messages method

- **WHEN** a user opens the change-method flow for a configured suite and selects the Anthropic
  Messages operation
- **THEN** the warning that the request configuration will be replaced is shown before confirming
