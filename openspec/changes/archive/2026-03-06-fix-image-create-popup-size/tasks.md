## 1. Fix popup size

- [x] 1.1 Change `size={PopupSize.Lg}` to `size={PopupSize.Md}` in `apps/ai-dial-admin/src/components/Deployments/Modals/ImageCreateContainer.tsx` (line 50)

## 2. Testing

- [x] 2.1 Add unit test for `ImageCreateContainer` verifying the popup renders with `PopupSize.Md` — query by role and text content, not data-testid
