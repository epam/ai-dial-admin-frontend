# Infrastructure Changelog

All notable infrastructure-relevant changes to this project will be documented in this file.

## Unreleased

### Added

#### Analytics

- `ANALYTICS_PUBLIC_URL` [Preview] — the REST endpoint of the Analytics data-access service as an _external_ client would reach it, used to prefill the copyable snippets in a table's Connect panel. Distinct from `DIAL_ANALYTICS_API_URL`, which is how this app reaches the service and is commonly an in-cluster address a user's machine cannot resolve. When unset the snippets show a `<adas-base-url>` placeholder (default: unset)
- `ANALYTICS_FLIGHT_SQL_PUBLIC_URL` [Preview] — the Arrow Flight SQL endpoint as an external client would reach it, e.g. `grpc://analytics.example.com:32010`, used to prefill the Flight SQL snippets in the Connect panel. Not derived from `ANALYTICS_PUBLIC_URL`: it is a separately exposed gRPC port with a different scheme and commonly a different host. When unset the snippets show a `grpc://<adas-host>:32010` placeholder (default: unset)

## 0.19.0

### Added

#### Analytics

- `ANALYTICS_ENABLED` [Preview] — enables the Analytics section (menu group with Query Builder and Tables sub-items); when disabled, the group and its routes are hidden (default: `false`)
- `DIAL_ANALYTICS_API_URL` [Preview] — AI DIAL Analytics data-access service API url
- `DIAL_QUERY_ASSISTANT_DEPLOYMENT` [Preview] — deployment id (resource URL, e.g. `applications/<bucket>/<app>__<version>`) of the DIAL application backing the Query Builder AI view; when set (and Analytics is enabled) the AI view is shown and requests go to this deployment via `DIAL_CORE_API_URL`, otherwise the AI view is hidden

#### Configuration Management

- `DIAL_CORE_API_URL` — DIAL Core API url (**required**); Publications and other Core-direct clients (buckets, files, assets, toolset ops, external-service sign-in, query assistant) call DIAL Core directly forwarding the user JWT. These features fail if unset.
- `CODE_APP_EDITOR_URL` — editor URL for Code App applications; when an Endpoints application's `endpoint` and `editorUrl` both equal this value, it is shown as the `Code App` source type

## 0.16.0

### Added

#### Providers

- `NIM_ENABLED` — enables the NIM Model Serving option in the Deployments section; when both this and `HF_ENABLED` are disabled, the Model Servings tab is hidden
- `HF_ENABLED` — enables the HF Model Serving option in the Deployments section; when both this and `NIM_ENABLED` are disabled, the Model Servings tab is hidden

---

### Changed

#### Configuration Management

- `MCP_REGISTRY_ENABLED` — documented as a preview feature for MCP Registry integration
- `DIAL_EVAL_API_URL` — documented as a preview feature for Evaluation API integration
