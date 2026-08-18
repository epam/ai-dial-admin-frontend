## ADDED Requirements

### Requirement: Conversation grid columns are offered from the entity schema

The conversations view SHALL build its column catalog from the `conversations` entity's schema as the analytics
service reports it, not from a field list held in the frontend. The schema is already fetched for the Query
Builder, is role-filtered by the service, and declares each field's type, display name and description — so it
is the only source that stays correct when the entity gains or loses a field.

Each offered column SHALL derive its header label from the field's display name, falling back to the field
name, and SHALL derive its cell formatting, its sortability and its filter type from the field's declared type:
count-like integer types, decimal money types, timestamp types and string types each render and filter the way
that value type already renders and filters elsewhere in the app.

A field SHALL NOT be offered when the grid cannot honestly render or query it:

- a field the service marks `sensitive` — selecting it would be rejected for a caller without the required
  role, so offering it would present a column that cannot be shown;
- a non-scalar `object` or `array` field — a grid cell is not a structured-value viewer, and rendering one as
  text would assert a shape the view does not know.

A field consumed by a curated column SHALL NOT also be offered as a raw column. The activity column composes
`first_request_time` and `last_request_time` into one cell, so the catalog SHALL offer that column and MUST NOT
additionally offer its two source fields as separate columns, which would present the same data twice under
different names.

The seven curated columns — conversation, project, user, turns, activity, tokens, cost — SHALL keep their
composed cells and their labels, and SHALL be the default visible set together with the Rating column. Every
other offered field SHALL default to hidden.

Every offered column SHALL be attributed to the `conversations` provenance group, since every one is read from
that entity. The Rating column SHALL remain attributed to `rate_analytics` and SHALL remain outside the
catalog: it is not a field of the queried entity, so it cannot be offered, hidden or reordered as one.

When the schema cannot be fetched the view SHALL render the curated columns and SHALL report that the
additional columns are unavailable, rather than presenting an empty catalog as though the entity had no other
fields.

#### Scenario: The catalog comes from the schema

- **WHEN** the conversations view loads
- **THEN** the column catalog offers the entity's fields as reported by the schema
- **AND** each offered column's label, formatting, sortability and filter type follow its declared type

#### Scenario: Sensitive and non-scalar fields are not offered

- **WHEN** the schema reports a field marked sensitive, and a field of an object or array type
- **THEN** neither is offered in the catalog

#### Scenario: A composed column's source fields are not offered separately

- **WHEN** the catalog is built
- **THEN** the activity column is offered
- **AND** `first_request_time` and `last_request_time` are not offered as columns of their own

#### Scenario: The curated set is what is visible by default

- **WHEN** the conversations view loads with no stored column choice
- **THEN** the conversation, project, user, turns, activity, tokens, cost and Rating columns are visible
- **AND** every other offered column is hidden

#### Scenario: Rating is not part of the catalog

- **WHEN** the operator opens the column panel
- **THEN** the Rating column is not offered as a selectable column

#### Scenario: A failed schema fetch degrades to the curated columns

- **WHEN** the entity schema cannot be fetched
- **THEN** the curated columns render
- **AND** the view reports that the additional columns are unavailable

### Requirement: The conversation list query projects the visible columns

The conversation list query SHALL select the fields the curated columns require plus every field whose
schema-driven column is currently visible. It MUST NOT select every field the entity carries: the entity's
field set is whatever the service reports and can grow, so projecting all of it would make every page fetch
pay for columns nobody asked for.

Making a hidden column visible SHALL restart paging, because the fetched pages do not carry that field and a
column rendered from an absent value would read as empty data rather than as data not fetched. Hiding a visible
column SHALL NOT re-query: the rows already held remain a correct answer to a narrower projection.

A field that has been made visible SHALL be sortable and filterable on the same terms as a curated
field-backed column, since it is a stored field of the same entity.

The whole-result count and cost SHALL be unaffected by which columns are visible: they are aggregates over the
filtered result, and a projection change does not change the result.

#### Scenario: The projection follows the visible columns

- **WHEN** the query is built with a schema-driven column visible
- **THEN** the select names that column's field alongside the curated fields
- **AND** it does not name a field whose column is hidden

#### Scenario: Showing a column re-queries from the first page

- **WHEN** the operator makes a hidden column visible after scrolling
- **THEN** the fetched pages are discarded and the next request is for the first page
- **AND** that request's select names the newly visible field

#### Scenario: Hiding a column does not re-query

- **WHEN** the operator hides a visible column
- **THEN** no new request is issued and the rows already loaded remain

#### Scenario: A newly visible column can be sorted and filtered

- **WHEN** a schema-driven column is made visible
- **THEN** it offers a sort affordance and a filter control matching its declared type
- **AND** applying either carries a predicate or sort key on that field into the query

#### Scenario: The summary is unchanged by a projection change

- **WHEN** the operator changes which columns are visible
- **THEN** the whole-result conversation count and cost do not change
