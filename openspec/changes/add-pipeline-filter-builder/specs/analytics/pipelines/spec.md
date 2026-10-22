## MODIFIED Requirements

### Requirement: A pipeline's SQL predicate fields are presented as bounded expressions

A pipeline admits four SQL predicates: the membership `filter`, the readiness `signal` of a group trigger,
the `prefer_sql` of its member selection, and the `where` of an individual aggregate measure. Each is a
boolean expression in the same bounded grammar over the read source's **entity** — the source with its
enrichments flattened in, which is what the service resolves a predicate against — and none admits a join, a
subquery, or a CTE.

The `signal`, the `prefer_sql` and a measure's `where` SHALL each be presented as a multi-line expression
input, in a monospaced face, captioned with the source its columns come from. The membership `filter` SHALL
be presented as described in *The membership filter is built from conditions, with SQL as a fallback*; its
SQL view is the same expression input.

The console SHALL NOT attempt to validate an expression typed into an expression input — the grammar is the
service's and a client-side approximation would reject valid predicates — so an invalid expression SHALL be
reported by surfacing the service's rejection on save.

#### Scenario: A predicate names its source

- **WHEN** a SQL predicate field is presented
- **THEN** it states which table its columns come from

#### Scenario: A measure's predicate uses the same control

- **WHEN** a measure's `where` is edited
- **THEN** it is presented as a bounded SQL expression naming the input table

#### Scenario: An invalid predicate is reported by the service

- **WHEN** a pipeline carrying an unparseable predicate is saved
- **THEN** the service's rejection message is surfaced
- **AND** the edited values remain in the form

## ADDED Requirements

### Requirement: The membership filter is built from conditions, with SQL as a fallback

The membership `filter` SHALL offer two views, **Builder** and **SQL**, chosen by a switch on the field. The
value sent to the service SHALL remain a SQL predicate string in both views; the wire contract does not change.

The Builder view SHALL present the filter as a list of conditions. Each condition SHALL be one row of a
**Column** control, an **Operator** control and, where the operator takes one, a **Value** control, and a
control that deletes the row. Only the first row SHALL draw the Column, Operator and Value labels; the rows
below line up under them without repeating them. Every control in every row SHALL still carry its name for
assistive technology, and each row SHALL be exposed as a group named by its position. Below the list an **Add condition** control SHALL append
an empty row. Above the list a **Match** control SHALL choose whether a row must satisfy **all** conditions or
**any** of them; the choice applies to the whole list.

The Column control SHALL offer the fields of the read source's entity, including the enrichment columns the
service accepts. The Operator control SHALL offer equals, not equals, less than, greater than, less than or
equal, greater than or equal, contains, does not contain, in, is empty and is not empty, and SHALL withhold
the operators the selected column's type does not admit: contains and does not contain are not offered for an
enum column. The Value control SHALL follow the column's type: a choice of the declared values for an enum
column, a choice of true or false for a boolean column, and a text input otherwise; for **in** it SHALL take
several values.

The SQL the builder writes SHALL quote and escape every column and value the way the service's own SQL
rendering does, so a value containing a quote, or a column named like a keyword, produces a predicate the
service reads as the operator meant it.

A condition with no column, or with no value where its operator needs one, SHALL NOT be written into the
filter. Neither SHALL a contains or does-not-contain condition whose value holds `%` or `_`, because the
service's SQL subset cannot express those characters in a contains pattern; that row SHALL show why. While any
condition is not written, the field SHALL state how many conditions are not applied, announced to assistive
technology, because the saved filter then admits more rows than the list shows.

When the form opens on a pipeline that already has a filter, the console SHALL ask the service to read the
filter against the read source and SHALL show it in the Builder view when it is a single condition, or one
list of conditions joined only by AND or only by OR, where each condition compares a column with a value, a
list of values or emptiness using an operator the builder offers. A negated equality or contains reads as its
opposite — `NOT ("deployment" = 'a')` as not equals — because that is a condition the builder offers. Otherwise —
the filter nests groups, calls a function, negates anything else, compares two columns, uses a case-sensitive
`LIKE`, lists a value holding a comma or edge spaces in an **in**, cannot be read by the service, the read
source is not resolved, or its columns cannot be loaded — the field SHALL open in the SQL view, the Builder
option SHALL be disabled, and the field SHALL say why the builder is unavailable. A list value holding a comma
or edge spaces is refused because the builder edits a list as comma-separated text, and writing it back would
change the list.

While the read source or its columns are still resolving, the field SHALL NOT offer the Builder view for a
filter that has text: a condition written before the column types are known would type its literals wrongly.
The SQL view stays editable meanwhile.

A string value SHALL be written exactly as entered, edge spaces included; a number, date, timestamp or boolean
value SHALL be written trimmed.

