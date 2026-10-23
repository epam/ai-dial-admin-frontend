## ADDED Requirements

### Requirement: Upstream interface endpoint requiredness follows the parent Base URL
For an interface configured inside a model upstream, the interface `endpoint` SHALL be optional only while that parent upstream's `baseUrl` is populated. When the parent `baseUrl` is absent, each configured interface whose `endpoint` is absent or blank SHALL be invalid: its Endpoint input SHALL carry a required marker, display the required-field error according to the form validation lifecycle, and prevent Save from being enabled.

The requiredness and Save validity SHALL update when the parent upstream Base URL changes. The rule SHALL remain enforced when the upstream details are collapsed. An empty interface endpoint SHALL continue to be represented as absent, rather than as an empty string, so a populated parent Base URL remains a valid fallback.

#### Scenario: Empty interface endpoint is optional with an upstream Base URL
- **WHEN** an admin configures an upstream with a populated Base URL and adds an interface whose Endpoint is empty
- **THEN** the interface Endpoint has no required marker, the model remains valid to save, and the interface endpoint is persisted as absent so DIAL Core uses the upstream Base URL

#### Scenario: Empty interface endpoint is required without an upstream Base URL
- **WHEN** an admin configures an upstream with no Base URL and adds an interface whose Endpoint is empty
- **THEN** the interface Endpoint is marked required, the form blocks Save, and no save request or backend validation-failure notification is triggered until either value is supplied

#### Scenario: Filling an interface endpoint satisfies the requirement without a Base URL
- **WHEN** an upstream has no Base URL and an interface Endpoint has a valid URL
- **THEN** the interface is valid and the model can be saved

#### Scenario: Clearing the upstream Base URL re-flags an empty interface endpoint
- **WHEN** an interface with an empty Endpoint is valid because its parent upstream has a populated Base URL and the admin clears that Base URL
- **THEN** the interface Endpoint immediately becomes required and Save is blocked

#### Scenario: Filling the upstream Base URL clears the endpoint requirement
- **WHEN** an interface Endpoint is empty and invalid because its parent upstream has no Base URL, and the admin fills that Base URL
- **THEN** the required error clears and the model becomes valid to save without an interface Endpoint

#### Scenario: Collapsing the upstream does not bypass endpoint validation
- **WHEN** an upstream has neither a Base URL nor an Endpoint for one of its configured interfaces and the admin collapses its details
- **THEN** Save remains blocked until the admin supplies the upstream Base URL or the missing interface Endpoint
