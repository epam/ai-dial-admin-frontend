## MODIFIED Requirements

### Requirement: Each entity type reads its own rows

Every request an entity dashboard issues SHALL carry its view's clause, the window, and the entity's clause:

| Entity | Entity clause | Name the clause matches |
| --- | --- | --- |
| Models, Platform models | `deployment` = the model | the model's name |
| Toolsets | `deployment` = the toolset | the toolset's name |
| Assets toolsets | `deployment` = the toolset | `toolsets/` + the toolset's path, each segment URI-encoded |
| Applications | own calls: `deployment` = the application; its call tree: `execution_path` contains the application | the application's name |
| Assets applications | as Applications | `applications/` + the application's path, each segment URI-encoded |

An application's call tree SHALL be every row whose `execution_path` — the chain of deployments the
request passed through — contains the application, at any depth: the calls it made, and the calls
the applications it called made in turn.

An application's Routes view SHALL read its own route calls: `deployment` = the application,
within the Routes view's rows.

An asset's path SHALL be read the way every other write path reads it — the flat field first, then
the merge layer's metadata. A merged Core-resource detail entity carries its identity only in that
metadata, and it is the detail view that opens the Audit tab, so reading the flat field alone left
the dashboard with no name to match on exactly the surface that shows it.

Where no name can be resolved, the panel SHALL state that the entity cannot be matched to the usage
log, and SHALL issue no request. Rendering nothing leaves the tab blank — no figures, no frame,
nothing that reads as a state — which is indistinguishable from a wiring fault and was one.

#### Scenario: A model's dashboard counts only that model

- **GIVEN** two models with traffic in the window
- **WHEN** one model's entity dashboard renders
- **THEN** its figures count only that model's calls

#### Scenario: An asset toolset is matched by its encoded path

- **GIVEN** an asset toolset whose path holds a space
- **WHEN** its entity dashboard issues a request
- **THEN** the deployment it matches is `toolsets/` + the path with the space encoded as `%20`

#### Scenario: A nested application's calls are in the tree

- **GIVEN** application A called application B, and B called a model
- **WHEN** A's entity dashboard reads its call tree
- **THEN** B's model call is among the rows it reads

#### Scenario: An asset's identity is read from the merge metadata

- **GIVEN** an asset toolset whose detail entity carries its path only in the merge metadata
- **WHEN** its entity dashboard issues a request
- **THEN** the deployment it matches is built from that path

#### Scenario: An entity the log cannot name says so

- **GIVEN** an entity whose name cannot be resolved
- **WHEN** its Audit tab renders the dashboard
- **THEN** the panel states that the entity cannot be matched to the usage log
- **AND** no request is issued

## ADDED Requirements

### Requirement: The breakdown card is as tall as it needs to be

While the card holds fewer rows than it scrolls at, it SHALL take the height of the rows it holds.
A single row in a box built for a full page is mostly empty space, and empty space under a header
reads as rows that failed to load rather than as rows that do not exist.

At or above that count the card SHALL keep its fixed height and scroll, as before. The threshold
SHALL be low enough that the content height never exceeds the fixed one, so the card only ever
shrinks at the boundary and never grows.

A card with no rows SHALL keep the full height: its empty state is a message that needs somewhere
to sit, not a row.

#### Scenario: One row takes one row's height

- **GIVEN** the active tab holds a single row
- **WHEN** the card renders
- **THEN** the table is as tall as that row and its header

#### Scenario: A full page keeps the fixed box

- **GIVEN** the active tab holds more rows than the card scrolls at
- **WHEN** the card renders
- **THEN** the table keeps its fixed height and scrolls

#### Scenario: An empty card keeps its height

- **GIVEN** the window holds no rows for the active tab
- **WHEN** the card renders
- **THEN** the table keeps its full height and states the empty window
