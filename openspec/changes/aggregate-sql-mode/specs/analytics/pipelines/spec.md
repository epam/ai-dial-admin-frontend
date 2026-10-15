## ADDED Requirements

### Requirement: An aggregate pipeline is declared in Form mode or SQL mode

An aggregate pipeline's declaration SHALL be authored in one of two modes: **Form**, the group keys and measures
editors, or **SQL**, one `INSERT INTO <target> (<columns>) SELECT …` statement. The service accepts exactly one
of the two for a pipeline, so the console SHALL present the choice as a group of radio buttons in the aggregate section and
SHALL present only the active mode's editor.

The mode of an opened pipeline SHALL follow its declaration: a pipeline served with `sql` opens in SQL mode, every
other aggregate opens in Form mode. A new aggregate with nothing declared SHALL open in Form mode.

Switching mode SHALL discard the other mode's authored content from the draft, because carrying both would be a
declaration the service refuses. When the mode being left holds authored content, the switch SHALL be confirmed
before it discards that content. The console SHALL NOT convert one mode's content into the other.

The scope of the mode choice is the aggregate section. The source, the target and the schedule remain presented
in both modes. The **filter** belongs to Form mode: a SQL declaration carries its own `WHERE`, and the service
refuses a `filter` beside `sql`, so the filter field SHALL NOT be presented in SQL mode.

#### Scenario: A form-mode pipeline opens in Form mode

- **WHEN** an aggregate pipeline served with group keys and measures and no `sql` is opened
- **THEN** the Form mode is active
- **AND** the group keys and measures editors are presented
- **AND** no SQL editor is presented

#### Scenario: A SQL-mode pipeline opens in SQL mode

- **WHEN** an aggregate pipeline served with `sql` is opened
- **THEN** the SQL mode is active
- **AND** the SQL editor holds the statement exactly as served
- **AND** the group keys and measures editors are not presented

#### Scenario: A pipeline with no declaration opens in Form mode

- **WHEN** an aggregate pipeline served with no `sql`, no group keys and no measures is opened
- **THEN** the Form mode is active

#### Scenario: Switching to SQL discards the form members

- **WHEN** the caller switches an aggregate pipeline from Form to SQL mode
- **THEN** the draft carries no group keys, no measures and no filter
- **AND** the SQL editor is presented

#### Scenario: The filter is presented in Form mode only

- **WHEN** an aggregate pipeline is opened in Form mode
- **THEN** the filter field is presented
- **AND** when the caller switches to SQL mode the filter field is no longer presented

#### Scenario: Switching to Form discards the statement

- **WHEN** the caller switches an aggregate pipeline from SQL to Form mode
- **THEN** the draft carries no `sql`
- **AND** the group keys and measures editors are presented empty

#### Scenario: Leaving a mode with authored content is confirmed

- **WHEN** the caller switches mode while the mode being left holds authored content
- **THEN** the caller is asked to confirm before that content is discarded
- **AND** declining leaves the mode and the content unchanged

#### Scenario: Leaving an empty mode is not confirmed

- **WHEN** the caller switches mode while the mode being left holds no authored content
- **THEN** the mode changes without a confirmation

### Requirement: The SQL declaration is authored as a statement the service judges

In SQL mode the aggregate section SHALL present one editor for the statement. The editor SHALL state the shape
the service accepts: one `INSERT INTO <target> (<columns>) SELECT …` statement whose `INSERT` target is the
pipeline's target.

The console SHALL NOT parse or validate the statement, and SHALL NOT reject any statement before the service
has seen it: the grammar and the eligibility rules (no HAVING, DISTINCT, ORDER BY, LIMIT, windows, joins,
set operations or subqueries; non-nullable group keys; a time bucket of step one) are the service's, and a
client-side approximation would refuse statements the service accepts. A refusal SHALL surface as the service's
own message through the same path as any other refused save.

An empty statement SHALL be a draft rather than a declaration: it SHALL NOT be sent as `sql: ""`, so a pipeline
the author has not yet written is the same pipeline the service already stores without a declaration.

The statement SHALL be sent exactly as typed: the console SHALL NOT trim inner whitespace, re-indent, or
otherwise rewrite it, because the service stores it verbatim and serves it back verbatim.

