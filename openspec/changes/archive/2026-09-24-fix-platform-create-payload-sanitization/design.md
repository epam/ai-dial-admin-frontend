## Context

The shared `CreateAssetActionMap` is the common dispatch point for list-based creation. `BaseAssetList` adds the selected `folderId` so asset views can construct a destination, but the eight flat platform views do not use folders in their Core resource bodies. Their server actions independently remove `_metadata` and other entity-specific fields, but a flat `folderId` supplied by the shared flow remains available to be forwarded to strict Core config-resource DTOs.

The eight affected entries are Models, App Runners, Catalog Schemas, Interceptors, Translators, Routes, Roles, and Keys. Platform applications and toolsets take a separate `PlatformCreateAssetActionMap` path and remain outside this change.

## Goals / Non-Goals

**Goals:**

- Ensure every flat platform create-map entry receives a payload with no transient `folderId` or `_metadata`.
- Preserve all other input fields, including the `name` or `$id` identity needed by the delegated server action.
- Cover the shared map boundary with focused tests across every platform map entry.

**Non-Goals:**

- Change the existing entity-specific server-action payload builders or their schema-specific transformations.
- Alter public-bucket application/toolset writes, platform application/toolset writes, or create UI behavior.
- Introduce API, type-model, routing, or persistence migrations.

## Decisions

### D1 — Sanitize at the shared map boundary

Wrap the eight flat platform action-map entries with one shared sanitizer that removes `folderId` and `_metadata`, then delegates to the existing server action.

This boundary is where the shared UI flow introduces the transient field, so it protects every call site without repeating the same destructuring in eight server-action modules. Individual server actions remain authoritative for fields that depend on their Core DTO: route/role descriptions and timestamps, key secrets, runner routes, catalog-schema identity, and model upstream secrets.

**Alternative considered:** add `folderId` removal to each entity's `to*Payload` function. This would duplicate behavior across eight modules, leave the shared-flow contract implicit, and make a future map entry easy to miss.

### D2 — Preserve current function signatures and map typing

The wrapper accepts and returns the existing `AssetWithVersion`/`ServerActionResponse` map contract, only narrowing the object before delegation. No server-action signatures or downstream callers change.

**Alternative considered:** broaden all server-action types to explicitly carry UI-only identity fields. That would encode transient UI transport data in Core resource contracts without improving runtime safety.

### D3 — Test delegation rather than every downstream Core payload transform

A focused `BaseAssetList` map test will mock the eight server actions, invoke each map entry with representative content plus `folderId` and `_metadata`, and assert that the delegated action receives neither transient field while retaining its required identity/content fields.

The existing per-action specs continue to validate each server action's independent Core-payload rules. The new test closes the gap at the shared boundary rather than duplicating their coverage.

## Risks / Trade-offs

- [A wrapper accidentally removes a real entity field] → Parameterize the test cases with meaningful identity/content fields (`name`, `$id`, `key`, schema fields) and assert their exact preservation.
- [A later platform map entry bypasses the sanitizer] → Keep all flat platform map wrappers visually grouped and assert coverage for the complete current entry set.
- [Platform applications/toolsets are unintentionally changed] → Do not modify `PlatformCreateAssetActionMap`; test scope is restricted to the flat platform entries in `CreateAssetActionMap`.
