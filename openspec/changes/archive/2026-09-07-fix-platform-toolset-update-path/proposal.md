## Why

Saving an existing platform-bucket toolset 404s: the UI sends `PUT /v1/toolsets/yo` instead of
`PUT /v1/toolsets/platform/yo` (GitHub issue #4419). `updateToolset` builds its write path from
`toolset.path`, which for a platform toolset is the bare resource name — the `platform/` bucket
segment only lives on `toolset.folderId`, which `updateToolset` never reads. This already violates
the existing `toolset-resources-core-api` spec ("Platform-bucket update path has no folder segment"),
so this is a bug fix, not a new requirement.

## What Changes

- `updateToolset` (`assets-toolsets/actions.ts`) recomputes its write path from `folderId` +
  versioned name — the same shape `createToolset` and Applications' `updateApp` already use —
  instead of trusting the caller-supplied `path` verbatim.
- This lets `updatePlatformToolset`'s existing `folderId: 'platform/'` override actually reach the
  write path, producing `platform/{name}` instead of the bare name.
- Public-bucket toolset updates keep the same computed path they get today (folder-qualified,
  versioned) — no behavior change there, confirmed by tracing `metadataFields`/
  `parseEncodedVersionedPath`, which already returns a folder-qualified `folderId` for public
  toolsets.
- Scoped to toolsets only. Applications' `updateApp`/`updatePlatformApplication` already do this
  recomputation correctly and are not touched.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None — the fix brings `updateToolset` in line with the `toolset-resources-core-api` spec's existing
"Platform-bucket update path has no folder segment" scenario, which the current code violates. No
spec-level behavior is changing.

## Impact

- `apps/ai-dial-admin/src/app/[lang]/assets-toolsets/actions.ts` — `updateToolset` gains path
  recomputation; `updatePlatformToolset` needs no change (its `folderId` override starts working).
- No API surface, route, or component signature changes.
- Existing toolset unit tests around `updateToolset`/`updatePlatformToolset` need updating/adding to
  cover the platform-bucket path.
