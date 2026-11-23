## ADDED Requirements

### Requirement: External service OAuth settings expose an optional Discovery URL
The OAuth section of the external service Add/Edit form SHALL show a "Discovery URL" field carrying
`auth_settings.discovery_url`, with the caption "Where DIAL Core reads the sign-in settings: the MCP server's URL,
or the identity provider's issuer URL. DIAL Core never sends requests of the application there." The field SHALL
exist only for application external services: the OAuth section of a toolset SHALL NOT show it, because Core
rejects `discovery_url` outside external services. A stored `discovery_url` SHALL be shown as loaded and SHALL be
sent back unchanged when the user does not edit it.

#### Scenario: Field shown for an external service
- **WHEN** a user opens the OAuth settings of an application external service
- **THEN** a Discovery URL field with the caption is shown

#### Scenario: Toolset unaffected
- **WHEN** a user opens the OAuth settings of an Assets toolset
- **THEN** no Discovery URL field is shown
- **AND** the toolset's save payload carries no `discovery_url`

#### Scenario: Stored value round-trips
- **WHEN** the user edits only the display name of a service that has a `discovery_url` and saves
- **THEN** the request carries the same `discovery_url`

### Requirement: External service OAuth form offers "Register automatically"
For an application external service the "Client registration type" selector SHALL offer "Register automatically"
(`AuthType.DYNAMIC`) next to "Existing client", and "Existing client" SHALL remain the default. The selector
SHALL NOT offer "Register automatically" for a toolset.

In "Register automatically" the form SHALL show only the registration type selector and the Discovery URL. It
SHALL hide every other OAuth field (client id, client secret, token endpoint authentication method, scopes,
authorization endpoint, token endpoint, resource, code challenge method). Entering the mode SHALL clear values
held for those fields, including the `redirect_uri` that choosing OAUTH fills in, so that the save request
carries `authentication_type: OAUTH` and `discovery_url` and no other OAuth field.

Returning to "Existing client" SHALL restore the form to an empty existing-client state: an empty client id and
the `redirect_uri` that choosing OAUTH fills in, keeping the Discovery URL the user typed.

A new service that has chosen "Register automatically" and has not yet typed a Discovery URL SHALL stay in that
mode; the mode SHALL NOT revert to "Existing client" because the URL is empty.

#### Scenario: Default is Existing client
- **WHEN** a user adds an external service and chooses OAuth
- **THEN** the registration type is "Existing client" and the client fields are shown

#### Scenario: Choosing Register automatically
- **WHEN** the user selects "Register automatically"
- **THEN** only the registration type and Discovery URL are shown
- **AND** the service's `auth_settings` hold `authentication_type` and `discovery_url` and no `redirect_uri`,
  `client_id`, `client_secret`, endpoint, scope, `resource`, PKCE or `token_endpoint_auth_method`

#### Scenario: Mode survives an empty Discovery URL
- **WHEN** the user selects "Register automatically" and has typed no Discovery URL
- **THEN** the registration type still reads "Register automatically"

#### Scenario: Apply requires a Discovery URL
- **WHEN** the user is in "Register automatically" with an empty Discovery URL
- **THEN** Apply is disabled

#### Scenario: Back to Existing client
- **WHEN** the user switches from "Register automatically" back to "Existing client"
- **THEN** the client fields are shown empty and `redirect_uri` is the admin callback
- **AND** the typed Discovery URL is kept

#### Scenario: Toolset has no automatic mode
- **WHEN** a user opens the OAuth settings of an Assets toolset
- **THEN** the registration type selector offers only "Existing client"

### Requirement: Register automatically is offered only where Core will register
`ResourceMultiAuth` SHALL offer "Register automatically" only when the service being edited is new, or its
**stored** authentication type (the value in the application as loaded, not the value being edited) is not
`OAUTH`. For a service whose stored type is `OAUTH` the registration type selector SHALL NOT be shown and the mode
SHALL follow the stored state: "Registered by DIAL Core" when `dynamically_registered` is true, otherwise
"Existing client".

#### Scenario: New service
- **WHEN** a user adds an external service and chooses OAuth
- **THEN** "Register automatically" is offered

#### Scenario: Stored service of another type switched to OAuth
- **WHEN** the stored type of a service is `API_KEY` and the user switches it to OAuth
- **THEN** "Register automatically" is offered

#### Scenario: Stored OAuth service
- **WHEN** a user edits a service whose stored type is `OAUTH`
- **THEN** no registration type selector is shown

#### Scenario: Stored OAuth service switched away and back
- **WHEN** the stored type is `OAUTH` and the user switches the service to API Key and back to OAuth
- **THEN** "Register automatically" is still not offered

### Requirement: A Core-registered client is shown read-only
When a service has `dynamically_registered: true` the OAuth section SHALL show "Registered by DIAL Core" and SHALL
show the registered client id, scopes, authorization endpoint, token endpoint, resource, token endpoint
authentication method, code challenge method and Discovery URL as read-only. It SHALL NOT show a client secret
control. A service the user has not changed SHALL be sent back as read, so Core keeps the same client id and PKCE
challenge. The panel SHALL NOT send `client_secret` for it.

