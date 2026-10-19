## Why

A skill fails to open ("Skill resource not found") whenever it is not on the first page of its parent
folder's Core listing, even though the folder's grid lists it. `getSkillMetadata` finds the skill's
`author`/dates/`etag` by scanning only the first page of the parent listing, and Core pages over raw
blobs (every file, version and marker inside every skill), so in a folder with many skills or grouping
folders the first page can contain no skill row at all (issue #5089).

Since Core 0.48.0 (`ai-dial-core#1888`), `GET /v2/metadata/skills/{bucket}/{path}` on a skill's own path
returns that skill as a single `ITEM` carrying the same fields, so the listing scan is no longer needed.

## What Changes

- `SkillsCoreApi.getSkillMetadata` reads the skill's own metadata path (one request, no pagination) and
  takes `etag`, `author`, `createdAt` and `updatedAt` from that `ITEM`; a 404, or a node that is not an
  `ITEM`, is reported as not found.
- Remove `findSkillListingEntry` and its "first page only" rationale.
- Remove the debug `console.log`s in `skills-core-api.ts` and `skills/actions.ts`.
- **BREAKING (deployment):** requires Core ≥ 0.48.0. Against an older Core the skill's own path returns an
  empty `FOLDER`, so every skill would read as not found. Older Core is explicitly not supported.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `skill-resources-core-api`: the requirement that a skill's author/dates/etag come from a single
  first-page read of its parent folder's listing is replaced by a direct read of the skill's own metadata
  path; the "missing from the first page is not found" scenario is replaced by scenarios for a skill in a
  large folder and for a genuinely absent skill.

## Non-goals

- Supporting Core versions before 0.48.0, or falling back to the paged listing.
- Parsing `name`/`description`/`version` (still read from `SKILL.md`).
- Changing the folder listing (`getSkills`, `fetchAllPages`), which already follows `nextToken`.

## Impact

- Code: `apps/ai-dial-admin/src/server/core/skills-core-api.ts` (and its spec), `skills/actions.ts` (debug
  log only).
- Behaviour: a skill read still costs two Core requests (own metadata + files listing), now independent of
  the parent folder's size.
- Docs/specs: `openspec/specs/skill-resources-core-api/spec.md`; any doc stating the minimum Core version.
