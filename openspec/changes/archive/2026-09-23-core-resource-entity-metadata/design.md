# Design — `_metadata` on Core resource detail entities

## Context

Detail reads of Core resources merge two responses: the content GET (`GET /v1/{type}/{path}`) and
the metadata GET (`GET /v1/metadata/{type}/{path}`), combined by the twelve `ASSET_MERGERS` in
`src/server/core/asset-metadata.ts` and, for skills, by `src/server/core/skill-metadata.ts` /
`skills-core-api.ts`. The mergers' shared formatters (`metadataFields`,
`folderMetadataFields`, `flatMetadataFields`, `dualBucketMetadataFields`) graft
`author`/`createdAt`/`updatedAt` (timestamps stringified) and identity (`name`/`path`/
`folderId`/`version`/`nodeType`) flat onto the entity, after the content spread — so a graft
silently overwrites a same-named content field. Read-only projections (`status`/
`validationWarnings`) arrive on the content response for `ConfigResourceController`-served types
and stay flat. Each write path re-enumerates the grafts to strip in its own `to*Payload`
destructure.

Verified against DIAL Core's DTOs (local clone `Documents/ai-dial-core`), the serve-path truth
table the merge layer must respect:

| Type (bucket) | Content GET | author/timestamps inline in content? |
| --- | --- | --- |
| Application (public) | `ResourceController` → `ApplicationService.getApplication` | yes — snake_case `created_at`/`updated_at` via `Application`'s `@JsonNaming(SnakeCaseStrategy)`, grafted from blob meta at serve time, `Long` |
| Toolset (public) | `ResourceController` → `ToolSetService.getToolSet` | yes — `author`, `created_at`, `updated_at` (snake via `ToolSet`'s `@JsonNaming(SnakeCaseStrategy)`) |
| Prompt / Conversation | `ResourceController` → raw blob | no — `Prompt`/`Conversation` DTOs declare no such fields |
| Model, Interceptor, Translator, Role, Key, Route, schemas, app runners (platform) | `ConfigResourceController.handleSingleGetFromBlob` | no — raw blob; `status`/`validationWarnings` projected on invalid reads |
| Application / Toolset (platform) | `ConfigResourceController` → raw blob + projector | no |

`Deployment` (base of Model/Application/Interceptor/ToolSet) declares `author`/`createdAt`/
`updatedAt` as content fields — the editable maintainer writes the content `author` (the
interceptor PUT deliberately does not strip it today).

## Goals / Non-Goals

**Goals:**

- One predictable place (`_metadata`) for every merge-grafted, non-content field on a detail
  entity, regardless of the type's serve-path.
- Resource content byte-identical before and after: nothing the content response carries is
  renamed, moved, or overwritten by the merge.
- Write payloads built by one wholesale `_metadata` strip instead of seven per-field
  destructures, with per-type write quirks preserved.
- Merged read shape == write-response shape == exim export shape.

**Non-Goals:** (see proposal Non-goals) list rows, etag, deployments/eval/config-file/files/
publications, any Core backend change, and the Activity Audit time filter.

## Decisions

### D1 — `_metadata` is built in the merge layer, not by a post-merge transformer

The shared formatters change their return from a flat graft object to a `_metadata` object; each
of the twelve mergers and the skill read attach it. Alternative considered: a generic
`withMetadata(entity, grafts)` wrapper applied after the mergers — rejected because the
formatters already encode the per-type path-parsing differences (versioned / folder-nested
versionless / flat / dual-bucket), and the graft set differs per type; a wrapper would re-derive
what the formatters know.

`_metadata` shape (all optional except where noted):

```ts
interface CoreResourceEntityMetadata {
  author?: string;
  createdAt?: string;   // epoch-ms from metadata node, stringified — existing formatter behavior
  updatedAt?: string;
  name: string;         // identity — always present (formatters always derive it)
  path: string;
  folderId: string;
  version?: string;     // versioned types only
  nodeType?: string;    // prompt merge sets ITEM today
  status?: string;               // only where the content response serves it (flat types)
  validationWarnings?: unknown[]; // ditto
}
```

`status`/`validationWarnings` stay sourced from the content response but relocate into
`_metadata` — they are Core-computed projections, not stored content, and the write strip removes
them with the rest of `_metadata`. Where the type's content response never serves them, the keys
are absent.

### D2 — Sourcing precedence: metadata response first, content inline fields as fallback

`author`/`createdAt`/`updatedAt` read `metadata.<field> ?? content.<inline field>` — the inline
field being snake_case `created_at`/`updated_at` for public applications and toolsets alike (both
DTOs serialize through `@JsonNaming(SnakeCaseStrategy)`, D-verified serve paths; the
`graftedTimestamp` helper accepts the camelCase spelling too, so a hand-served body still backs up
the gap). Alternative considered: content-first — rejected because the metadata node is the
authoritative blob metadata and today's mergers already let it win; content-first would flip
public application/toolset values (they are equal in practice, since Core grafts them from the
same blob metadata, but the fallback only fires when the metadata node omits a value).

### D3 — Grafts no longer overwrite content; content fields stay flat and untouched

Spread order becomes `{ ...content, _metadata: <grafts> }`. This is the rule-3 consequence with
two visible effects worth stating:

- For public applications/toolsets, the entity carries the served inline
  `created_at`/`updated_at` *and* `_metadata.createdAt`/
  `_metadata.updatedAt` — same value, two shapes. Consumers read `_metadata` only (D5).
- The editable maintainer (`author` on interceptor/model/application/toolset content) survives a
  reload as a flat field; previously the merger's graft overwrote it with the metadata author.
  `_metadata.author` carries the metadata-sourced value for display.

**Amendment — dual-bucket application/toolset `name` is a documented exception.** For a
platform-bucket application/toolset, `mergeApplicationResource`/`mergeToolsetResource` set the flat
top-level `name` (in addition to `_metadata.name`) from `dualBucketMetadataFields`'s URL-parsed
identity, overwriting whatever `content.name` holds. This is narrower than it sounds: it is scoped
to these two mergers' dual-bucket path only, not a general reopening of rule-3. The rationale
mirrors the existing `folderId` dual-bucket carve-out (`platform-applications`/`platform-toolsets`
specs) — a platform-bucket resource's served `content.name` can go stale relative to its Core
resource path, so the URL-parsed name is authoritative. See the "Platform application/toolset name
reflects the corrected dual-bucket identity" requirements in those specs.

### D4 — One shared strip helper; payload builders keep only genuine quirks

`stripMetadata<T extends { _metadata?: unknown }>(entity: T): Omit<T, '_metadata'>` (placed in
`src/server/assets/` next to `stripAssetIdentityFields`, which composes with it for exim import).
The `to*Payload` builders in `platform-{keys,roles,routes,app-runners,interceptors}` and
`assets-{applications,toolsets}` actions drop their `author`/`createdAt`/`updatedAt`/
`status`/`validationWarnings`/`path`/`folderId` destructuring in favor of the shared strip, and
keep: keys' `name`/`description` junk-field strip and `key` null-normalization; toolsets'
`reference` strip and `displayVersion` graft; prompt `id` recompute (`withContentId` in
`asset-api.ts`, already centralized). Note `name` stays flat where it is content
(`RoleBasedEntity`-based types) and is written — matching today's interceptor behavior, which
already round-trips it without complaint.

Alternative considered: centralizing the strip inside `asset-api.put` so no builder can forget it
— rejected because prompt `id` recompute and the per-type quirks live around the strip, and
`put`'s callers (exim import, move-adjacent flows) pass pre-stripped bodies by different routes;
the builders remain the single visible place where a payload's shape is decided. (The
`ConfigResourceController`'s strict `FAIL_ON_UNKNOWN_PROPERTIES` makes a forgotten strip a hard
400, so a missed builder fails loudly, not silently — the same safety property the current
per-field destructures rely on.)

