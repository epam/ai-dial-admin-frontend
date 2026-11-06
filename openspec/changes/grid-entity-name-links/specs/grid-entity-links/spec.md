## ADDED Requirements

### Requirement: An entity table navigates only through the name link
An ENTITY table — a list whose rows are entities with their own details page — SHALL render each row's
entity name as a link to that entity's details page, styled as a link (accent text). The name link SHALL
be the only part of the row that navigates: a click on any other cell, on the row's padding, or on a tag,
badge or icon in the row SHALL NOT navigate. The row actions column keeps its own menu. Grids whose rows
are not entities with a details page (data, editable and heat-map tables, and grids whose row click
selects, expands or opens a drawer in place) are not ENTITY tables and are not affected.

#### Scenario: Clicking the name opens the details page
- **WHEN** the user clicks an entity's name in an entity table
- **THEN** that entity's details page opens in the same tab

#### Scenario: Clicking elsewhere in the row does nothing
- **WHEN** the user clicks a cell other than the name, such as a description or a date
- **THEN** no navigation occurs and the list stays as it is

#### Scenario: The actions column keeps its menu
- **WHEN** the user clicks a row's actions button
- **THEN** the actions menu opens and no navigation occurs

### Requirement: The name link behaves as a browser link
The name link SHALL be a real link to the details address, so the browser's own link behaviors apply:
Cmd/Ctrl-click and middle-click SHALL open the details page in a new tab and leave the list as it is,
and the browser's link context menu SHALL offer opening and copying the address. A plain click SHALL
navigate in the same tab on every entity table, including tables nested in another entity's tab.

#### Scenario: A modified click opens a new tab
- **WHEN** the user Cmd/Ctrl-clicks or middle-clicks an entity's name
- **THEN** the details page opens in a new tab and the list keeps its scroll, filters and selection

#### Scenario: A nested tab follows the same rule
- **WHEN** the user clicks a name in an entity table shown inside another entity's tab
- **THEN** the details page opens in the same tab, as on a top-level list

### Requirement: The name link is reachable from the keyboard
The name link SHALL be focusable and SHALL open with Enter, and its accessible name SHALL be the
entity's display name, so a keyboard or screen-reader user can find and open an entity without the
mouse.

#### Scenario: Opening an entity from the keyboard
- **WHEN** a keyboard user moves focus to an entity's name link and presses Enter
- **THEN** that entity's details page opens

#### Scenario: The link is announced by the entity's name
- **WHEN** a screen reader reaches an entity's name link
- **THEN** it announces the entity's display name as the link's name

### Requirement: Entity table rows keep their hover state
An entity table SHALL keep its row hover highlight even though only the name navigates, so the row the
pointer is on stays easy to follow across wide tables.

#### Scenario: Hovering a row highlights it
- **WHEN** the pointer rests over a row of an entity table
- **THEN** the row shows its hover highlight

### Requirement: A folder row in an asset list opens the folder
In an asset list that holds folders and items, an item row SHALL open through its name link, and a
folder row SHALL keep opening that folder in place when clicked.

#### Scenario: Opening a folder
- **WHEN** the user clicks a folder row in an asset list
- **THEN** the list shows that folder's contents and the page does not change

#### Scenario: Opening an item
- **WHEN** the user clicks an item's name in an asset list
- **THEN** that item's details page opens

### Requirement: A column naming another entity links to that entity
When a grid column shows another entity that has its own details page and the row carries that entity's
identifier — a run's test suite, an enrichment's source table, a pipeline's target and input tables, an
audited resource and a parent activity, a container's internal image, an entity's adapter or container
source, and the entities listed in an entity's own tabs (roles, interceptors, dependencies, an adapter's
models, an image's containers, a role's entities, a tokenizer's models) — the value SHALL render as a link to
that entity's details page. A value with no resolvable details page (an external image reference, a missing
id, a label such as "Direct call") SHALL stay plain text. A cell listing several entities SHALL render each
as its own link. Links in a grid shown inside an entity's own tab, and in Activity Audit, SHALL open in a new
browser tab so the page being viewed — and any unsaved edits on it — stays as it is; links elsewhere follow the
same-tab rule.

#### Scenario: A run's test suite opens from the runs list
- **WHEN** the user clicks the test suite id in a row of the runs list
- **THEN** that test suite's details page opens

#### Scenario: Each input table of a pipeline is its own link
- **WHEN** a pipeline reads two input tables
- **THEN** its Inputs cell shows two links, one to each table's details page

#### Scenario: A value with no details page stays text
- **WHEN** a container's source is an external image reference
- **THEN** its source cell shows the reference as plain text

#### Scenario: A link inside an entity tab opens a new tab
- **WHEN** the user clicks a role's name in a model's Roles tab
- **THEN** the role's details page opens in a new browser tab and the model page stays open
