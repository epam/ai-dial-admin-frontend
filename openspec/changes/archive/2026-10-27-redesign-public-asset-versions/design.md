## Context

Core treats every public application/toolset as a resource at a complete path. Admin alone interprets the final segment as `name__version`. `VERSIONED_RESOURCE_TYPES` and `server/publications/path.ts` correctly retain this parsing for these types; prompts/conversations are already versionless following PR #4627. The redesign removes version-family UX, not this storage interpretation.

Current assumptions span `Assets/BaseAssetList`, `Assets/Modals/utils.tsx`, `Assets/ExportAssets/export.ts`, `Common/FilePath/utils.ts`, detail-page move/delete, import previews, and header controls. `AssetButtonsWrapper` fetches/displays sibling versions, views can create a new version while saving, and three row transformers merge same-name resources. Delete-preview tree paths are synthesized from bare names and can collide even after aggregation is removed.

Content and identity already have distinct sources: `DialResource.display_version` is content, while `CoreResourceEntityMetadata.version` is parsed from the URL. However, create/update payload builders and duplicate/publication handlers overwrite the former with the latter; both camelCase and snake_case display-version spellings appear in current write paths.

### Verified backend contracts

All Core paths below are relative to the sibling `../ai-dial-core/` repository:

- `server/src/main/java/com/epam/aidial/core/server/util/ResourceDescriptorFactory.java:162-203`: decoded component validation and a 900-byte UTF-8 limit on the complete absolute storage path. Forbidden decoded characters are `/`, `{`, `}`, `"`, and U+0000–U+001F. URI-reserved characters require segment encoding.
- `server/src/main/java/com/epam/aidial/core/server/controller/ResourceController.java:722-729`: ordinary resource PUT rejects folders and any component ending in a dot.
- `storage/src/main/java/com/epam/aidial/core/storage/util/UrlUtil.java:27-75`: segment decoding/encoding; ordinary spaces and Unicode are not semver-restricted.
- `config/src/main/java/com/epam/aidial/core/config/Deployment.java:41-44`, `Application.java:19-24`, `ToolSet.java:16-21`: independent string display version, accepted camel/snake aliases, snake_case serialization for these concrete resource types. No display-version format/length constraint was found.
- Existing `application-resources-core-api` and `toolset-resources-core-api` specs preserve the former admin-backend-facing server-action/import/export contracts; the implementation now calls Core directly.

These are inspected source contracts, not runtime proof of every unusual URI/Unicode character. Core's bulk-admin apply and move routes have validation asymmetries; frontend validation for newly entered versions follows the ordinary PUT contract used by this app, not the more permissive bulk route.

## Goals / Non-Goals

**Goals:**

- One independently selectable row/resource for every complete public application/toolset path.
- Text path versions editable only in create, duplicate, and publication review; synchronize display version in those flows.
- Existing details expose an immutable path version and independently editable optional display version.
- Exact-path operations and collision checks, with unchanged folder recursion, auth, notifications, etags, and export document formats.
- One coherent PR, including specs and regression tests.

**Non-Goals:**

- No Core implementation, stored-resource migration, delimiter replacement, version API, latest-version semantics, or version-family history.
- No change to platform-bucket identity/UI, prompt/conversation behavior, deployment/image versioning, or unrelated display-version controls.
- No browser-verification task: the user explicitly declined it. No manual-verification tasks.

## Decisions

### D1: Separate storage parsing from version-family UX

Keep `VERSIONED_RESOURCE_TYPES`, the consolidated last-`__` parser/builders, and path-derived `_metadata.version`. Do not widen `isVersionlessAssetView` to applications/toolsets: that flag also controls whether `__` is interpreted at all. Remove grouping and selection-expansion machinery from public applications/toolsets explicitly, while preserving the existing public/platform bucket dispatch.

`AssetWithVersion` can continue to describe a row carrying a scalar version. Remove obsolete aggregate `versions`/`selectedVersions` fields and version-map props from these asset flows where no live consumer remains; do not delete image-owned version collections or helpers used by images. Prefer simplifying the existing shared components over introducing a new policy framework for two types.

**Alternative rejected:** treating applications/toolsets as versionless prompts, which would misparse existing names, alter URLs, and require a migration the user excluded.

