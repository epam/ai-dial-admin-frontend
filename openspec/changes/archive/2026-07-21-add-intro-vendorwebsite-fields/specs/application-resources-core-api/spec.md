## ADDED Requirements

### Requirement: Application-resource `intro` carried through Core content/metadata mapping
The system SHALL include `intro` in the fields read from and written to DIAL Core when getting, creating, or updating an application resource, so it round-trips through the same content+metadata merge already used for other `AssetApp` fields.

#### Scenario: Get returns intro
- **WHEN** `getApp` fetches an application resource that has an `intro` value in Core
- **THEN** the returned `AssetApp` includes that `intro` value

#### Scenario: Create and update send intro
- **WHEN** `createApp` or `updateApp` is called with an `AssetApp` that has a non-empty `intro`
- **THEN** the request sent to Core includes that `intro` value
