## MODIFIED Requirements

### Requirement: A URI-shaped `$id` is a valid, fully usable row name

Because the row name is the runner's `$id`, it contains characters the shared asset list treats as illegal in a filename — notably `:` and `/`. The system SHALL present such a row as ordinary and fully usable for this view: rendered in the normal text style with no invalid-name indication, opening on click, and offering its row actions. Views whose names are filenames SHALL keep the stricter default. The row's own encoded path, not its displayed name, is what addresses the resource, so the name's shape has no bearing on correctness.

#### Scenario: A URI-shaped name is not flagged as invalid

- **WHEN** the list renders a runner whose `$id` is a URI such as `http://example.com/schema`
- **THEN** the name is shown in the normal style with no forbidden-character indication or rename prompt

#### Scenario: A URI-shaped name opens on click

- **WHEN** a user clicks the name link of a row whose name contains `:` and `/`
- **THEN** the detail view opens, navigating by the row's encoded path

#### Scenario: Row and bulk actions stay enabled

- **WHEN** a user opens the row context menu or selects runners for bulk delete
- **THEN** the delete action is enabled rather than disabled on account of the name's characters

#### Scenario: Filename-shaped views keep the stricter rule

- **WHEN** any other asset view renders a name containing `/` or `%`
- **THEN** that view's existing invalid-name treatment is unchanged