### D2: Full paths are row and operation identity everywhere

`BaseAssetList` serves rows without same-name reduction and uses a plain Version `ColDef` with the established text/ellipsis treatment. Remove semantic comparison, selected-version maps, and version-specific nonclickable-column rules from this surface. Preserve root/platform column sets and the established name renderer/folder editors.

Apply the same shape to deletion previews, export selection previews, and `Common/FilePath`. Preview tree keys and synthetic paths must include the stored versioned leaf or retain an unambiguous full-path mapping; two selected same-name resources must not overwrite each other in `pathMapping`.

Move/export/delete operate on exact selected paths. A selected folder still means its descendants according to the existing recursive contract, not just one item; only implicit same-name sibling expansion disappears. Keep `.dial_folder` marker exclusion, progress reporting, conflict resolution, and existing notifications.

Detail-page moves use the opened entity's original path directly instead of fetching siblings and calling `getListOfPathsToMove` by name. Detail deletion uses that same exact path and current etag, with no All versions selector. Remove folder-list requests from `[id]/page.tsx` that exist only to populate sibling-version controls; preserve requests needed by other tabs.

**Alternative rejected:** only changing the main grid. Existing export/delete/folder-picker transformers and detail moves would retain the old model and target unexpected resources.

### D3: Asset-specific text-version validation, not a global semver change

Reuse `BaseControls/Version`'s existing opt-out of semantic validation, or a thin asset-owned composition of the kit Input, with an asset-specific validator. Keep image/deployment semantic validation unchanged. Use the standard validation context, field errors, and localized labels; use separate control ids for Version and Display version.

For newly entered path versions:

- Require a nonblank value (`trim()` only checks emptiness; do not silently trim/rewrite nonblank labels).
- Reject the literal delimiter `__` anywhere and a leading `_`, because the existing parser splits at its last occurrence; a leading underscore overlaps the separator and changes the parsed name. The user confirmed both restrictions during implementation.
- Reject Core's forbidden decoded characters and a resulting stored component ending in `.`.
- Validate the assembled destination path, including parent segments and the complete `name__version` leaf, against ordinary PUT restrictions and the 900 UTF-8 byte limit. The limit includes the public/type storage prefix, not just version length.
- Segment-encode URI-reserved text exactly once at the request boundary. Do not copy platform deployment-name whitelists or frontend ID-length rules onto public version labels.

Create/duplicate preflight against current destination-folder rows using exact paths, rechecking when name/version/folder changes. Do not let `IdControl` reject a public name simply because a sibling version exists. Core's existing `If-None-Match: *` remains authoritative against races; show the existing error notification and retain the draft on rejection. A failed listing must not silently be treated as proof that a path is free.

**Alternative rejected:** disabling semver and leaving validation otherwise untouched; it permits ambiguous `__`, malformed paths, and hidden duplicate-name false positives.

### D4: Synchronization is flow-specific

Create and duplicate show only Version. Editing it sets both the create identity version and `display_version`. A submit with an unchanged default/source version also synchronizes display version; this cannot depend solely on the input change event. The existing create default is retained. Duplication defaults to the source's parsed path version, proposes the usual copy name, and permits editing name/folder/version; there is no inferred semver increment and no New Version radio mode. The destination tuple is checked for uniqueness after every relevant change.

Publication review retains its editable Version field and sets `_metadata.version` and `display_version` together when Version changes. There is no separate Display version field there. Publication submission also synchronizes display version to the submitted path version when the field was left unchanged, matching creation/duplication; this exception does not apply to ordinary asset detail saves. Target collision checks/issues use the publication's actual target folder/name/version and retain existing action semantics (including intentional replacement/delete), not create-only blanket uniqueness.

Existing details add an optional, unrestricted string Display version input directly below Display name. It changes only `display_version` and can be cleared to an empty string; read-only administrators cannot edit it. Ordinary detail saves never resynchronize it to the path version, even when another field or folder placement changes.

**Alternative rejected:** a universal `display_version = version` rule in every server action. It would make the new independent details input ineffective.

### D5: Immutable detail identity and separate content writes

