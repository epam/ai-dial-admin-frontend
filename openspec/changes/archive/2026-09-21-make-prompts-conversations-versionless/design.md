## Context

Core is version-blind for every resource type: `ResourceDescriptor` builds paths by `/`-segment joining, `Prompt`/`Conversation` DTOs are `id/folderId/name/content` (+`ignoreUnknown`), and `name__1.0` vs `name__2.0` are unrelated resources. The `__` name/version convention exists only in this frontend: `VERSIONED_RESOURCE_TYPES = [APPLICATION, TOOLSET, CONVERSATION, PROMPT]` (`src/constants/assets-core.ts`) drives `isVersioned()` in the asset client, version grafting in `mergePrompt`/`mergeConversation`, `__`-parsing in publications path building, and a large version UX (dropdowns, compare, add-version, versions-per-name grid merging) that Core cannot back with any version API.

Two in-repo precedents define the target shape:

- **Model resource kind** (`core-asset-client` spec, "Content-addressed unversioned resource support") — content GET/PUT/DELETE + metadata GET against a plain `models/platform/{name}` path, no `__` parsing. Prompts/conversations keep folders (unlike the flat model kind), but the versionless content+metadata treatment is identical.
- **Platform bucket of apps/toolsets** (prior `platform-applications`/`platform-toolsets` refactor) — versionless UX carve-outs inside the *same* shared components: `getVersionedName` no-ops on empty version, `hideVersionField`, flat column set, tests asserting `path).not.toContain('__')` (for newly built paths).

A third surface, files, is versionless in the client but its move-with-duplicate still grafts an `extractVersionByPath` suffix (`app/[lang]/files/actions.ts:55-57`) — a quirk, not a precedent to copy, and out of scope.

## Goals / Non-Goals

**Goals:**

- Prompts and conversations are versionless in every bucket: `__` is an ordinary part of the name, never a delimiter.
- No `version` in `DialPrompt`/`DialConversation` models, no version UX for them anywhere.
- Applications and toolsets keep today's versioned behavior byte-for-byte, in every bucket.
- Existing resources whose stored names contain `__` keep working and render as-is.
- The shared pipeline forks by resource-type group cleanly, with one source of truth for group membership.

**Non-Goals:**

- No Core changes, no data migration, no renaming of stored resources.
- No files behavior change (including their duplicate-move suffix quirk).
- No version-history/compare/"latest" replacement features.
- No conversations-trace changes.

## Decisions

### D1: Group membership lives in `VERSIONED_RESOURCE_TYPES` only

Remove `CONVERSATION` and `PROMPT` from `VERSIONED_RESOURCE_TYPES` (`src/constants/assets-core.ts`) and from the `VersionedResourceType` exclude-list. Every versioned-vs-versionless branch in the pipeline already keys off this set (`isVersioned()` in `server/core/asset-metadata.ts` and `server/core/asset-api.ts`), so the split propagates from one place. No new parallel `VERSIONLESS_*` set — a second list would drift.

