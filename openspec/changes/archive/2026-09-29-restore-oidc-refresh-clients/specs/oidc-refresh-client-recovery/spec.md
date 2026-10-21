## ADDED Requirements

### Requirement: Refresh client recovery after process-local state loss
The system SHALL obtain an OIDC client for an expired JWT session from the in-process client cache when available. When no cached client exists, the system SHALL reconstruct and cache a client for the token’s configured provider before submitting the refresh-token request.

#### Scenario: Session refresh runs on a new process
- **WHEN** an expired JWT session is refreshed on a process that did not serve its interactive login
- **THEN** the system reconstructs the client for the session provider and refreshes the token without requiring the user to sign in again

#### Scenario: Login-created client is cached
- **WHEN** an expired JWT session is refreshed on the same process that handled its login callback
- **THEN** the system reuses the cached client and does not reconstruct it

### Requirement: Safe provider configuration resolution
The system SHALL defer access to configured authentication providers until an uncached refresh requires reconstruction. It SHALL merge provider defaults with configured provider options before reading OIDC client metadata and SHALL not introduce a circular module initialization dependency.

#### Scenario: Authentication modules initialize
- **WHEN** the application initializes its NextAuth options and provider definitions
- **THEN** the token endpoint configuration is available without a temporal-dead-zone initialization error

#### Scenario: Provider uses discovery metadata
- **WHEN** the uncached session provider supplies a well-known discovery URL, including the custom GitLab provider
- **THEN** the system discovers issuer metadata from that URL before creating and caching the client

### Requirement: Controlled unsupported-provider failure
The system SHALL not construct an OIDC client from guessed endpoint values. If the matching configured provider is missing or lacks sufficient verified metadata to construct a client, the system SHALL retain the prior JWT and mark it with the existing refresh-token error outcome while logging a redacted server-side failure.

#### Scenario: Provider cannot be reconstructed
- **WHEN** an expired JWT session references a provider that is not configured or whose configuration lacks the required OIDC metadata
- **THEN** the session receives the existing refresh-token error outcome and no access token or refresh token value is written to logs

#### Scenario: Ping Identity metadata is insufficient
- **WHEN** an expired Ping Identity session requires reconstruction and its configured provider metadata cannot identify a valid discovery document or token endpoint
- **THEN** the system fails through the controlled unsupported-provider outcome rather than attempting a request to an inferred endpoint
