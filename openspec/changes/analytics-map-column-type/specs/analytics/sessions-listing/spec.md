## MODIFIED Requirements

### Requirement: Session grid columns are the curated set plus every field the entity schema reports

The sessions grid SHALL offer, in addition to its curated columns, one column per field the fetched
`sessions` entity schema reports. The offered set SHALL follow the instance rather than a list held in
the frontend, and the number of columns MUST NOT be fixed anywhere in the frontend: one instance reports 39
fields (25 from the rollup, 14 from `session_insights`), another carrying a further enrichment reports
more, and the difference between them is the reason the schema is read rather than a list maintained.

The curated columns SHALL keep their designed cells, headers and defaults and SHALL NOT be re-derived. They
are Session, Project, User, Turns, Activity, Tokens, Cost, Deployments, Topics and Rating.

Where a schema was read, a curated column reading a field of the entity SHALL be offered only when the schema
reports that field — the original set included. No `sessions` field is catalogued `sensitive` by default, but an
administrator can mark any column so and an instance can lag the frontend's field set, and a column whose sort
or filter names an unreported field fails the whole listing. Rating
reads no field of this entity and SHALL be kept. The same rule SHALL hold for every select the session views
build from a read schema, the session detail record included: a field the schema does not report is not
named. With no schema in hand only the required core is named.

A derived column SHALL take:

- its header from the field's `display_name` where the schema reports one, and otherwise from the field's
  `name` rendered readably — separators replaced by spaces and the first word capitalized, with an
  enrichment prefix stripped first, so `avg_duration_ms` reads "Avg duration ms" and
  `session_insights.activity_sub_task_type` reads "Activity sub task type". `display_name` is reported for some
  fields and not others on the same instance, and for none at all on some instances, so both paths are
  ordinary rather than exceptional. A raw catalog identifier SHALL NOT be presented as a header;
- its tooltip from the field's `description`, **verbatim**. The descriptions are authoritative and several
  contradict what the column looks like — `duration_ms` counts a chained turn's nested hops more than once
  and so exceeds the session's elapsed time, and `chain_price_total` is NULL wherever no turn carries a
  chain-starting hop with a chat id, which is a coverage gap and not a zero. The frontend SHALL NOT
  paraphrase a description into a string of its own, because a paraphrase is a second copy that drifts when
  the service re-words the original;
- its cell formatting and its sort affordance from the field's declared type, on the same terms as any other
  column of that value type elsewhere in the app;
- its filter from the declared type **only where the grid's filter translation carries that filter's model**.
  A derived column of a timestamp or boolean type SHALL offer no filter at all. A date filter reports its
  bounds under names the translation does not read, so the predicate would be dropped and the header would
  show an active filter over an unnarrowed result; a boolean falling through to the text filter would offer
  a contains predicate the query language cannot express over a boolean, and the service rejects a whole
  query for one such predicate — so a filter menu would take the listing down rather than narrow it. Both
  SHALL remain sortable: an ordering is expressible for either, and it is only the predicate that has no
  translation.

  A derived column of an **enum** type SHALL offer the value filter specified under "A column of an enum
  type filters by selecting from its observed values" rather than the text filter, and SHALL offer no
  floating filter — the floating filter is a text entry, so it would write a text model over the value model
  the translation reads. It SHALL remain sortable on the same terms as any other scalar column. The branch
  SHALL key on the declared type alone: no list in the frontend names which fields are enums, so a field an
  instance begins reporting as one gets the control with no frontend change.

A field SHALL NOT be offered as a derived column when:

- its type is the non-scalar `object`, `array` or `map` — a grid cell is not a structured-value viewer, and
  rendering one as text would assert a shape the view does not know;
- a curated column already reads it, including a field a curated column composes without having a column of
  its own. `first_request_time` (composed into Activity) and `session_insights.title` (read by the
  identity column) SHALL NOT additionally appear as columns of their own, which would present the same value
  twice under two names.

A field the service marks `heavy` SHALL NOT be excluded from being offered on that ground alone: `heavy` is a
transfer-cost hint and SHALL govern **projection** rather than offering.