#### Scenario: Registered client shown
- **WHEN** a user opens a service with `dynamically_registered: true`
- **THEN** "Registered by DIAL Core" is shown with the client id and the other registered fields disabled
- **AND** no client secret field is shown

#### Scenario: Editing the display name keeps the client
- **WHEN** the user changes only the display name of a registered service and saves
- **THEN** the request carries the stored `client_id` and `code_challenge` unchanged and no `client_secret`

#### Scenario: Read-only admin
- **WHEN** a read-only admin opens a registered service
- **THEN** the fields are shown and no "Use an existing client instead" action is offered

#### Scenario: Registered values appear after save
- **WHEN** a new service saved with "Register automatically" succeeds
- **THEN** the application is re-read from Core and the service shows the registered client id and
  "Registered by DIAL Core"

### Requirement: A registered client can be converted to an existing client
The registered-client state SHALL offer "Use an existing client instead". Choosing it SHALL switch the form to
"Existing client", clear the client id and client secret so the admin enters their own, and require both before
Apply is enabled. If the stored token endpoint authentication method is `none` it SHALL be reset to
`client_secret_basic`. The other registered values, the Discovery URL included, SHALL stay as read. There SHALL be
no action that returns a stored service to automatic registration. The action SHALL be disabled while the user is
signed in to the service, like the other auth fields.

#### Scenario: Convert to a static client
- **WHEN** the user chooses "Use an existing client instead", enters a client id and secret and saves
- **THEN** the request carries both and the service is read back with `dynamically_registered` false

#### Scenario: Apply requires both credentials
- **WHEN** the user has chosen "Use an existing client instead" and left the client id or secret empty
- **THEN** Apply is disabled

#### Scenario: Public client method reset
- **WHEN** the registered client's token endpoint authentication method is `none` and the user chooses
  "Use an existing client instead"
- **THEN** the method becomes `client_secret_basic`

#### Scenario: No way back
- **WHEN** a stored service is in the Existing client mode after conversion
- **THEN** no "Register automatically" option is offered

### Requirement: Registration failures surface through the save notification
The panel SHALL show Core's message through the existing save-failure notification when Core fails the application
save because the setup of an external service failed (`400` with `External service '<id>': <reason>`), and
SHALL save nothing. The panel SHALL NOT parse the reason, mark the service row, or suggest a different mode.

#### Scenario: Provider has no registration support
- **WHEN** Core answers the save with `400` and a message that the MCP server does not support dynamic client
  registration
- **THEN** the error notification shows that message and the application stays unsaved

#### Scenario: Unreachable Discovery URL
- **WHEN** Core answers `400` with a connection failure for the Discovery URL
- **THEN** the error notification shows that message and the application stays unsaved

## MODIFIED Requirements

### Requirement: Generalized ResourceAuthentication component
`ResourceAuthentication` SHALL accept a generic `authSettings` object and `name` string instead of
a full `DialToolsetResource`, enabling reuse for external services. An optional
`onChangeForwardPerRequestKey` callback enables toolset-specific `forward_per_request_key` reset
behavior. An optional `redirectUrl` prop sets the OAuth `redirect_uri` stored in `auth_settings`.
An optional `excludeAuthTypes` prop filters specific auth types out of the selectable options.
An optional `isDiscoveryUrlSupported` prop shows the Discovery URL field in the OAuth section, and an optional
`isDynamicRegistrationOffered` prop additionally enables the "Register automatically" mode; without them both are
absent, as for toolsets.

#### Scenario: Toolset caller uses generalized component
- **WHEN** the asset toolset view renders `ResourceAuthentication`
- **THEN** it passes `name={toolset.name}`, `authSettings={toolset.auth_settings}`,
  `redirectUrl={TOOLSET_AUTH_REDIRECT_URL}`, `onChange`, and `onChangeForwardPerRequestKey`
- **AND** it does not pass `excludeAuthTypes`, `isDiscoveryUrlSupported` or `isDynamicRegistrationOffered`, so all auth types remain
  available and no Discovery URL or automatic registration is shown
- **AND** behavior is identical to the pre-refactor version

#### Scenario: Auth type changed to API_KEY with forward_per_request_key callback
- **WHEN** the user selects API_KEY auth type and `onChangeForwardPerRequestKey` is provided
- **THEN** `onChangeForwardPerRequestKey(false)` is called in addition to the `onChange` callback

#### Scenario: External service caller uses generalized component
- **WHEN** `ResourceMultiAuth` renders `ResourceAuthentication` for a service
- **THEN** it passes `name={serviceId}`, `authSettings={service.auth_settings}`,
  `redirectUrl={EXTERNAL_SERVICE_AUTH_REDIRECT_URL}`, `onChange`,
  `excludeAuthTypes={[ToolsetAuthType.NONE]}`, `isDiscoveryUrlSupported`, and `isDynamicRegistrationOffered`
  derived from the service's stored authentication type
- **AND** `onChangeForwardPerRequestKey` is not passed
