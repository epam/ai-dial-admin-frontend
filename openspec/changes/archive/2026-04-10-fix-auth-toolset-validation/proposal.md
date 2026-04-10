## Why

Users can currently save OAuth authentication toolsets even when mandatory fields (Client ID and Client Secret) are empty. The fields display `required: true` labels, but this is only a visual indicator—no validation logic prevents the save operation. This allows invalid data to persist in the system.

**Issue:** #2934 - "[Entities --> Toolsets] Auth toolset can be saved without mandatory fields (Client ID or Client Secret) filled in"

**Current behavior:**
1. User opens an auth toolset
2. Clears Client ID or Client Secret field
3. Clicks Save
4. ✗ Toolset saves successfully with empty mandatory fields

**Expected behavior:**
1. User clears a required field
2. Error message displays immediately
3. Save button becomes disabled
4. ✓ User cannot save until fields are filled

This fix ensures data integrity and provides immediate feedback to users when required fields are missing.

## What Changes

- Create validation utility `getErrorForClientId` and `getErrorForClientSecret` in a new `toolset-auth-error.ts` file
- Create `ClientIdControl` component following the DisplayNameControl pattern (validates on change and mount, dispatches to SaveValidationContext)
- Create `ClientSecretControl` component with same pattern but using DialPasswordInput
- Update `OAuthSection` to use the new control components instead of raw DialInput/DialPasswordInput
- Handle edge case: skip validation dispatch when user is already logged in (auth settings locked)
- Add unit tests for validation functions
- Add component tests for both controls
- Add integration test verifying save button is disabled when fields are empty

## Capabilities

### New Capabilities

- `oauth-client-validation`: Client ID and Client Secret fields in OAuth toolsets are validated as required fields, preventing save when empty.

### Modified Capabilities

<!-- No existing spec-level capabilities are changing -->

## Impact

- `utils/validation/toolset-auth-error.ts` — new validation functions
- `components/Toolsets/Auth/Controls/ClientIdControl.tsx` — new control component
- `components/Toolsets/Auth/Controls/ClientSecretControl.tsx` — new control component
- `components/Toolsets/Auth/Sections/OAuthSection.tsx` — updated to use new controls
- Test files for the above
