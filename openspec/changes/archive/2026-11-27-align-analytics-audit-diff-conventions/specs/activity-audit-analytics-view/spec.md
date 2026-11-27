## MODIFIED Requirements

### Requirement: An analytics revision diff shows every field of the snapshot

The detail page renders an analytics revision through the shared diff engine. For an analytics
resource type the engine SHALL emit a diff row for every field the snapshot carries **that holds a
value on at least one side of the comparison**, so a reader sees the state of the resource with the
changes located inside it. A field that is empty on both sides SHALL NOT produce a row — the same
rule the engine applies to every other resource type, so one page never follows two rules. No field
SHALL be dropped because the engine has no dedicated handler registered for its shape:

- a scalar field renders as one row: its parameter and its value;
- an object-valued field renders as one row per leaf, its parameter naming the path to that leaf
  (`grain.grain_key`, `partition_by.granularity`);
- an array of scalars renders as a single row whose value joins the elements **in the order the
  snapshot lists them**. `ordering_key` and `tag_order` are ordered fields whose order is their
  meaning; sorting them would render a reordering as no change at all.

A snapshot field whose value the service computes per request, or which the service does not record
in its audit trail at all, SHALL be suppressed by resource type, as the container and image resource
types already suppress `$type`, `id`, `createdAt` and `updatedAt`:

| Resource type | Suppressed | Why |
| --- | --- | --- |
| `Table` | `permissions` | Resolved from the caller's own roles against that revision's access lists, so its value answers what *this* reader could have done then — two readers would see different diffs of one revision pair, and a full admin sees it unchanged always. |
| `Pipeline` | `created_at`, `updated_at`, `state` | `state` is runtime position the service excludes from its audit trail, so a revision read never carries it; the timestamps duplicate the activity row. |
| `SavedQuery` | `id`, `created_at`, `updated_at` | The identifier is the row's own key, already shown as the activity's resource identifier; the timestamps duplicate the activity row. |

The timestamps are suppressed because the activity the reader opened already states when the change
happened and who made it, in its own `epochTimestampMs` and `initiatedEmail` — the reason the image
resource types suppress theirs.

A field that describes the resource rather than the reader SHALL stay visible even when it is
service-assigned: a pipeline's `generation`, and a saved query's `owner_id` and `owner_email`, whose
change is itself an auditable fact.

Each parameter SHALL be labelled through the localized field labels the tables feature already
defines; a field with no label defined SHALL fall back to the snapshot's own field name rather than
being hidden.

#### Scenario: Every field of a table snapshot appears in the diff

- **WHEN** the detail page renders a table revision whose snapshot carries `name`, `description`,
  `type`, `source_table`, `status`, `ordering_key`, `partition_by`, `identity_column`,
  `version_column` and `tag_order`
- **THEN** the table-definition group displays a row for each of those fields
- **AND** no field holding a value in either snapshot is absent from the rendered diff

#### Scenario: A field empty on both sides produces no row

- **GIVEN** a table revision pair in which a column's `enum_values` is an empty list on both sides
- **WHEN** the detail page renders the comparison with `All parameters` selected
- **THEN** that column's group displays no `enum_values` row
- **AND** the table-definition group likewise omits any of its own fields that are empty on both
  sides

#### Scenario: An ordered list field keeps the snapshot's order

- **GIVEN** a table snapshot whose `ordering_key` lists `created_at` and then `id`
- **WHEN** the detail page renders it
- **THEN** the `ordering_key` row's value reads `created_at, id`
- **AND** it is not re-sorted alphabetically

#### Scenario: A pipeline or saved-query snapshot is rendered field by field

- **WHEN** the detail page renders a `Pipeline` or a `SavedQuery` revision
- **THEN** every field of that snapshot that holds a value, other than the fields suppressed for its
  resource type, is displayed as a row in the definition group
- **AND** no column group is rendered for it

#### Scenario: A table's permissions are not shown

- **WHEN** the detail page renders a `Table` revision whose snapshot carries a `permissions` member
- **THEN** no row is displayed for `permissions` or for any leaf beneath it
- **AND** every other field of that snapshot is displayed as usual

#### Scenario: A pipeline's timestamps and runtime state are not shown

- **WHEN** the detail page renders a `Pipeline` revision
- **THEN** no row is displayed for `created_at`, for `updated_at`, or for any leaf beneath `state`
- **AND** a row is displayed for `generation`

#### Scenario: A saved query's identifier and timestamps are not shown

- **WHEN** the detail page renders a `SavedQuery` revision
- **THEN** no row is displayed for `id`, `created_at` or `updated_at`
- **AND** rows are displayed for `owner_id` and `owner_email`

#### Scenario: A column activity is suppressed like the table it resolves through

- **GIVEN** a `TableColumn` activity, whose snapshot is its table's own definition
- **WHEN** the detail page renders that revision
- **THEN** `permissions` is omitted, as it is for a `Table` activity
- **AND** the suppression follows the snapshot's resource family, not the activity's resource type
  alone

### Requirement: An analytics revision diff groups the definition and each column separately

A table snapshot's fields SHALL be grouped: the table-definition fields — every field other than
`columns` — under a single group, and the columns under a `Columns` section holding **one group per
column**. A column group SHALL exist for every column name present in either revision, the groups
SHALL be ordered by column name, and each SHALL list every attribute that column carries (`name`,
`type`, `element_type`, `enum_values`, `nullable`, `tag`, `display_name`, `description`,
`sensitive`) **that holds a value on at least one side of the comparison** — an attribute empty on
both sides produces no row, by the same rule the table-definition group follows.

Each column group SHALL be headed by the name of the column it describes, so a reader can tell which
column a group is about without reading its rows.

#### Scenario: Each column is its own group headed by its name

- **GIVEN** a table revision whose snapshot carries the columns `amount` and `total`
- **WHEN** the detail page renders it
- **THEN** the diff shows one group headed `Column amount` and one headed `Column total`
- **AND** each lists that column's own attributes
- **AND** the table-definition fields are shown in a separate group above them

#### Scenario: Column groups are ordered by column name

- **GIVEN** a table revision whose snapshot lists the columns `total`, `amount`, `id` in that order
- **WHEN** the detail page renders it
- **THEN** the column groups appear in the order `amount`, `id`, `total`
