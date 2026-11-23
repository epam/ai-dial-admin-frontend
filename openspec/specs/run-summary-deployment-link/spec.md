# run-summary-deployment-link Specification

## Purpose
Defines how Run Summary / Compare Summary, Test Suite Properties, the Method tab’s selected
application, and Conversations agent links resolve a suite target — using a stored
`deploymentRef.type` when present, a single deployment lookup (typed or type-less by-id) instead
of unfiltered / catalog lists, or the stored route reference for ROUTE suites.
## Requirements
### Requirement: Missing deployment type uses a single by-id lookup

When a DEPLOYMENT suite’s `deploymentRef` has an `id` but no `type`, the system SHALL resolve the
deployment type with exactly one call to the eval backend endpoint
`GET /api/v1/deployments/all/{id}` (everything after `/all/` is the deployment ID). The response’s
`$type` discriminator SHALL drive Models vs Applications routing. The system SHALL NOT call
`GET /api/v1/deployments?type=…` listing endpoints or the admin catalog `GET /api/v1/deployments` for
this feature.

#### Scenario: Type resolved from by-id response

- **WHEN** the Run Summary page renders a deployment suite whose `deploymentRef` has `id` and no
  `type`
- **THEN** the system SHALL issue one `GET /api/v1/deployments/all/{id}` request
- **AND** SHALL use the returned `$type` to build the external link target

#### Scenario: Lookup miss hides the link

- **WHEN** that by-id lookup returns no deployment (null / upstream not found)
- **THEN** the Application external-link control SHALL NOT be rendered

### Requirement: Stored deployment type skips the network lookup

When `deploymentRef.type` is already present, the system SHALL use that value for navigation and
SHALL NOT call `GET /api/v1/deployments/all/{id}` for the external link.

#### Scenario: Type present on the suite snapshot

- **WHEN** the Run Summary page renders a deployment suite whose `deploymentRef` includes both `id`
  and `type`
- **THEN** the system SHALL NOT issue a deployment by-id request for the external link
- **AND** SHALL still render the external-link control when a navigation target can be resolved from
  type and/or an `applications/` id prefix

### Requirement: Loading and empty states for the link control

While a required by-id lookup is in flight, the system SHALL show the existing loader in the
external-link icon slot. When the deployment cannot be resolved after the lookup (or type is never
available), the control SHALL render nothing.

#### Scenario: Loader while resolving type

- **WHEN** `deploymentRef.type` is missing and the by-id lookup is still in flight
- **THEN** the Application field postfix SHALL show a loader in the icon slot

#### Scenario: No icon when unresolved

- **WHEN** type resolution finishes without a usable type and no navigation target can be built
- **THEN** the Application field postfix SHALL render neither the loader nor the external-link icon

### Requirement: MCP tool suites link without a by-id lookup

For `MCP_TOOL` suites with an `mcpDeploymentRef`, the system SHALL resolve the external-link target
from the MCP deployment id (no `GET /api/v1/deployments/all/{id}`): a `toolsets/` prefix SHALL open
Assets Toolsets with `?path=` (prefix stripped); an `applications/` prefix SHALL open Assets
Applications the same way; otherwise the system SHALL open the MCP Containers route with the flat
id/name.

#### Scenario: Asset toolset MCP external link

- **WHEN** the Run Summary page renders an MCP_TOOL suite whose `mcpDeploymentRef.id` starts with
  `toolsets/`
- **THEN** the Application external-link control SHALL target Assets Toolsets with the toolset name
  and `?path=` set to the id with the `toolsets/` prefix removed
- **AND** SHALL NOT issue a deployment by-id request for the link

#### Scenario: MCP container external link

- **WHEN** the Run Summary page renders an MCP_TOOL suite with a flat `mcpDeploymentRef.id` (no
  `toolsets/` or `applications/` prefix)
- **THEN** the Application external-link control SHALL target the MCP Containers route for that
  deployment
- **AND** SHALL NOT issue a deployment by-id request for the link

### Requirement: Route suites link to Platform Routes without a deployment lookup

