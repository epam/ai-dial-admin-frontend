## RENAMED Requirements

- FROM: `### Requirement: Conversations agent link uses eval by-id`
- TO: `### Requirement: Conversations agent link uses the Core deployment lookup`

## MODIFIED Requirements

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
