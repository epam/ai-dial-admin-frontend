# Infrastructure Changelog

All notable infrastructure-relevant changes to this project will be documented in this file.

## 0.22.0

### Added

#### Analytics

- `ANALYTICS_USAGE_ENABLED` [Preview] — serves the analytics Dashboards page, over the usage log, at `/dashboards`, and moves the `Dashboards` menu item from the `Audit` group to the top of the `Analytics` group. Takes effect only when `ANALYTICS_ENABLED` is `true`; otherwise `/dashboards` serves the telemetry dashboard, as `/dashboard` did, while `DIAL_ADMIN_API_URL` is set (default: `false`)

#### Files import

- `ZIP_IMPORT_MAX_ENTRIES`, `ZIP_IMPORT_MAX_ENTRY_SIZE_MB`, `ZIP_IMPORT_MAX_TOTAL_SIZE_MB` — limits applied to uploaded zip archives (entry count, inflated size of one entry, inflated size of the whole archive); an archive over a limit is rejected with a 400. Invalid or non-positive values fall back to the defaults (default: `500`, `100`, `1024`)

#### Projects

- `PROJECT_CONTEXT_ALLOWED_EXTENSIONS`, `PROJECT_CONTEXT_FILE_MAX_BYTES`, `PROJECT_CONTEXT_TOTAL_MAX_BYTES` — limits applied when adding context files to a project (allowed extensions, size of one file, total size of the context); a file over a limit is rejected before it is staged. Use the same values as the chat application. Extensions are comma-separated, case-insensitive, with an optional leading dot; unset or empty values, and invalid or non-positive byte values, fall back to the defaults (default: `csv,pdf,xlsx`, `1048576`, `10485760`)

### Changed

#### Navigation

- The telemetry dashboard moves from `/dashboard` to `/dashboards`, and its menu item is renamed `Dashboards`; `/dashboard` redirects to the new path. The `dashboard` token of `DISABLE_MENU_ITEMS` still hides the item, in whichever group it sits

#### Theming

- The themes config served at `THEMES_CONFIG_URL` must define the ui-kit 2.0 color tokens (`bg-layer-base`, `bg-layer-raised`, `bg-layer-sunken`, the `bg-control-*`, `text-control-*` and `stroke-*` families, `bg-gradient-*`, `shadow-*`) in every theme. The app no longer ships dark defaults for them, so a config that carries only the legacy set (`bg-layer-0`…`bg-layer-4`, `controls-*`) renders ui-kit controls with ui-kit's own light fallbacks. The current [default themes config](https://github.com/epam/ai-dial-chat-themes/blob/development/static/config.json) already defines them; a custom config derived from an older copy must be updated

### Removed

#### Providers

- `NIM_ENABLED` — NIM Model Serving is no longer supported. The variable is ignored and can be removed from the deployment configuration; the Model Servings tab now depends on `HF_ENABLED` alone. Existing NIM deployments are no longer listed, `NimDeployment` rows are hidden from audit lists, and NIM entries in the import/export format are not recognized

## 0.21.0

### Added

#### Analytics

- `ANALYTICS_PUBLIC_URL` [Preview] — the REST endpoint of the Analytics data-access service as an _external_ client would reach it, used to prefill the copyable snippets in a table's Connect panel. Distinct from `DIAL_ANALYTICS_API_URL`, which is how this app reaches the service and is commonly an in-cluster address a user's machine cannot resolve. When unset the snippets show a `<analytics-base-url>` placeholder (default: unset)
- `ANALYTICS_FLIGHT_SQL_PUBLIC_URL` [Preview] — the Arrow Flight SQL endpoint as an external client would reach it, e.g. `grpc://analytics.example.com:32010`, used to prefill the Flight SQL snippets in the Connect panel. Not derived from `ANALYTICS_PUBLIC_URL`: it is a separately exposed gRPC port with a different scheme and commonly a different host. When unset the snippets show a `grpc://<analytics-host>:32010` placeholder (default: unset)
- `ANALYTICS_SESSIONS_ENABLED` [Preview] — enables the Sessions sub-item in the Analytics section. Takes effect only when `ANALYTICS_ENABLED` is `true`; when disabled, the sub-item is hidden and the rest of the Analytics section stays available, so Analytics can be rolled out without the session trace view (default: `false`)

#### Core API Migration

- Full DIAL Core API migration [Preview] — the `Catalog` menu group (Platform Models, Interceptors, Translators, Routes, App Runners, Roles, Keys on the `/platform-*` routes) reads and writes DIAL Core config resources directly instead of proxying through the admin backend, which is being phased out
- `DIAL_CORE_API_URL` — required since 0.19.0, and the Core-direct `Catalog` views additionally depend on it; the migration cannot be exercised while it is unset. The variable itself is not Preview — the migration is
- `DISABLE_MENU_ITEMS` — recommended to include `catalog` while the migration is Preview. The `Catalog` group is not behind a feature flag (unlike `DEPLOYMENTS_ENABLED` / `ANALYTICS_ENABLED`), so it renders for every user unless disabled here; keep `DIAL_ADMIN_API_URL` set so the admin-backend-backed `Entities`, `Builders`, `Access Management`, and `Audit` groups remain available as the supported path

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
