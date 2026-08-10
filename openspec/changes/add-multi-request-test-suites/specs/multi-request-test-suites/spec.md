## ADDED Requirements

### Requirement: A DEPLOYMENT test suite carries an ordered chain of requests

`TestSuite` and `SuiteSnapshot` SHALL declare `requestName?: string`, labelling the suite's own
`endpointRef`/`requestTemplate`/`responseColumns`/`inputBindings` fields as request `#0`, and
`additionalRequests?: TestSuiteAdditionalRequest[]`, holding requests `1..N` run in order against the
same deployment. Each `TestSuiteAdditionalRequest` SHALL carry `name?: string`, `endpointRef?:
TestSuiteEndpointRef`, `requestTemplate?: TestSuiteRequestTemplate`, `responseColumns?: ResponseColumn[]`,
and `inputBindings?: InputBinding[]` — the same four request fields request `#0` has, plus its own name.

A suite with no `additionalRequests` (or an empty array) is single-request and SHALL behave exactly as
before this change.

#### Scenario: A suite with an empty chain is unaffected

- **WHEN** a test suite with no `additionalRequests` is opened on the Method tab
- **THEN** it renders and behaves exactly as it did before this change

#### Scenario: A three-request chain is loaded

- **WHEN** a test suite whose `additionalRequests` has two entries is opened
- **THEN** the suite is treated as a three-request chain (request `#0` plus the two additional entries)

### Requirement: A pure proxy view lets existing editors edit any request in the chain unchanged

`src/utils/evaluation/request-chain.ts` SHALL export pure functions operating on a `TestSuite`:
`getRequestCount`, `getRequestName`, `updateRequestName`, `toRequestView`, `fromRequestView`,
`addRequest`, `removeRequestAt`, and `getChainResponseColumns`.

