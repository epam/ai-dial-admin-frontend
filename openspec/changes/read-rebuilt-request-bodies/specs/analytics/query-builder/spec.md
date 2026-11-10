## ADDED Requirements

### Requirement: A projection-only field is offered only as a row-mode projection

The entity schema marks every field with `projection_only`. A field marked `true` is computed by the service
after the query runs rather than stored, and the service accepts it only as a plain column of a row-mode
projection: naming it in a filter, a sort, a group-by, a having condition, an aggregate, `distinct`, or as any
function's argument rejects the whole query with `400 bad_request`.

The builder SHALL offer a projection-only field only in the row-mode **Select** projection. It SHALL NOT offer
one as the left operand of a Filter condition (the row-limit editor inherits this), a Group by column, a Sort
key, a Having operand, an aggregate's operand, or an argument of a function being built in any section. The SQL
view's completions are not clause-aware and SHALL keep proposing every schema field, a projection-only one
included, since it is legal in the select list.

The exclusion SHALL key on the flag alone, so a field an instance begins marking projection-only is guarded with
no change here. A field with no flag, or the flag `false`, SHALL be offered as today. The flag SHALL add to the
type-based exclusion under **A map field is offered only where the service accepts it**, not replace it: the
service sets the flag only on computed fields, so a `map` field keeps its own rule and stays offered as a function
argument.

A query authored in the JSON or SQL view, or proposed by the assistant, that already names a projection-only
field in an excluded position SHALL be carried as authored; the service's own error reports the problem.

#### Scenario: A projection-only field is listed only in Select

- **WHEN** the selected entity's schema reports a field with `projection_only: true`
- **THEN** the row-mode Select dropdown lists it
- **AND** the Filter, Group by, Sort and Having column dropdowns do not list it
- **AND** no function argument dropdown in any section lists it

#### Scenario: Aggregate mode does not offer a projection-only field

- **WHEN** the builder is in aggregate mode for an entity whose schema reports a projection-only field
- **THEN** no aggregate or measure operand dropdown lists it

#### Scenario: A field without the flag is unaffected

- **WHEN** the schema reports a field without `projection_only`, or with it `false`
- **THEN** the field is offered in every position its type admits, as before
