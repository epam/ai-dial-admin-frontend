# skill-resources-core-api — `_metadata` sourcing delta

## MODIFIED Requirements

### Requirement: A single skill's author, created/updated dates, and etag are read from a single parent-folder listing
The system SHALL populate a single skill's `author`/`createdAt`/`updatedAt` — inside the skill
entity's `_metadata` object (see the `core-resource-entity-metadata` capability) — by finding that
skill's own row in a single (first-page, non-paginated) read of its parent folder's listing, and SHALL
NOT issue a separate `SKILL.md` manifest fetch for this purpose. Confirmed by reading Core's actual
implementation, not just its design documentation: no metadata endpoint returns these for a direct "read
this one skill" call — the children-listing mapper that backs `GET /v2/metadata/skills/{bucket}/{path}`
only ever sets `nodeType`/`createdAt`/`updatedAt`/`author`/`etag` on *children of a listed folder*, but
that same per-child `etag` is exactly the aggregate etag a `SKILL.md` content-read's `ETag` header would
carry, making a second, dedicated manifest fetch redundant. `etag` SHALL keep flowing as a separate
value, outside `_metadata`. `name`/`description`/`version` remain
unpopulated by this method — they live only in `SKILL.md`'s frontmatter, out of scope until in-browser
`SKILL.md` editing is built. A skill read costs exactly two Core requests: this listing read, plus the
files listing (see the file-listing requirement above).

#### Scenario: Author, dates, and etag all come from one parent-folder listing read
- **WHEN** a single skill is read
- **THEN** its `_metadata.author`, `_metadata.createdAt`, and `_metadata.updatedAt` are populated
  from that skill's row in a single read of its parent folder's listing, with no separate manifest
  fetch and no per-skill metadata call, and the etag is returned as a separate value outside
  `_metadata`

#### Scenario: A skill missing from its parent folder's first listing page is reported not found
- **WHEN** a skill's row cannot be found on the first page of its parent folder's listing
- **THEN** the read reports the skill as not found, rather than paginating further or returning a
  partial result with the missing fields left undefined
