## Context

The current implementation in `OAuthSection.tsx` (lines 73-88) shows `required: true` on Client ID and Client Secret inputs, but this only renders a visual asterisk. No validation logic checks if these fields are empty before save.

The codebase already has:
1. **SaveValidationContext** - global validation state that controls the save button
2. **DisplayNameControl pattern** - established pattern for validated input controls that dispatch to SaveValidationContext
3. **SimpleButtonsWrapper** - already reads `isValid` from context and sets `disableSave = !isValid`

The infrastructure exists, but OAuthSection doesn't hook into it. Currently:
- OAuthSection renders inputs with `onChange` that directly updates state
- No validation dispatch occurs
- SaveValidationContext.fieldValidations remains empty
- SaveValidationContext.isValid stays `true` (empty Map → all valid)
- Save button never gets disabled

## Goals / Non-Goals

**Goals:**
- Add validation for Client ID and Client Secret fields in OAuth auth toolsets
- Follow the established DisplayNameControl pattern for consistency
- Disable save button when required fields are empty
- Show error messages inline with fields
- Validate on mount (handles edit mode) and on change (handles user input)
- Handle logged-in state (fields disabled, skip validation dispatch)

**Non-Goals:**
- Validating format/content of Client ID or Secret (OAuth spec doesn't define formats)
- Validating other auth types (API Key, None)
- Backend validation changes (backend should already validate)
- Changing validation infrastructure or patterns

## Decisions

### Decision 1: Create reusable control components (ClientIdControl, ClientSecretControl)

Following the DisplayNameControl pattern rather than adding inline validation to OAuthSection.

**Alternative considered:** Add validation logic directly in OAuthSection
**Rejected because:**
- Mixes UI and validation concerns
- Harder to test in isolation
- Doesn't follow established pattern (DisplayNameControl, EndpointControl)
- Less reusable if Client ID/Secret fields appear elsewhere

**Chosen:** Create dedicated control components that encapsulate:
- Validation logic
- SaveValidationContext dispatch
- Error state management
- DialInput/DialPasswordInput rendering

### Decision 2: Simple empty-check validation

Create `getErrorForClientId` and `getErrorForClientSecret` functions that only check if the field is empty.

**Alternative considered:** Add format validation (e.g., no special characters, length limits)
**Rejected because:**
- OAuth 2.0 spec doesn't define Client ID/Secret formats
- Different providers use different formats (UUIDs, alphanumeric, etc.)
- Backend is authoritative for format validation
- Overly restrictive frontend validation could block valid credentials

**Chosen:** Check only for empty/whitespace-only values:
```typescript
if (!value || value.trim().length === 0) {
  return { type: ErrorType.EMPTY, text: t(ErrorI18nKey.RequiredField) };
}
return null;
```

### Decision 3: Namespaced field keys in validation context

Use `authSettings.clientId` and `authSettings.clientSecret` as field keys.

**Alternative considered:** Use simple keys like `clientId`
**Rejected because:** Could collide with other entity fields (toolsets might have other IDs)

**Chosen:** Namespace keys under `authSettings.*` to make scope clear and avoid collisions.

### Decision 4: Skip validation dispatch when logged in

When `isLoggedIn` is true, auth settings are locked (display-only). Validation should still run for UI feedback, but shouldn't block save.

**Implementation:**
```typescript
const validate = useCallback((value?: string) => {
  const error = getErrorForClientId(value, t);
  setError(error);

  if (!isLoggedIn) {  // ← Only dispatch when not logged in
    dispatch({
      type: ValidationActionType.SetField,
      field: 'authSettings.clientId',
      isValid: !error
    });
  }
}, [dispatch, t, isLoggedIn]);
```

### Decision 5: Trim on change, immediate validation

Follow DisplayNameControl pattern: `value?.trimStart()` on change, validate immediately.

**Alternative considered:** Trim on blur, validate on blur
**Rejected because:** DisplayNameControl uses trimStart on change, and immediate validation provides better UX

**Chosen:** Trim leading whitespace on every change, run validation immediately.

## Risks / Trade-offs

- **Logged-in state complexity**: Need to pass `isLoggedIn` prop through to controls. If forgotten, validation will incorrectly block save when auth settings are locked. Mitigation: Add clear prop documentation and component tests covering logged-in state.

- **Field key naming**: Using `authSettings.clientId` assumes this namespace is unique. If other components use the same key, validation could conflict. Mitigation: These keys are specific to toolset auth settings, unlikely to appear elsewhere.

- **Existing invalid data**: Opening a toolset with pre-existing empty Client ID will immediately show validation errors. This is correct behavior (surfaces the issue) but might surprise users. No migration needed—users must fix the data.

- **Password field trimming**: Trimming Client Secret could theoretically break credentials with leading/trailing spaces. In practice, OAuth providers don't use such secrets, and the UX benefit (removing accidental spaces) outweighs this edge case.
