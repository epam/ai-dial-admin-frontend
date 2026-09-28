## Why

DIAL Core has no version concept for prompts and conversations — their DTOs are `id/folderId/name/content` (plus `ignoreUnknown`), paths are built by `/`-segment joining only, and `name__1.0` vs `name__2.0` are just two unrelated resources. The `__` name/version convention is a pure frontend invention: this app writes it into paths and parses it back out, grafting a `version` field onto models from URLs that Core never interpreted. Removing it eliminates a whole pipeline of frontend-only version machinery, fixes the mis-parse bug class where a prompt legitimately named `foo__bar` is treated as name `foo` + version `bar`, and aligns the FE with Core's actual contract.

## What Changes

- **BREAKING** Prompts and conversations become versionless everywhere (all buckets — `public/`, user buckets, review buckets, platform buckets): `__` is no longer a name/version delimiter but ordinary characters in the entity name.
- Remove the `version` field from `DialPrompt` and `DialConversation` (and their `versions`/`selectedVersions` siblings), and remove every prompt/conversation code path that produces, parses, edits, or displays it.
- Split the two asset groups in the shared pipeline: **APPLICATION and TOOLSET keep today's versioned logic exactly as is**; PROMPT and CONVERSATION stop flowing through version-parsing/building code (`VERSIONED_RESOURCE_TYPES` in `constants/assets-core.ts` is the central switchboard).
- Remove the prompt/conversation version UX: version field in the New Prompt modal, version dropdown on detail pages, "Save as new version" button, AddVersionModal, CompareVersions, "New Version" radio in the duplicate modal, "All versions" option in delete modals, version column and per-name version multi-select in grids, version tags in delete toasts, version editing in publication prompt review.
- `getPrompt` stops resolving by name+version listing; it resolves by path like other versionless reads.
- Import/export: prompt ids no longer require a `__version` suffix (`PROMPT_ID_REGEX` changes); existing documents containing `name__1.0` ids still import — the suffix becomes part of the name. Export paths are built from the plain name.
- Publications: prompt/conversation resources are enriched without version parsing, and update target recalculation builds plain-name URLs for them; their PUT bodies no longer carry `version`.
- Stored resources with `__` in their names (e.g. `prompts/public/name__1.0.json` created before this change) remain valid and render as-is — the suffix is simply part of the displayed name. No data migration.
- Names containing `__` (old or newly created) are processed successfully end-to-end: create, list, get, move, import, export, publication, delete, open-in-new-tab.

## Capabilities

### New Capabilities
- `versionless-prompts-conversations`: app-wide versionless treatment of prompts and conversations — `__` as name characters, no version in models or UX, and the versioned (application/toolset) vs versionless (prompt/conversation) group split in shared asset surfaces.

### Modified Capabilities
- `prompts-core-api`: get no longer resolves by name+version; move no longer reapplies a version suffix on duplicate names; import id validation no longer requires a `__version` suffix; export path building drops the version part.
- `conversations-core-api`: the merged `DialConversation` shape returned by get/list no longer carries a client-derived `version`.
- `core-asset-client`: the consolidated version-path helper's scope narrows to application/toolset only; conversation and prompt mappers stop parsing `version` from the metadata URL; put responses for prompt/conversation stop returning a parsed `version`.
- `publications-core-api`: prompt and conversation leave the "four versioned types"; enrichment parses their paths without `__` version splitting; update recalculates their target URLs without a version part; prompt/conversation bodies are persisted without `version`.

## Impact

- **Shared pipeline that must fork by group, not be simplified away** (applications/toolsets still ride it): `BaseAssetList` grid pipeline (version column, versions-per-name merging, selection expansion into `prefix__version` paths, export/delete path building), `server/core/asset-metadata.ts` (`isVersioned`, `mergePrompt`/`mergeConversation`), `server/core/asset-api.ts` (`parsePathFields`, `withContentId` prompt-id recomputation), `server/publications/{path,resolver,update}`, `server/assets/{exim,move,import-destination,get-by-name-version}`, `utils/entities/versions.ts`, `utils/files/path.ts`, `components/Assets/Deployments/*`, `components/EntityListView/{CreateEntity,Import,HeaderButtons}`, `components/EntityView/Modals/Delete`, `utils/open-in-new-tab.ts`.
- **Prompt/conversation-only code deletable outright**: `components/Assets/Conversations/View/utils.ts` version helpers, `enrichConversationWithVersion`, `CompareVersions`, `getPromptVersionError` (already dead), `server/prompts/exim.ts` `PROMPT_ID_REGEX`.
- **Semantics change** (user-visible): duplicate prompt names no longer "version-bump" — a plain name collision is a conflict (Core's full-string uniqueness). Duplicate-name handling for prompts/conversations needs a defined behavior (plain-copy rename vs surfaced conflict) — settled in design.md.
- **No backend change**: Core already accepts all of this; its DTOs ignore unknown fields and never read `version`.
- **Tests**: extensive fixtures encode versioned prompt behavior (`prompts/actions.spec.ts`, `publications-enrichment.spec.ts`, `versions.spec.ts`, import/export specs, BaseAssetList specs); shared specs need prompt/conversation cases adjusted, not deleted.
- Conversations-trace is unaffected (opaque chat ids; `__` strings there are app deployment ids or session ids).

## Non-goals

- No change to application/toolset versioning — their versioned paths, fields, and UX stay exactly as today, in every bucket.
- No migration or renaming of resources already stored with `__` in their names.
- No DIAL Core changes (none needed — Core is already version-blind).
- No new version-aware features (version history, compare, "latest version" resolution) — these are removed, not replaced.
- No conversations-trace changes.
