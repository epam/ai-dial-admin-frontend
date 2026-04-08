## Why

When users navigate to Approvals → Toolset Publications, configure API Key authentication, then switch to "Without authentication", the Log In/Log Out button in the top-right corner becomes misaligned with the Discard and Save buttons. This horizontal misalignment occurs on both desktop and mobile views.

The issue is caused by how React handles conditional rendering when `AuthButtons` transitions from rendering a button element to returning `null`. The parent flex container (`PublicationsHeader`) recalculates its layout with a different number of children, causing the remaining buttons to shift horizontally.

Issue: [#2907](https://github.com/epam/ai-dial-admin-frontend/issues/2907)

## What Changes

- Move the authentication type check (`ToolsetAuthType.NONE`) from inside `AuthButtons` component to the parent component (`PublicationView.tsx`)
- Prevent `AuthButtons` from mounting when authentication type is NONE, rather than mounting and returning `null`

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None — this is a single conditional rendering fix with no functional changes.

## Non-goals

- Changing the AuthButtons component's internal logic or UI
- Modifying button styling or spacing in PublicationsHeader
- Affecting other views that use AuthButtons (Toolsets, Assets)
- Adding new authentication types or features

## Impact

- **File**: `apps/ai-dial-admin/src/components/Publications/View/View.tsx` (lines 201-210)
- **Scope**: Minimal — only affects when `AuthButtons` component is rendered
- **Risk**: Low — no logic changes, purely conditional rendering adjustment
- **Affected views**: Toolset Publications approval workflow only