### D5 — Consumer migration is mechanical: `entity.<graft>` → `entity._metadata.<graft>`

No adapter layer, no selector hook. The consumers are enumerable and already inventoried: info
headers (`EntityHeaderControls/Info/InfoHeader.tsx`, `Assets/Resources/ResourceInfoHeader.tsx` —
its `updated_at ?? updatedAt` fallback is deleted, `Publications/View/InfoHeader.tsx` is
publications and untouched), `Maintainer` display, `SourceField/Application/utils.ts` runner
options, Skills view, and every detail-view identity read (`.path`/`.folderId`/`.name`/
`.version`) across Views, Move/delete/duplicate flows, `getEntityPath`, and the dual-bucket
`isPlatformBucketPath(asset.folderId)` checks (which become `isPlatformBucketPath(asset._metadata.folderId)`).
Grid columns are unaffected — they read `ResourceInfo` rows, which stay flat.

Alternative considered: keeping flat fields as deprecated aliases populated from `_metadata` —
rejected; it defeats the issue's goal (one source of truth) and doubles the migration surface.

### D6 — Model types: one `_metadata` type, flat graft fields removed from merged shapes

`CoreResourceEntityMetadata` lives in `src/models/dial/resource.ts` (domain type, per
code-standards). The `Dial*Resource` interfaces drop the flat graft fields the mergers no longer
set; fields that are genuinely served content keep their served shape — notably
`DialToolsetResource` loses `updatedAt: string` (a merger artifact) and gains the served
`updated_at?: number`. `DialSkillResource.author/createdAt/updatedAt` move into its `_metadata`.
The spec-project typecheck (`npm run typecheck:specs`, blocking at zero) is the guard that every
fixture follows — this is the change's largest test surface and the reason tasks are sequenced
type-first.

