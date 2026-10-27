## Context

`SkillsCoreApi.getSkillMetadata` needs a skill's `author`/`createdAt`/`updatedAt`/`etag`. It currently
gets them from `findSkillListingEntry`, which reads the first page of the skill's parent folder listing
and `.find`s the skill's row. The listing is the grid's data source, so a skill the grid shows can still
fail to open with "Skill resource not found" (issue #5089).

Verified against `ai-dial-core`:

- `ComplexResourceService.listChildren` always lists at the **blob** level and applies `limit` (default
  100, max 1000) to raw blobs — every file, version file and marker of every skill — then discards
  non-marker entries. A page can hold few or zero nodes and still carry a `nextToken`; in `public/` the
  first page held only folder markers.
- Since `ai-dial-core#1888` (commit `1dddf4c4`, 2026-09-02, first in 0.48.0-rc.0),
  `ComplexResourceService.getMetadata` checks the target path's marker first: an active skill returns
  `itemMetadata` — a single `ITEM` with `etag`, `author`, `createdAt`, `updatedAt` and `attributes` —
  and only otherwise falls through to `listChildren`. Core's `SkillResourceApiTest.testMetadataOfSkillItselfIsItem`
  covers it. Before that fix the route always listed children, which is the premise behind the comment
  and the listing scan being replaced here.

## Goals / Non-Goals

**Goals:** open any skill regardless of its parent folder's size; keep a skill read at two Core requests.

**Non-Goals:** supporting Core < 0.48.0; changing folder listings (`getSkills`/`fetchAllPages` already
follow `nextToken`); parsing `SKILL.md` frontmatter.

## Decisions

### D1. Read the skill's own metadata path instead of paginating its parent listing

`getSkillMetadata` calls `GET /v2/metadata/skills/{bucket}/{path}` (via the existing metadata URL
construction, no `recursive`/`token`/`limit`) in parallel with `getSkillFiles`, and maps the returned
`ITEM`.

Alternatives considered:

- **Follow `nextToken` until the row is found** (early exit). Correct on any Core, but costs N requests
  for a skill deep in a large folder and reads every page for a missing one; each page is a blob scan of
  every skill's files. Rejected: it works around the problem rather than removing it.
- **Drain all pages with `fetchAllPages`, then `.find`.** Simplest, but always pays the worst case.
- **Raise `limit`.** Core caps it at 1000 and the cost still scales with folder size.

### D2. Not found means "not an ITEM", not just 404

A path Core can't resolve to a skill falls through to `listChildren`, which answers with a `FOLDER`
listing (or 404 when nothing exists there). `findSkillListingEntry` returned `undefined` for both; the new
code treats a `null` response or a node that isn't an `ITEM` as not found, so a stray folder path can
never be presented as a skill with undefined metadata.

### D3. No support for older Core

On Core < 0.48.0 the skill's own path returns an empty `FOLDER`, so every skill would be reported not
found. This is accepted by the maintainers and not mitigated with a listing fallback, which would keep
the paging bug's code path alive.

## Risks / Trade-offs

- **Core upgrade is a prerequisite.** Mitigation: call it out in the proposal and release notes
  (`Deployment Changes`); the failure on old Core is loud (every skill "not found"), not silent.
- **Folder paths with a trailing slash** resolve as grouping folders and return a listing. Mitigation: the
  `ITEM` check in D2.
- **Existing specs mock the listing-based lookup** (`skills-core-api.spec.ts`, `skills/actions.spec.ts`).
  They are updated with the change.
