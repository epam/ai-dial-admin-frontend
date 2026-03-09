## Why

The image creation pop-up in Deployments uses `PopupSize.Lg`, but when rendered in modal mode (`isModal=true`), `ContainerFields` only shows `ContainerBase` and optionally `ContainerSource` — a small amount of content. This results in an oversized dialog (1920x923px) with excessive empty space, not matching design specifications.

Issue: [#2418](https://github.com/epam/ai-dial-admin-frontend/issues/2418)

## What Changes

- Reduce the popup size of `ImageCreateContainer` from `PopupSize.Lg` to an appropriate smaller size (`PopupSize.Sm` or `PopupSize.Md`) that fits the actual modal content

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None — this is a single-property fix with no requirement-level changes.

## Non-goals

- Changing the layout or fields shown in the image creation modal
- Modifying the `DialConfirmationPopup` or `PopupSize` enum in `@epam/ai-dial-ui-kit`
- Changing popup sizes for other modals in the application

## Impact

- **File**: `apps/ai-dial-admin/src/components/Deployments/Modals/ImageCreateContainer.tsx` (line 50)
- **Scope**: Minimal — only affects the `size` prop passed to `DialConfirmationPopup`
- **Risk**: Low — no logic changes, purely visual sizing adjustment
