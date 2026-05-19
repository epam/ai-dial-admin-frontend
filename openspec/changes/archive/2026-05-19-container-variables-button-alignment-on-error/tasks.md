## 1. Alignment fix at lg+

- [x] 1.1 In `Variable.tsx`, change the Name + drag-grip row cell's container className from `flex flex-row gap-x-2 items-end` to `flex flex-row gap-x-2 items-end lg:items-start`.

## 2. File-upload button moves inside `Value`

- [x] 2.1 In `Value.tsx`, render a `flex flex-col gap-y-1` outer that holds an optional `DialLabel` (rendered when `fieldName` is provided) and an inner `flex flex-row gap-x-2 items-start` containing the input/pill (DialInput / DialPasswordInput / ValueFile) and `FileButton`.
- [x] 2.2 In `ValueFile.tsx`, remove the `fieldName` prop and the internal `DialLabel` rendering — `Value` now owns the label.
- [x] 2.3 In `Variable.tsx`, remove the flex-row wrapper around `<Value>` and `<FileButton>`. Render `<Value ... />` directly as a stack/grid cell and remove the `FileButton` sibling and its import.

## 3. Mobile card layout: trash centered next to fields stack

- [x] 3.1 In `Variable.tsx`, change the fields wrapper from `flex flex-col mt-4 gap-y-4 lg:mt-0 lg:contents` to a `flex flex-row items-center gap-x-2 mt-4 lg:mt-0 lg:contents` containing a new `flex-1 min-w-0 flex flex-col gap-y-4 lg:contents` for the fields stack and a `<div className="lg:hidden"><DialRemoveButton /></div>` for the centered mobile trash.
- [x] 3.2 In `Variable.tsx`, wrap the inline trash inside the Mount-type cell in `<div className="hidden lg:flex">` so it shows only at lg+.

## 4. Mobile field labels on every variable

- [x] 4.1 In `Variable.tsx`, drop the `index === 0` constraint in `mobileLabel`, the Value `fieldName`, and the Mount-type `label` so labels render on every variable at mobile.

## 5. Tests

- [x] 5.1 In `tests/Variable.spec.tsx`, add a structural test asserting that the Name row container uses `lg:items-start` and that the FileButton's parent row uses `items-start`.
- [x] 5.2 In `tests/Value.spec.tsx`, update the previous "button lives in Variable" assertions to reflect that `FileButton` and the hidden file input are now rendered inside `Value`, and that the input/button row uses `flex-row items-start`.
