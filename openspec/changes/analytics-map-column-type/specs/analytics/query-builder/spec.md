## ADDED Requirements

### Requirement: A map field is offered only where the service accepts it

A schema field the entity schema types `map` SHALL NOT be offered as a **column** in any builder position the
service refuses a raw map in: the left operand of a Filter condition, a plain **Group by** column, and a
**Sort** key's field. The service defines no comparison, grouping or ordering over a map — it answers every
operator over one, the null tests included, with a refusal — and it rejects the whole query for one bad
predicate or key, so a single such entry would take the entire result down rather than degrading it. The
exclusion SHALL key on the field's **schema type alone**: no list in the frontend names which fields are maps, so
a field an instance begins reporting as a map is guarded with no change here. The row-limit editor, which reuses
the Filter condition editor, inherits the exclusion.

A map field SHALL stay offered where the service accepts it:

- in the row-mode **Select** projection, where it returns as a JSON object;
- as an `expression` argument of a function being built, in every section that builds one — because a function
  reading one key of a map is how a map is filtered, grouped and sorted on, and the served catalog does not
  declare what type an `expression` argument expects, so there is nothing to exclude on.

The builder SHALL NOT name any map function itself: reading a key goes through whichever functions the served
catalog offers (see "Served function catalog"), and the key is that function's own `string_literal` argument,
typed as it is stored — a key containing a dot is one flat key, not a path. A function reading a key returns the
catalog's declared type, so its condition's operators, its value type and its eligibility as a Group by or Sort
entry follow that return type exactly as for any other function.

A query authored in the JSON or SQL view, or proposed by the assistant, that already names a map field in one of
the excluded positions SHALL be carried as authored: the exclusion governs what the builder offers, not what it
parses, and the service's own error is what reports the problem.

#### Scenario: A map field is withheld from Filter, Group by and Sort

- **WHEN** the selected entity's schema has a field `span_attributes` typed `map`
- **THEN** the Filter condition's left-operand dropdown, the plain-column part of the Group by dropdown and the Sort key's field dropdown do not list it

#### Scenario: A map field stays projectable

- **WHEN** the user opens the row-mode Select dropdown for an entity with a `map` field
- **THEN** the map field is listed and can be added as a projection chip

#### Scenario: A map field is offered as a function argument

- **WHEN** the user picks a catalog function in a Filter condition's operand and opens its `expression` argument's dropdown
- **THEN** the entity's `map` fields are listed there
- **AND** with the map field and a key filled, the condition serializes as that function call compared against the literal

#### Scenario: The exclusion follows the schema type

- **WHEN** an instance's schema reports a field typed `map` that the frontend has never named
- **THEN** it is withheld from the Filter, Group by and Sort column options with no frontend change
