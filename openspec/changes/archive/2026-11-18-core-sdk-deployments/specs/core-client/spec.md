## MODIFIED Requirements

### Requirement: Calls the SDK cannot express stay on the hand-written client
Core calls the SDK cannot express SHALL stay on the hand-written Core client: multipart uploads, file streaming, `text/plain` reads, `v2/skills`, generic `v1/metadata/{type}`, the MCP client, and streamed chat completion. The SDK-backed calls are `BucketApi.getBucket`, `CoreUtilityApi.getUserInfo`, the deployment lookups `CoreUtilityApi.checkDeploymentByName` and `CoreUtilityApi.getDeploymentById`, and the global-settings read and write on `SettingsApi`.

#### Scenario: The plain-text Core version read is unchanged
- **WHEN** the current Core version is requested
- **THEN** it is fetched by the hand-written client with `Accept: text/plain`, not through the SDK
