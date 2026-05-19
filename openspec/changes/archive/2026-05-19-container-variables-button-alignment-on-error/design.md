## Context

In `Variable.tsx`, the Name + drag-grip cell and the Value + file-upload cell used `flex flex-row gap-x-2 items-end`. `DialInput` and `ValueFile` render their `DialErrorText` as a sibling of the input inside the field's `flex flex-col`. When validation fails, the field's column grows taller and `items-end` bottom-aligns the paired button to the now-taller column — the button drifts below the input baseline.

`DialNeutralButton` size `Standard` is 40 px (UI kit `Button.tsx`), the input is also 40 px, and `DialRemoveButton` renders inside a 40-px-tall hit area. The error caption belongs to the field component, not to the row — `DialInput` and `ValueFile` own their error captions and lifting them out is not acceptable.

Backend (`ai-dial-admin-mcp-manager-backend/.../FileEnvVarValueDto.java`) enforces `@Pattern("^[-._a-zA-Z0-9]+$")` + `@Size(min=1, max=253)` on `fileName`, identical to the FE rule. Validation behavior must remain byte-for-byte equivalent.

At mobile (<lg) the variable is rendered as a bordered card with a collapsible header above a flex-col stack of fields. The trash button was the trailing element inside the Mount-type cell — visually "delete mount type" rather than "delete row". Field labels were also gated to `index === 0`, leaving variables 2+ as a sea of unlabeled inputs.

## Goals / Non-Goals

**Goals:**
- File-upload button stays anchored to the input/pill row regardless of error state at all viewports.
- Drag-grip stays anchored to the Name input top regardless of error state at lg+.
- Trash button at mobile reads as a row-level action: a vertically-centered sibling of the fields stack.
- Field labels render on every variable at mobile, not only the first.
- No regression to existing `container-variables-row-layout` requirements (drag source, gaps, lg+ trash placement, validation behavior, mobile collapsible header, lg+ list-header labels).

**Non-Goals:**
- Changing validation rules, regex, or length constants.
- Changing `DialInput` / `DialErrorText` / `@epam/ai-dial-ui-kit`.
- Moving the field's error caption out of the field component.
- Absolute-positioned error text.

## Decisions

### File-upload button moves inside `Value`; field label moves above the input + button row

`FileButton` was a sibling of `Value` inside the row cell, so its alignment depended on the row's `items-*`. Whenever the field's `DialErrorText` extended the field column, `items-end` would drift the button. We now render `FileButton` *inside* `Value`'s own `flex flex-col gap-y-1`, immediately to the right of the input/pill in an inner `flex flex-row gap-x-2 items-start` row. `Value` also renders the field label via `DialLabel` directly (instead of passing `labelProps` to `DialInput` / `fieldName` to `ValueFile`). The order inside `Value` is:

```
flex flex-col gap-y-1
├── DialLabel (mobile only)
└── flex flex-row gap-x-2 items-start
    ├── flex-1 wrapper for DialInput / DialPasswordInput / ValueFile (still owns its own error rendering)
    └── FileButton
```

Because the label sits *outside* the inner row, the top of `DialInput` / `ValueFile`'s flex-col is the input/pill — so `items-start` on the inner row anchors `FileButton` to the input/pill top. The field's `DialErrorText` continues to render below the input/pill inside the field component, extending the column downward without moving the button. This satisfies the user constraint ("error is part of field component, you can't lift it") while fully eliminating the drift.

`ValueFile.tsx` no longer takes a `fieldName` prop — the parent (`Value`) owns label rendering for all variants. `DialInput` and `DialPasswordInput` are called without `labelProps` from `Value`.

**Alternatives considered:**
- *`items-center` on the row* — halves the drift instead of eliminating it. Rejected after user feedback that the residual drift was still visible.
- *Lift `DialErrorText` out of the field* — rejected by the user: error is part of the field component contract.
- *Absolute-position the file button to overlap the input row* — fragile, depends on input height; out of scope.

### Name + drag-grip cell uses `items-end lg:items-start`

This cell is unchanged at mobile (drag-grip is `hidden lg:flex`, so the row has a single child and the alignment class is a no-op). At lg+ the cell uses `items-start` because the field column has no label at lg+, so anchoring the drag-grip to the column top is anchoring it to the input top — and the column extends downward with the error caption without moving the grip.

### Mobile card layout: `flex-row [fields-stack | trash]` with `items-center`

`Variable.tsx`'s previous inner wrapper `flex flex-col mt-4 gap-y-4 lg:mt-0 lg:contents` is rewrapped as `flex flex-row items-center gap-x-2 mt-4 lg:mt-0 lg:contents`. Its first child is a new `flex-1 min-w-0 flex flex-col gap-y-4 lg:contents` holding the four field cells (unchanged contents), and its second child is `<div className="lg:hidden"><DialRemoveButton /></div>`. The trash inline inside the Mount-type cell is wrapped in `<div className="hidden lg:flex">` so it shows only at lg+.

Both new wrappers carry `lg:contents`, so at lg+ they collapse out of the box model and the four cells become direct grid children, preserving the existing desktop column-track requirements. At mobile, the outer flex-row uses `items-center` so the trash button is vertically centered against the fields stack as a single block.

### Mobile field labels render on every variable

`mobileLabel` previously gated label rendering with `isTablet && index === 0`. The `index === 0` part is dropped: at mobile every variable card is a standalone unit and should label its own inputs. At lg+ `isTablet` is `false` so no labels render, matching the existing list-header-labels requirement.

## Risks / Trade-offs

- **Risk:** Two `DialRemoveButton` instances are present in the DOM (the lg+ inline one + the mobile centered one); only one is visible per viewport. → **Mitigation:** confirmed acceptable; existing tests grep for the first trash button, which matches the lg+ inline render in jsdom (1024 px default).
- **Risk:** `Value` now owns label rendering, so any future change in `DialInput` / `ValueFile` label semantics needs to be reflected in `Value`. → **Mitigation:** the label is a thin pass-through (single `DialLabel` element); the field component still controls error/caption/invalid styling.
- **Risk:** The mobile flex-row's `items-center` centers the trash against the fields stack; if a field's error makes the stack significantly taller, the trash centroid shifts slightly. → **Mitigation:** acceptable — error captions are short single lines, and the visual centroid still reads as "middle of the row".
- **Risk:** Future UI-kit changes adding a label or caption above the input at lg+ would shift buttons to the label position. → **Mitigation:** the existing `container-variables-row-layout` spec constrains label placement to the list header; any change there would require updating this spec too.
