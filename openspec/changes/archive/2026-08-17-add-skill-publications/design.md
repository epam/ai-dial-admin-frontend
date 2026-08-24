## Context

DIAL Core added `SKILL` as a new publishable resource type: a folder-of-files resource (root
manifest `SKILL.md` with YAML frontmatter `name`/`description`/`version`), served through a new
`/v2/skills/...` API (multipart upload, ZIP download, per-file mutation) rather than the `/v1/<type>/...`
single-JSON-document CRUD that Application/Toolset/Prompt/Conversation use. Core already accepts
`SKILL` into `PublicationService.ALLOWED_RESOURCES` and publishes/approves/rejects/deletes it through
the same generic `/v1/ops/publication/*` endpoints as every other type — no new publication endpoint
exists or is needed.

On the FE, every publication type flows through one generic pipeline
(`src/server/publications/resolver/{registry,resolve,types}.ts`) keyed by a
`Record<PublishableResourceType, PublicationTypeConfig>`. That pipeline currently has exactly two
enrichment shapes:
- **Versioned types** (Application, Conversation, Prompt, Toolset): `enrichAssetResource` fetches
  the whole asset body via `GET /v1/{type}/{path}` merged with its metadata, and the publication's
  Properties tab reuses that type's live asset-editor form, pre-filled with the fetched body.
- **File**: `enrichFileResource` fetches metadata only (`getFileMetadata`) — no content — because a
  file's "properties" are its metadata, not an editable document.

Skill has no single-document body to fetch or edit at all (its GET returns a ZIP; its "properties"
live in a folder marker), so it cannot use the versioned-type path. It also isn't literally a `FILE`
resource. It needs a third enrichment shape that is structurally identical to File's (metadata-only,
read-only) but keyed off its own resource type and its own Core metadata endpoint.

## Goals / Non-Goals

**Goals:**
- Slot `SKILL` into the existing generic publication registry/resolver/mapper machinery so list,
  approve, reject, delete, and update work for Skill publications with no new backend endpoint.
- Add a metadata-only enrichment path for Skill (name/description/version/etag + child file list),
  mirroring the File resource's existing metadata-only treatment rather than the versioned-type
  content-fetch treatment.
- Give reviewers a read-only Properties tab for a pending Skill publication: the standard
  name/folder/comment fields every publication type already shows, plus the skill's metadata and a
  listing of the files inside the bundle.
- Add the Approvals menu entry, route, and list page, following the existing five publication types'
  pattern exactly.

**Non-Goals:**
- No `/v2/skills/...` multipart-upload or ZIP-download client on the FE. This change never fetches
  or renders a skill's actual file *contents* (e.g. `SKILL.md` text) — only its folder metadata and
  the names/sizes of its files.
- No editing of a skill's properties or files from the publication view. `onChange` wiring that the
  four versioned types support (because their body is a re-PUTtable JSON document) has no Skill
  equivalent — the update server action's file-staging behavior remains scoped to `files`-key
  attachments and is untouched by this change.
- No Skill-specific auth/header treatment. Toolset's `InfoHeader` shows an auth block because
  toolsets carry auth config; nothing in Skill's `FolderResourceMarker.metadata` suggests an
  equivalent, so `InfoHeader`/`View.tsx`'s toolset-only branch is left alone.

## Decisions

### 1. Skill enrichment forks from File's pattern, not the versioned-type pattern

`resolve.ts` already special-cases `ResourceType.FILE` inside `resolvePublication`'s per-resource
loop:

```ts
const wrapper =
  config.resourceType === ResourceType.FILE
    ? await enrichFileResource(resource, status, token, clients, issues)
    : await enrichAssetResource(resource, status, config, token, clients, issues);
```

