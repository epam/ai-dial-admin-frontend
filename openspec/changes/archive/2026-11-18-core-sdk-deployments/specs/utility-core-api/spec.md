## REMOVED Requirements

### Requirement: Deployment listing and lookup read DIAL Core directly
**Reason**: The deployment listing had no reachable caller and is deleted (design D1); the lookup half is restated below as "Deployment lookups read DIAL Core directly", without the listing scenario.
**Migration**: None. Nothing called the listing; deployment lookups keep their `null` / `undefined` contract.

## ADDED Requirements

### Requirement: Deployment lookups read DIAL Core directly
The system SHALL provide a server-side client (`CoreUtilityApi`) that looks up a single deployment against DIAL Core (`GET /v1/deployments/{name}`), through the SDK and authenticated with the caller's JWT, instead of the admin backend's proxy of the same route. It SHALL NOT list deployments. A lookup SHALL resolve to the deployment Core returns, which is not admin's evaluation-service deployment shape. There SHALL be two lookups, by the kind of input: checking a name a user typed SHALL percent-encode it segment by segment, so reserved characters in it stay part of the name while `/` remains a path separator; looking up an id Core issued SHALL send the id unchanged, because it is already encoded.

#### Scenario: A single deployment is checked by name with a GET, not a HEAD
- **WHEN** a caller checks whether a deployment name already exists
- **THEN** the client issues a `GET` request to Core's deployment-by-name route on `DIAL_CORE_API_URL`, because Core registers only `GET` for that route and a `HEAD` request would 404 unconditionally
- **AND** a 404 response resolves to `null`, matching the existing "name is unique" contract

#### Scenario: A forbidden lookup is not treated as unique
- **WHEN** Core answers the lookup with 403
- **THEN** the client resolves to `undefined`, not `null`, so the name is not reported as free

#### Scenario: Reserved characters stay part of a typed name
- **WHEN** a caller checks a name containing `?`, `#`, `%` or a space
- **THEN** the request path carries that name percent-encoded as one segment, with no query string or fragment introduced and no character encoded twice

#### Scenario: A slash in a typed name is not encoded
- **WHEN** a caller checks the name `a/b`
- **THEN** the request path is `/v1/deployments/a/b`

#### Scenario: A Core-issued id is sent as is
- **WHEN** a caller looks up the id `applications/bucket/My%20App`
- **THEN** the request path is `/v1/deployments/applications/bucket/My%20App`, not `My%2520App`
