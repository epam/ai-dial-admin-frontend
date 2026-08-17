## ADDED Requirements

### Requirement: External services list displayed in App Properties
The App Properties panel SHALL display an "External Services" section above the `EntityAttachments`
component when the app is opened. The section renders each entry in `app.external_services` as a row
showing the auth type icon, display name (falling back to the service ID), Edit and Delete buttons (except on
a `DIAL_NATIVE` row — see "Consent is the only mutation offered on a DIAL-native row"), and a row action
dispatched on `auth_settings.authentication_type` by known value:

| `authentication_type` | Row action |
|---|---|
| `OAUTH` | Login / Logout, unchanged |
| `API_KEY` | Login / Logout, unchanged |
| `NONE` | none |
| `DIAL_NATIVE` | `Grant consent` or `Approved` + `Withdraw consent` |
| absent, or any value the frontend does not recognise | none |

A type the frontend does not recognise SHALL NOT fall through to Login / Logout. More authentication types
are expected, and Core rejects sign-in for types that have no credential to sign in with.

#### Scenario: App has no external services
- **WHEN** the app's `external_services` map is empty or absent
- **THEN** the section shows only an "Add Service" button and no rows

#### Scenario: App has external services
- **WHEN** the app's `external_services` map contains one or more entries
- **THEN** each entry is rendered as a row with the service's display name (or ID if no display name), the
  auth type icon, and its dispatched action

#### Scenario: Service with NONE auth type
- **WHEN** a service has `authentication_type === NONE`
- **THEN** no Login, Logout, or consent action is shown for that row

#### Scenario: Service shows as logged in
- **WHEN** an `OAUTH` or `API_KEY` service has `auth_settings.app_level_auth_status === SIGNED_IN` OR
  `auth_settings.user_level_auth_status === SIGNED_IN`
- **THEN** the row shows a Logout button and no Login button

#### Scenario: Service shows as logged out
- **WHEN** an `OAUTH` or `API_KEY` service has `app_level_auth_status` and `user_level_auth_status` both not
  `SIGNED_IN`
- **THEN** the row shows a Login button

#### Scenario: DIAL-native service shows consent actions
- **WHEN** a service has `authentication_type === DIAL_NATIVE`
- **THEN** the row shows a consent action — `Grant consent` when not approved, `Withdraw consent` when
  approved
- **AND** no Login or Logout action is reachable on that row in any state

#### Scenario: Unrecognised authentication type
- **WHEN** a service's `authentication_type` is a value the frontend does not recognise
- **THEN** the row renders the service and its type with no action
- **AND** no Login, Logout, or consent action is shown

---

### Requirement: External service auth type selector excludes "Without authentication"
The `ResourceAuthentication` component used by `ResourceMultiAuth` for external services SHALL NOT offer
the `NONE` ("Without authentication") auth type as a selectable option, since an external service always
requires either OAuth, an API key, or DIAL-native delegation. `DIAL_NATIVE` SHALL NOT be selectable either:
declaring a DIAL-native service is an application-manifest act, and the only mutation this UI offers on such
a service is consent.

A type that is not selectable but is already set on the service SHALL still render as a card so the current
selection stays visible, and SHALL NOT be assumed to be present in the selectable options — resolving the
selected card MUST tolerate a type that is absent from that list.

#### Scenario: User adds or edits an external service
- **WHEN** the user opens the Add/Edit form for an external service
- **THEN** the auth type selector shows only "OAuth" and "API Key" as selectable
- **AND** "Without authentication" is not shown
- **AND** "DIAL (native)" is not offered as a choice

#### Scenario: Toolset auth is unaffected
- **WHEN** the asset toolset view renders `ResourceAuthentication`
- **THEN** OAuth, API Key, and "Without authentication" remain available, unchanged from before this change
- **AND** `DIAL_NATIVE` is not offered, since Core's validator rejects it outside external services
- **AND** the caller passes no exclusion for it — the type is never selectable regardless of caller

#### Scenario: Existing service already saved with NONE auth type
- **WHEN** an external service was saved before this change with `authentication_type === NONE`
- **THEN** the "Without authentication" card is still shown (so the existing selection remains visible and
  editable) until the user changes it to a different auth type
- **AND** it no longer appears once a different auth type is selected and saved

#### Scenario: Editing a service already declared as DIAL_NATIVE
- **WHEN** the user opens the Edit form for a service with `authentication_type === DIAL_NATIVE`
- **THEN** a "DIAL (native)" card is shown as the current selection
- **AND** the card offers no auth-settings fields to edit
- **AND** the form does not crash for a read-only admin, for whom only the selected card is rendered

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