On the current schema no offered field is heavy, so the heavy class is empty — the expected result rather
than a gap. The non-scalar rule is a rule about which fields become **columns**, and carries no implication
for projection: `deployments` is an array, has a designed column, and is projected on every page like any
other cheap field. The one heavy field the entity reports is `traces`, and it is absent from the projection
because **no rendered column reads it**, not because of its type. The class SHALL become non-empty on either
of two events, neither requiring this rule to be revisited: the service marking a scalar field `heavy`, or a
column being designed that reads `traces`.

The default visible set SHALL be exactly the set visible today — Session, Project, User, Activity, Cost
and Rating — and every derived column SHALL ship hidden. Grouping constrains column order, so the default
visible **order** SHALL become Session, Activity, Project, User, Cost, Rating. The change of order is
accepted deliberately: a group a reader can see is worth more than a preserved column sequence.

Columns SHALL be grouped on the pair of **origin and tag**, at one level, with one group per pair the schema
actually reports:

- the **tag** SHALL supply the group's label, rendered as readable words rather than as the raw kebab-case
  catalog identifier. A tag for which the frontend holds no label SHALL fall back to the raw tag rather than
  causing its columns to be dropped, and a group with no tag at all SHALL be labelled by its origin;
- the **origin** — the rollup, a named enrichment, or the rating source — SHALL supply the group's colour;
- a group of an **enrichment** origin SHALL additionally name that enrichment in the label itself, not in
  the colour alone, and two enrichments the frontend cannot name SHALL form separate groups even where they
  carry the same tag — they share one catch-all origin, so the enrichment is the only thing distinguishing
  them. The columns panel prints a group's label as the caption under each of its columns, so a
  caption reading only "Evaluator run" above a column reading "Model" still leaves the reader to guess whose
  model it is. A group of the rollup SHALL take no such prefix: the rollup is what the grid is a list of, and
  naming the source table there is the mis-attribution this grouping replaced.

Each group SHALL also state its origin's meaning on hover, so a hue is never the only carrier of the
distinction.

Keying on the pair rather than on the tag alone SHALL keep a rollup field and an enrichment field that share
a tag in separate groups. Two origins merged under one tag would attribute an enrichment value to the rollup,
and the two produce different kinds of empty cell — one that cannot happen and one that means not yet
evaluated.

Every column SHALL be attributed to exactly one group, and no column SHALL be left unattributed.

The five fields the schema tags `provenance` are the evaluation's own bookkeeping rather than facts about the
session: the evaluator's DIAL deployment, its version, the input's group version, when the row was
computed, and whether the input was truncated. They SHALL be presented only under a group whose label names
them as the evaluator's run, and MUST NOT be presented under a label a reader could take for a property of
the session. In particular the field whose reported `display_name` is "Model" — described by the service
as the DIAL deployment that produced the row — MUST NOT appear as a column headed "Model" without that group
above it: read bare, it is indistinguishable from the deployments the session actually used, which is
the specific defect that caused schema-derived columns to be withdrawn.

The identity column SHALL NOT be hideable. It is how a reader recognises a row and how a row is opened, so a
grid without it is a table of values belonging to sessions the reader cannot name. It SHALL declare the
rollup as its origin even though it reads the enrichment for its title — a session's identity is its id
and the title only labels it — and SHALL state in its own disclosure that the title comes from the insight
enrichment and may describe only part of the session. It SHALL state that size cap **once**, for the
column, rather than marking the rows it applies to.

`session_insights.summary` SHALL be offered as a derived column, hidden by default. It is derived text
the service reports as non-sensitive, like the title the identity column already shows. This is recorded as a
decision and not an oversight: the request and response bodies it was derived from are marked `sensitive` and
`heavy`, are encrypted at rest and carry an explicit gating instruction, and none of that propagates through
an enrichment — so the flags on the derived field cannot be read as evidence that the derivation is
uninteresting, only that the service does not gate it.

The two fields whose values form a closed vocabulary — an insight's sentiment and its resolution status —
SHALL be offered as derived columns of their reported string type, with the string operators the query
language already expresses. The frontend SHALL NOT hold a copy of the evaluator's enumeration in order to
offer a value-list filter for them: that vocabulary is declared in the evaluator's response schema on the
service side and would drift silently whenever the evaluator is re-versioned.