`toRequestView(testSuite, index)` SHALL return a `TestSuite`-shaped object whose `endpointRef`,
`requestTemplate`, `responseColumns`, and `inputBindings` reflect chain entry `index` (the suite's own
fields for `index === 0`, `additionalRequests[index - 1]`'s fields otherwise), with every other field of
`testSuite` passed through unchanged. `fromRequestView(testSuite, index, editedView)` SHALL be the
inverse: it SHALL write `editedView`'s four request fields back onto request `index` of a copy of
`testSuite`, and SHALL take every other field from `testSuite`, never from `editedView`.

No existing Request Template or Endpoint Schema editor component SHALL be modified to be chain-aware —
each SHALL keep reading and writing a plain `TestSuite`.

#### Scenario: Editing request #0 through the proxy view is a no-op passthrough

- **WHEN** `toRequestView(testSuite, 0)` is called
- **THEN** the returned object's four request fields are referentially the suite's own

#### Scenario: Editing an additional request writes back into the right chain entry

- **WHEN** `fromRequestView(testSuite, 2, editedView)` is called with an edited `requestTemplate`
- **THEN** the returned suite's `additionalRequests[1].requestTemplate` reflects the edit
- **AND** the suite's own top-level `requestTemplate` (request `#0`) is unchanged
- **AND** every other `additionalRequests` entry is unchanged

#### Scenario: A non-request field is never taken from the edited view

- **WHEN** `fromRequestView` is called with an `editedView` whose `id` or `name` differs from the original
  suite (because the view object happens to carry the suite's original identity fields verbatim)
- **THEN** the returned suite's `id` and `name` are the original suite's, not derived from `editedView`

### Requirement: A chip strip selects, adds, renames, and removes chain entries

`RequestChainSelector` SHALL render, on the Method tab of a DEPLOYMENT suite only, one chip (ui-kit
`DialTag`) per chain entry, labelled by `getRequestName`. Selecting a chip SHALL switch which chain entry
the Request Template and Endpoint Schema editors display and edit, via the proxy view.

An "add request" affordance SHALL append a new, empty `TestSuiteAdditionalRequest` (via `addRequest`) and
SHALL be disabled once the chain reaches 11 total requests (request `#0` plus 10 additional). A "remove
request" affordance SHALL remove the selected additional request (via `removeRequestAt`) and SHALL NOT be
offered for request `#0` — the chain always has at least one request.

Each chip's name SHALL be editable inline, writing to `requestName` for request `#0` or to the matching
`additionalRequests[i].name` otherwise, via `updateRequestName`.

#### Scenario: Selector does not render for MCP suites

- **WHEN** a test suite has `suiteType: SuiteType.McpTool`
- **THEN** the Method tab does NOT render `RequestChainSelector`

#### Scenario: Adding a request appends a new chip

- **WHEN** "add request" is used on a suite with two requests
- **THEN** the chain has three requests, and a new chip for request `#3` (empty template) is shown

#### Scenario: Add is disabled at the chain cap

- **WHEN** the chain already has 11 requests (request `#0` plus 10 additional)
- **THEN** the "add request" affordance is disabled

#### Scenario: Removing an additional request drops its chip

- **WHEN** "remove request" is used on the second chip of a three-request chain
- **THEN** the chain has two requests, and the removed entry's chip is gone

#### Scenario: Request #0 cannot be removed

- **WHEN** the chip strip is rendered
- **THEN** no remove affordance is offered on request `#0`'s chip

#### Scenario: Renaming a chip updates its label

- **WHEN** the second chip's name is edited to "Follow-up"
- **THEN** that chip's label reads "Follow-up" and `additionalRequests[0].name` is `"Follow-up"`

### Requirement: Switching the selected chip remounts the request editors

`RequestTemplate` and `EndpointSchema` SHALL be rendered keyed by the selected request index (or an
equivalent remount trigger), so that selecting a different chip unmounts and remounts both editors rather
than reusing their internal state (e.g. `RequestTemplate`'s owned `bodyText`).

#### Scenario: Switching requests does not carry over unsaved editor text

- **WHEN** the user types an unsaved, non-committing edit into the Body tab of request `#1`, then selects
  the chip for request `#2`
- **THEN** the Body tab shows request `#2`'s own body text, not request `#1`'s in-progress text

#### Scenario: Switching back shows the committed state of the previous request

- **WHEN** the user edits and the edit is committed (written to the suite) for request `#1`, selects
  request `#2`, then selects request `#1` again
- **THEN** request `#1`'s editors show the committed edit

### Requirement: An info banner marks a non-zero request as part of a chain

The Method tab SHALL show an informational banner whenever a request other than `#0` is selected in the
chip strip, and SHALL show no such banner when request `#0` is selected.

#### Scenario: Banner shown for a non-zero request

- **WHEN** the second chip (request `#1`) is selected
- **THEN** an info banner is shown above the request editors

#### Scenario: No banner for request #0

- **WHEN** request `#0`'s chip is selected
- **THEN** no info banner is shown

### Requirement: Try Out always exercises request #0

The Try Out action SHALL read and send request `#0`'s `endpointRef`/`requestTemplate` regardless of which
chip is currently selected in `RequestChainSelector`.

#### Scenario: Try Out is unaffected by the selected chip

- **WHEN** a non-zero request is selected in the chip strip and Try Out is invoked
- **THEN** the request sent by Try Out matches request `#0`'s configuration, not the selected request's

### Requirement: MCP suites never carry chain fields, even after a mid-edit method change

Saving a test suite whose `suiteType` is `SuiteType.McpTool` SHALL omit `requestName` and
`additionalRequests` from the payload sent to the backend, regardless of whether those fields are present
on the in-memory suite object (e.g. left over from a DEPLOYMENT-mode edit before the method was changed to
MCP).

#### Scenario: Switching an MCP suite strips a previously built chain

- **WHEN** a suite that was DEPLOYMENT with two `additionalRequests` has its method changed to MCP and is
  saved
- **THEN** the payload sent to the backend contains neither `requestName` nor `additionalRequests`

#### Scenario: A DEPLOYMENT suite's chain is sent unchanged

- **WHEN** a DEPLOYMENT suite with a non-empty chain is saved
- **THEN** `requestName` and `additionalRequests` are present in the payload, each request template
  normalized the same way request `#0`'s is

### Requirement: Each additional request's template is normalized before save

Saving a test suite SHALL apply the existing request-template body normalization (e.g. dropping an empty
`jsonataContent`) to request `#0`'s template and to every `additionalRequests[i].requestTemplate`
identically.

#### Scenario: An empty JSONata expression is omitted from every chain entry

- **WHEN** two of a suite's requests (request `#0` and `additionalRequests[0]`) both have
  `requestTemplate.body.jsonataContent` set to `''`
- **THEN** the saved payload omits `jsonataContent` from both

### Requirement: Test Cases tab shows one Dynamic Configuration section per additional request

For each entry in `additionalRequests`, the Test Cases tab SHALL render its own "Dynamic configuration"
section, using the existing `DynamicConfiguration` component, bound to that entry's own `inputBindings`.
Its template variables SHALL be derived client-side from that entry's own `requestTemplate` (URL, headers,
query params, and body text), using the same `${{name}}` / `${{name:default}}` placeholder scan used for
request `#0`, and merged with that entry's own `inputBindings`.

Request `#0` keeps its existing, unmodified "Dynamic configuration" section — no new section is added for
it.

#### Scenario: An additional request's placeholder becomes a binding row

- **WHEN** `additionalRequests[0].requestTemplate` contains `${{followUpQuestion}}`
- **THEN** that request's own Dynamic Configuration section offers a binding row for `followUpQuestion`

#### Scenario: Sections are independent per request

- **WHEN** request `#0` and `additionalRequests[0]` each have their own placeholders
- **THEN** each request's Dynamic Configuration section shows only its own request's variables and
  bindings

#### Scenario: A suite with no additional requests shows no extra sections

- **WHEN** a suite has no `additionalRequests`
- **THEN** the Test Cases tab shows only the existing single Dynamic Configuration section
