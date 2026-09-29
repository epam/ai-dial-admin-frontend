# schema-property-editor Specification

## Purpose

The shared schema property editor lets Catalog Schemas, platform App Runners, and Application Runners
edit a JSON Schema's properties in a grid. This capability covers the input constraints it applies to
the free-text cells and how a consumer configures them.

## Requirements

### Requirement: Free-text property cells carry default length limits

The property editor SHALL limit the length of every free-text cell it renders, by default:

| Cell        | Default limit   |
| ----------- | --------------- |
| Name        | 255 characters  |
| Title       | 255 characters  |
| Tab         | 255 characters  |
| Section     | 255 characters  |
| Description | 1024 characters |

The Order cell SHALL carry no default constraint. Select and toggle cells (data type, requirement,
property kind, widget, localized) are not free text and carry none.

A limited cell SHALL stop accepting characters once its value reaches the limit, both when typing and
when pasting, so the value in the cell never exceeds it. The defaults SHALL apply to every consumer
that does not configure otherwise, including all three current ones.

#### Scenario: Typing stops at the title limit

- **WHEN** a user types into a property's Title cell until it holds 255 characters and keeps typing
- **THEN** the cell keeps exactly the first 255 characters
- **AND** the stored title is those 255 characters after save

#### Scenario: A paste is cut at the limit

- **WHEN** a user pastes a 1001-character string into a property's Name cell
- **THEN** the cell holds the first 255 characters of it

#### Scenario: Description allows a longer value

- **WHEN** a user enters a 600-character description
- **THEN** the full description is kept and the save is not blocked

#### Scenario: Defaults apply on every consumer

- **WHEN** a user edits the property editor on a catalog schema, a platform app runner, or an
  application runner
- **THEN** the Name, Title, and Description limits above are in effect on each
- **AND** the Tab and Section limits are in effect wherever those cells are shown

### Requirement: Consumers configure input constraints per field

A consumer of the property editor SHALL be able to replace the default constraints without changing the
editor, through one optional configuration covering the Name, Title, Description, Tab, Section, and
Order cells:

- no configuration — the defaults apply;
- configuration switched off — no field carries any default;
- a field mapped to "none" — that field carries no default, the others keep theirs;
- a field mapped to a set of native input attributes — those attributes are merged over that field's
  defaults, attribute by attribute; an attribute given without a value removes that default.

Any native text-input attribute SHALL be accepted, including `maxLength`, `minLength`, `pattern`,
`inputMode`, `spellCheck`, and, for Order, `min`, `max`, and `step`. The attributes the editor itself
drives — the value, change and key handling, input type, element id, and styling — SHALL NOT be
overridable through this configuration.

#### Scenario: Overriding one limit keeps the others

- **WHEN** a consumer sets the Title limit to 100 and configures nothing else
- **THEN** Title stops at 100 characters
- **AND** Name, Description, Tab, and Section keep their default limits

#### Scenario: Disabling one field

- **WHEN** a consumer maps Description to "none"
- **THEN** Description accepts a value of any length
- **AND** the other fields keep their default limits

#### Scenario: Disabling all defaults

- **WHEN** a consumer switches the configuration off
- **THEN** no cell carries a length limit

#### Scenario: Adding an attribute beyond length

- **WHEN** a consumer gives Order `min: 0`
- **THEN** the Order input carries `min="0"`

#### Scenario: Editor-owned attributes cannot be replaced

- **WHEN** a consumer's configuration for Title includes a change handler or a value
- **THEN** the cell keeps its own value and change handling, and edits still reach the schema

### Requirement: Constraint violations block save

The property editor SHALL check every property it holds, at every nesting level, against the resolved
`maxLength`, `minLength`, and `pattern` of each field. A property whose Name, Title, Description, Tab,
or Section violates one of them SHALL block save through the same save-validation mechanism that
already blocks empty and duplicate property names, and SHALL show a message above the grid naming the
field and the rule it breaks. The message SHALL NOT repeat the offending value.

This check covers values the input cannot stop: those arriving through the raw JSON editor, an import,
or a schema stored before the limits existed. Other attributes (`min`, `max`, `inputMode`, …) SHALL
affect input only and SHALL NOT block save.

A read-only editor — one showing a schema resolved from an external source, which the user cannot
edit here — SHALL NOT block save on constraint violations and SHALL NOT show their messages.

When a violation is removed — by editing the value in the grid or in the raw JSON editor — the
message SHALL disappear and the save SHALL be unblocked, provided nothing else blocks it.

#### Scenario: An over-limit title from the JSON editor blocks save

- **WHEN** a user sets a property's title to a 1001-character string through the raw JSON editor
- **THEN** save is blocked
- **AND** a message above the grid identifies Title and its 255-character limit without showing the
  title itself

#### Scenario: A stored over-limit schema opens but cannot be saved unchanged

- **WHEN** a user opens a schema whose property name is longer than 255 characters
- **THEN** the schema opens and its properties are shown
- **AND** save stays blocked until the name is shortened

#### Scenario: Fixing the value unblocks save

- **WHEN** a user shortens the offending value to within its limit
- **THEN** the message disappears and save is no longer blocked by the property editor

#### Scenario: A nested property is checked too

- **WHEN** a sub-field of an object property carries a title longer than 255 characters
- **THEN** save is blocked with the same message

#### Scenario: A consumer pattern is enforced on save

- **WHEN** a consumer configures Name with `pattern: "^[a-z_]+$"` and a property name `Bad Name`
  arrives through the raw JSON editor
- **THEN** save is blocked with a message identifying Name and the format it must match

#### Scenario: A read-only editor does not block

- **WHEN** an app runner's Parameters tab shows a read-only schema resolved from its schema endpoint,
  and one of its descriptions is longer than 1024 characters
- **THEN** save is not blocked by the property editor and no constraint message is shown

#### Scenario: Disabled constraints do not block

- **WHEN** a consumer has switched the configuration off and a property title is 1001 characters
- **THEN** save is not blocked by the property editor
