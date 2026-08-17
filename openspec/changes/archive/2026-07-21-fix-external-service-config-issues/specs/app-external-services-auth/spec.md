## ADDED Requirements

### Requirement: External service auth type selector excludes "Without authentication"
The `ResourceAuthentication` component used by `ResourceMultiAuth` for external services SHALL NOT
offer the `NONE` ("Without authentication") auth type as a selectable option, since an external
service always requires either OAuth or an API key.

#### Scenario: User adds or edits an external service
- **WHEN** the user opens the Add/Edit form for an external service
- **THEN** the auth type selector shows only "OAuth" and "API Key"
- **AND** "Without authentication" is not shown

#### Scenario: Toolset auth is unaffected
- **WHEN** the asset toolset view renders `ResourceAuthentication`
- **THEN** all three auth types (OAuth, API Key, Without authentication) remain available,
  unchanged from before this change

#### Scenario: Existing service already saved with NONE auth type
- **WHEN** an external service was saved before this change with `authentication_type === NONE`
- **THEN** the "Without authentication" card is still shown (so the existing selection remains
  visible and editable) until the user changes it to a different auth type
- **AND** it no longer appears once a different auth type is selected and saved

---

### Requirement: External service scope URL is segment-encoded
The sign-in and sign-out `url` identifying an external service
(`applications/{appPath}/external_services/{serviceId}`) SHALL have each `/`-separated segment of
`{appPath}` URL-encoded before being sent to the backend, so folder or app names containing spaces
or other reserved characters do not produce a malformed request.

#### Scenario: App path contains a space
- **WHEN** the app's path includes a folder name with a space (e.g. `public/als code apps/my-app`)
- **THEN** the `url` sent to `POST /v1/ops/external-service/signin` (or `/signout`) has each path
  segment URL-encoded (e.g. `public/als%20code%20apps/my-app`)
- **AND** the sign-in/sign-out request succeeds instead of returning a Bad Request

## MODIFIED Requirements

### Requirement: Add external service
The App Properties panel SHALL provide an "Add Service" button that opens an inline edit form
(within the same `ResourceMultiAuth` component) for creating a new external service entry.

#### Scenario: User clicks Add Service
- **WHEN** the user clicks the "Add Service" button
- **THEN** the component transitions to edit mode showing a blank form with fields: Service ID,
  Display Name, Description, and auth settings (via the generalized `ResourceAuthentication`
  component)
- **AND** a Back button is visible

#### Scenario: User fills in new service and saves
- **WHEN** the user fills in a Service ID, optional Display Name/Description, configures auth
  settings, and the parent app Save is triggered
- **THEN** the new service is included in `app.external_services` under the entered Service ID key
- **AND** the service is saved as part of the app PUT

#### Scenario: Service ID already exists on add
- **WHEN** the user enters a Service ID that matches another existing entry while adding
- **THEN** an inline validation error is shown on the Service ID field indicating the ID is
  already in use
- **AND** the Apply button is disabled, preventing the save

#### Scenario: User clicks Back without saving
- **WHEN** the user clicks the Back button in edit mode
- **THEN** the component returns to the list view and local edit-mode changes are discarded

---

### Requirement: Edit external service
The App Properties panel SHALL allow editing an existing external service's metadata, Service ID,
and auth settings via the Edit button in the list row.

#### Scenario: User clicks Edit on a service
- **WHEN** the user clicks the Edit button on a service row
- **THEN** the component transitions to edit mode showing the service's current Service ID,
  Display Name, Description, and auth settings pre-filled

#### Scenario: User modifies auth settings and saves
- **WHEN** the user changes auth settings (type or field values) and the parent app Save is
  triggered
- **THEN** the updated `auth_settings` (with statuses stripped) is included in the app PUT body

#### Scenario: Service ID field is editable when editing
- **WHEN** the user is in edit mode for an existing service
- **THEN** the Service ID field is displayed and editable, allowing the service to be renamed

#### Scenario: User renames a service to an ID that already exists
- **WHEN** the user is in edit mode for an existing service and changes the Service ID to a value
  that matches a different existing entry
- **THEN** an inline validation error is shown on the Service ID field indicating the ID is
  already in use
- **AND** the Apply button is disabled, preventing the save

---

### Requirement: Generalized ResourceAuthentication component
`ResourceAuthentication` SHALL accept a generic `authSettings` object and `name` string instead of
a full `DialToolsetResource`, enabling reuse for external services. An optional
`onChangeForwardPerRequestKey` callback enables toolset-specific `forward_per_request_key` reset
behavior. An optional `redirectUrl` prop sets the OAuth `redirect_uri` stored in `auth_settings`.
An optional `excludeAuthTypes` prop filters specific auth types out of the selectable options.

#### Scenario: Toolset caller uses generalized component
- **WHEN** the asset toolset view renders `ResourceAuthentication`
- **THEN** it passes `name={toolset.name}`, `authSettings={toolset.auth_settings}`,
  `redirectUrl={TOOLSET_AUTH_REDIRECT_URL}`, `onChange`, and `onChangeForwardPerRequestKey`
- **AND** it does not pass `excludeAuthTypes`, so all auth types remain available
- **AND** behavior is identical to the pre-refactor version

#### Scenario: Auth type changed to API_KEY with forward_per_request_key callback
- **WHEN** the user selects API_KEY auth type and `onChangeForwardPerRequestKey` is provided
- **THEN** `onChangeForwardPerRequestKey(false)` is called in addition to the `onChange` callback

#### Scenario: External service caller uses generalized component
- **WHEN** `ResourceMultiAuth` renders `ResourceAuthentication` for a service
- **THEN** it passes `name={serviceId}`, `authSettings={service.auth_settings}`,
  `redirectUrl={EXTERNAL_SERVICE_AUTH_REDIRECT_URL}`, `onChange`, and
  `excludeAuthTypes={[ToolsetAuthType.NONE]}`
- **AND** `onChangeForwardPerRequestKey` is not passed
