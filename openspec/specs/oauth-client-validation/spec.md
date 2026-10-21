## Purpose

Keeps OAuth Client ID and Client Secret from being saved empty, and defines how a stored client secret that core never returns is shown and written back for Assets toolsets and application external services.

## Capability: OAuth Client Validation

### Summary

Validates that Client ID and Client Secret fields in OAuth authentication toolsets are not empty, preventing users from saving toolsets with missing required credentials.

### User-Facing Behavior

**When user opens OAuth toolset:**
1. If Client ID or Client Secret is empty, validation error shows immediately
2. Error message: "This field is required"
3. Save button is disabled
4. User must fill in both fields to enable save

**When user clears a required field:**
1. Field border turns red
2. Error message displays below field
3. Save button immediately becomes disabled
4. Typing in field clears error when no longer empty

**When user is already logged in:**
1. Auth settings are locked (display-only mode)
2. Alert shows: "Auth settings are locked because you are signed in"
3. Validation errors still display (for visibility)
4. Save button remains enabled (auth settings cannot be modified anyway)

### Technical Behavior

**Validation flow:**

```
User opens toolset with OAuth auth
  ↓
ClientIdControl renders
  ↓
useEffect: validate(clientId)
  ↓
If empty:
  - setError({ type: EMPTY, text: "This field is required" })
  - dispatch({ field: 'authSettings.clientId', isValid: false })
  ↓
SaveValidationContext.isValid = false
  ↓
SimpleButtonsWrapper.isDisableSave = true
  ↓
Save button disabled
```

**Field names in validation context:**
- `authSettings.clientId`
- `authSettings.clientSecret`

**Validation logic:**
```typescript
if (!value || value.trim().length === 0) {
  return { type: ErrorType.EMPTY, text: "This field is required" };
}
return null;
```

### Acceptance Criteria

- [ ] Emptying Client ID field shows "This field is required" error
- [ ] Emptying Client Secret field shows "This field is required" error
- [ ] Save button is disabled when Client ID is empty
- [ ] Save button is disabled when Client Secret is empty
- [ ] Save button is enabled when both fields are filled
- [ ] Validation runs on component mount (handles existing empty values)
- [ ] Validation runs on field change (handles user clearing values)
- [ ] When logged in, validation errors display but don't block save
- [ ] Leading whitespace is trimmed from input values
- [ ] Error clears when user types a non-empty value

### Edge Cases

**Already logged in:**
Auth settings are locked. Validation still runs for UI feedback, but doesn't dispatch to SaveValidationContext (won't affect save button state).

**Switching auth types:**
When switching from OAuth to API Key and back to OAuth, Client ID/Secret might be undefined. Validation treats undefined the same as empty string.

**JSON editor mode:**
JSON editor bypasses form validation. Save button is enabled regardless of field values when in JSON mode.

**Existing invalid data:**
Opening a toolset with pre-existing empty Client ID/Secret will show validation errors immediately. This is correct behavior—users must fix the data before saving.

### Dependencies

- Requires SaveValidationContext to exist and be provided by parent
- Requires SimpleButtonsWrapper to check `isValid` state
- Requires `ErrorI18nKey.RequiredField` i18n key
- Requires `ErrorType.EMPTY` error type

### Testing Strategy

**Unit tests** (`toolset-auth-error.spec.ts`):
- Empty string returns EMPTY error
- Whitespace-only string returns EMPTY error
- Valid value returns null
- Undefined returns EMPTY error

**Component tests** (`ClientIdControl.spec.ts`, `ClientSecretControl.spec.ts`):
- Renders with label and required indicator
- Shows error when value is empty
- Calls onChange with trimmed value
- Dispatches validation state to context
- Validates on mount with initial value
- Skips dispatch when isLoggedIn=true

**Integration test** (`OAuthSection.spec.tsx`):
- Save button disabled when Client ID empty
- Save button disabled when Client Secret empty
- Save button enabled when both filled
- Clearing value shows error and disables save
- Logged-in state doesn't dispatch validation

