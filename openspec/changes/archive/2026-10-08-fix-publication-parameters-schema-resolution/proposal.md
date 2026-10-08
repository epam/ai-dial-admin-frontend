## Why

Application publication requests can carry a valid application schema and configuration, but the Approvals Parameters tab currently cannot resolve that schema. Reviewers must open the JSON Editor to inspect models, tools, and other configuration details. The publication detail page also unconditionally loads schema options through the Admin API, breaking the page when that optional backend URL is unavailable.

## What Changes

- Load application-schema options for publication detail pages through the established Admin-API-gated fallback: Admin API when configured, otherwise DIAL Core config schemas, together with platform runners, normalized into the shared application-runner option shape.
- Resolve a publication resource's `application_type_schema_id` before source-based runner matching so its Parameters tab renders the existing read-only generated form when its schema is available.
- Preserve the existing source-based resolution path for application shapes that do not carry a resource schema ID and preserve existing platform/config runner resolution behavior.
- Add focused server-page and Parameters-tab coverage for both schema-option loading and publication-resource schema resolution.

## Capabilities

### New Capabilities

- `application-publication-parameters`: Human-readable, schema-driven configuration display for application resources in the publication-approval Parameters tab.

### Modified Capabilities

- None.

## Non-goals

- Changing publication approval actions, publication resource enrichment, or the JSON Editor.
- Introducing a new schema format, synthesizing schemas for unavailable IDs, or changing ordinary application Parameters-tab behavior.
- Adding an Admin API fallback to DIAL Core publication retrieval.

## Impact

- Affects `application-publications/[id]` server-side option loading and the shared `Applications/ParametersTab` runner-selection utility.
- Reuses existing Core config-entity reads, platform app-runner loading, runner-option normalization, and schema resolution rather than adding API endpoints or dependencies.
- Makes an existing publication configuration visible in the review UI under deployments that omit `DIAL_ADMIN_API_URL`.
