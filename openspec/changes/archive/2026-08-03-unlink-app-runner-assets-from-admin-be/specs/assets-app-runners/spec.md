## REMOVED Requirements

### Requirement: Interceptors tab uses the admin-BE interceptor list

**Reason**: The requirement's rationale no longer holds. It justified the admin-backend source on the grounds that "Core's blob-only interceptor listing would not include interceptors published through the aggregated config" — true of Core's metadata route alone, but Core also exposes a config-file entity route that lists exactly the population the metadata route omits. Reading both gives the complete set, so the admin-backend dependency is no longer necessary. The requirement is removed rather than modified because its name asserts the admin-BE sourcing, and a modification cannot change a requirement's name.

**Migration**: Replaced by "Interceptors tab options are sourced from DIAL Core" below, which preserves the two behaviours this requirement guaranteed — the shared interceptors component is still used, and the selection is still stored in `dial:applicationTypeInterceptors`. No stored data changes: a selection saved before this change reads back identically, because a config-file-defined interceptor was already referenced by bare name.

## ADDED Requirements

### Requirement: Interceptors tab options are sourced from DIAL Core
The system SHALL render the app-runner Interceptors tab using the existing shared interceptors component, populating the selectable interceptors from DIAL Core as the union of its two populations, and storing the selection in the runner's `dial:applicationTypeInterceptors` field.

#### Scenario: Selectable interceptors come from Core, both populations
- **WHEN** the app-runner detail page loads
- **THEN** the available interceptors are read from DIAL Core, including both those written through its API and those defined in its configuration files, and no admin-backend request contributes to the list

#### Scenario: Selection round-trips on the runner resource
- **WHEN** a user selects interceptors and saves
- **THEN** their references are persisted in `dial:applicationTypeInterceptors` and reappear on reload

#### Scenario: An option Core would reject is not offered
- **WHEN** the interceptor options are built
- **THEN** every offered option resolves in Core's merged configuration, so selecting one cannot produce a write rejected for an unresolvable reference

### Requirement: Global interceptors are read from DIAL Core
The Interceptors tab displays the globally configured interceptors alongside the runner's own. The system SHALL read that list from DIAL Core rather than the admin backend, and SHALL scope the change to this surface so the admin-backend-backed entity surfaces are unaffected.

#### Scenario: Global interceptors come from Core on this surface
- **WHEN** the app-runner Interceptors tab renders
- **THEN** the global interceptor list is read from DIAL Core

#### Scenario: Entity surfaces keep their existing source
- **WHEN** an admin-backend-backed entity surface renders the same shared interceptors component
- **THEN** its global interceptor list is read exactly as before

### Requirement: Per-route role options are sourced from DIAL Core
The AppRoutes tab lets a user grant roles per route, choosing from a list of available roles. The system SHALL populate that list from DIAL Core as the union of its two role populations, replacing the admin-backend role list this surface reads today.

#### Scenario: Route role options come from Core, both populations
- **WHEN** a user opens the role picker on an app route
- **THEN** the available roles are read from DIAL Core, including both API-written and configuration-file-defined roles, with no admin-backend request

#### Scenario: A granted role round-trips on the route
- **WHEN** a user grants a role to a route and saves
- **THEN** the grant persists on the runner resource and reappears on reload

#### Scenario: A role already granted but absent from the option list is still shown
- **WHEN** a route grants a role that the option list does not contain, whether because a read failed or because the role is no longer defined
- **THEN** the granted role is still displayed, rather than the tab presenting the route as ungranted

### Requirement: The topics control offers no catalogue on this surface
DIAL Core has no registry of topics — a deployment's topics are a free list of strings it stores verbatim — so there is no Core equivalent of the admin backend's topic catalogue. The system SHALL therefore not request a topic catalogue on this surface, and SHALL leave topics fully editable by typed entry.

#### Scenario: No catalogue is requested
- **WHEN** a user opens the topics control on an app-runner asset
- **THEN** no topic catalogue is fetched, and no suggestion list is presented beyond the topics the runner already carries

#### Scenario: Topics remain addable and persist
- **WHEN** a user types a new topic and applies it
- **THEN** it is added to the runner and persists across save and reopen

#### Scenario: Other surfaces keep their catalogue
- **WHEN** the same shared topics control renders on a surface backed by the admin backend
- **THEN** its topic catalogue is still requested, unchanged

### Requirement: Configuring an app runner requires no admin-backend call
Every field this surface reads or writes is owned by DIAL Core. The system SHALL NOT require any admin-backend request in order to view or configure an app runner, so the surface remains usable when that service is unavailable.

#### Scenario: The surface is configurable without the admin backend
- **WHEN** a user opens an app-runner asset and edits any field the surface exposes, including interceptors, per-route roles and topics
- **THEN** no admin-backend request is required for the edit to be made or saved

#### Scenario: The claim is stated with its scope
- **WHEN** the capability describes itself as Core-direct
- **THEN** it states what holds — that the runner resource and every option list it offers are read from Core — rather than implying the surface has no other dependency
