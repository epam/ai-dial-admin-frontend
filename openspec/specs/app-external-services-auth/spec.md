## ADDED Requirements

### Requirement: External services list displayed in App Properties
The App Properties panel SHALL display a "External Services" section above the `EntityAttachments` component when the app is opened. The section renders each entry in `app.external_services` as a row showing the auth type icon, display name (falling back to the service ID), an Edit button, and Login/Logout buttons (when `authentication_type !== NONE`).

#### Scenario: App has no external services
- **WHEN** the app's `external_services` map is empty or absent
- **THEN** the section shows only an "Add Service" button and no rows

#### Scenario: App has external services
- **WHEN** the app's `external_services` map contains one or more entries
- **THEN** each entry is rendered as a row with the service's display name (or ID if no display name), the auth type icon, and action buttons

#### Scenario: Service with NONE auth type
- **WHEN** a service has `authentication_type === NONE`
- **THEN** no Login or Logout buttons are shown for that row

#### Scenario: Service shows as logged in
- **WHEN** a service's `auth_settings.app_level_auth_status === SIGNED_IN` OR `auth_settings.user_level_auth_status === SIGNED_IN`
- **THEN** the row shows a Logout button and no Login button

#### Scenario: Service shows as logged out
- **WHEN** a service's `app_level_auth_status` and `user_level_auth_status` are both not `SIGNED_IN`
- **THEN** the row shows a Login button (if `authentication_type !== NONE`)

---

### Requirement: Add external service
The App Properties panel SHALL provide an "Add Service" button that opens an inline edit form (within the same `ResourceMultiAuth` component) for creating a new external service entry.

#### Scenario: User clicks Add Service
- **WHEN** the user clicks the "Add Service" button
- **THEN** the component transitions to edit mode showing a blank form with fields: Service ID, Display Name, Description, and auth settings (via the generalized `ResourceAuthentication` component)
- **AND** a Back button is visible

#### Scenario: User fills in new service and saves
- **WHEN** the user fills in a Service ID, optional Display Name/Description, configures auth settings, and the parent app Save is triggered
- **THEN** the new service is included in `app.external_services` under the entered Service ID key
- **AND** the service is saved as part of the app PUT

#### Scenario: Service ID already exists on add
- **WHEN** the user enters a Service ID that matches an existing entry while adding (not editing)
- **THEN** a warning is shown indicating the ID is already in use

#### Scenario: User clicks Back without saving
- **WHEN** the user clicks the Back button in edit mode
- **THEN** the component returns to the list view and local edit-mode changes are discarded

---

### Requirement: Edit external service
The App Properties panel SHALL allow editing an existing external service's metadata and auth settings via the Edit button in the list row.

#### Scenario: User clicks Edit on a service
- **WHEN** the user clicks the Edit button on a service row
- **THEN** the component transitions to edit mode showing the service's current Service ID (read-only for existing services), Display Name, Description, and auth settings pre-filled

#### Scenario: User modifies auth settings and saves
- **WHEN** the user changes auth settings (type or field values) and the parent app Save is triggered
- **THEN** the updated `auth_settings` (with statuses stripped) is included in the app PUT body

#### Scenario: Service ID is read-only when editing
- **WHEN** the user is in edit mode for an existing service
- **THEN** the Service ID field is displayed but not editable

---

### Requirement: Delete external service
The App Properties edit mode SHALL provide a way to remove an external service from the app's `external_services` map.

#### Scenario: User deletes a service from edit mode
- **WHEN** the user is in edit mode for an existing service and confirms deletion
- **THEN** the service is removed from the local `external_services` map
- **AND** the component returns to list mode
- **AND** the deletion is persisted when the parent app Save is triggered

---

### Requirement: Login to external service
The App Properties panel SHALL allow the user to sign in to an external service at APPLICATION level, USER level, or both, using the same popup pattern as asset toolsets.

#### Scenario: User opens login popup
- **WHEN** the user clicks the Login button on a service row
- **THEN** a login popup opens allowing the user to select APPLICATION level, USER level, or both

#### Scenario: API key login
- **WHEN** the service uses `authentication_type === API_KEY` and the user confirms login
- **THEN** `POST /v1/ops/external-service/signin` is called with `url = applications/{appId}/external_services/{serviceId}`, the selected `credentials_level`, `authentication_type: API_KEY`, and the entered `api_key`

#### Scenario: OAuth login
- **WHEN** the service uses `authentication_type === OAUTH` and the user confirms login
- **THEN** the browser navigates to the OAuth provider's authorization endpoint
- **AND** the `redirect_uri` is set to `{origin}/external-service-signin`
- **AND** the app ID, service ID, and selected credential level are stored in localStorage for the callback

#### Scenario: OAuth callback completes
- **WHEN** the OAuth provider redirects to `/external-service-signin` with a `code` parameter
- **THEN** `signInExternalService` is called with the code
- **AND** on success the browser navigates back to the original app page

---

### Requirement: Logout from external service
The App Properties panel SHALL allow the user to sign out from an external service at a specific credential level.

#### Scenario: User clicks Logout for single-level login
- **WHEN** the user is signed in at exactly one level and clicks Logout
- **THEN** `POST /v1/ops/external-service/signout` is called for that level without a confirmation popup

#### Scenario: User clicks Logout for multi-level login
- **WHEN** the user is signed in at both APPLICATION and USER levels and clicks Logout
- **THEN** a confirmation popup appears allowing the user to choose which level(s) to sign out from

---

### Requirement: Generalized ResourceAuthentication component
`ResourceAuthentication` SHALL accept a generic `authSettings` object and `name` string instead of a full `DialToolsetResource`, enabling reuse for external services. An optional `onChangeForwardPerRequestKey` callback enables toolset-specific `forward_per_request_key` reset behavior. An optional `redirectUrl` prop sets the OAuth `redirect_uri` stored in `auth_settings`.

#### Scenario: Toolset caller uses generalized component
- **WHEN** the asset toolset view renders `ResourceAuthentication`
- **THEN** it passes `name={toolset.name}`, `authSettings={toolset.auth_settings}`, `redirectUrl={TOOLSET_AUTH_REDIRECT_URL}`, `onChange`, and `onChangeForwardPerRequestKey`
- **AND** behavior is identical to the pre-refactor version

#### Scenario: Auth type changed to API_KEY with forward_per_request_key callback
- **WHEN** the user selects API_KEY auth type and `onChangeForwardPerRequestKey` is provided
- **THEN** `onChangeForwardPerRequestKey(false)` is called in addition to the `onChange` callback

#### Scenario: External service caller uses generalized component
- **WHEN** `ResourceMultiAuth` renders `ResourceAuthentication` for a service
- **THEN** it passes `name={serviceId}`, `authSettings={service.auth_settings}`, `redirectUrl={EXTERNAL_SERVICE_AUTH_REDIRECT_URL}`, and `onChange`
- **AND** `onChangeForwardPerRequestKey` is not passed

---

### Requirement: Auth status stripping before app save
The server action (or client-side mapper) SHALL strip `app_level_auth_status`, `user_level_auth_status`, and `global_auth_status` from every service's `auth_settings` before including `external_services` in the app PUT body.

#### Scenario: App is saved with external services that have auth statuses
- **WHEN** the app is saved and `external_services` entries contain auth status fields
- **THEN** those status fields are absent from the PUT request body