### D7 — Write responses and exim follow the same shape

`asset-api.put`'s `parsePathFields` enrichment grafts into `_metadata` on the response. exim
export documents carry `_metadata` verbatim (useful provenance for consumers of the export);
import strips it via `stripMetadata` composed into the existing `transformForPut`/
`stripAssetIdentityFields` chain.

### D8 — Sequencing: server layer first, then actions, then consumers, typecheck-driven

The mergers change first (with `asset-metadata.spec.ts` rewritten per type), because every later
step compiles against the new shape. `typecheck` + `typecheck:specs` run after each task — the
compiler enumerates the consumer migrations D5 describes, so no consumer is found by grep alone.

## Risks / Trade-offs

- [A missed consumer read (`entity.path` etc.) compiles only if the type lost the field — types
  that keep a same-named content field (`name`, `author` on `Deployment`-based types) would
  silently read the content value instead of the graft] → Mitigation: task-level inventory of
  consumers in D5 drives the migration list; the per-`ResourceType` spec suite asserts the merged
  shape field-by-field; the browser verification task (if added) covers a representative
  detail view per serve-path class.
- [Public application/toolset entities now carry duplicate timestamp fields (content inline +
  `_metadata`), which appear in the JSON editor diff surface] → Mitigation: the JSON editor
  renders the entity as served; the duplicates are real content, and `_metadata` is stripped
  before write, so a save round-trip is stable. If the editor diff proves noisy, hiding
  `_metadata` in the editor is a follow-up, not this change.
- [A write path outside the `to*Payload` builders passes an entity with `_metadata` to
  `ConfigResourceController`'s strict deserializer and 400s] → Mitigation: the strict 400 is loud,
  not silent; exim import and move/duplicate flows are in the task inventory; a unit test per
  builder asserts the outgoing body carries no `_metadata`.
- [Large diff concentrated in `asset-metadata.spec.ts` and consumer specs] → Mitigation: tasks
  are split per layer (mergers / actions / consumers / exim) so each PR-sized task reviews alone;
  fixtures follow production types, guarded by `typecheck:specs`.
- [Rollback] → No backend or persisted-state change: reverting the commits restores the flat
  merge. Nothing migrated, nothing to unwind.

## Migration Plan

Single-PR-set deployment, no feature flag: the shape is frontend-internal (server actions to
client components), never persisted, and never crosses a service boundary. Rollback is `git
revert`. `to-be-documented` label on issue #4474: update `docs/` in the same change if a doc
describes the merged entity shape.

## Open Questions

None blocking — scope, contents, sourcing precedence, and the write strip were all decided during
exploration (recorded in the proposal and specs). One deferred item: whether the JSON editor
should hide `_metadata` from the save/discard diff (see Risks) — decided as follow-up-only after
observation.
