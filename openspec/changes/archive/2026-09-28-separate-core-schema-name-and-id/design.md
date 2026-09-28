## Context

DIAL Core stores Platform App Runner and Catalog Schema documents under a flat resource storage name while resolving their schema bodies by declared `$id`. Core GET responses project storage `name` and `status`; those projections are not schema content. Existing console code was built around the conventional case where `name` is `encodeURIComponent($id)`, and consequently reconstructs storage addresses from `$id`. Migrated and externally created resources can legitimately violate that convention.

The change spans Core metadata merging, server actions, shared asset-list navigation, specialized create forms, JSON editing, and application/catalog-schema consumers. The admin-backend Application Runner API remains a separate single-identity contract.

## Goals / Non-Goals

**Goals:**

- Model Core storage identity and schema identity independently for platform App Runners and Catalog Schemas.
- Keep the body `$id` authoritative for runtime schema resolution and deployment references.
- Keep `_metadata.path` authoritative for CRUD after a resource has been loaded.
- Require operators to provide both identities for new resources and prevent `$id` mutation after creation.
- Preserve metadata-only lists without content fan-out.

**Non-Goals:**

- Change Core, config-file, or admin-backend behavior.
- Introduce resource-name renaming, migrate existing blobs, or reconcile a duplicate storage name before Core reports it.
- Make read-only config-file resources writable.
- Change the legacy entity Application Runner identity model.

## Decisions

### Preserve two explicit identities

The server merge for both resource types will preserve a nonblank body `$id`; it will only fall back to decoding metadata name for compatibility with legacy malformed content. The implementation will retain the loaded `_metadata.path` as a separate address and will not synthesize a body `$id` from it when a declared value exists.

This matches Core's contract: `application_type_schema_id`, `catalog_schema_id`, and resolved-schema APIs accept raw declared `$id`, whereas resource CRUD accepts the storage path. Collapsing the fields is rejected because it corrupts migrated resources.

### Create at operator-supplied name; update and delete at loaded path

Specialized create forms will collect required storage `name` and declared `$id` independently. Create actions will encode and use the supplied name as the resource address and put the declared `$id` into the serialized body. Subsequent update/delete actions will use the loaded `_metadata.path` rather than recalculating an address from `$id`.

Using `$id` as the create address remains a rejected alternative: it cannot express valid Core resources where the values differ. Refetching by `$id` before each update is also rejected because it cannot reliably find a blob by semantic ID and adds unnecessary requests.

### Use storage name for metadata-only navigation; declared ID for semantic consumers

Metadata list rows remain content-free and show the decoded storage name as `Name`; their encoded metadata path drives routes and actions. Detail views show both the read-only storage name and declared `$id`. App Runner source resolution and Catalog Schema selection retain raw declared `$id` after a content/merged-config read, never a list storage name.

Fetching every body to display `$id` in list rows is rejected because it creates one Core request per row. The previous label was misleading when values differ.

### Enforce declared-ID immutability at the save boundary

Existing property forms will keep `$id` read-only. The JSON-editor save path will compare the edited document's `$id` with the original declared value and block changed values before any write, preserving pending edits and showing the established validation/error feedback. This protects against a raw JSON path bypassing the form restriction.

Removing `$id` from raw JSON is rejected because it hides an important schema declaration and would make the raw representation incomplete.

### Preserve Core projections as non-persisted fields

Payload serializers will continue to strip `name`, `status`, metadata, and list-only fields. The added form `name` is an addressing input, not a persisted JSON-schema property.

## Risks / Trade-offs

- [Route parameters can be decoded by Next.js differently from Core storage paths] → Cover list/create/detail round trips where `name` and `$id` differ, and use the existing encoded metadata path contract consistently.
- [Existing call sites may implicitly assume list `name` equals `$id`] → Audit source pickers, open-in-new-tab helpers, and delete keys; keep semantic reference fields sourced from declared content only.
- [Core reports duplicate name and duplicate `$id` through different conflicts] → Keep the modal open and surface Core's message without guessing which uniqueness constraint failed.
- [Old records have no declared `$id`] → retain decoded-storage-name fallback only at the merge boundary for compatibility.

## Migration Plan

No data migration is required. The release changes client interpretation of existing Core resources: future reads preserve declared `$id`, and writes target the already-loaded storage path. Rollback returns to the previous client behavior but does not alter stored Core data.

## Open Questions

- None. The metadata-only list deliberately presents storage `Name`; semantic `$id` is available after opening the detail or through merged-schema option APIs.
