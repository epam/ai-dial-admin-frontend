## Context

Application publications are fetched directly from DIAL Core, but their detail page also supplies the runner options used by the shared `ParametersTab`. The page currently always reads application schemes through the Admin API. In deployments without `DIAL_ADMIN_API_URL`, that auxiliary read has no valid server base URL. Separately, publication views pass a `DialApplicationResource` to the shared tab, but current runner selection treats the publication route as source-based even though a resource carries `application_type_schema_id` instead of an application `source`.

The Assets Applications detail page already composes the needed sources: Admin-backed schemes when configured, Core config schemas otherwise, and platform runners normalized through `buildAppRunnerOptions`. `getResolvedRunnerSchema` depends on the resulting runner option's origin and path to resolve config and platform schemas correctly.

## Goals / Non-Goals

**Goals:**

- Render the existing read-only, schema-generated Parameters form for an application publication whenever its declared schema is available.
- Keep publication detail rendering functional when `DIAL_ADMIN_API_URL` is absent.
- Reuse the established Assets Applications option-loading and shared schema-resolution paths.
- Preserve source-based resolution for application shapes that lack a resource schema ID.

**Non-Goals:**

- Change the publication resource model, publication actions, JSON Editor, or schema formats.
- Change ordinary Assets Applications Parameters behavior.
- Make an unavailable schema ID render a fabricated or partial configuration form.

## Decisions

### Mirror the Assets Applications runner-option composition

The publication page will conditionally load Admin schemes only when `DIAL_ADMIN_API_URL` is configured; otherwise it will read Core config schemas. It will combine that result with platform runners and pass the normalized `buildAppRunnerOptions` output to `PublicationView`.

**Rationale:** Core config rows do not carry the option `$id` shape used by schema matching, while normalized options retain the identifiers, origin, and path needed by the resolver. This also makes publication configuration work for both config-backed and platform-backed runners.

**Alternative considered:** Pass raw Core config rows to `ParametersTab`. Rejected because matching by schema ID would still fail when rows lack `$id`, and platform runner support would be omitted.

### Prefer resource schema identity over route-specific source lookup

The runner-selection utility will first use `DialApplicationResource.application_type_schema_id` when the supplied entity has one. Only entities without that value will use the existing source/editor-based lookup. The existing route-specific rendering behavior remains unchanged.

**Rationale:** Schema selection follows the input data contract rather than an assumption that all publication entities have a `source`. A direct match still returns an existing runner option rather than bypassing the resolver.

**Alternative considered:** Change `getResolvedRunnerSchema` to accept a raw schema-ID string. Rejected because it would lose the selected option's config/platform origin and path, duplicate existing resolution logic, and expand the shared API unnecessarily.

### Keep unavailable-schema behavior unchanged

If no normalized option matches the declared schema ID, the tab will retain its current no-schema state.

**Rationale:** The page must not invent an unverified schema or configuration when the corresponding schema is not available to the reviewer.

## Risks / Trade-offs

- **[Core config rows differ from Admin options]** → Normalize all schema sources through `buildAppRunnerOptions` before passing them to the publication view.
- **[Platform runner content changes after its listing]** → Preserve the existing resolver path, which refreshes platform runner content using its option metadata.
- **[Auxiliary option loading can fail independently of publication retrieval]** → Follow the sibling page's established loading behavior and cover both URL-configured and Core-only branches in server-page tests.
- **[Shared utility change affects Assets Applications]** → Retain the existing source-based fallback and add focused unit coverage for both resource-ID and source-based selection.

## Migration Plan

No data migration or rollout flag is required. The change only changes client-side option loading and schema selection for already stored publication resources. Rollback consists of reverting the code change; no persisted state is created.

## Open Questions

- None. The expected presentation, Core fallback, and resolver behavior are established by the issue and the existing Assets Applications implementation.
