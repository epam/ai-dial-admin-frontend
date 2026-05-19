## Why

Issue [#3223](https://github.com/epam/ai-dial-admin-frontend/issues/3223) follow-up. The Container Variables row needs three fixes around mobile / error-state layout:

1. **File-upload button drifts on error.** When a Name or file-name validation error caption appears below the input, the paired button bottom-aligned to the now-taller field column, drifting below the input baseline. BE enforces the same `^[-._a-zA-Z0-9]+$` / 1–253 char rule on `FileEnvVarValueDto.fileName`, so the validation itself stays — only the visual behavior needs fixing.
2. **Trash button reads as "delete mount type" on mobile.** It was the trailing element inside the Mount-type cell; a row-level destructive action belongs outside the field stack.
3. **Field labels were missing on second-and-later variables at mobile.** Labels were gated to `index === 0`, leaving variables 2+ as a sea of unlabeled inputs on mobile.

## What Changes

- **File-upload button position**: move `FileButton` from being a flex sibling of `Value` in `Variable.tsx` to being a sibling of the input/pill *inside* `Value`'s own flex-col. The input + button share a `flex flex-row items-start` row; the field's `DialErrorText` continues to render inside `DialInput` / `ValueFile` below that row, so the button stays anchored to the input top regardless of error state. The field's label is rendered above the row by `Value` (so the button row is the top of the column at both mobile and lg+).
- **Name + drag-grip cell**: change from `items-end` to `items-end lg:items-start` so the drag-grip stays anchored to the input top at lg+ regardless of error state.
- **Mobile card layout**: restructure the variable card so the trash button is rendered as a vertically-centered sibling of the fields stack on the right side of the card. The trash inside the Mount-type cell is hidden at mobile (`hidden lg:flex`).
- **Mobile field labels**: drop the `index === 0` gate so all variables at mobile show field labels (Variable Name, Description, Value, Mount type), matching the standard per-variable card pattern.
- No change to validation rules, regex, or length constants.
- No change to error rendering — `DialInput` and `ValueFile` continue to own their inline error captions.

### Non-goals

- Loosening or removing variable-name or file-name validation.
- Touching backend validation in `ai-dial-admin-mcp-manager-backend`.
- Lifting `DialErrorText` out of `DialInput` / `ValueFile`.
- Absolute-positioned error text.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `container-variables-row-layout`: add requirements covering (a) the `FileButton` placement inside the `Value` cell, (b) responsive cross-axis alignment of the Name + drag-grip row, (c) the new mobile placement of the trash button as a vertically-centered sibling of the fields stack, and (d) per-variable field labels on mobile.

## Impact

- `apps/ai-dial-admin/src/components/Deployments/Fields/ContainerVariables/Variable.tsx`
- `apps/ai-dial-admin/src/components/Deployments/Fields/ContainerVariables/Value.tsx`
- `apps/ai-dial-admin/src/components/Deployments/Fields/ContainerVariables/ValueFile.tsx`
- `tests/Variable.spec.tsx`, `tests/Value.spec.tsx` (updated to match new structure)
- No API, contract, or i18n changes.
