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
