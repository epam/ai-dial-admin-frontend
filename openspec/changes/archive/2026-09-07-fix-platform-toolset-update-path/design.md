## Context

`updateToolset` (`assets-toolsets/actions.ts:62-71`) writes to `assetApi.put(token, ResourceType.TOOLSET, toolset.path, ...)`, trusting the caller-supplied `path` as-is. For a public-bucket toolset, `path` comes from `metadataFields`/`parseEncodedVersionedPath`, which already returns a folder-qualified, versioned path — so this happens to work today. For a platform-bucket toolset, `path` comes from `flatMetadataFields`, which deliberately returns the bare resource name (`"yo"`); the `platform/` bucket segment lives only on `toolset.folderId`, which `updatePlatformToolset` sets to `'platform/'` but `updateToolset` never reads. The write lands at `v1/toolsets/yo` instead of `v1/toolsets/platform/yo`, 404s (issue #4419).

`createToolset` (`:33-46`) already avoids this: it recomputes `path` from `folderId` + `getVersionedName(name, version)`, so `createPlatformToolset`'s `folderId: 'platform/'` override actually reaches the write path. Applications' `updateApp` (`assets-applications/actions.ts:109-110`) does the identical recomputation for its update path, which is why `updatePlatformApplication` works correctly today — confirmed by the user, who reports Applications has no equivalent bug.

## Goals / Non-Goals

**Goals:**

- Make `updateToolset` compute its write path from `folderId` + versioned name, matching `createToolset` and `updateApp`, so `updatePlatformToolset`'s `folderId` override takes effect.
- Fix scoped to toolsets only — Applications is not touched.

**Non-Goals:**

- Changing how platform-bucket writes strip fields, validate names, or anything else already covered by the `platform-toolsets` spec.
- Introducing a new path-construction pattern — this reuses the one `createToolset`/`updateApp` already establish.

## Decisions

### Recompute the path in `updateToolset`, not in `updatePlatformToolset`

Two shapes were considered:

- **A — recompute in `updateToolset`** (chosen): add the same `folderId`/`getVersionedName` computation `createToolset` already has. `updatePlatformToolset`'s existing `folderId: 'platform/'` override then flows through unchanged.
- **B — special-case in `updatePlatformToolset`**: set `path: \`${PLATFORM_ROOT_FOLDER}/${name}\`` only in the platform wrapper, leaving `updateToolset` untouched.

A is chosen because:
- It matches the sibling implementation (`updateApp`) exactly, which this codebase's patterned-entity convention favors over a locally-invented shape.
- It fulfills the doc comment already sitting on `getPlatformToolsets`/`createPlatformToolset` (`actions.ts:83-91`), which claims `updateToolset` already does this recomputation — the comment describes the intended design, and A makes the code match it instead of leaving the comment wrong.
- It satisfies the `toolset-resources-core-api` spec's existing "Platform-bucket update path has no folder segment" scenario directly, rather than working around a gap in `updateToolset`.

B was rejected because it fixes only the platform case while leaving `updateToolset` inconsistent with `createToolset`, and does nothing to reconcile the misleading doc comment.

**Consequence for public-bucket toolsets:** today, editing a public toolset's *name* and saving writes to the *old* `toolset.path` (the rename only lands in the request body, since `path` is trusted verbatim). After A, the write path is recomputed from `folderId` + the new name, so a name-edit save now targets the new path — matching how `updateApp` already behaves for applications. This is a behavior change beyond the 404 fix, but it aligns toolsets with the established Applications pattern rather than introducing a new inconsistency.

## Risks / Trade-offs

- **[Risk] Public-bucket rename-on-save behavior shifts to target the new path instead of the old one.** → Mitigation: this matches `updateApp`'s existing behavior for Applications, so it is not a new pattern in this codebase; confirm during implementation whether the Toolset view's name field is editable independently of a version bump (if the UI always creates a new version on rename rather than allowing an in-place rename, this risk doesn't materialize in practice).
- **[Risk] Any other caller of `updateToolset` might rely on `toolset.path` being honored verbatim.** → Mitigation: grep call sites of `updateToolset`/`updatePlatformToolset` before implementing; the only two callers are the toolset view's save action and `updatePlatformToolset`, both of which already supply the fields the recomputation needs (`name`, `version`/`folderId`).