Remove `AssetVersionControl` from existing details and show Version as `LabelledText` through `ResourceInfoHeader`'s existing prefix slot: the first metadata item, before Maintainer. It is not part of the top entity/action header and follows the other metadata's visibility when switching to JSON editing. No sibling selection or create-version action appears in the unchanged or changed header state. Remove `addedVersions`, `addNewVersion`, and optional `newVersion` save branches from application/toolset views and their shared header wiring where unused.

Ordinary saves retain the original path version from trusted original identity rather than accepting a forged editable version field from the draft/JSON editor. Folder changes remain the explicit move flow; the versioned leaf is preserved. This must also preserve the application's existing parameters-iframe dirty/save/discard behavior.

Use the existing snake_case Core-resource content shape for `display_version` in create/update and publication writes, and do not emit both spellings. Create payload construction performs the flow-specific initial synchronization; ordinary update payload construction preserves supplied content. Keep stripping `_metadata` and frontend identity fields before Core writes, and retain toolset secret-hint stripping, OAuth duplication resets, references, and source-specific application behavior.

**Alternative rejected:** hiding the dropdown while retaining mutable JSON identity and save-as-new-version branches, which leaves an alternative path-version edit route.

### D6: Import/export retain both values independently

Export selected exact resources with the existing Core-prefixed `id`, aggregate JSON keys, archive entry names, and folder traversal. New export ids encode the decoded leaf path segment-by-segment so literal percent text, spaces, and Unicode decode exactly once on import; this is serialization, not migration of stored paths or incoming ids. Do not serialize a comma-separated version list or find siblings through `findAssetVersions`.

Import previews continue parsing name/version from the stored id but render Version as plain read-only text. Keep existing name/folder conflict resolution; if an imported name is changed, preserve the original versioned suffix. Do not set display version from the path version on import. Both matching and differently valued `display_version` content must round-trip, including older valid semver exports. Incoming ids remain authoritative; this change does not re-encode/migrate existing identifiers or retrofit newly entered-version validation onto immutable legacy labels.

**Alternative rejected:** reusing the prompt's versionless import flag; that would discard the suffix split rather than simply make it noneditable.

### D7: Publication relocation is preserved

Keep `buildUpdatePlan`'s target URL construction and `withMovedReviewPath`: a version edit changes the publication target and Core relocates the review copy before the content PUT. Persist synchronized content to that post-move review path, not the old path. Validation failures block save with field feedback; Core/publication failures keep the existing notification and pending-review behavior. Prompts/conversations and file staging keep their current branches.

## Risks / Trade-offs

- [A remaining same-name key collapses two rows or deletes the wrong item] → Cover main list, export, delete synthetic tree mappings, folder pickers, detail moves/deletes, and notifications with two same-name/different-version fixtures.
- [Shared cleanup breaks platform assets, prompts, or image versioning] → Retain parsing-group membership and image consumers; add regression assertions for unaffected branches and run both typecheck gates.
- [URI text or long Unicode labels fail downstream] → Test decoded character constraints, segment encoding, and total UTF-8 byte boundaries separately; Core remains authoritative for races/storage errors.
- [A newly entered version accidentally changes independent display-version content on ordinary save/import] → Distinct fixtures where path version and display version differ, including empty display version and JSON-editor saves.
- [Publication target collision validation prevents intentional replacement] → Use existing publication action/issue semantics; distinguish target validation from temporary review-copy identity.
- [Persisted grid column state references the old Version renderer] → Keep the existing Version column id and replace its renderer; no storage migration is required.
- [Old unversioned or unusual stored resources cannot be corrected through a read-only identity] → Continue reading/exporting/saving existing identities without forcing new-label validation on untouched version metadata; only create/duplicate/edited publication versions use the new-entry rules.

## Migration Plan

Deliver the row/action changes, identity/content separation, publication exception, tests, and spec deltas together in one PR. There is no data migration, Core deployment requirement, feature flag, or multi-PR rollout. Implementation task groups are work breakdown only, not separate deliveries. Run unit/component tests and the final lint/format/typecheck/full-suite gates before completion. Rollback is the frontend revert; resources created with text versions remain valid Core resources, although old UI semver controls cannot edit those labels reliably.

## Open Questions

No outstanding product decisions. Recorded implementation defaults: creation retains its existing default version; duplication seeds the source version instead of calculating a next version. Publication synchronization applies at submission as well as input changes, like creation/duplication. Browser verification was explicitly declined.