## Requirements

### Requirement: Stored client secret is represented by a masked placeholder
When an Assets OAuth auth-settings entity (an Assets toolset or an application external service) is
loaded with a `client_secret_hint`, the Client Secret field SHALL show a `••••` placeholder with an empty
value, SHALL NOT show the "This field is required" error, and SHALL NOT block Save while the field is empty.

#### Scenario: Saved OAuth toolset opens with a stored secret
- **WHEN** a user opens an Assets toolset whose OAuth auth settings carry a `client_secret_hint`
- **THEN** the Client Secret field is empty and shows the `••••` placeholder
- **AND** no "This field is required" error is shown for Client Secret
- **AND** the Save button is not disabled by the Client Secret field

#### Scenario: Application external service with a stored secret
- **WHEN** a user opens an application external service whose OAuth auth settings carry a `client_secret_hint`
- **THEN** its Client Secret field behaves as in the toolset scenario

#### Scenario: No stored secret
- **WHEN** the OAuth auth settings carry no `client_secret_hint` and the Client Secret is empty
- **THEN** the "This field is required" error is shown and Save is disabled

#### Scenario: Typing a new secret
- **WHEN** the user types a value into the Client Secret field of settings that carry a hint
- **THEN** the typed value is shown masked and treated as a new secret

#### Scenario: Clearing a typed secret
- **WHEN** the user clears a secret they typed into a field whose settings carry a hint
- **THEN** the field returns to the empty `••••` placeholder state with no error and Save is not blocked

#### Scenario: Signed-in lock unchanged
- **WHEN** the user is signed in to the toolset
- **THEN** the auth settings remain locked and the Client Secret field is disabled

### Requirement: A typed client secret has a minimum length
In the Assets OAuth auth settings, a non-empty Client Secret the user typed SHALL be at least 8
characters, matching core's write validation. A shorter value SHALL show an inline error and SHALL disable
Save. An empty value is governed by the stored-secret requirement above. The rule SHALL NOT apply to the
legacy Toolsets UI.

#### Scenario: Typed secret is too short
- **WHEN** the user types 1 to 7 characters into the Client Secret field
- **THEN** an error stating the 8-character minimum is shown and Save is disabled

#### Scenario: Typed secret reaches the minimum
- **WHEN** the user extends the value to 8 or more characters
- **THEN** the error clears and Save is no longer blocked by the field

#### Scenario: Short typed secret over a stored secret
- **WHEN** settings carry a `client_secret_hint` and the user types fewer than 8 characters
- **THEN** the minimum-length error is shown and Save is disabled until the value is cleared or lengthened

#### Scenario: Legacy Toolsets unaffected
- **WHEN** a user types a short Client Secret in the legacy Toolsets UI
- **THEN** no minimum-length error is shown

### Requirement: Client secret is omitted from the save payload unless the user typed one
When saving Assets OAuth auth settings, the system SHALL omit `client_secret` from the payload when it is
empty, and SHALL always omit `client_secret_hint`, so that core keeps the stored secret.

#### Scenario: Save without touching the secret
- **WHEN** the user saves a toolset whose settings carry a `client_secret_hint` without typing a secret
- **THEN** the request carries neither `client_secret` nor `client_secret_hint`

#### Scenario: Save with a new secret
- **WHEN** the user types a new secret and saves
- **THEN** the request carries the typed `client_secret` and no `client_secret_hint`

#### Scenario: External services in an application
- **WHEN** the user saves an application with OAuth external services
- **THEN** each service's auth settings follow the same omission rules

### Requirement: Duplicating an OAuth resource still resets its auth settings
Duplicating an Assets toolset or application whose auth type is OAuth SHALL continue to reset the copy's
auth settings to `NONE`, regardless of `client_secret_hint`, because a stored secret cannot be copied.

#### Scenario: Duplicate OAuth toolset with a hint
- **WHEN** the user duplicates an OAuth toolset whose settings carry a `client_secret_hint`
- **THEN** the copy's auth settings are `{ authentication_type: NONE }`
