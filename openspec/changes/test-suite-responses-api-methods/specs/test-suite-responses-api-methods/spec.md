## Purpose

Governs which invocation methods a test suite offers for a deployment target, so that DIAL's OpenAI
Responses API operations become selectable — and only for deployments that report supporting that
interface.

## ADDED Requirements

### Requirement: Responses support is read from the single-deployment fetch

A single-deployment response can report Responses API support two ways, and method selection SHALL
treat either as sufficient, reading both from the single-deployment fetch for the selected target:

- `features.responses_api` — DIAL Core's per-deployment feature flag, passed through verbatim. This
  is the signal that actually arrives for models, because Core does not report `interfaces` for
  deployments fetched through its `/openai/...` API.
- `interfaces` — an array of interface wire values containing `openaiResponses`. Authoritative
  wherever Core populates it.

The deployment listing response carries neither field, so support SHALL NOT be inferred from any
listing-backed deployment record.

An absent signal means "not reported" and SHALL NOT be treated as "supports nothing" beyond the
Responses group's own visibility, which this capability governs. In particular, the
`/chat/completions` method SHALL remain offered regardless of which signals are present.

#### Scenario: Support read from the Core feature flag

- **WHEN** a user opens method selection for a test suite whose target reports
  `features.responses_api` as `true` and carries no `interfaces` property
- **THEN** the Responses API methods are offered

#### Scenario: Support read from the interfaces array

- **WHEN** the selected target reports `interfaces` containing `openaiResponses`
- **THEN** the Responses API methods are offered

#### Scenario: Feature flag reported false

- **WHEN** the selected target reports `features.responses_api` as `false`
- **THEN** no Responses API method is offered

#### Scenario: Chat completions unaffected by a reported signal set that omits it

- **WHEN** the selected target reports `interfaces` as `["openaiResponses"]`, with no chat value
- **THEN** the `/chat/completions` method is still offered

#### Scenario: Neither signal present leaves chat completions offered

- **WHEN** the selected target's record has neither an `interfaces` nor a `features` property
- **THEN** the `/chat/completions` method is offered and no Responses API method is

### Requirement: Responses API methods form their own group, gated on reported support

Method selection SHALL present a distinct, labelled "Responses" group listing the Responses API
operations, ordered after the "Chat interface" group and before the group of methods derived from the
deployment's own routes.

The group SHALL render when any of the following holds, and SHALL be absent otherwise:

- the selected target reports `features.responses_api` as `true`; or
- the selected target reports `interfaces` containing `openaiResponses`; or
- the test suite being edited already selects a Responses API method.

The third condition exists so that a suite already configured against a Responses API method keeps
its selection visible and re-selectable even when the target stops reporting support.

#### Scenario: Group present when the interface is reported

- **WHEN** the selected target reports `interfaces` containing `openaiResponses`
- **THEN** a "Responses" group is rendered between the "Chat interface" group and the routes group

#### Scenario: Group absent when a reported interface set omits the Responses value

- **WHEN** the selected target reports `interfaces` as `["chat", "openaiChatCompletions"]` and the
  suite does not select a Responses API method
- **THEN** no "Responses" group is rendered

#### Scenario: Group absent when nothing is reported

- **WHEN** the selected target's record reports neither `features.responses_api` nor an `interfaces`
  entry for it, and the suite does not select a Responses API method
- **THEN** no "Responses" group is rendered

#### Scenario: Saved selection keeps the group visible

- **WHEN** the suite being edited selects a Responses API method, and the selected target reports
  neither signal
- **THEN** the "Responses" group is rendered and the suite's selected method is shown as active

### Requirement: The group lists the four Responses API operations

The "Responses" group SHALL list exactly these operations, each identified by its HTTP method and its
DIAL-relative URL:

| Operation | HTTP method | Relative URL |
| --------- | ----------- | ------------ |
| Create a response | `POST` | `/openai/v1/responses` |
| Retrieve a response | `GET` | `/openai/v1/responses/{response_id}` |
| Delete a response | `DELETE` | `/openai/v1/responses/{response_id}` |
| Cancel a response | `POST` | `/openai/v1/responses/{response_id}/cancel` |

Every URL SHALL carry DIAL's `/openai/v1` prefix — in the stored pattern, in the seeded request path,
and in the displayed label alike. The prefix is what identifies a request as targeting DIAL's
Responses API, so that a deployment exposing its own unrelated `/responses` route is not routed to
the Responses API host. A path that omits the prefix SHALL therefore NOT be recognised as a Responses
API method.

`/chat/completions` needs no equivalent prefix because its own URL is parameterised on the
deployment, which already identifies where the request goes.

The displayed URL SHALL show the readable `{response_id}` placeholder rather than the regex the
stored pattern uses.

#### Scenario: All four operations offered

- **WHEN** the "Responses" group renders
- **THEN** it lists the create, retrieve, delete, and cancel operations, each showing its HTTP method

#### Scenario: DIAL prefix carried on the request path

- **WHEN** a user selects any Responses API operation
- **THEN** the request path configured on the suite starts with `/openai/v1/responses`

#### Scenario: An unprefixed responses route is not a Responses API method

- **WHEN** a deployment exposes its own `/responses` route and a suite selects it, and the deployment
  reports no Responses API support
- **THEN** no "Responses" group is rendered, and that route stays in the group derived from the
  deployment's own routes

### Requirement: Selecting the create operation configures a runnable request

Selecting `POST /responses` SHALL configure the suite's request with:

- a JSON request body containing `model` set to the selected target's deployment id, and `input` bound
  to a `user_message` template variable;
