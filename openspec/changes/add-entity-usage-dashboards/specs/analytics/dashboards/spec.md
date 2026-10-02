## ADDED Requirements

### Requirement: The entity Audit tab serves the usage dashboard behind the flags

While both `ANALYTICS_ENABLED` and `ANALYTICS_USAGE_ENABLED` resolve truthy — the same pair that
decides what `/dashboards` serves — the Audit `Dashboard` tab of these entity types SHALL render the
usage dashboard for that entity: Models, Platform models, Applications, Assets applications,
Toolsets and Assets toolsets. With either flag falsy, the tab SHALL render the telemetry dashboard
where it does today, unchanged.

Assets applications SHALL gain the `Dashboard` tab only while both flags are truthy: they have no
telemetry dashboard to fall back to. Every other entity type's Audit tab SHALL be unchanged.

When the analytics service refuses the user, the tab SHALL render the page's no-access state rather
than an empty dashboard and a failure notification.

#### Scenario: Flags on serve the usage dashboard on an entity

- **GIVEN** both flags resolve truthy
- **WHEN** the user opens a model's Audit tab and selects `Dashboard`
- **THEN** the usage dashboard renders for that model
- **AND** no telemetry control (refresh interval, telemetry filters) is shown

#### Scenario: A flag off keeps the telemetry dashboard

- **GIVEN** `ANALYTICS_USAGE_ENABLED` resolves falsy
- **WHEN** the user opens a model's Audit `Dashboard` tab
- **THEN** the telemetry dashboard renders as before

#### Scenario: Asset applications gain the tab behind the flags only

- **GIVEN** an asset application
- **WHEN** both flags resolve truthy
- **THEN** its Audit tab offers `Dashboard`
- **AND** with either flag falsy it offers `Activities` alone, as today

#### Scenario: A refused user sees the no-access state

- **GIVEN** both flags resolve truthy and the analytics service answers 403 for the user
- **WHEN** the user opens an entity's Audit `Dashboard` tab
- **THEN** the no-access state renders in the tab

### Requirement: An entity dashboard shows only its entity's blocks, under one set of controls

An entity dashboard SHALL offer no `View by`. It SHALL render one block per kind of traffic its
entity has, each a heading over the widgets of that view — KPI row, time series, share donut,
heatmap, breakdown table — in this order of blocks: LLM, MCP, Routes.

| Entity | Blocks |
| --- | --- |
| Models, Platform models | LLM |
| Toolsets, Assets toolsets | MCP |
| Applications, Assets applications | LLM, MCP, and Routes when the application declares routes |

The period, `Compare` and refresh SHALL sit once above the blocks and govern all of them. The period
SHALL start from, and write back to, the period the entity's other Audit tabs share, so switching to
`Activities` and back keeps it.

#### Scenario: A model shows one block and no View by

- **WHEN** a model's entity dashboard renders
- **THEN** it shows one LLM block
- **AND** no `View by` control

#### Scenario: An application shows its blocks in order

- **GIVEN** an application that declares routes
- **WHEN** its entity dashboard renders
- **THEN** it shows the LLM, MCP and Routes blocks in that order

#### Scenario: No routes, no Routes block

- **GIVEN** an application that declares no routes
- **WHEN** its entity dashboard renders
- **THEN** it shows the LLM and MCP blocks only

#### Scenario: One period governs every block and survives a tab switch

- **GIVEN** an application's entity dashboard with the period set to the last 7 days
- **WHEN** the user opens `Activities` and returns to `Dashboard`
- **THEN** every block reads the last 7 days

### Requirement: Each entity type reads its own rows

Every request a block issues SHALL carry its view's clause, the window, and the entity's clause:

| Entity | Entity clause | Name the clause matches |
| --- | --- | --- |
| Models, Platform models | `deployment` = the model | the model's name |
| Toolsets | `deployment` = the toolset | the toolset's name |
| Assets toolsets | `deployment` = the toolset | `toolsets/` + the toolset's path, each segment URI-encoded |
| Applications | own calls: `deployment` = the application; calls it made: `parent_deployment` = the application | the application's name |
| Assets applications | as Applications | `applications/` + the application's path, each segment URI-encoded |

