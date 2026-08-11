## ADDED Requirements

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

## MODIFIED Requirements

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