A curated column whose field the entity schema does not report SHALL NOT be rendered at all — neither shown
nor offered as hideable — because the query cannot name the field and the cells could never fill. Rating is
the exception and SHALL render unconditionally: it reads no field of this entity, so no schema will ever
report it, and it SHALL remain outside the derived set, not offered, hidden or reordered as a field-backed
column is.

An enrichment field's exposed name is a qualified flat name containing a dot. The grid SHALL read such a field
by that whole name and MUST NOT interpret the dot as a path into a nested value: the row carries the name as a
single key, so a path interpretation finds nothing and renders an empty cell for a field the row does carry.

No column SHALL be offered for a request or response body, because the entity reports no such field. Those
are columns of `dial_usage_log`, a different entity; the listing queries `sessions`. The frontend SHALL
state this where columns are derived and SHALL NOT carry a filter against those names, which would imply the
schema could report them.

When the entity schema cannot be fetched the grid SHALL render the curated columns that need no optional
field, SHALL offer no derived column, and SHALL report that the additional columns could not be read.

A stored column choice recorded against a smaller column set SHALL leave a column it does not name at that
column's coded default, so columns introduced by this change arrive hidden for an operator who already has a
stored choice.

#### Scenario: The offered columns come from the schema, not from a fixed list

- **WHEN** the grid loads against an instance whose schema reports fields beyond those the curated columns read
- **THEN** each such field is offered as a column
- **AND** the offered count follows the schema rather than a number held in the frontend
- **AND** an instance reporting a further enrichment offers that enrichment's fields too, with no code change

#### Scenario: The default visible set is unchanged and derived columns ship hidden

- **WHEN** the grid loads with no stored column choice
- **THEN** the Session, Project, User, Activity and Cost columns are visible, together with Rating
- **AND** every derived column is hidden
- **AND** the visible order is Session, Activity, Project, User, Cost, Rating

#### Scenario: A group is named by its tag and coloured by its origin

- **WHEN** the grid renders its column groups
- **THEN** each group is labelled in readable words rather than by a raw catalog identifier
- **AND** each group's colour distinguishes the rollup from an enrichment
- **AND** a group of an enrichment origin names that enrichment in its label, while a rollup group does not
- **AND** each group states its origin's meaning on hover
- **AND** the columns of one group are adjacent
- **AND** every column belongs to exactly one group

#### Scenario: A rollup field and an enrichment field sharing a tag stay in separate groups

- **WHEN** the schema reports an enrichment field carrying the same tag as a field of the rollup
- **THEN** the two are placed in different groups
- **AND** neither group attributes an enrichment value to the rollup

#### Scenario: The evaluator's deployment never reads as the session's model

- **WHEN** the schema reports `session_insights.model` with the display name "Model"
- **THEN** its column appears only under a group whose label names the evaluator's run
- **AND** the columns panel states that column's origin alongside it
- **AND** no column headed "Model" appears with no such group above it

#### Scenario: A tag the frontend has no label for still yields columns

- **WHEN** the schema reports a field carrying a tag the frontend holds no label for
- **THEN** the field is still offered as a column
- **AND** its group is labelled with the raw tag rather than dropped

#### Scenario: A field with no display name gets a readable header

- **WHEN** the schema reports `avg_duration_ms` with no display name, and
  `session_insights.activity_sub_task_type` with none either
- **THEN** the first column's header reads "Avg duration ms"
- **AND** the second's reads "Activity sub task type", the enrichment prefix having been stripped
- **AND** neither header is a raw catalog identifier

#### Scenario: A field's description is its tooltip, unparaphrased

- **WHEN** the grid renders the header of a derived column whose field carries a description
- **THEN** the tooltip is that description as the service reported it
- **AND** the duration column's tooltip states that nested hops are counted more than once
- **AND** the chain-cost column's tooltip states that its NULL is a coverage gap, not an accounting difference

#### Scenario: Non-scalar fields are not offered

- **WHEN** the schema reports a field of an object, array or map type
- **THEN** it is not offered as a column