An application's Routes block SHALL read its own route calls: `deployment` = the application,
within the Routes view's rows.

#### Scenario: A model's dashboard counts only that model

- **GIVEN** two models with traffic in the window
- **WHEN** one model's entity dashboard renders
- **THEN** its figures count only that model's calls

#### Scenario: An asset toolset is matched by its encoded path

- **GIVEN** an asset toolset whose path holds a space
- **WHEN** its entity dashboard issues a request
- **THEN** the deployment it matches is `toolsets/` + the path with the space encoded as `%20`

### Requirement: An application's figures rest on its own calls

An application's LLM block SHALL compute `Requests`, `Unique callers`, `Error rate`, `Avg latency`,
the time series and the heatmap from the calls made *to* the application, so one user request is one
request however many model calls it fanned out into.

`Total spend` SHALL be the sum of those calls' total price: the cost of each request together with
every call it set off, nested applications included. A model call's own price is not summed here —
it is part of the total already.

`Tokens` and `Cost per 1M tokens` SHALL be read from the application's direct model calls, and the
`Tokens` card SHALL say so in its caption, because a model called through a nested application is
not among them.

The application's MCP block SHALL read the tool calls the application made.

#### Scenario: One request fanned out is one request

- **GIVEN** a user called the application once and it called models three times
- **WHEN** the LLM block's KPI row renders
- **THEN** `Requests` counts one

#### Scenario: Spend covers the whole call tree

- **GIVEN** the application called a nested application that called a model
- **WHEN** the LLM block's KPI row renders
- **THEN** `Total spend` includes the nested model call's price

#### Scenario: Tokens name what they count

- **WHEN** an application's LLM block renders its KPI row
- **THEN** the `Tokens` card's caption states that it counts direct model calls

### Requirement: A block hides the tab that would rank its entity against itself

Each block SHALL offer its view's breakdown tabs less the one whose rows would be the entity alone:

| Entity | Block | Hidden tab | Tabs offered |
| --- | --- | --- | --- |
| Models, Platform models | LLM | `Models` | `Applications`, `Projects` |
| Toolsets, Assets toolsets | MCP | `MCP Servers` | `Tools`, `Applications`, `Projects` |
| Applications, Assets applications | LLM | `Applications` | `Models`, `Projects` |
| Applications, Assets applications | MCP | `Applications` | `MCP Servers`, `Tools`, `Projects` |
| Applications, Assets applications | Routes | `Owners` | `Paths`, `Callers`, `Projects` |

The block's share donut and its split plot SHALL lead with the block's first offered tab.

On an application's LLM block the `Models` tab and its donut SHALL rank the models the application
called, and their shares SHALL be shares of the application's direct model calls rather than of its
own calls — the two counts differ, and a share of the wrong total can exceed one hundred per cent.

#### Scenario: A model's block opens on its callers

- **WHEN** a model's LLM block renders
- **THEN** the breakdown offers `Applications` and `Projects`, opening on `Applications`
- **AND** the donut splits by application

#### Scenario: An application's model shares add up

- **GIVEN** an application whose calls fanned out into many model calls
- **WHEN** its LLM block's `Models` tab renders
- **THEN** the shares of its rows sum to no more than one hundred per cent

### Requirement: The Dashboards page is unchanged by the entity dashboards

The standalone `/dashboards` page SHALL render, request and behave exactly as before this change:
its `View by`, its views, its tabs and its figures.

#### Scenario: The page keeps View by

- **GIVEN** both flags resolve truthy
- **WHEN** the user opens `/dashboards`
- **THEN** `View by` offers LLM, MCP and Routes as before

## REMOVED Requirements

### Requirement: The entity Audit tab keeps the telemetry dashboard

**Reason**: Behind the analytics flags the entity Audit tab now serves the usage dashboard, so the
page and the entity no longer disagree; the requirement "The entity Audit tab serves the usage
dashboard behind the flags" replaces it.

**Migration**: With either flag falsy the telemetry dashboard still renders on every entity that
has it today; no configuration change is needed to keep it.
