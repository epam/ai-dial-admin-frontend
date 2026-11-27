## MODIFIED Requirements

### Requirement: Calls the SDK cannot express stay on the hand-written client
Core calls the SDK cannot express SHALL stay on the hand-written Core client: multipart uploads, file streaming, `text/plain` reads, `v2/skills`, the generic `v1/metadata/{type}` reads of every resource type that has no SDK operation, the MCP client, and streamed chat completion. The SDK-backed calls are `BucketApi.getBucket`, `CoreUtilityApi.getUserInfo`, the deployment lookups `CoreUtilityApi.checkDeploymentByName` and `CoreUtilityApi.getDeploymentById`, the global-settings read and write on `SettingsApi`, the eight publication operations of `CorePublicationsApi` (list, get, create, rule list, approve, reject, delete, update), and the content get, metadata get, save and delete of `AssetApi` for the model, router, role, route, project key, interceptor, translator, plugin, application-type-schema and catalog-schema resource types. The per-resource enrichment calls a publication makes (asset get and put, file, skill and project metadata, file upload) are not publication operations and stay on their own clients.

#### Scenario: The plain-text Core version read is unchanged
- **WHEN** the current Core version is requested
- **THEN** it is fetched by the hand-written client with `Accept: text/plain`, not through the SDK

#### Scenario: Publication operations are SDK-backed
- **WHEN** any of the eight publication operations runs
- **THEN** it is sent by the SDK to the Core host with the caller's token, not by the hand-written client

#### Scenario: Publication enrichment stays on its own clients
- **WHEN** a publication is resolved and its resources are enriched
- **THEN** the asset, file, skill and project lookups are made by their existing clients, not through the publication SDK calls

#### Scenario: Model asset operations are SDK-backed
- **WHEN** a model's content, metadata, save or delete is requested through the asset client
- **THEN** it is sent by the SDK to the Core host with the caller's token, not by the hand-written client

#### Scenario: Platform configuration asset operations are SDK-backed
- **WHEN** the content, metadata, save or delete of a router, role, route, project key, interceptor, translator, plugin, application-type schema or catalog schema is requested through the asset client
- **THEN** it is sent by the SDK to the Core host with the caller's token, to the same method, path and query the hand-written client used, not by the hand-written client

#### Scenario: A resource type not yet routed through the SDK stays hand-written
- **WHEN** the content or metadata of a type that has no SDK route registered yet, such as a policy, is requested through the asset client
- **THEN** it is fetched by the hand-written client at the same URL as before
