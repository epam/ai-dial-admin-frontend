## Purpose

Defines how Run Summary / Compare Summary, Test Suite Properties, the Method tab’s selected
application, and Conversations agent links resolve a single deployment — using a stored
`deploymentRef.type` when present and a single deployment lookup (typed or type-less by-id) instead
of unfiltered / catalog lists.

## ADDED Requirements

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

For `MCP_TOOL` suites with an `mcpDeploymentRef`, the system SHALL open the MCP Containers route
using the MCP deployment id/name and SHALL NOT call `GET /api/v1/deployments/all/{id}` for that
link.

#### Scenario: MCP external link

- **WHEN** the Run Summary page renders an MCP_TOOL suite with `mcpDeploymentRef.name` set
- **THEN** the Application external-link control SHALL target the MCP Containers route for that
  deployment
- **AND** SHALL NOT issue a deployment by-id request for the link

### Requirement: Compare Summary reuses the same link behavior

Compare Summary SHALL use the same deployment external-link behavior as single-run Summary for each
run’s suite context (primary and compared).

#### Scenario: Compare renders two independent links

- **WHEN** Compare Summary shows Application names for both primary and compared runs
- **THEN** each run’s Application postfix SHALL resolve its external link independently using the
  same rules as single-run Summary (by-id only when that run’s `deploymentRef.type` is missing)

### Requirement: Test Suite Properties Open uses stored type or by-id

On the Test Suite view Properties tab (non-modal), the Open Application control SHALL use
`testSuite.deploymentRef.type` when present and SHALL NOT call unfiltered `GET /api/v1/deployments`
or the admin catalog list for that control. When `type` is missing and `id` is present, the system
SHALL resolve type with one `GET /api/v1/deployments/all/{id}` call. Navigation SHALL use type plus
the `applications/` id-prefix fallback (empty catalog). The Application picker SHALL remain usable
without a Properties-level deployments list (CreateTestSuite loads its own data).

#### Scenario: Properties Open with stored type

- **WHEN** the user views Test Suite Properties for a suite whose `deploymentRef` includes `id` and
  `type`
- **THEN** the system SHALL NOT call unfiltered deployments list or admin catalog for Open
- **AND** SHALL NOT call `GET /api/v1/deployments/all/{id}`
- **AND** the Open control SHALL navigate using the stored type

#### Scenario: Properties Open with missing type

- **WHEN** the user views Test Suite Properties for a suite whose `deploymentRef` has `id` but no
  `type`
- **THEN** the system SHALL issue one `GET /api/v1/deployments/all/{id}` request
- **AND** SHALL use the returned `$type` for Open navigation

#### Scenario: Properties picker enabled without list gate

- **WHEN** the user views Test Suite Properties (non-modal)
- **THEN** the Application picker SHALL be enabled without waiting for an unfiltered deployments
  list on Properties

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

### Requirement: Conversations agent link uses eval by-id

On Assets Conversations Properties, the agent external link SHALL resolve the conversation’s
`model.id` with one `GET /api/v1/deployments/all/{id}` call and SHALL NOT call the admin catalog
`GET /api/v1/deployments` list for that link. Navigation SHALL use the response `$type` and
deployment id (plus `applications/` prefix fallback).

#### Scenario: Conversations agent link from by-id

- **WHEN** the user views a conversation whose `model.id` is set
- **THEN** the system SHALL issue one `GET /api/v1/deployments/all/{model.id}` request
- **AND** SHALL NOT call admin `getAllDeployments` for the agent link
- **AND** the external-link control SHALL use the returned `$type` to build the target URL
