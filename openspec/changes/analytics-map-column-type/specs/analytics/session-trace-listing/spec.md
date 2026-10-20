## MODIFIED Requirements

### Requirement: Single-session query over the sessions entity

The system SHALL provide a query builder returning a `StructuredQuery` over the entity `sessions` in
**row mode**, narrowed to exactly one `client_session_id` by equality, requesting a single row.

The query SHALL select every stored column of the session rollup **the fetched schema reports**, so the
detail view reads the full available record rather than the subset the log's grid needs. Every selected
column SHALL be **named explicitly**. A column the service marks `heavy` is excluded from a default
projection, so a query that relied on the default would silently return no value for it; `traces` is such a
column, and the detail view renders it.

The query SHALL take the schema's reported fields from the caller rather than enumerating a field list of
its own, per "A session query names only fields the entity's schema reports". The columns the view has
always read are required; every column added since — `traces`, the cache, cached-prompt and reasoning token
counts, the chain cost, and the insight columns — is optional. With no schema available the query SHALL name
the required set alone.

The query SHALL name **every** column the insight enrichment exposes, discovered from the enrichment
namespace the schema qualifies those columns with rather than from a field list held in the frontend. An
enumerated list cannot follow the enrichment: a column the evaluator gains is one the detail view cannot
render at all, and the reader has no way to tell that from a session the evaluator never reached. The
failure is worse than absence when a column is _superseded_ — the enumerated pair keeps being named and
comes back null, while the pair that replaced it is never asked for, so the panel reports the evaluator as
silent on a session it labelled.

No column SHALL be withheld for the **kind** of column it is. The enrichment's own bookkeeping — which
evaluator produced a row, and from what input — was previously excluded as not describing the session,
and that exclusion is removed: those columns are what separate a session the current evaluator has not
reached from one it labelled and found nothing in, which no descriptive column can say about itself. The
rule's only test is the enrichment namespace, so no category of column has to be recognised for it to hold.

A column the enrichment exposes that the detail view cannot render as a value SHALL be excluded — one the
schema types as an object, an array or a map. The exclusion SHALL be decided by what the schema reports about the
column rather than by its name, so a column newly typed is classified with no frontend change. A sensitive
column needs no separate treatment here: the rule against referencing one governs every column this query
names. The enrichment exposes no column of either kind today, so this is a guard against one being added
rather than a filter that removes anything.

The selected set SHALL include the rollup's enrichment columns where the schema reports them, whose exposed
names are qualified flat names containing a dot. The query SHALL send such a name whole rather than treating
the dot as a path.

The query MUST NOT carry a time bound. The log's list query bounds `last_request_time` to the selected
period, but a detail view is addressed by id and SHALL resolve regardless of which period the log was
showing — a deep link or a bookmark MUST NOT fail because a session falls outside the current window.

The query SHALL name a column the analytics service marks sensitive only where the fetched schema reports it.
Sensitive columns are removed from the query model for callers without the elevated role, so naming one the
caller's schema does not report would fail as an unknown field for those callers rather than being refused
cleanly, making the whole view unavailable to them; a column the schema does report is one this caller may read.
With no schema available the query names the required set alone, which holds none.

#### Scenario: The query is narrowed to one session by id

- **WHEN** the single-session query is built for a session id
- **THEN** it queries the `sessions` entity in row mode
- **AND** it filters on that id by equality and requests one row

#### Scenario: The heavy trace column is named explicitly

- **WHEN** the single-session query is built
- **THEN** its select names `traces`
- **AND** the projection is explicit rather than a default or wildcard projection

#### Scenario: The insight columns are selected

- **WHEN** the single-session query is built and the schema reports the insight columns
- **THEN** its select names `session_insights.title`
- **AND** it names every other column the schema reports under that enrichment namespace
- **AND** it names them whether or not the frontend has a definition for them

#### Scenario: An insight column the frontend has never heard of is still named

- **WHEN** the schema reports an insight column no frontend list enumerates
- **THEN** the select names it
- **AND** naming it required no change to a frontend field list

#### Scenario: No insight column is withheld for its category

- **WHEN** the schema reports insight columns the enrichment stamps for its own bookkeeping rather than to
  describe the session
- **THEN** the select names them like any other column of the namespace
- **AND** no category of insight column is excluded

#### Scenario: A descriptive insight field the schema omits is not named

- **WHEN** the schema reports the insight enrichment but does not report its resolution status
- **THEN** the select names the insight columns the schema does report
- **AND** it does not name `session_insights.resolution_status`
- **AND** the query returns a row

#### Scenario: A non-scalar insight column is excluded

- **WHEN** the schema reports an insight column typed as an array, an object or a map
- **THEN** the select does not name it
- **AND** the exclusion follows the schema's own report rather than a list of column names

#### Scenario: An instance without the enrichment still resolves a session

- **WHEN** the single-session query is built and the schema reports no insight column
- **THEN** its select names none of them
- **AND** it names the session's own stored columns
- **AND** the detail view renders

#### Scenario: The query carries no time bound

- **WHEN** the single-session query is built
- **THEN** it contains no predicate over `first_request_time` or `last_request_time`

#### Scenario: A session outside the log's period still resolves

- **WHEN** a session whose last activity precedes the log's selected period is opened
- **THEN** its detail view renders that session's values

#### Scenario: No sensitive column is requested

- **WHEN** the single-session query is built and the schema reports no column the analytics service marks
  sensitive
- **THEN** its selected columns include none

#### Scenario: A sensitive column the schema reports is requested

- **WHEN** the single-session query is built and the schema reports a column marked sensitive
- **THEN** its selected columns include that column
