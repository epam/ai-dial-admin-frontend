## Context

The `ImageCreateContainer` modal (`apps/ai-dial-admin/src/components/Deployments/Modals/ImageCreateContainer.tsx`) uses `PopupSize.Lg` for its `DialConfirmationPopup`. When `isModal=true`, `ContainerFields` only renders `ContainerBase` and optionally `ContainerSource` — a small form that doesn't justify a large popup.

Other similar modals in the same directory use smaller sizes:
- `ImageAdd.tsx` → `PopupSize.Md`
- `ContainerDuplicate.tsx` → `PopupSize.Md`
- `ImageDuplicate.tsx` → `PopupSize.Md`

## Goals / Non-Goals

**Goals:**
- Size the image creation popup appropriately for its content

**Non-Goals:**
- Changing the content or layout of the modal
- Introducing responsive/dynamic popup sizing

## Decisions

### Use `PopupSize.Md` instead of `PopupSize.Lg`

**Rationale**: `PopupSize.Md` is already used by similar deployment modals with comparable content (`ImageAdd`, `ContainerDuplicate`, `ImageDuplicate`). This is consistent with existing patterns and appropriately fits the modal form content.

**Alternative considered**: `PopupSize.Sm` — too narrow for forms with labels and inputs side by side. `Md` is the established size for deployment form modals.

## Risks / Trade-offs

- **[Low] Model Servings path shows extra field**: When `image.$type` matches model servings, `ContainerSource` is also rendered. `PopupSize.Md` still accommodates this — `ImageAddContainer` shows even more fields and uses `Lg`, confirming `Md` is right for the smaller form.