For `ROUTE` suites with a `routesRef.name`, the system SHALL display the route name without the
canonical `routes/platform/` prefix and resolve the external-link target directly to the Platform
Routes entity. It SHALL NOT issue a deployment by-id request for this link.

#### Scenario: Route suite external link

- **WHEN** the Run Summary page renders a ROUTE suite whose `routesRef.name` is
  `routes/platform/search-route`
- **THEN** the Application field SHALL display `search-route`
- **AND** its external-link control SHALL target the `search-route` Platform Routes entity
- **AND** SHALL NOT issue a deployment by-id request for the link

### Requirement: Compare Summary reuses the same link behavior

Compare Summary SHALL use the same deployment external-link behavior as single-run Summary for each
run’s suite context (primary and compared). When the two runs belong to different test suites, a
run's suite context SHALL come from that run's own suite, never from the other run's.

#### Scenario: Compare renders two independent links

- **WHEN** Compare Summary shows Application names for both primary and compared runs
- **THEN** each run’s Application postfix SHALL resolve its external link independently using the
  same rules as single-run Summary (by-id only for a deployment reference whose `type` is missing)

#### Scenario: Runs of different suites resolve links against their own suite

- **WHEN** Compare Summary shows two runs of different test suites and a run's stored suite snapshot
  lacks the deployment information needed for the link
- **THEN** that run's link SHALL be resolved from its own test suite
- **AND** SHALL NOT be resolved from the other run's test suite

### Requirement: Test Suite Properties Open uses stored type or by-id

On the Test Suite view Properties tab (non-modal), the Open Application control SHALL use
`testSuite.deploymentRef.type` when present and SHALL NOT call unfiltered `GET /api/v1/deployments`
or the admin catalog list for that control. When `type` is missing and `id` is present, the system
SHALL resolve type with one `GET /api/v1/deployments/all/{id}` call. Navigation SHALL use type plus
the `applications/` id-prefix fallback (empty catalog). A bare `dial-application` id SHALL open
Assets Applications when Core has a platform-bucket application of that name, and Entities
Applications only when that lookup misses. The Application picker SHALL remain usable
without a Properties-level deployments list (CreateTestSuite loads its own data).

#### Scenario: Properties Open with stored type

- **WHEN** the user views Test Suite Properties for a suite whose `deploymentRef` includes `id` and
  `type`
- **THEN** the system SHALL NOT call unfiltered deployments list or admin catalog for Open
- **AND** SHALL NOT call `GET /api/v1/deployments/all/{id}`
- **AND** the Open control SHALL navigate using the stored type

#### Scenario: Properties Open for a platform application

- **WHEN** the user views Test Suite Properties for a suite whose `deploymentRef` is a bare
  `dial-application` id and Core has a platform-bucket application with that name
- **THEN** the Open control SHALL navigate to that application's Assets Applications page
- **AND** SHALL NOT navigate to Entities Applications

#### Scenario: Properties Open with missing type

- **WHEN** the user views Test Suite Properties for a suite whose `deploymentRef` has `id` but no
  `type`
- **THEN** the system SHALL issue one `GET /api/v1/deployments/all/{id}` request
- **AND** SHALL use the returned `$type` for Open navigation

#### Scenario: Properties picker enabled without list gate

- **WHEN** the user views Test Suite Properties (non-modal)
- **THEN** the Application picker SHALL be enabled without waiting for an unfiltered deployments
  list on Properties

### Requirement: Route Test Suite Properties opens the Platform Route

On the Test Suite view Properties tab, a ROUTE suite's Application field SHALL display the
unprefixed route name and its Open control SHALL navigate directly from `routesRef`, without a
deployment lookup.

#### Scenario: Properties Open for a route suite

- **WHEN** the user views Test Suite Properties for a ROUTE suite whose `routesRef.name` is
  `routes/platform/search-route`
- **THEN** the Application field SHALL display `search-route`
- **AND** the Open control SHALL navigate to the `search-route` Platform Routes entity
- **AND** the system SHALL NOT issue `GET /api/v1/deployments/all/{id}` for the control