#### Scenario: The editor states the accepted shape

- **WHEN** the SQL mode is active
- **THEN** the editor's caption states that it takes one INSERT … SELECT statement into the pipeline's target

#### Scenario: A statement the service refuses is reported as refused

- **WHEN** the caller saves an aggregate pipeline whose statement the service refuses with a validation error
- **THEN** the service's message is presented
- **AND** the draft, including the statement, is unchanged

#### Scenario: The console does not pre-judge a statement

- **WHEN** the caller types a statement the console cannot itself classify as valid
- **THEN** saving is still offered

#### Scenario: An empty statement is not sent

- **WHEN** the caller saves an aggregate pipeline in SQL mode whose editor is empty or only whitespace
- **THEN** the request carries no `sql`

#### Scenario: The statement is not rewritten

- **WHEN** the caller saves a statement containing multiple lines and indentation
- **THEN** the request carries the statement's lines and indentation as typed

### Requirement: An aggregate request states one declaration mode

The request for an aggregate pipeline SHALL carry the active mode's declaration and none of the other mode's.
In SQL mode it SHALL carry `sql` and SHALL carry no `group_by`, no `measures` and no `filter`. In Form mode it
SHALL carry no `sql`. The service refuses a request that carries `sql` beside any form-mode member, and clears
the other mode's stored members when a patch states a mode; the console SHALL therefore never send a mixed
body, and SHALL send the active mode's member on every save of a pipeline whose mode it knows, so that a
switch of mode is always stated rather than implied.

A pipeline opened as JSON SHALL be governed by the same rule: the document SHALL carry `sql` for a SQL-mode
pipeline and SHALL NOT carry the form-mode members beside it. A document the caller edits into a mixed
declaration is the caller's, and the service's refusal SHALL surface as for any other.

#### Scenario: A SQL-mode request carries no form member

- **WHEN** an aggregate pipeline in SQL mode is saved
- **THEN** the request carries `sql`
- **AND** the request carries no `group_by`, no `measures` and no `filter`

#### Scenario: A form-mode request carries no statement

- **WHEN** an aggregate pipeline in Form mode is saved
- **THEN** the request carries no `sql`

#### Scenario: A switch of mode is stated on save

- **WHEN** a pipeline stored in Form mode is switched to SQL mode and saved
- **THEN** the request carries `sql` and no form-mode member

#### Scenario: A SQL-mode pipeline round-trips through the JSON document

- **WHEN** a pipeline served with `sql` is opened as JSON
- **THEN** the document carries `sql`
- **AND** the document carries no `group_by` and no `measures`

## MODIFIED Requirements

### Requirement: The aggregate section presents group keys and measures

An aggregate pipeline's declaration is a pair in Form mode: what its rows are grouped by, and what is computed
for each group. In Form mode the console SHALL present both, and SHALL present no freshness control — the
service accepts no such member. In SQL mode the declaration is one statement and the pair is not presented; see
"An aggregate pipeline is declared in Form mode or SQL mode".

In Form mode at least one measure SHALL be required before an aggregate pipeline can be submitted: a rollup that
computes nothing has no meaning to fall back on. In SQL mode no measure is required of the console, and the
statement is the service's to judge.

Group keys SHALL NOT be required. When none is declared the service derives them from the target's
ordering key, provided each key is a column of the input under the same name, and echoes the derived
keys back expanded. The section SHALL state that an empty list means derivation from the target rather
than presenting the emptiness as an omission.

#### Scenario: The two parts are presented together

- **WHEN** an aggregate pipeline in Form mode is opened
- **THEN** its group keys and measures are presented

#### Scenario: No freshness control is presented

- **WHEN** an aggregate pipeline is opened
- **THEN** no freshness mode is offered

#### Scenario: Group keys may be left empty

- **WHEN** an aggregate pipeline in Form mode is submitted with no group key and at least one measure
- **THEN** submission is offered
- **AND** the section states that the keys are derived from the target

#### Scenario: A measure is still required

- **WHEN** an aggregate pipeline in Form mode is submitted with no measure
- **THEN** submission is blocked and the missing part is named

#### Scenario: No measure is required in SQL mode

- **WHEN** an aggregate pipeline in SQL mode is submitted
- **THEN** submission is not blocked for want of a measure
