## ADDED Requirements

### Requirement: Core-owned route maps use a separate object-native editor

The system SHALL retain `ApplicationAppRoutes` and `EntityRoutes` as the array-only App Routes UI for `/applications` and `/application-runners`. It SHALL render `/assets-applications` and `/platform-app-runners` through a separate object-native App Routes component whose input and output are keyed route objects. The object-native component SHALL identify each route by its object key and SHALL support adding, editing, renaming, and deleting object entries without converting the route collection to an array.

#### Scenario: Admin-backend route arrays remain on the existing editor

- **WHEN** an application or Application Runner loads routes from the admin backend
- **THEN** it continues to render through `ApplicationAppRoutes` and `EntityRoutes` with the returned route array unchanged
- **AND** no Core-owned object editor is used

#### Scenario: Asset application uses the object-native editor

- **WHEN** an asset application opens its App Routes tab
- **THEN** it renders through the object-native App Routes component
- **AND** the component receives and emits the application’s keyed `routes` object rather than a route array

#### Scenario: Platform App Runner uses the object-native editor

- **WHEN** a Platform App Runner opens its App Routes tab
- **THEN** it renders through the object-native App Routes component
- **AND** the component receives and emits the runner’s keyed `dial:applicationTypeRoutes` object rather than a route array

### Requirement: Object-native editor supports both Core-owned route field contracts

The object-native App Routes component SHALL support an unprefixed Asset Application route entry and a `dial:`-prefixed Core App Runner route entry. It SHALL read and write each route, upstream, response, attachment-path, role, and permission field using the selected contract’s field names, preserving the original object contract in parent state and in the JSON editor.

#### Scenario: Asset application route remains unprefixed

- **WHEN** an administrator edits an asset application route stored as `{ "health": { "paths": ["/health"] } }`
- **THEN** the edited `routes` object remains keyed by the route name and uses unprefixed route fields

#### Scenario: Platform App Runner route remains Core-shaped

- **WHEN** an administrator edits a Platform App Runner route stored in `dial:applicationTypeRoutes`
- **THEN** the edited object remains keyed by the route name and uses Core `dial:`-prefixed route and nested fields
- **AND** its JSON editor displays that same Core-shaped object

#### Scenario: Renaming an object route updates its key

- **WHEN** an administrator renames a route through the object-native editor
- **THEN** the updated route object uses the new route name as its key
- **AND** the prior key is absent

### Requirement: Asset applications inherit raw Core App Runner route maps by source origin

When an asset application requires details of its selected App Runner, the system SHALL choose the Core read by the option’s explicit origin. A Platform-origin runner SHALL continue to load through the platform resource action using its storage path. A Config-origin runner SHALL load through DIAL Core’s config-file `schemas` population using its declared `$id`, or its name when no `$id` is available. Both reads SHALL expose the original Core `dial:applicationTypeRoutes` object, interceptors, and application feature details to asset-application consumers.

#### Scenario: Sourced asset application renders the inherited Core map read-only

- **WHEN** an asset application selects a Platform-origin or Config-origin App Runner whose `dial:applicationTypeRoutes` is a Core keyed `dial:` route map
- **THEN** the object-native App Routes component renders that map through the Core App Runner field contract
- **AND** the routes remain read-only on the asset application

#### Scenario: Configuration-file runner supplies inherited interceptor and feature details

- **WHEN** an asset application selects a Config-origin App Runner whose complete config-file schema declares interceptors or application feature flags absent from its picker option
- **THEN** the Interceptors and Features surfaces use those loaded declarations as inherited runner details

#### Scenario: Detail read failure is not treated as an empty route set

- **WHEN** a selected runner has an addressable origin-specific identifier but its detail read fails
- **THEN** the App Routes tab renders its existing resolved-schema failure state
- **AND** it does not render the route editor as though the runner declares no routes

### Requirement: Platform App Runner validation and writes preserve Core route objects

The system SHALL validate a Platform App Runner’s raw `dial:applicationTypeRoutes` object before save, including Core route keys and Core-prefixed nested fields. A malformed object entered through the JSON editor SHALL produce a validation error rather than a runtime failure. A successful Platform App Runner write SHALL preserve the validated `dial:applicationTypeRoutes` object without array-to-object or object-to-array conversion.

#### Scenario: Invalid Core route object blocks save

- **WHEN** an administrator enters an invalid `dial:applicationTypeRoutes` map in the Platform App Runner JSON editor
- **THEN** save is blocked with validation feedback identifying the invalid route map or entry
- **AND** no write reaches Core

#### Scenario: Valid Core route object writes unchanged

- **WHEN** an administrator saves a valid Platform App Runner with a Core-shaped `dial:applicationTypeRoutes` object
- **THEN** the Core write payload retains that keyed `dial:` object
- **AND** no collection-level array-to-object conversion is applied