---

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

---

### Requirement: Auth status stripping before app save
The server action (or client-side mapper) SHALL strip `app_level_auth_status`, `user_level_auth_status`, and `global_auth_status` from every service's `auth_settings` before including `external_services` in the app PUT body.

#### Scenario: App is saved with external services that have auth statuses
- **WHEN** the app is saved and `external_services` entries contain auth status fields
- **THEN** those status fields are absent from the PUT request body

---

### Requirement: DIAL-native services render approval state, never sign-in state
A service whose `auth_settings.authentication_type` is `DIAL_NATIVE` SHALL render its
`auth_settings.app_level_auth_status` as an administrator's approval of the application, using consent
wording: `SIGNED_IN` means approved, any other value (including an absent status) means not approved. The
row SHALL NOT display the word "Signed in" for this type, and SHALL NOT display or otherwise reflect
`auth_settings.user_level_auth_status` — for `DIAL_NATIVE` that field describes the offline credentials of
the administrator currently viewing the page, not the application or its users.

No additional request is made to read this state; it arrives on the application payload the page already
fetches.

#### Scenario: Approved service
- **WHEN** a `DIAL_NATIVE` service has `app_level_auth_status === SIGNED_IN`
- **THEN** the row shows an `Approved` badge
- **AND** the row's status indicator shows the approved state

#### Scenario: Not-approved service
- **WHEN** a `DIAL_NATIVE` service has `app_level_auth_status === SIGNED_OUT`
- **THEN** the row shows no `Approved` badge
- **AND** the row's status indicator shows the not-approved state

#### Scenario: Status absent from the payload
- **WHEN** a `DIAL_NATIVE` service has no `app_level_auth_status` at all
- **THEN** the row is rendered as not approved
- **AND** no error is surfaced

#### Scenario: Viewing admin has their own offline credentials but the application is unapproved
- **WHEN** a `DIAL_NATIVE` service has `user_level_auth_status === SIGNED_IN` and
  `app_level_auth_status === SIGNED_OUT`
- **THEN** the row's status indicator shows the not-approved state
- **AND** nothing on the row indicates that the service is connected or signed in

#### Scenario: Sign-in state of other auth types is unaffected
- **WHEN** an `OAUTH` or `API_KEY` service has `user_level_auth_status === SIGNED_IN`
- **THEN** the row's status indicator shows the signed-in state exactly as before this change

---

### Requirement: Grant admin consent to a DIAL-native service
The external-services row for a not-approved `DIAL_NATIVE` service SHALL offer a `Grant consent` action
that opens a confirmation dialog before any request is sent. The dialog SHALL state that the application
will be able to act on behalf of any user in the installation who has enabled offline access, with that user's own
permissions, without asking them, including while they are not present. On confirmation the UI SHALL call
`POST /v1/applications/{appId}/external-services/{id}/consent` with no request body.

Because the reach of an approval is installation-wide, the confirmation is required for granting, not only
for withdrawing.

#### Scenario: Admin opens the grant dialog
- **WHEN** the administrator clicks `Grant consent` on a not-approved `DIAL_NATIVE` row
- **THEN** a confirmation dialog opens naming the application
- **AND** the dialog states that the application will be able to act on behalf of any user in the installation who has
  enabled offline access
- **AND** no request has been sent yet

#### Scenario: Admin cancels the grant dialog
- **WHEN** the administrator cancels the dialog
- **THEN** the dialog closes, no request is sent, and the row is unchanged

#### Scenario: Grant succeeds
- **WHEN** the administrator confirms and the request succeeds
- **THEN** a success notification is shown
- **AND** the application is re-read so the row reflects the state Core stored, rather than being patched
  locally
- **AND** the row shows `Approved` with a `Withdraw consent` action

#### Scenario: Grant fails
- **WHEN** the request fails with any error status
- **THEN** an error notification is shown carrying the server's message and request id
- **AND** the row's approval state is left unchanged

#### Scenario: Granting twice is safe
- **WHEN** consent is granted for a service that is already approved
- **THEN** the request succeeds and the row remains approved

---

