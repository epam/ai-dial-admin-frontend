## MODIFIED Requirements

### Requirement: Folder list keeps its loading, empty and fetch behavior
`FolderList` SHALL show a loader while the context is fetching, a "no folders" message when
nothing is loaded, and SHALL auto-fetch roots or the `initialPath` hierarchy as before. The
empty-state auto-fetch SHALL be issued once per mount for a given set of root paths, not once per
context update. A fetch that throws SHALL be treated as a failed fetch, so the context reports a fetch
error and the load-error notification is shown instead of an indefinitely empty state. When the
selected folder is rendered after an `initialPath` fetch, it SHALL be scrolled into view.

#### Scenario: Loader while fetching
- **WHEN** the context is fetching
- **THEN** a loader is shown and no tree is rendered

#### Scenario: Empty state
- **WHEN** fetching is done and there are no folders
- **THEN** the `NoFolders` message is shown

#### Scenario: Auto-fetch when empty
- **WHEN** the context has no files, `disableAutoFetch` is not set and there is no `initialPath`
- **THEN** the root path(s) are fetched

#### Scenario: Auto-fetch is not repeated on context updates
- **WHEN** the context value changes while its files are still empty (for example the fetching flag
  flips, or a fetch fails)
- **THEN** no additional root fetch is issued for the same root paths

#### Scenario: Thrown fetch is reported as a failure
- **WHEN** the root fetch rejects instead of resolving
- **THEN** the context reports a fetch error, the load-error notification is shown, and no fetch is
  left pending

#### Scenario: Stale failure does not override a newer load
- **WHEN** an earlier fetch rejects after a later fetch has loaded successfully
- **THEN** the context keeps the loaded folders and reports no fetch error

#### Scenario: Selected folder scrolled into view
- **WHEN** `initialPath` is given and the hierarchy loads
- **THEN** the row with `aria-selected="true"` is scrolled into view
