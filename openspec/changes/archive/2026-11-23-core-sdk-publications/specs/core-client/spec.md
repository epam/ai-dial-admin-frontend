## MODIFIED Requirements

### Requirement: Calls the SDK cannot express stay on the hand-written client
Core calls the SDK cannot express SHALL stay on the hand-written Core client: multipart uploads, file streaming, `text/plain` reads, `v2/skills`, generic `v1/metadata/{type}`, the MCP client, and streamed chat completion. The SDK-backed calls are `BucketApi.getBucket`, `CoreUtilityApi.getUserInfo`, the deployment lookups `CoreUtilityApi.checkDeploymentByName` and `CoreUtilityApi.getDeploymentById`, the global-settings read and write on `SettingsApi`, and the eight publication operations of `CorePublicationsApi` (list, get, create, rule list, approve, reject, delete, update). The per-resource enrichment calls a publication makes (asset get and put, file, skill and project metadata, file upload) are not publication operations and stay on their own clients.

#### Scenario: The plain-text Core version read is unchanged
- **WHEN** the current Core version is requested
- **THEN** it is fetched by the hand-written client with `Accept: text/plain`, not through the SDK

#### Scenario: Publication operations are SDK-backed
- **WHEN** any of the eight publication operations runs
- **THEN** it is sent by the SDK to the Core host with the caller's token, not by the hand-written client

#### Scenario: Publication enrichment stays on its own clients
- **WHEN** a publication is resolved and its resources are enriched
- **THEN** the asset, file, skill and project lookups are made by their existing clients, not through the publication SDK calls
