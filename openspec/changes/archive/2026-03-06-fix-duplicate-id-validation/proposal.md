## Why

When creating entities through `DeploymentProperties` (Models, Applications, Toolsets), the "This ID already exists" validation message does not appear immediately on input. The `names` prop (list of existing IDs) is available in `DeploymentProperties` but is not forwarded to `IdControl`, so client-side duplicate detection is skipped. The error only surfaces after form submission via a server-side check (`checkIsUniqueDeploymentName`), providing no real-time feedback.

In contrast, `EntityProperties` (used for Interceptors, Routes) correctly passes `names` to `IdControl`, so duplicate detection works immediately.

Issue: [#2420](https://github.com/epam/ai-dial-admin-frontend/issues/2420)

## What Changes

- Pass the `names` prop from `DeploymentProperties` to `IdControl` so that client-side duplicate ID detection triggers immediately on input change

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None — this is a bug fix passing an existing prop that was missed.

## Non-goals

- Changing the server-side unique name check (`checkIsUniqueDeploymentName`) — it remains as a secondary validation on submit
- Modifying `IdControl` or `getErrorForName` validation logic — they already support `names` correctly
- Affecting `EntityProperties` which already works correctly

## Impact

- **File**: `apps/ai-dial-admin/src/components/EntityMainProperties/Properties/DeploymentProperties.tsx` (line 121)
- **Scope**: Single prop addition to `IdControl`
- **Affected routes**: Models, Applications, Toolsets (all routes using `DeploymentProperties`)
- **Risk**: Low — `EntityProperties` already passes `names` to `IdControl` with the same pattern; `getErrorForName` already handles the `names` parameter
