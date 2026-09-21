## ADDED Requirements

### Requirement: Duplicating a runner navigates to the new runner, not a 404

Because `$id` is always a URI (it always contains characters `encodeURIComponent` must escape), the post-duplicate redirect for `Catalog > App Runners` SHALL apply exactly the same single URL-encoding to the new `$id` that row-click navigation applies to an existing runner's decoded name, so both entry points resolve to the same URL segment.

#### Scenario: Duplicating a runner with a URI-shaped id lands on the new runner

- **WHEN** a user duplicates a runner whose `$id` requires URL-encoding (e.g. contains `:` or `/`) and submits the Duplicate modal
- **THEN** the runner is created
- **AND** the browser navigates to the new runner's detail page, not a 404

#### Scenario: The post-duplicate redirect URL matches the row-click URL

- **WHEN** the redirect URL for a freshly duplicated runner is computed from its `$id`
- **THEN** it is identical to the URL that clicking that same runner's row in the list would produce, once both exist as list rows
