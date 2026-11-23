## MODIFIED Requirements

### Requirement: Target and present-as selection
The system SHALL let the user choose the **target type** (Model, Application, Toolset, Auto Router), then pick the **target** with
the shared entity picker in single-selection mode, opened from a read-only input with an open icon (the pattern of the
other popup-backed fields; no separate Select/Change button), then choose **present-as**. Present-as options SHALL be limited to:
Model → Model, Application; Application → Model, Application, Toolset; Toolset → Toolset; Auto Router → Auto Router, Model,
Application. Present-as Auto Router SHALL be offered for an Auto Router target only. Present-as SHALL default to
the target type and SHALL be written only when it differs from that default. The Auto Router target type SHALL be offered
only on a Platform alias, because Core refuses a router target on a Public alias; a Public alias already stored with a
router target SHALL still show that type. Changing the target type SHALL clear the
target. The picker SHALL offer every source the chosen type has: Application and Toolset the Public tree, Platform
and config.json; Model and Auto Router Platform and config.json. The picked target SHALL be stored as `target.path`: a Public pick as
`<type>/<picked public path>` with each path segment percent-encoded, the form Core parses (for example
`applications/public/team/assistant`, or `applications/public/QA/Code%20Apps%20ALS/assistant` for a folder named
`Code Apps ALS`), and a Platform or config.json pick as `<type>/<name>` (for example `routers/smart-router`). The stored path SHALL be decoded again where
it is shown or reused. A `target.path` the form cannot parse SHALL be shown as plain text and SHALL be left unchanged
until the user picks a target. The Auto Router label SHALL NOT change the Core router type or its stored values.

#### Scenario: Toolset target allows only toolset presentation
- **WHEN** the target type is Toolset
- **THEN** present-as offers only Toolset

#### Scenario: Application target offers all three presentations
- **WHEN** the target type is Application
- **THEN** present-as offers Model, Application and Toolset, with Application preselected

#### Scenario: Router target offers router, model and application presentations
- **WHEN** the target type is Auto Router
- **THEN** present-as offers Auto Router, Model and Application, with Auto Router preselected, and an Auto Router pick is stored as `routers/<name>`

#### Scenario: Public alias is not offered a router target
- **WHEN** an admin opens the target type on a Public alias
- **THEN** Auto Router is not among the options; on a Platform alias it is

#### Scenario: Target is an input with an open icon
- **WHEN** an admin views the Target step or tab
- **THEN** the target is a read-only input showing the readable path, with an open icon that opens the picker and no Select/Change target button

#### Scenario: Changing the type clears the target
- **WHEN** an admin changes the target type after picking a target
- **THEN** the target is cleared and present-as falls back to the new type's default

#### Scenario: Public pick is stored with its bucket
- **WHEN** an admin picks `public/team/assistant` on the Public tab of the Application picker
- **THEN** `target.path` is `applications/public/team/assistant`

#### Scenario: Public pick with spaces in its path is stored encoded
- **WHEN** an admin picks `public/QA/Code Apps ALS/app__1.0.0` on the Public tab of the Application picker
- **THEN** `target.path` is `applications/public/QA/Code%20Apps%20ALS/app__1.0.0` and Core accepts the create

#### Scenario: An encoded target is shown readably
- **WHEN** an alias with `target.path` `applications/public/QA/Code%20Apps%20ALS/app__1.0.0` is opened
- **THEN** the Target tab shows `QA/Code Apps ALS/app__1.0.0` as the reference

#### Scenario: Platform and config.json picks are stored by bare name
- **WHEN** an admin picks `gpt-4-internal` on the Platform or config.json tab of the Model picker
- **THEN** `target.path` is `models/gpt-4-internal`

#### Scenario: Single selection across tabs
- **WHEN** an admin selects an entity on the Public tab and then selects another on the Platform tab
- **THEN** only the second is selected, Apply is enabled, and applying reports exactly one entity

#### Scenario: Model and Router pickers have no Public tab
- **WHEN** an admin opens the target picker for a Model or Auto Router target
- **THEN** only the Platform and config.json tabs are offered

#### Scenario: Unparseable existing target is not rewritten
- **WHEN** an alias is loaded with a `target.path` the form cannot parse and the user saves another field
- **THEN** the original `target.path` is sent unchanged

#### Scenario: A missing target is accepted by the form
- **WHEN** an admin saves an alias whose target does not exist yet
- **THEN** the form does not block the save, because Core accepts it and reports the alias as broken until the target exists

#### Scenario: Stored router target retains its displayed type
- **WHEN** an admin opens an alias whose target path uses the `routers/` prefix
- **THEN** the target type is displayed as Auto Router and its existing path is retained