- a request body schema and a response body schema describing the operation, so the schema and
  parameter views have content to display;
- one response column named `answer` that extracts the response's textual output.

The response carries no single textual field: its `output` is an ordered array whose items are
discriminated by `type`, and the generated text lives in the `output_text` content parts of the items
whose type is `message`, alongside reasoning items and tool calls. The `answer` column SHALL
therefore extract from `output`, and SHALL yield a single string where a response spreads its text
across several parts or messages.

DIAL's Responses API endpoint is not parameterised on deployment id in its URL, so `model` in the
request body is the only means of directing the request at a specific deployment; it SHALL therefore
always be populated.

#### Scenario: Body seeded with the target's deployment id

- **WHEN** a user selects `POST /responses` for a target whose deployment id is `gpt-4o`
- **THEN** the request body contains `model` set to `gpt-4o` and an `input` value bound to the
  `user_message` template variable

#### Scenario: Answer column created

- **WHEN** a user selects `POST /responses`
- **THEN** the suite has a response column named `answer` extracting the text of the `output_text`
  content parts of the response's `message` output items, joined into one string

#### Scenario: Answer column name is made unique

- **WHEN** a user selects `POST /responses` for a request in a chain where the name `answer` is
  already taken by another request's response column
- **THEN** the new column is given a non-conflicting name

### Requirement: The response-scoped operations are configured as chainable requests

`GET /responses/{response_id}`, `DELETE /responses/{response_id}` and
`POST /responses/{response_id}/cancel` identify an already-created response, so selecting one SHALL
configure the suite's request with an empty body and no response columns, and SHALL express the
response id in the request path as a template variable rather than a literal id.

Selecting a method replaces the suite's request configuration by merging the new method's
configuration over the old one, so these operations SHALL clear the response columns explicitly
rather than by omission — otherwise the previously selected method's extraction expressions would
survive against a response shape that cannot satisfy them.

This makes these operations usable as later requests in a chain, taking the response id from a prior
request's output or from a test case field.

#### Scenario: Request path carries a template variable

- **WHEN** a user selects `GET /responses/{response_id}`
- **THEN** the configured request path contains a `response_id` template variable rather than a
  literal response id

#### Scenario: No body or response columns seeded

- **WHEN** a user selects any of the three response-scoped operations, from a suite whose previously
  selected method contributed a response column
- **THEN** the suite's request body is empty and it has no response columns

#### Scenario: Response id bindable from a prior request

- **WHEN** a response-scoped operation is selected for a request that follows another request in the
  chain
- **THEN** the `response_id` variable is offered for binding alongside the prior request's outputs

### Requirement: Request paths remain editable and validatable

The editable final request path is validated against the selected operation's URL pattern whenever
that pattern is a regular expression. Each Responses API operation's URL pattern SHALL therefore be
expressed so that the seeded final path — and any real response id a user substitutes for the
template variable — validates successfully.

#### Scenario: Seeded path validates

- **WHEN** a user selects any Responses API operation
- **THEN** the seeded final path reports no validation error

#### Scenario: A substituted response id validates

- **WHEN** a user replaces the `response_id` template variable in the final path with a concrete
  response id
- **THEN** the final path reports no validation error

#### Scenario: A path outside the operation is rejected

- **WHEN** a user edits the final path of a selected Responses API operation to a path that the
  operation's pattern does not match
- **THEN** the final path reports a validation error

### Requirement: The selected method is restored when a suite is reopened

When method selection opens for an existing suite, the method matching the suite's configured HTTP
method and URL pattern SHALL be shown as active, across all groups. Reopening a suite SHALL NOT
re-seed its request configuration.

#### Scenario: A saved Responses method is shown active

- **WHEN** a user reopens a suite configured against `POST /responses/{response_id}/cancel`
- **THEN** that operation is shown as the active method in the "Responses" group

#### Scenario: Reopening preserves an edited request

- **WHEN** a user reopens a suite whose Responses API request body was edited by hand
- **THEN** the edited body is displayed unchanged

#### Scenario: A saved method that no longer exists leaves nothing active

- **WHEN** a user reopens a suite whose configured method matches no offered method
- **THEN** no method is shown as active and the suite's request configuration is left untouched

### Requirement: The seeded model follows the suite's target deployment

Because `model` in a Responses API create request selects the deployment, a suite configured against
`POST /responses` SHALL have its request body `model` updated to the new deployment id whenever its
target deployment is changed.

Without this, the suite would keep invoking the previously targeted deployment while displaying the
new one, and would do so without error — `model` would still name a deployment that exists.

#### Scenario: Changing the target updates the model

- **WHEN** a user changes the target of a suite configured against `POST /responses` from a deployment
  with id `gpt-4o` to one with id `claude-3`
- **THEN** the suite's request body `model` becomes `claude-3`

#### Scenario: Other methods' bodies are untouched

- **WHEN** a user changes the target of a suite configured against `/chat/completions` or a
  route-derived method
- **THEN** the suite's request body is left unchanged

#### Scenario: A hand-edited body keeps its other fields

- **WHEN** a user changes the target of a suite configured against `POST /responses` whose request
  body carries additional hand-added fields
- **THEN** only `model` changes and the other fields are preserved

### Requirement: Changing method warns about losing request configuration

Selecting a different method replaces the suite's request configuration. The existing warning shown
when changing an already-configured suite's method SHALL apply to the Responses API group identically
to the other groups.

#### Scenario: Warning shown when changing to a Responses method

- **WHEN** a user opens the change-method flow for a configured suite and selects a Responses API
  operation
- **THEN** the warning that the request configuration will be replaced is shown before confirming
