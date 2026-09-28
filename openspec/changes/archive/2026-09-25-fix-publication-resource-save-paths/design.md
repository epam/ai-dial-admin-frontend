## Context

Pending publication edits use a two-stage Core workflow: `CorePublicationsApi.updatePublication` first posts the rebuilt publication request, then writes each edited resource body through the shared `publicationEnrichmentClients.updateAsset` adapter. The Application and Toolset resource mergers now place their Core identity under `_metadata`; the adapter still reads the removed flat `path` field, causing the post-update write to receive an undefined path and fail.

## Goals / Non-Goals

**Goals:**

- Restore successful saves for edited pending Application and Toolset publication requests.
- Use the metadata path already supplied by the enriched resource as the Core content-write identity.
- Retain existing Core endpoint selection, update ordering, payload sanitization, and error propagation.
- Lock the behavior with API-level regression tests that assert the final Core PUT URL and body.

**Non-Goals:**

- Change the publication request DTO, routing, server-action interface, or notification UI.
- Alter optimistic-concurrency headers, target URL calculation, file staging, or non-Application/Toolset resource behavior.
- Add an admin-backend fallback or migrate the resource metadata model.

## Decisions

### Resolve Application and Toolset write paths from `_metadata.path`

The publication update adapter will derive the path supplied to `AssetApi.put` from the enriched resource metadata, which is the authoritative identity contract after the resource metadata migration.

**Rationale:** Application and Toolset mergers intentionally retain only content fields at the top level and place `path`, `folderId`, version, and audit fields under `_metadata`. The existing flat-field lookup is stale and is the direct cause of the failed Core write.

**Alternatives considered:**

- Restore a flat `path` field in merger output: rejected because it reverses the shared metadata-model contract and risks reintroducing strict-DTO payload fields.
- Rebuild the write path from folder, name, and version at the publication layer: rejected because `_metadata.path` is already the authoritative Core-addressable path and avoids duplicating resource-path logic.

### Preserve the existing payload sanitation and two-stage update order

The change only replaces the path source. The resource body remains passed through `stripMetadata`, with the existing Application/Toolset identity-field stripping, and persists only after the publication-update request succeeds.

**Rationale:** This minimizes the fix and retains the established Core DTO compatibility and failure behavior.

**Alternatives considered:**

- Combine publication metadata and resource content into a new endpoint call: rejected because Core's current publication contract requires the established two-stage flow.

### Test the final Core content request for both affected resource types

Regression tests will submit Application and Toolset publication fixtures using `_metadata.path`, then assert the content PUT URL targets the metadata path and that the write payload omits metadata-only fields.

**Rationale:** The prior update test uses a Prompt fixture, whose identity shape does not expose this regression. URL assertions prevent a future silent reintroduction of a stale path lookup.

## Risks / Trade-offs

- [A resource fixture omits `_metadata.path`] → Keep tests representative of the enriched Application/Toolset contract; let the existing request-error pipeline surface malformed backend data rather than inventing a fallback identity.
- [The change affects only the post-publication-update resource write] → Retain the existing ordering so a failed publication metadata update cannot cause an independent content write.
- [The scoped tests miss shared adapter changes] → Run targeted API tests plus the app's lint, formatting, app typecheck, spec typecheck, and full test gates.

## Migration Plan

1. Deploy the frontend fix with no data migration or configuration change.
2. New saves use `_metadata.path`; existing pending requests remain valid because their detail enrichment already produces this metadata shape.
3. Roll back by reverting the frontend change if unexpected Core compatibility issues arise; no persisted schema or backend behavior changes.

## Open Questions

- None.
