# core-asset-client Specification (delta)

## ADDED Requirements

### Requirement: Listing rows carry an explicit bucket and one mapper serves every asset list
The shared Core asset client's list mapping SHALL project the metadata node's `bucket` field onto
every listing row, and the skills and files list mappings SHALL be produced by that same shared
row mapper rather than per-type hand-rolled copies — the per-type differences (skills' `/v2`
path parsing, the folder trailing-slash convention, files' `parentPath`-derived `folderId`) live
in the shared mapper as explicit per-type inputs, and the continuation-token pagination loop SHALL
have exactly one implementation used by all three entry points.

#### Scenario: Rows served by the shared list carry bucket
- **WHEN** any asset type's metadata listing is mapped into rows
- **THEN** every row carries `bucket` sourced from the metadata node's own `bucket` field, for both
  the `public` and `platform` buckets

#### Scenario: Skills rows come from the shared mapper
- **WHEN** the skills list action returns rows
- **THEN** they are produced by the same shared row mapper as every other asset type, with the
  skills-specific path parsing applied inside it, and the previous hand-rolled skills mapper no
  longer exists

#### Scenario: One pagination implementation
- **WHEN** any asset, file, or skill listing follows Core's continuation token
- **THEN** it runs through a single paginated-list helper, and the token-vs-nextToken quirk is
  documented exactly once at that helper