#### Scenario: A sensitive field is offered like any other

- **WHEN** the schema reports a field marked `sensitive`
- **THEN** it is offered as a column, hidden by default
- **AND** no frontend list or role check decides whether it is offered, because the service has already filtered
  the schema by the caller's role

#### Scenario: A heavy field is not excluded for being heavy

- **WHEN** the schema reports a scalar field marked heavy
- **THEN** it is offered as a column
- **AND** it is hidden by default like any other derived column

#### Scenario: A field a curated column already reads is not offered twice

- **WHEN** the columns are built
- **THEN** `first_request_time` is not offered as a column of its own, being composed into Activity
- **AND** `session_insights.title` is not offered as a column of its own, being read by the identity column
- **AND** `deployments` and `session_insights.topics` are offered only as their curated columns

#### Scenario: The summary is offered, hidden

- **WHEN** the schema reports `session_insights.summary`
- **THEN** it is offered as a column
- **AND** it is hidden by default

#### Scenario: Sentiment and resolution status are offered as string columns

- **WHEN** the schema reports the insight sentiment and resolution status as string fields
- **THEN** each is offered as a column with the string filter operators the query language expresses
- **AND** neither offers a value list drawn from a copy of the evaluator's enumeration held in the frontend

#### Scenario: No body column is offered

- **WHEN** the columns are built from the reported schema
- **THEN** no column is offered for a request or response body
- **AND** no filter names those fields, the schema reporting none

#### Scenario: The identity column cannot be hidden and discloses its title's source

- **WHEN** the operator opens the columns panel
- **THEN** the Session column offers no way to hide it
- **AND** every other column can be hidden
- **AND** the column's own disclosure states that its title comes from the insight enrichment and may describe
  only part of the session
- **AND** no row carries a separate truncation marker of its own

#### Scenario: A dotted enrichment field is read by its whole name

- **WHEN** a derived enrichment column renders a row carrying that field's qualified name as a key
- **THEN** the cell states that row's value
- **AND** it is not empty

#### Scenario: A curated column whose field is missing is not rendered

- **WHEN** the schema reports no insight fields
- **THEN** the grid renders no Topics column
- **AND** the columns panel offers it nowhere
- **AND** the remaining columns render as they did before it existed

#### Scenario: Rating survives a schema that reports no such field

- **WHEN** the columns are built from a schema reporting no `rating` field
- **THEN** the Rating column renders
- **AND** it is not offered as a derived column

#### Scenario: A failed schema fetch degrades to the curated columns

- **WHEN** the entity schema cannot be fetched
- **THEN** the curated columns that need no optional field render
- **AND** no derived column is offered
- **AND** the view reports that the additional columns could not be read

#### Scenario: A stored choice from the smaller set leaves new columns hidden

- **WHEN** the grid loads for an operator whose stored column choice names only the previously shipped columns
- **THEN** that stored choice is honoured for the columns it names
- **AND** every column it does not name is hidden

#### Scenario: A derived timestamp or boolean column offers no filter

- **WHEN** the schema reports a timestamp field and a boolean field that no curated column reads
- **THEN** each is offered as a column and each offers a sort
- **AND** neither offers a filter control

#### Scenario: Two unnamed enrichments sharing a tag stay apart

- **WHEN** the schema reports fields from two enrichments the frontend has no name for, both carrying the
  same tag
- **THEN** each enrichment's fields form their own group
- **AND** each group is labelled with the enrichment that supplies it

#### Scenario: Sort affordances match what the query can order

- **WHEN** the grid renders its headers
- **THEN** a derived column of a scalar type offers a sort
- **AND** the Rating, Topics and Deployments columns offer none

#### Scenario: An enum-typed field's column offers the value filter

- **WHEN** the schema reports a field of an enum type that no curated column reads
- **THEN** its column offers the value filter rather than a text entry
- **AND** it offers no floating filter
- **AND** it remains sortable

#### Scenario: A timestamp or boolean field's column still offers no filter

- **WHEN** the schema reports a timestamp field and a boolean field
- **THEN** neither column offers a filter
- **AND** both remain sortable
