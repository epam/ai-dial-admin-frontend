# tryout-chain-variables Specification

## Purpose
Defines how Try Out obtains, resolves, and presents a test suite's template variables when the suite is a
chain of requests: the request-index-keyed contract on both template-variable endpoints and the
suite-level try-out payload, and the rule that every request's values come from that request alone.
## Requirements
### Requirement: Template variables are reported per chain request

Both template-variable endpoints — the suite-level one and the test-case one — SHALL be read as a map
keyed by request index, where key `"0"` is the suite's own request and key `"n"` is
`additionalRequests[n-1]`, matching the `requestIndex` parameter of the resolved-request endpoint. The
client SHALL treat a request whose key maps to an empty list as declaring no template variables, and
SHALL treat a missing key as an empty list rather than as an error.

Because the response covers the whole chain, Try Out SHALL fetch template variables once per opening and
SHALL NOT re-request them when the user switches between request sections.

#### Scenario: A chain's requests each get their own variables

- **WHEN** Try Out is opened for a suite whose request `#0` declares no placeholders and whose second
  request declares two
- **THEN** the section for request `#0` shows no variable rows
- **AND** the section for the second request shows both of its variables

#### Scenario: A single-request suite is unchanged

- **WHEN** Try Out is opened for a suite with no additional requests
- **THEN** the variables reported under key `"0"` are presented as the suite's only variable section

#### Scenario: A request added after the variables were fetched

- **WHEN** the response carries no key for a request the suite in the editor now has
- **THEN** that request's section shows no variable rows, and Try Out does not report an error

#### Scenario: Switching request sections does not refetch

- **WHEN** the user moves between request sections in an unsent Try Out
- **THEN** no further template-variable request is issued

### Requirement: A request's variables resolve from that request alone

Each request's template-variable values SHALL be resolved using that request's own input bindings. A
variable that the selected request does not bind SHALL NOT fall back to another request's binding for the
same name, because the suite runner resolves each chain request independently.

Resolution order for one request and one turn SHALL be: the binding's constant value, then the test-case
field the binding names, then a test-case field matching the variable's own name, then the template's
declared default, then no value.

#### Scenario: A name bound differently by two requests

- **WHEN** request `#0` binds `query` to a constant and the second request binds `query` to a test-case
  field
- **THEN** request `#0`'s section shows the constant and the second request's section shows the field's
  value

#### Scenario: A name bound by an earlier request only

- **WHEN** the second request declares `query` but binds nothing for it, while request `#0` binds `query`
  to a constant
- **THEN** the second request's section does not show request `#0`'s constant
- **AND** it falls through to a same-named test-case field, the template default, or no value

#### Scenario: Per-request editor type

- **WHEN** a variable of the same name is typed as a file by one request and as a string by another
- **THEN** each request's section renders the editor for its own declared type

### Requirement: Suite-level try-out submits values per request

A suite-level try-out — one started without selecting a test case — SHALL submit entered variable values
keyed by request index, so that two requests declaring the same variable name can carry different values.
The request envelope SHALL keep its existing `variables` key; only the value it carries is keyed by
request index. The values submitted for a request replace that request's stored input bindings for the
invocation; they are not merged with them.

The submitted keys SHALL be limited to the requests the template-variable response reported, because the
endpoint rejects an index outside the saved chain and the suite open in the editor may hold a request
that has not been saved. A request left out of the payload is invoked with no variables of its own.

#### Scenario: Values are submitted under their own request

- **WHEN** the user enters a value for a variable of request `#0` and a different value for a
  same-named variable of the second request, then sends
- **THEN** the submitted payload carries each value under its own request index

#### Scenario: A single-request suite submits one entry

- **WHEN** a suite with no additional requests is sent from a suite-level try-out
- **THEN** the submitted payload carries exactly one request-index entry

#### Scenario: A request added but not yet saved is not submitted

- **WHEN** the user adds a request to the chain, does not save, and sends a suite-level try-out
- **THEN** the submitted payload carries no entry for that request, so no out-of-range index is sent

### Requirement: Try Out shows one variable section per chain request

For a suite with a chain, the Try Out Request preview SHALL present the selected request's variables
under the request tab strip, at both suite level and test-case level. Values SHALL be editable at suite
level and read-only for a test case, as they are for a single-request suite.

#### Scenario: Suite-level try-out of a chain offers every request

- **WHEN** a suite-level try-out is opened for a suite with additional requests
- **THEN** the request tab strip is shown, and selecting a request shows that request's variables with
  editable values

#### Scenario: Test-case try-out of a chain is read-only

- **WHEN** a test-case try-out is opened for a suite with additional requests
- **THEN** selecting a request shows that request's resolved values, and they cannot be edited

#### Scenario: A request that declares nothing

- **WHEN** the selected request declares no template variables
- **THEN** its section states that the request has no template variables rather than rendering an empty
  configuration box
