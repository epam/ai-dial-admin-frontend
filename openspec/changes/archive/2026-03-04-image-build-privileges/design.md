## Context

The Admin → Deployments → Images UI allows administrators to manage container images. Each image has fields like name, version, source, transport type, etc. The Properties view renders these via `ImageFields`, which orchestrates `ImageBase`, `ImageSource`, and `ImageTransport` sub-components. Radio groups use `DialRadioGroup` from `@epam/ai-dial-ui-kit` (see `ImageTransport.tsx` as reference pattern).

Currently, there is no `imageBuilder` field in the data model or UI. The backend expects this field to control whether images are built with root or rootless privileges.

## Goals / Non-Goals

**Goals:**
- Add `imageBuilder` field to the `Image` model with enum `IMAGE_BUILDER_TYPE` (`buildkit_rootless` | `buildkit`)
- Render a "Build Privileges" `DialRadioGroup` in the Properties view, separated from existing fields by a divider
- Default to `buildkit_rootless` in the image template
- Hide the field in the create image modal (`isModal` mode)
- Include descriptive captions on each radio option

**Non-Goals:**
- Backend API changes (field is already supported server-side)
- Conditional visibility based on image type (applies to all image types)
- Validation logic for this field (it always has a valid value)

## Decisions

### 1. New enum and type additions

Add `IMAGE_BUILDER_TYPE` enum to `types/deployments/images.ts`:
```typescript
export enum IMAGE_BUILDER_TYPE {
  ROOTLESS = 'buildkit_rootless',
  ROOT = 'buildkit',
}
```

Add `imageBuilder?: IMAGE_BUILDER_TYPE` to the `Image` interface. Optional because existing images may not have it set yet.

**Rationale**: Follows the same pattern as `IMAGE_TRANSPORT_TYPE` — an enum for discrete values with a corresponding optional field on the model.

### 2. New component: `ImageBuildPrivileges`

Create `Deployments/Fields/ImageBuildPrivileges.tsx` following the exact pattern of `ImageTransport.tsx`:
- Accept `image` and `setImage` props
- Use `DialRadioGroup` with `RadioGroupOrientation.Column`
- Define radio options with `name` and `caption` fields via `BUILDER_TYPES` constant (similar to `TRANSPORT_TYPES`)
- Default to `buildkit_rootless` when `image.imageBuilder` is undefined

**Rationale**: Keeping it as a separate component in `Deployments/Fields/` matches the existing field component organization and keeps `ImageFields` clean.

### 3. Integration into ImageFields

Use Tailwind's `divide-y divide-primary` on the parent container to automatically render dividers between child sections, instead of manually adding border elements. This pattern is already used in the project (e.g., `Roles.tsx`, `AuditView.tsx`). Each direct child of the flex container becomes a divided section.

The existing `ImageBase` wrapper's `pb-8 border-b border-primary` should be replaced — the parent's `divide-y` handles the borders and `gap-y-8` handles the spacing automatically.

```tsx
<div className="flex flex-col w-full h-full gap-y-8 divide-y divide-primary">
  <ImageBase ... />
  <div className="flex flex-col gap-y-8">
    <ImageSource ... />
    {!isModal && <ImageTransport ... />}
  </div>
  {!isModal && <ImageBuildPrivileges image={image} setImage={setImage} />}
</div>
```

The `!isModal` guard ensures Build Privileges only shows in the Properties view, not the create modal.

**Rationale**: Using `divide-y divide-primary` is the established project pattern for automatic dividers between sibling elements, avoiding manual border elements.

### 4. Constants and i18n

Add to `constants/deployments/images.tsx`:
- `BUILDER_TYPES` function returning `RadioButtonWithContent[]` with captions
- `IMAGE_BUILDER_I18N_KEYS` record

Add i18n keys to the appropriate i18n constants file for:
- Field title: "Build privileges"
- Option names: "Rootless (recommended)", "Root"
- Captions: Security descriptions for each option

**Rationale**: Consistent with existing patterns (`TRANSPORT_TYPES`, `IMAGE_TRANSPORT_I18N_KEYS`).

### 5. Unit tests

Follow existing project conventions: `.spec.tsx` files in a `tests/` subdirectory, using `vitest`, `@testing-library/react`, and `userEvent`.

**`ImageBuildPrivileges.spec.tsx`** (in `Deployments/Fields/tests/`):
- "should render correctly" — render with a mock image, assert the radio group element is in the document
- "should call setImage with buildkit when Root is selected" — render with `setImage` as `vi.fn()`, simulate selecting Root, assert `setImage` was called with `{ ...image, imageBuilder: 'buildkit' }`
- "should call setImage with buildkit_rootless when Rootless is selected" — same pattern for the other option

**`ImageFields.spec.tsx`** (in `Images/Fields/tests/`):
- "should render correctly" — render without `isModal`, assert core child components are present
- "should render ImageBuildPrivileges in Properties view" — render without `isModal`, assert build privileges is present
- "should not render ImageBuildPrivileges in modal" — render with `isModal={true}`, assert build privileges is absent
- "should render dividers between field groups" — render without `isModal`, assert parent container has `divide-y divide-primary` classes

**Rationale**: Covers both the new component in isolation and its conditional integration within `ImageFields`. Uses `vi.fn()` for callbacks to verify correct values on interaction.

### 6. Template default

Update `IMAGE_TEMPLATE` to include `imageBuilder: IMAGE_BUILDER_TYPE.ROOTLESS`.

**Rationale**: New images should default to the more secure rootless option.

## Risks / Trade-offs

- **[Existing images without field]** → The field is optional (`imageBuilder?`), so existing images without it will show "Rootless" as default via the fallback in the radio group's `activeRadioButton` prop.
- **[No backend validation coupling]** → The frontend sends the value as-is. If the backend rejects unknown values, it's handled by existing error handling. No special frontend validation needed since values come from a fixed radio group.
