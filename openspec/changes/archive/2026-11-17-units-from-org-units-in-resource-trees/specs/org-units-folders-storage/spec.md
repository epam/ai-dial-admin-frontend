## MODIFIED Requirements

### Requirement: Unit map is shared by every folder context
One org units context SHALL hold the unit map, its status and the ownership lookup, and SHALL load the units on first use by Folders Storage or any file manager. Asset folder contexts SHALL NOT fetch units themselves: they read the shared context, and a folder load that needs the units SHALL wait for the context's read in flight instead of starting its own. A file manager opened for a route that has an org-unit namespace SHALL ask the context to read the units again once, on open; navigating between folders inside it SHALL NOT. Once the units call has answered 404 or 403, the context SHALL make no further units request until the page is reloaded.

#### Scenario: One load for several consumers
- **WHEN** Folders Storage and a file manager are used in one session without opening another unit-aware listing
- **THEN** the units call is made once until a unit is created, renamed or removed

#### Scenario: Opening a unit-aware listing
- **WHEN** the user opens the toolsets listing, then the applications listing, then the toolsets listing again
- **THEN** each opening reads the units once, and expanding a folder inside a listing reads nothing

#### Scenario: Folder load during a read
- **WHEN** a folder load starts while the units read is in flight
- **THEN** it waits for that read and no second units call is made

#### Scenario: Units off stop the requests
- **GIVEN** the units call has answered 404
- **WHEN** another unit-aware listing opens
- **THEN** no units request is made
