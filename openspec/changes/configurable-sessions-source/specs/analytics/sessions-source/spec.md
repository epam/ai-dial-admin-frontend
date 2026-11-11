## Purpose

The instance-wide Sessions source setting: which analytics table the Sessions pages are composed over, which of
its fields play the session id, time, project, title, cost and turns roles, where the setting is edited and
stored, and how the Sessions pages resolve every name they used to fix through it.

## ADDED Requirements

### Requirement: The Sessions source is one base table and six role fields

The Sessions source SHALL consist of exactly one **base table** and a binding of six **roles** to fields of
that table's entity schema:

| Role | Required | Field types offered |
|---|---|---|
| Session id | yes | string |
| Time | yes | timestamp |
| Project | no | string |
| Title | no | string |
| Cost | no | decimal, integer, long |
| Turns | no | integer, long |

The base table SHALL be chosen from the entities the analytics service lists. A role's field SHALL be chosen
from the fields the base table's entity schema reports — its own fields and every enrichment field the schema
flattens into it — restricted to the types that role accepts. A role SHALL NOT be bound to an array- or
object-typed field, to a field the schema flags sensitive, or to a projection-only field: the setting is read by
every analyst, and a sensitive field is absent from the schema of one without that clearance. One field MAY serve more than one role.

The composition SHALL be the base table and the enrichments its entity schema reports, and nothing else. The
setting SHALL NOT offer a second table: data that belongs on a session reaches the pages as an enrichment of
the base table, which the catalog joins, and the trace view keeps its own fixed hop log.

#### Scenario: A role offers only fields of a fitting type

- **WHEN** the operator opens the Time picker for a base table whose schema reports string, long and timestamp fields
- **THEN** only the timestamp fields are offered

#### Scenario: An enrichment field can fill a role

- **WHEN** the base table's schema reports an enrichment field of type string
- **THEN** the Title picker offers that field by its qualified name

#### Scenario: Array fields are never offered

- **WHEN** the base table's schema reports an array-typed string field
- **THEN** no role picker offers it

#### Scenario: Sensitive and projection-only fields are never offered

- **WHEN** the base table's schema reports a string field flagged sensitive and another flagged projection-only
- **THEN** no role picker offers either of them

### Requirement: The setting is edited on the System Properties page and stored by the analytics service

The setting SHALL be edited on a **Sessions source** tab of the System Properties page and SHALL be stored by the
analytics service as one value per instance. It SHALL NOT be stored in DIAL Core's global settings, in the
browser, or in deployment configuration: it is changed from the UI and read by every caller of the instance.

The tab SHALL be offered only when Analytics is enabled. Saving SHALL require both required roles to be bound;
until they are, the Save action SHALL be disabled and each unbound required picker SHALL carry a validation
message naming the role. Changing the base table SHALL clear every role whose field the new table's schema does
not report.

A successful save SHALL be confirmed by a success notification. A failed save SHALL be reported by an error
notification carrying the service's message, and the tab SHALL keep the operator's unsaved edits. A failed read
of the stored setting SHALL be reported by an error notification, and the tab SHALL NOT present the default
binding as the stored one.

Next to the base-table picker the tab SHALL state, as visible text, that the table MUST record the same session id
the usage log records, and that otherwise a session's traces read as empty. The tab SHALL NOT check that
compatibility.

#### Scenario: Save is blocked until the required roles are bound

- **WHEN** the operator picks a base table and binds Session id but not Time
- **THEN** the Save action is disabled
- **AND** the Time picker states that the role is required

#### Scenario: Changing the table clears roles the new table lacks

- **WHEN** the operator switches the base table to one whose schema does not report the field bound to Cost
- **THEN** the Cost role is cleared
- **AND** a role whose field the new schema does report keeps its binding

#### Scenario: The compatibility caveat is visible

- **WHEN** the Sessions source tab is opened
- **THEN** the text next to the base-table picker states that the table must carry the usage log's session id

#### Scenario: A failed save keeps the edits

- **WHEN** the save is rejected by the service
- **THEN** an error notification carries the service's message
- **AND** the tab still shows the operator's unsaved binding

### Requirement: Without a stored setting the pages use the default binding

Where the analytics service holds no stored setting, the Sessions pages SHALL use the default binding: base table
`sessions`, Session id `client_session_id`, Time `last_request_time`, Project `project_id`, Title
`session_insights.title`, Cost `total_price`, Turns `turn_count`. The tab SHALL show the default binding as
unsaved values, so opening it and saving stores the default explicitly.

Wherever `analytics/sessions-listing`, `analytics/session-trace-listing` or `analytics/session-trace-detail` name
the `sessions` entity or one of the fields above, the name SHALL be read as the field the configured binding
assigns to that role. Those requirements are written against the default binding; this requirement is what
makes them hold for any other.

#### Scenario: An instance that never saved the setting renders as before

- **WHEN** no Sessions source is stored and the Sessions page is opened
- **THEN** the session query reads the `sessions` entity, ordered and bounded by `last_request_time`

#### Scenario: A configured table replaces the fixed name

- **WHEN** the stored base table is another entity whose Time role is bound to a field other than `last_request_time`
- **THEN** the session query reads that entity
- **AND** its period bounds and default ordering use the bound Time field

### Requirement: An unbound optional role hides what depends on it

An optional role left unbound, or bound to a field the caller's schema does not report, SHALL hide what reads it
rather than render it empty:

- no **Title** — the identity column and the detail header state the session id alone;
- no **Cost** — no cost pill, no Cost column;
- no **Turns** — no turns figure in the header and no Turns column;
- no **Project** — the trace listing's paging query carries no project predicate.

The entity schema is filtered by the caller's role, so a bound field may be absent for one caller and present for
another. The decision SHALL be made per caller from the schema the page fetched, never from the stored binding
alone.

A required role bound to a field the caller's schema does not report SHALL fail the page with an error that names
the role and the field, rather than render a grid whose rows cannot be opened or bounded by period.

#### Scenario: No cost role hides the pill and column

- **WHEN** the Cost role is unbound
- **THEN** the header shows no cost pill
- **AND** the grid offers no Cost column

#### Scenario: A title hidden by role falls back to the id

- **WHEN** the Title role is bound to a sensitive field the caller's schema does not report
- **THEN** the identity column shows the session id alone

#### Scenario: A missing required field fails with its name

- **WHEN** the Time role is bound to a field the caller's schema does not report
- **THEN** the page reports an error naming the Time role and that field
- **AND** no session query is issued