### Requirement: Method tab loads a single deployment for Change Method

On the Test Suite Method tab (DEPLOYMENT suites), the system SHALL load `selectedApplication` with
one call: `GET /api/v1/deployments/{type}/{id}` when `deploymentRef.type` is present, or
`GET /api/v1/deployments/all/{id}` when type is missing. The system SHALL NOT call unfiltered
`GET /api/v1/deployments` for this purpose.

#### Scenario: Method tab with stored type

- **WHEN** the Method tab loads a suite whose `deploymentRef` has `id` and `type`
- **THEN** the system SHALL call typed get-deployment for that id and type
- **AND** SHALL NOT call the unfiltered deployments list

#### Scenario: Method tab with missing type

- **WHEN** the Method tab loads a suite whose `deploymentRef` has `id` but no `type`
- **THEN** the system SHALL call `GET /api/v1/deployments/all/{id}` once
- **AND** SHALL use the returned deployment as `selectedApplication`

### Requirement: Compare Summary shows the test suite of each run

Compare Summary SHALL show a single Test Suite field when both runs belong to the same test suite, and
SHALL show the test suite of each run, labelled by run, when they belong to different test suites.
Each shown suite SHALL link to that suite, and SHALL read as the suite's id while its name is
unavailable.

#### Scenario: Both runs belong to one suite

- **WHEN** Compare Summary shows two runs of the same test suite
- **THEN** it shows one Test Suite field with that suite's name and a link to the suite

#### Scenario: Runs belong to different suites

- **WHEN** Compare Summary shows two runs of different test suites
- **THEN** the Test Suite field lists each run's name beside the name of its own suite
- **AND** each entry has a link that opens that suite

#### Scenario: Suite name not yet loaded

- **WHEN** a run's suite name has not loaded
- **THEN** that run's Test Suite entry shows the suite's id

### Requirement: Conversations agent link uses the Core deployment lookup

On Assets Conversations Properties, the agent external link SHALL resolve the conversation’s
`model.id` with one DIAL Core `GET /v1/deployments/{model.id}` call, sending `model.id` as Core issued it
(not re-encoded), and SHALL NOT call any deployments list for that link. Navigation SHALL use the
response's `object` (`model` or `application`) and the conversation's `model.id`. An `applications/`-prefixed
id SHALL link to Assets Applications with the prefix stripped; an unprefixed application id SHALL link to
Applications. A model deployment SHALL wait for the Catalog-vs-Entities route probe before the link is
offered, as test-suite links do, and SHALL show the loading state until the probe has resolved. A response
with no mapped `object` SHALL link as the catalog-shaped record does, and a lookup that finds nothing SHALL
offer no link.

#### Scenario: Conversations agent link from by-id

- **WHEN** the user views a conversation whose `model.id` is set
- **THEN** the system SHALL issue one `GET /v1/deployments/{model.id}` request to DIAL Core
- **AND** SHALL NOT call a deployments list for the agent link
- **AND** the external-link control SHALL use the response's `object` to build the target URL

#### Scenario: An encoded application id is looked up as is

- **WHEN** the conversation's `model.id` is `applications/bucket/My%20App`
- **THEN** the request path is `/v1/deployments/applications/bucket/My%20App`, with nothing encoded twice

#### Scenario: A model deployment waits for the route probe

- **WHEN** the lookup answers `object: "model"`
- **THEN** the agent shows its loading state, with no link, until the Catalog-vs-Entities probe has resolved
- **AND** the link then points at the route the probe picked

#### Scenario: A custom application links to Assets Applications

- **WHEN** the lookup answers `object: "application"` for `model.id` `applications/bucket/app`
- **THEN** the link points at Assets Applications with path `bucket/app`

#### Scenario: A config-defined application links to Applications

- **WHEN** the lookup answers `object: "application"` for an unprefixed `model.id` such as `my-app`
- **THEN** the link points at Applications for `my-app`, whether or not Core's `reference` equals the id

#### Scenario: An unknown deployment offers no link

- **WHEN** the lookup finds no deployment for `model.id`
- **THEN** the external-link control is not offered

