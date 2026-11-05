## RENAMED Requirements

- FROM: `### Requirement: A caller's own identity read prefers the admin backend when configured`
- TO: `### Requirement: A caller's own identity read comes from DIAL Core`

## MODIFIED Requirements

### Requirement: A caller's own identity read comes from DIAL Core
The system SHALL read the caller's own identity only from DIAL Core's `GET /v1/user/info` through
`CoreUtilityApi.getUserInfo`, whatever `DIAL_ADMIN_API_URL` is. The returned `UserInfo` SHALL carry `id`
(`userId`, else `project`) and `email` (the `email` claim) and SHALL NOT carry roles. The admin backend's
identity endpoint and the `getUserInfo` picker in `src/app/api/api.ts` SHALL NOT exist.

#### Scenario: Admin backend configured still reads identity from Core
- **WHEN** `DIAL_ADMIN_API_URL` is set and a caller requests the current user's identity
- **THEN** the request goes to DIAL Core's `GET /v1/user/info`, never to the admin backend

#### Scenario: Identity is derived from Core's response
- **WHEN** Core answers `/v1/user/info`
- **THEN** `id` comes from `userId` or `project` and `email` from the `email` claim
- **AND** the result has no `roles` field
