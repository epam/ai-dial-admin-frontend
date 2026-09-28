# files-core-api Specification (delta)

## ADDED Requirements

### Requirement: File listing rows are produced by the shared asset row mapper
The files list action SHALL map Core's file metadata response through the shared asset row mapper,
deriving each row's root-level `folderId` from the raw DTO's `parentPath`/`bucket` (the file DTO
carries no `folderId` of its own) and paginating through the shared continuation-token helper, so
file rows arrive in the same movable row shape with the same field provenance as every other
asset type.

#### Scenario: File rows carry the movable row shape
- **WHEN** the files list action returns rows
- **THEN** each row carries `name`, `path`, `nodeType`, `bucket`, and a root-level `folderId`
  derived from the raw DTO, and participates in move flows like any other movable row

#### Scenario: File listing paginates through the shared helper
- **WHEN** Core's file listing response includes a continuation token
- **THEN** the listing continues through the same paginated-list helper every other asset list
  uses, and no per-type pagination loop exists for files