### Requirement: Withdraw admin consent from a DIAL-native service
The external-services row for an approved `DIAL_NATIVE` service SHALL offer a `Withdraw consent` action
that opens its own confirmation dialog stating that the application will no longer be able to act on behalf of
any user in the installation, that everything it does for them stops immediately, and that it resumes only
when consent is granted again. The copy SHALL NOT name a specific consuming feature — the capability being
withdrawn is general, and scheduled work is only one thing that depends on it. On confirmation the UI SHALL
call `DELETE /v1/applications/{appId}/external-services/{id}/consent` with no request body.

A `false` response body means no consent record existed. It SHALL be treated as already withdrawn — a
success — not as a failure.

#### Scenario: Withdraw succeeds
- **WHEN** the administrator confirms withdrawal and the request succeeds
- **THEN** a success notification is shown
- **AND** the application is re-read
- **AND** the row shows `Grant consent` and no `Approved` badge

#### Scenario: Withdrawing when nothing was stored
- **WHEN** the request returns `200` with a body of `false`
- **THEN** no error notification is shown
- **AND** the row is refreshed and shown as not approved

#### Scenario: Withdraw fails
- **WHEN** the request fails with any error status
- **THEN** an error notification is shown and the row's approval state is left unchanged

---

### Requirement: Consent is the only mutation offered on a DIAL-native row
A `DIAL_NATIVE` row SHALL offer no Edit and no Delete action. Declaring the service is an
application-manifest act, so the row exposes approval and nothing else.

Beyond matching the declaration model, this closes a live hazard: the Edit form can change the Service ID,
and the consent record is keyed by that id — renaming an approved service would silently orphan its
approval, showing the row as not approved while the old record remains in Core's storage.

Rows of every other type keep Edit and Delete unchanged, including a type the frontend does not recognise —
otherwise such a service could never be removed through this UI.

#### Scenario: DIAL-native row hides declaration actions
- **WHEN** a `DIAL_NATIVE` service is rendered for an administrator with write access
- **THEN** the row shows its consent action
- **AND** no Edit or Delete action is rendered for that row

#### Scenario: Other types keep declaration actions
- **WHEN** an `OAUTH` or `API_KEY` service is rendered for an administrator with write access
- **THEN** Edit and Delete are rendered exactly as before this change

#### Scenario: Unrecognised type remains removable
- **WHEN** a service whose `authentication_type` the frontend does not recognise is rendered
- **THEN** no action is offered for its authentication
- **AND** Edit and Delete are still rendered, so the declaration can be removed

---

### Requirement: Consent actions are hidden from read-only admins
Grant and withdraw actions SHALL be rendered only for administrators with write access. A read-only admin
SHALL see the approval state of a `DIAL_NATIVE` service but no action to change it.

Core enforces this independently and answers a non-admin with `403`; hiding the action prevents a button
that is guaranteed to fail.

#### Scenario: Read-only admin views a not-approved service
- **WHEN** a read-only admin opens an application with a not-approved `DIAL_NATIVE` service
- **THEN** the row shows the not-approved state
- **AND** no `Grant consent` action is rendered

#### Scenario: Read-only admin views an approved service
- **WHEN** a read-only admin opens an application with an approved `DIAL_NATIVE` service
- **THEN** the row shows the `Approved` badge
- **AND** no `Withdraw consent` action is rendered

#### Scenario: Permission error from the server
- **WHEN** a consent request returns `403`
- **THEN** the failure is surfaced as a permission error notification
- **AND** the row's approval state is left unchanged

---

### Requirement: Consent request URL is segment-encoded
The consent URL `v1/applications/{appId}/external-services/{serviceId}/consent` SHALL be built by encoding
each `/`-separated segment of the application path and by encoding the service id, rather than by
concatenating raw values. Core decodes the path segment-wise and derives the consent storage key from the
result; an encoding mismatch would make the grant and the later redemption address different records.

#### Scenario: Application path contains a space
- **WHEN** consent is granted for an application whose path is `public/my app`
- **THEN** the request URL contains `public/my%20app`
- **AND** the request succeeds instead of returning a Bad Request

#### Scenario: Application path contains multiple folder segments
- **WHEN** consent is granted for an application nested in folders
- **THEN** the `/` separators between segments remain unencoded
- **AND** each segment's own reserved characters are encoded

---

### Requirement: Stale declaration refreshes the list
A `404` from a consent request means the external service is no longer declared on the application. The UI
SHALL re-read the application so the stale row is removed, rather than leaving a row whose actions cannot
succeed.

#### Scenario: Service was removed from the declaration elsewhere
- **WHEN** a consent request returns `404`
- **THEN** an error notification is shown
- **AND** the application is re-read, so the row disappears if the service is gone

---