Prompt/conversation then land in the "content-addressed unversioned" bucket alongside MODEL: they keep the content+metadata GET/PUT split (unlike FILE's blob shape) but skip all `__` parsing.

*Alternative rejected:* a bucket-scoped flag like the platform apps/toolsets carve-out. That refactor was versionless-per-bucket for a type that stays versioned elsewhere; here the type is versionless everywhere, so type-level membership is simpler and total.

### D2: Prompt/conversation paths parse and build like Skill's folder path — no `__` split

Reads: prompt/conversation URLs in publications resolve via the `parseEncodedFolderPath` shape already used for Skill (`server/publications/path.ts`): decode, strip the type prefix, split on `/`, name = last segment, folderId = the rest. No `__` handling.

Writes: destination paths build as `{folderId}{name}` — `getVersionedName(name, '')` already no-ops to `name`, so the existing builders work once version is never set for these types; explicit builders in `server/publications/update.ts` target recalculation and `server/assets/import-destination.ts` stop passing a version for the versionless group.

*Alternative rejected:* keeping the last-`__` split as a tolerant fallback for old data. Rejected because it re-creates the mis-parse bug class (`foo__bar` → `foo` + `bar`) and contradicts the accepted behavior that `__` is part of the name.

### D3: Duplicate-name semantics become plain-name semantics

- **Move with `duplicateName`** (`server/assets/move.ts`): for the versionless group the destination name is exactly `duplicateName` — no `extractVersionByPath` suffix graft. A same-name collision is governed by the existing `overwrite` flag (Core's full-string uniqueness otherwise rejects).
- **Duplicate modal** (`components/Assets/Deployments/DuplicateAsset.tsx`): for prompts/conversations the "New Version" radio and `VersionControl` are removed; only "New Entity" behavior remains, with the name seeded by `getClonedEntityName` (the existing `copy`-suffix convention) — the same shape the modal already shows for the ENTITY option.

### D4: Models — prompts leave the `AssetWithVersion` union

`DialPrompt` drops `version`, `versions`, `selectedVersions`; `DialConversation` drops `version`. `AssetWithVersion` (`src/models/dial/deployment-asset.ts`) narrows to deployment assets only (apps/toolsets), which is what its name always meant. Shared components currently typed on the union (`BaseAssetList`, `AssetVersionControl`, `DuplicateAsset`, delete modals) split their props/handling: version-owning surfaces take `DeploymentAsset`; prompts/conversations flow through versionless branches. This is the widest type-level ripple of the change and is done deliberately first, so the compiler enumerates every site the version assumption reached.

### D5: `getPrompt` becomes path-based, mirroring `getConversation`

Drop `getAssetByNameVersion` usage for prompts: `getPrompt(path, etag)` issues the conditional GET directly (conversations already work this way, and the detail page already receives the full path). The prompt detail page stops feeding the version dropdown (no sibling listing by name needed). `getAssetByNameVersion` remains for apps/toolsets.

### D6: Grid pipeline (`BaseAssetList`) forks by route group

For prompt/conversation routes: no Version column, no `getVersionsPerName` row merging (each stored resource is its own row — `name__1.0` renders as one prompt named `name__1.0`), no per-name version multi-select, selection expansion uses plain paths (`getAllSelectedItemsPaths` stops splitting `prefix__version`), and export/delete/duplicate path building uses the row's plain path. Version-owning behavior stays for app/toolset routes behind the same route-group check used by the platform flat-column precedent. Selection and merge state currently keyed `folderId+name` re-keys to path for the versionless group.

### D7: Import/export — versionless id shape, old documents accepted

`PROMPT_ID_REGEX` (`server/prompts/exim.ts`) becomes the versionless shape: `prompts/public/{folders}/{name}` where the name segment is any valid filename — `__` neither required nor forbidden. Old export documents with `name__1.0` ids import as prompts named `name__1.0` (per accepted behavior). Import destination resolution and conflict checks compare plain paths. The import grid (`components/EntityListView/Import/utils.ts`) drops the editable Version column for prompts and stops rewriting ids on version edits.

### D8: Publications — versionless enrichment and target recalculation

`server/publications/resolver/registry.ts` routes PROMPT/CONVERSATION to a versionless enrichment (folder-path parse, merge without version — same mapper minus the grafted field); `server/publications/update.ts` recalculates their target URLs without a version part. PUT bodies for prompt/conversation do **not** join `RESOURCE_TYPES_STRIPPED_BEFORE_PUT` in `app/api/api.ts`: unlike app/toolset DTOs (`FAIL_ON_UNKNOWN_PROPERTIES` — strip required), prompt/conversation DTOs are `id/folderId/name/content` with `ignoreUnknown` and *require* `folderId` on the body (confirmed by reproducing the publications-update 400 with/without the strip), so stripping them is itself a bug. The no-version guarantee is met without stripping: `version` no longer exists on the FE models, and Core silently ignores any residual `path`/`id` identity fields. `withContentId` keeps recomputing the prompt `id` from the path — `id` is a real Core DTO field and the recomputation must not reintroduce a version.

### D9: Version utils stay, scoped to the versioned group

`src/utils/entities/versions.ts` and `updatePathWithNameAndVersion`/`extractVersionByPath` (`src/utils/files/path.ts`) remain for apps/toolsets (and files' existing quirk). All prompt/conversation callers are removed; the dead `getPromptVersionError` (`src/utils/validation/version-error.ts`) is deleted outright. Prompt/conversation-only version helpers (`getConversationPathWithVersion`, `getConversationVersions`, `enrichConversationWithVersion`, `CompareVersions`) are deleted. `getEntityPath` (`src/utils/open-in-new-tab.ts`) stops appending `__${version}` for prompts/conversations.

## Risks / Trade-offs

- [Widest risk: shared components typed on `AssetWithVersion`] → D4 deliberately narrows the union first so `tsc` enumerates every affected site; the typecheck gate is the safety net for the ripple.
- [Shared tests encode versioned prompt behavior] → Prompt/conversation fixtures are updated to versionless shapes; app/toolset cases stay untouched as the regression guard that the versioned group didn't drift. `publications-enrichment.spec.ts`'s prompt/conversation assertions flip from "keeps `version`" to "strips `version`".
- [Users lose version grouping on old `name__*` data — `foo__1.0` and `foo__2.0` now look like two arbitrary prompts] → Accepted product decision (proposal); grid sorting/searching by name keeps similar names adjacent.
- [Spec files carry ~720 pre-existing type errors, so a green test run ≠ type-correct specs] → Prompt/conversation spec edits are checked with targeted `npx vitest run` per file; the final gate still runs the full suite.
- [Missed `__` parser in a corner (toasts, open-in-new-tab, audit links) regresses old-named resources] → The task list includes a sweep for remaining `__` literals across prompt/conversation paths (`grep` for `__`-splitting on prompt/conversation code) plus a spec-verification pass on a bucket seeded with `name__1.0` resources.
- [Grid column state persisted in localStorage still names a Version column] → Harmless: a removed column is dropped when state is applied; no migration needed.

## Migration Plan

Pure frontend change, deployed as a series of PR-sized tasks (see tasks.md): type-level split first (D4), then server pipeline (D1/D2/D5/D7/D8), then grid/UX (D3/D6/D9), then spec/test normalization. No coordinated backend deploy, no data migration, no feature flag — Core already accepts every request shape involved. Rollback = revert the FE.

## Open Questions

None remaining — duplicate-name semantics (D3), old-data display, and import compatibility were settled during exploration and confirmed by the product decision.
