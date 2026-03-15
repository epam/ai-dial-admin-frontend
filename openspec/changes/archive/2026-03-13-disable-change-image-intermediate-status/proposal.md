## Why

The "change image" button (OpenPopup icon) on the container detail view remains clickable when a container is in an intermediate status (PENDING or STOPPING). All other form fields are already disabled during these transitional states via `isEditDisabled()`, but this button was missed. Changing the image while a container is transitioning could cause conflicts or confusing behavior.

## What Changes

- Disable the "change image" OpenPopup icon in `TabsContent.tsx` when the container status is PENDING or STOPPING
- Reuse the existing `isEditDisabled()` utility from `containers.ts`

## Non-goals

- Changing the behavior of the ContainerChangeImage modal itself
- Adding new status types or modifying existing status logic
- Changing backend validation

## Capabilities

### New Capabilities

_None_

### Modified Capabilities

_None — this is a small UX fix using existing patterns, no spec-level behavior changes._

## Impact

- **Code**: `TabsContent.tsx` — the `headerPrefix` section where the OpenPopup icon is rendered
- **UX**: Users will no longer be able to open the change image modal during transitional states, consistent with other disabled controls