This gets a third arm for `ResourceType.SKILL`, calling a new `enrichSkillResource` (new file
`src/server/publications/resolver/skill-resource.ts`, sibling to `file-resource.ts`). Where
`enrichFileResource` calls `clients.getFileMetadata`, `enrichSkillResource` calls a new
`EnrichmentClients` method, `getSkillMetadata`, backed by `GET /v2/metadata/skills/{bucket}/{path}/`
(Core's folder-metadata endpoint — read-only, no ZIP, no multipart). The response's
`FolderResourceMarker.metadata` (`name`, `description`, `version`) plus `fileMetadata` (the map of
relative path → `{size, etag}`) becomes the enriched `PublicationSkill.skillResource` and its file
listing.

**Alternative considered**: route Skill through `enrichAssetResource` by pointing `getAsset` at the
metadata endpoint instead of the content endpoint. Rejected — `enrichAssetResource`'s
already-exists/not-found checks and its `[config.assetKey]: res.response` shape assume the response
*is* the asset body (what the Properties form edits). Reusing it for metadata would either silently
hand a metadata object to a spot that types expect an editable asset, or require a parallel
"read-only versioned type" flag that only Skill would ever set — more machinery than a dedicated
third function.

### 2. New `PublicationTypeConfig.hasFiles`-like flag is not needed — Skill's own file list lives on its resource wrapper, not on `Publication.files`

Toolset/Application's `hasFiles: true` means the publication carries *separate attached* file
resources alongside the primary resource (the `files` field on `Publication`, resolved from
`FILES_PREFIX`-URLs sitting in the same Core publication payload). Skill's files are not separate
publication resources — they're children *inside* the one skill folder resource, discovered via a
single metadata call. So `PublicationSkill.skillResource.files` (a plain array carried on the
enriched skill object) holds them, and the registry entry sets `hasFiles: false`. This keeps the
`resolve.ts` file-resource loop (which filters by `FILES_PREFIX`) untouched for Skill.

### 3. `CoreResourceType.SKILL` slots into `RESOLUTION_ORDER` last

`RESOLUTION_ORDER` (`mappers.ts`) decides which type wins when a Core publication's `resourceTypes`
array names more than one type — an edge case, not the common path (a publication normally carries
resources of one type). Existing order: `APPLICATION → CONVERSATION → PROMPT → TOOL_SET → FILE`.
Skill is appended last (`... → FILE → SKILL`), consistent with it being the newest, least-integrated
type and with the requested menu ordering — there's no functional reason to rank it higher, and nothing
in Core's publication payload suggests skills would ever legitimately co-occur with another primary
type in one publication.

### 4. Component reuse: clone `FileProperties`/`FilesDetails`/`FilesList`, not `ToolsetProperties`/`ToolsetDetails`

Confirmed during exploration: this repo has no existing Skills asset-editor component to wrap (unlike
Toolset, which wraps the live `ToolsetAssetProperties` asset form). `SkillProperties.tsx` follows
`FileProperties.tsx`'s shape — `BaseProperties` (name/folder/comment) + a details block — but the
details block (`SkillDetails.tsx`) is simpler than `FilesDetails.tsx`: no add/remove affordances (no
`addedFiles`/`setAddedFiles` props, since this is read-only), just the skill's metadata fields
followed by a read-only file-list grid. The file-list grid itself reuses `FilesList`'s column/action
plumbing (`getGridFileColumns`, `FILES_COLUMNS`) but with add/remove actions omitted (no `onChange`,
no `onRemoveAdded` passed) since files inside a skill bundle can't be individually
added/removed/downloaded through this view — mirroring how `isRemoveActionHidden`/`onChange`-absent
already renders `FilesList` read-only in this codebase (`!onChange` hides the remove action).

## Risks / Trade-offs

- **[Risk]** `PUBLICATION_TYPE_REGISTRY`, `PublicationResourceKey`/`PublicationAssetKey` unions,
  `CORE_RESOURCE_TYPE_TO_RESOURCE_TYPE` (and its inverse), and `update.ts`'s primary-type detection
  are all `Record`/exhaustive-union shapes that must each grow a `SKILL`/`skillResources`/
  `skillResource` arm — missing one fails to compile (TypeScript enforces exhaustiveness on the
  `Record<PublishableResourceType, …>` types) or silently breaks resolution/update for Skill (for the
  manual `if (Array.isArray(publication.xResources))` chain in `update.ts`, which is not statically
  exhaustive). → Mitigation: tasks.md sequences these as one early, dedicated task with the exact
  file list from the design/proposal Impact sections, verified by `tsc` catching the `Record` misses;
  the `update.ts` chain gets an explicit added branch plus a unit test.
- **[Risk]** Core's exact `/v2/metadata/skills/{bucket}/{path}/` response shape (whether
  `fileMetadata` is flat or nested, exact field names) wasn't verified against a running Core
  instance during this design — it's inferred from `FolderResourceMarker.java` and the OpenAPI spec.
  → Mitigation: the API client method is isolated in one new file (`skill-resource.ts`) with its own
  unit test using a fixture response; if the real shape differs, only that file and its test need
  correction, nothing else in the resolver pipeline.
- **[Trade-off]** A pending Skill publication with zero reviewable content beyond metadata + a file
  list is a materially thinner review experience than Toolset/Application's full editable form. This
  is accepted per the proposal's Non-goals — building a `/v2/skills` editor is a separate, larger
  feature.

## Open Questions

- Confirm Core's actual JSON field names on `GET /v2/metadata/skills/{bucket}/{path}/` before
  implementing `getSkillMetadata` (name/description/version placement, file-list shape) — flagged as
  a task to verify against a running `ai-dial-core` instance rather than blocking the rest of the
  change, since the enrichment call is isolated (see risk above).
