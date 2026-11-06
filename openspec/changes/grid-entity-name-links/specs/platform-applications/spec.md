## MODIFIED Requirements

### Requirement: Platform application detail view
The system SHALL provide a detail view for a platform-bucket application under
`src/components/Assets/Platform/Applications/`, distinct from the public Apps detail view, reusing the
public Apps `TabsContent`/tab components for full field/tab parity but showing no versioning/publish
UI and no folder-move control. Both buckets share the existing `/assets-applications/[id]` detail
route — a `?path=` query param present means public bucket; its absence means platform bucket.

#### Scenario: Opening a platform application shows the platform detail view
- **WHEN** the user clicks a platform-bucket application's name link
- **THEN** the system navigates to `/assets-applications/[id]` with no `?path=` query param, and
  renders the platform Apps view, not the public Apps view

#### Scenario: Platform application detail has no version tab
- **WHEN** the user views a platform-bucket application's detail
- **THEN** no version-history or publish tab is present

#### Scenario: Platform application detail has no folder-move control
- **WHEN** the user views a platform-bucket application's Properties tab
- **THEN** no folder-move control is shown, since the platform bucket has no folders to move into

