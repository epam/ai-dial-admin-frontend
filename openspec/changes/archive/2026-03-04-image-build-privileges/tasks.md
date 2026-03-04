## 1. Types and Data Model

- [x] 1.1 Add `IMAGE_BUILDER_TYPE` enum to `apps/ai-dial-admin/src/types/deployments/images.ts` with values `ROOTLESS = 'buildkit_rootless'` and `ROOT = 'buildkit'`
- [x] 1.2 Add optional `imageBuilder?: IMAGE_BUILDER_TYPE` field to the `Image` interface in `apps/ai-dial-admin/src/models/deployments/images.ts`

## 2. Constants and i18n

- [x] 2.1 Add i18n keys for build privileges field title, option names ("Rootless (recommended)", "Root"), and captions to the i18n constants
- [x] 2.2 Add i18n translation values for the new keys in the locale files
- [x] 2.3 Add `BUILDER_TYPES` function (returning `RadioButtonWithContent[]` with captions) and `IMAGE_BUILDER_I18N_KEYS` record to `apps/ai-dial-admin/src/constants/deployments/images.tsx`
- [x] 2.4 Update `IMAGE_TEMPLATE` in `apps/ai-dial-admin/src/constants/deployments/images.tsx` to include `imageBuilder: IMAGE_BUILDER_TYPE.ROOTLESS`

## 3. Component Implementation

- [x] 3.1 Create `ImageBuildPrivileges` component in `apps/ai-dial-admin/src/components/Deployments/Fields/ImageBuildPrivileges.tsx` using `DialRadioGroup` with column orientation, following the `ImageTransport.tsx` pattern
- [x] 3.2 Refactor `ImageFields.tsx` parent container to use `divide-y divide-primary` with three child groups: (1) ImageBase, (2) ImageSource + ImageTransport, (3) ImageBuildPrivileges (guarded by `!isModal`). Remove the existing `border-b border-primary` from the ImageBase wrapper

## 4. Unit Tests

- [x] 4.1 Create `ImageBuildPrivileges.spec.tsx` in `apps/ai-dial-admin/src/components/Deployments/Fields/tests/` with: "should render correctly" (assert radio group is in document), "should call setImage with `buildkit` when Root selected" (vi.fn() + userEvent), "should call setImage with `buildkit_rootless` when Rootless selected" (vi.fn() + userEvent)
- [x] 4.2 Create `ImageFields.spec.tsx` in `apps/ai-dial-admin/src/components/Images/Fields/tests/` with: "should render correctly" (assert core children present), "should render ImageBuildPrivileges in Properties view" (!isModal), "should not render ImageBuildPrivileges in modal" (isModal=true), "should render dividers between field groups" (assert `divide-y divide-primary` classes on parent)

## 5. Verification

- [x] 5.1 Run unit tests and confirm all pass
- [x] 5.2 Verify the build privileges radio group renders in the Properties view with correct options, captions, and default selection
- [x] 5.3 Verify the build privileges radio group does NOT render in the create image modal
