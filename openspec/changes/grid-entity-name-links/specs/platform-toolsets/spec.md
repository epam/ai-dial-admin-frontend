## MODIFIED Requirements

### Requirement: Platform toolset detail view
The system SHALL provide a detail view for a platform-bucket toolset under
`src/components/Assets/Platform/Toolsets/`, distinct from the public Toolsets detail view, reusing
the public Toolsets `TabsContent` (Properties, Tools, Audit) and its authentication controls
(sign-in/sign-out) for full field/tab/auth parity, but showing no versioning/publish UI and no
folder-move control. Both buckets share the existing `/assets-toolsets/[id]` detail route — a `?path=`
query param present means public bucket; its absence means platform bucket.

#### Scenario: Opening a platform toolset shows the platform detail view
- **WHEN** the user clicks a platform-bucket toolset's name link
- **THEN** the system navigates to `/assets-toolsets/[id]` with no `?path=` query param, and renders
  the platform Toolsets view, not the public Toolsets view

#### Scenario: Platform toolset detail has no version tab
- **WHEN** the user views a platform-bucket toolset's detail
- **THEN** no version-history or publish tab is present

#### Scenario: Platform toolset detail has no folder-move control
- **WHEN** the user views a platform-bucket toolset's Properties tab
- **THEN** no folder-move control is shown, since the platform bucket has no folders to move into

#### Scenario: Platform toolset sign-in and sign-out work the same as public
- **WHEN** the user signs in to or out of a platform-bucket toolset's external service
- **THEN** the sign-in/sign-out flow behaves identically to a public-bucket toolset, since Core scopes
  authentication credentials and secret encryption to the resource's own bucket

