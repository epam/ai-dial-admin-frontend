## ADDED Requirements

### Requirement: Text path versions remain independent from display-version content

The shared Core asset client SHALL preserve non-semver application/toolset suffixes through the existing consolidated last-`__` parsing/building and segment encoding. `_metadata.version` SHALL remain path-derived and content `display_version` SHALL remain content-derived. Scalar path versions SHALL not imply a version-family grouping, ordering, or selection API. Unversioned platform resources and the existing prompt/conversation parsing branches SHALL remain unchanged.

#### Scenario: A text version is parsed and encoded without semver interpretation
- **WHEN** an application/toolset request addresses a resource ending with `assistant__release candidate`
- **THEN** request segments are encoded and the merged identity reports Version `release candidate` without semantic comparison or validation

#### Scenario: Differing path and display versions survive merging
- **WHEN** content contains `display_version` of `Spring release` and metadata identifies `assistant__stable`
- **THEN** merged content retains `Spring release` and `_metadata.version` equals `stable`

#### Scenario: Names containing the delimiter retain the last-delimiter contract
- **WHEN** an existing application/toolset stored leaf is `assistant__internal__stable`
- **THEN** its parsed name is `assistant__internal` and its parsed Version is `stable`, without changing its stored path

#### Scenario: Platform and versionless resources retain their parsing
- **WHEN** a platform application/toolset or a prompt/conversation is read
- **THEN** the client's existing bucket/type-specific unversioned behavior remains unchanged
