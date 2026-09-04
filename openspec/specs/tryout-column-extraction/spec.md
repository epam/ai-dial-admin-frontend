# tryout-column-extraction Specification

## Purpose

Governs where the Try Out Columns tab's values come from, so that what a user sees a suite extract is
what the evaluation backend actually extracted — and so that a column with no value says why.

## Requirements

### Requirement: Extracted values are the backend's, not recomputed

The Columns tab SHALL display, for each executed invocation, the per-column extraction that the
try-it-out response reports for that invocation. It SHALL NOT evaluate the suite's column expressions
itself when the response reports an extraction, even where its own evaluation would produce a value.

A try-out response reports an extraction as a mapping from column name to extracted value, and reports
a column whose extraction failed with an explicit null value. Absence of the mapping means no
extraction was performed and is distinct from a mapping in which every value is null.

The displayed value SHALL be the reported value. A non-string value SHALL be rendered in a form that
preserves it — a number, boolean or structured value SHALL NOT be flattened into an empty or
placeholder display.

The column's name and declared type SHALL continue to come from the suite's own column definition, so
a column the suite declares but the response omits is still listed.

**Why:** two evaluators over the same response give two answers, and only the backend's is the one a
Run records. The frontend's own evaluation is documented for one response shape (chat completions) and
silently yields nothing for any other — a streaming Responses API response resolves every column to
nothing while the backend extracts all of them.

#### Scenario: Value shown for a successfully extracted column

- **WHEN** a try-out completes and the response reports `answer` extracted as `Hi there, friend!`
- **THEN** the Columns tab shows the `answer` column as extracted, with the value `Hi there, friend!`

#### Scenario: Backend extraction preferred over a client-side result

- **WHEN** a try-out completes and the response reports a column's extracted value, and evaluating
  that column's expression in the browser against the returned body would yield a different value
- **THEN** the value the response reported is displayed

#### Scenario: A response shape the frontend cannot interpret still shows values

- **WHEN** a try-out of a streaming suite completes, whose response body carries a stream of events
  rather than the shape the frontend's own evaluation understands, and the response reports every
  column extracted
- **THEN** every column shows its extracted value, and none is presented as a failure

#### Scenario: Non-string extracted values survive display

- **WHEN** the response reports one column extracted as a number, one as a boolean, and one as a
  structured object
- **THEN** each is shown with its value legible, and none is shown as empty or as a failure

#### Scenario: A declared column absent from the reported extraction

- **WHEN** the response reports an extraction that omits a column the suite declares
- **THEN** that column is still listed, with its declared name and type, and is not shown as
  successfully extracted

### Requirement: A failed column shows the reason it failed

A try-out response reports, alongside its extraction, one warning per column whose extraction failed,
each naming the column, the expression that was evaluated, and the error.

For a column reported with a null value, the Columns tab SHALL present it as a failed extraction and
SHALL display the error text from that column's warning. Where no warning names the column, the tab
SHALL present the failure without inventing a reason.

The tab SHALL NOT present a failed extraction with a bare validity verdict as its only explanation.

**Why:** a red "Invalid" badge reads as "this expression is wrong", which is frequently untrue — the
expression may be correct and the response simply lack the path. The backend already computes the
distinction and sends the error text.

#### Scenario: Failure reason displayed

- **WHEN** the response reports `summary` with a null value and a warning for `summary` whose error
  reads `Expression matched nothing`
- **THEN** the `summary` column is shown as failed, displaying `Expression matched nothing`

#### Scenario: Mixed success and failure in one invocation

- **WHEN** the response reports one column with a value and another with a null value and a warning
- **THEN** the first is shown as extracted with its value, and the second as failed with its error,
  in the same result list

#### Scenario: Failure with no warning reported

- **WHEN** the response reports a column with a null value and reports no warning naming that column
- **THEN** the column is shown as failed with no error text, and no reason is fabricated

### Requirement: A failed invocation reports that nothing was extracted

A try-out response reports no extraction when the invocation itself failed — the invoked endpoint
answered with a non-success status, or a streamed response terminated abnormally rather than
completing.

For such an invocation the Columns tab SHALL list every column the suite declares, present each as
**not extracted**, and state that the invocation failed as the reason. It SHALL NOT evaluate the
suite's column expressions against the returned body, and SHALL NOT present the columns as extraction
failures.

**Why:** evaluating expressions against an error body is what produces today's misleading verdict —
every column reported as invalid when the expressions were never the problem. Not-extracted and
extraction-failed are different facts about a column and a user acts differently on each.