The shape is judged on the filter as the service reads it, not as it was typed. The service folds an OR of
equalities on one column into a single **in** condition, and that folding can turn a nested group into a flat
list: `("deployment" = 'a' OR "deployment" = 'b') AND "response_status" = 200` reads as two conditions joined
by AND. The console SHALL show such a filter in the Builder view as read — the folded group as one **in**
condition — because it means the same rows, and SHALL NOT try to restore the OR it was typed as, which the read
filter no longer records.

Opening a pipeline SHALL NOT change its filter. The filter's text SHALL change only when the user edits it,
in either view.

Switching from Builder to SQL SHALL show the predicate the builder wrote. Switching back without editing the
SQL SHALL return to the same conditions, including those not applied. Switching from SQL to Builder after the
SQL was edited SHALL read the current text the same way as on open: a filter the builder can show replaces the list; one it cannot
show keeps the field in the SQL view with the reason.

An empty list, or an empty SQL view, SHALL send no filter, which the service reads as admitting every row.

#### Scenario: A new pipeline's filter opens in the Builder view

- **WHEN** the user creates a pipeline
- **THEN** the filter field shows the Builder view with no conditions
- **AND** an Add condition control is presented

#### Scenario: Conditions are written as a SQL predicate

- **WHEN** the user adds a condition with column `deployment`, operator equals and value `o'neil`
- **AND** adds a second condition with column `status_code`, operator in and values `200` and `201`
- **AND** chooses to match all conditions
- **THEN** switching to the SQL view shows `"deployment" = 'o''neil' AND "status_code" IN (200, 201)`

#### Scenario: Labels are drawn on the first condition only

- **WHEN** the filter has two conditions
- **THEN** the Column, Operator and Value labels are shown above the first condition only
- **AND** every control of the second condition is still named Column, Operator or Value for assistive
  technology

#### Scenario: Is empty takes no value

- **WHEN** the user chooses the operator is empty on a condition
- **THEN** no Value control is presented for that row
- **AND** the condition is written as `IS NULL` on its column

#### Scenario: Contains is withheld for an enum column

- **WHEN** the selected column of a condition is an enum
- **THEN** the Operator control does not offer contains or does not contain
- **AND** the Value control offers the column's declared values

#### Scenario: An incomplete condition is not applied

- **WHEN** a condition has a column and the operator equals but no value
- **THEN** the condition is not part of the filter sent on save
- **AND** the field states that one condition is not applied

#### Scenario: A contains value with a LIKE wildcard is refused

- **WHEN** the user enters `a_b` as the value of a contains condition
- **THEN** the row says the value cannot contain `%` or `_`
- **AND** the condition is not part of the filter sent on save

#### Scenario: An existing flat filter opens in the Builder view

- **WHEN** the user opens a pipeline whose filter is `"deployment" = 'gpt-4o' OR "response_status" = 200`
- **THEN** the filter field shows the Builder view with two conditions
- **AND** the Match control is set to any condition

#### Scenario: An OR of equalities on one column opens as one in condition

- **WHEN** the user opens a pipeline whose filter is
  `("deployment" = 'a' OR "deployment" = 'b') AND "response_status" = 200`
- **THEN** the filter field shows the Builder view with two conditions: `deployment` in `a, b`, and
  `response_status` equals `200`
- **AND** the Match control is set to all conditions
- **AND** the filter's text is unchanged until the user edits a condition

#### Scenario: A filter the builder cannot show opens in the SQL view

- **WHEN** the user opens a pipeline whose filter calls a function, or nests a group over different columns
  such as `"deployment" = 'a' AND ("response_status" = 200 OR "response_status" IS NULL)`
- **THEN** the filter field shows the SQL view with the filter's text unchanged
- **AND** the Builder option is disabled
- **AND** the field says why the builder is unavailable

#### Scenario: Opening a pipeline does not rewrite its filter

- **WHEN** the user opens a pipeline whose filter shows in the Builder view and saves without editing it
- **THEN** the filter sent on save is the text the pipeline already had

#### Scenario: A look at the SQL keeps conditions not yet applied

- **WHEN** the builder holds a condition with a column and no value, the user switches to the SQL view and
  back without editing
- **THEN** the condition is still shown
- **AND** the field still states that one condition is not applied

#### Scenario: An in list with a comma inside a value stays in the SQL view

- **WHEN** the user opens a pipeline whose filter is `"label" IN ('a,b', 'c')`
- **THEN** the filter field shows the SQL view with the filter's text unchanged
- **AND** the Builder option is disabled

#### Scenario: Switching back to the builder rereads the SQL

- **WHEN** the user switches to the SQL view, changes a condition's value in the text, and switches back to
  the Builder view
- **THEN** the Builder view shows the changed value

#### Scenario: An empty builder sends no filter

- **WHEN** the user deletes every condition and saves
- **THEN** the pipeline is saved with no filter