#### Scenario: Non-success response status

- **WHEN** a try-out completes with the invoked endpoint answering `401` and the response reports no
  extraction
- **THEN** every declared column is shown as not extracted, each stating that the request failed,
  and none is shown as an extraction failure

#### Scenario: Stream terminated abnormally

- **WHEN** a try-out of a streaming suite completes with the stream reported as having timed out or
  errored, and the response reports no extraction
- **THEN** every declared column is shown as not extracted, each stating that the stream did not
  complete

#### Scenario: No expressions evaluated in the browser

- **WHEN** an invocation failed and a declared column's expression would resolve against the returned
  error body
- **THEN** no value is displayed for that column and it remains presented as not extracted

#### Scenario: Suite declaring no columns

- **WHEN** a try-out completes for a suite that declares no response columns
- **THEN** the Columns tab presents no column results, and no not-extracted entries are invented

### Requirement: Each invocation of a multi-invocation try-out shows its own extraction

A try-out of a multi-request or multi-turn suite reports each executed invocation separately, and each
reported invocation carries its own extraction over its own request's column definitions.

The Columns tab SHALL show, for each invocation it presents, that invocation's own reported
extraction. It SHALL NOT derive one invocation's column values from another invocation's, and SHALL
NOT require an earlier invocation's values in order to display a later one's.

Where a chain stopped early, only the invocations that actually ran SHALL be presented; a request that
never ran SHALL NOT be presented with fabricated or empty column results.

**Why:** the backend reports each invocation's own reconciled extraction. Re-deriving later values
from earlier ones in the browser reproduces the chaining rules a second time, with the same divergence
risk as re-deriving the values themselves.

#### Scenario: Per-turn values within one request

- **WHEN** a multi-turn try-out completes with each turn's invocation reporting its own extraction
- **THEN** each turn's section shows that turn's extracted values

#### Scenario: Per-request values across a chain

- **WHEN** a multi-request try-out completes and the user selects a request
- **THEN** the columns shown are that request's own columns with that request's reported extraction

#### Scenario: A later request's column that references an earlier one

- **WHEN** a chained request declares a column whose expression references an earlier request's
  extracted column, and the response reports that column extracted
- **THEN** the reported value is displayed without the frontend resolving the reference itself

#### Scenario: A chain that stopped early

- **WHEN** a chained try-out failed at its second request and reports only the invocations that ran
- **THEN** results are shown for the invocations that ran, and the requests that never ran show no
  column results

### Requirement: MCP-tool suites keep client-side evaluation

A try-out of an MCP-tool suite performs no extraction, so no extraction is reported for it. For such a
suite the Columns tab SHALL continue to evaluate the suite's column expressions against the response
in the browser, presenting each column as valid or invalid exactly as it does today.

This is the sole remaining path on which the frontend evaluates column expressions, and it SHALL NOT
be entered for a suite whose try-out reports an extraction or reports an invocation failure.

**Why:** the backend documents extraction as omitted for MCP try-outs, so it is the one case where
client-side evaluation is the only available answer rather than a competing one.

#### Scenario: MCP suite still evaluates locally

- **WHEN** a user runs a try-out of an MCP-tool suite that declares response columns
- **THEN** the Columns tab shows each column evaluated against the response, marked valid or invalid

#### Scenario: A non-MCP suite never falls back to local evaluation

- **WHEN** a try-out of a non-MCP suite completes, whether it reported an extraction or reported an
  invocation failure
- **THEN** no column expression is evaluated in the browser

### Requirement: A restored try-out result shows the same extraction

The most recent try-out result for a suite is restored when the Try Out panel is reopened. A restored
result SHALL present its columns from the extraction reported with it, on the same terms as when it
was first received — including its per-column failure reasons and its not-extracted state.

A restored result that predates extraction being recorded SHALL NOT be presented as an extraction
failure on that basis; its columns SHALL be presented as not extracted.

**Why:** a restored result that silently switches to a different source of values would show a
different answer for the same invocation depending on whether the panel had been reopened.

#### Scenario: Reopening shows the recorded extraction

- **WHEN** a user reopens the Try Out panel for a suite whose last try-out reported an extraction
- **THEN** the Columns tab shows the same extracted values, and the same failure reasons, as the
  original result did

#### Scenario: A result recorded before extraction was captured

- **WHEN** a user reopens the Try Out panel and the restored result carries no extraction and no
  record of the invocation having failed
- **THEN** the declared columns are shown as not extracted rather than as extraction failures
