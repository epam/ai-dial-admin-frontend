## Context

Issue #5147 migrates legacy `Dial*` ui-kit components to their 2.0 counterparts. ui-kit 0.15.3 ships all fourteen components in this batch under `components/New/`. The legacy ones are still exported from the main entry, so migrated and unmigrated code coexist and each component can move independently.

Call sites (excluding specs), from the import and JSX scan: `DialCollapsibleSidebar` 10 files, `DialSegmentedControl` 9, `DialPasswordInput` 9 (11 uses), `DialButtonDropdown` 8, `DialErrorText` 8, `DialRadioButton` 7 (14 uses), `DialFileIcon` 7 (11 uses), `DialTextarea` 6, `DialSearch` 5, `DialRadioGroupPopupField` 2, and one file each for `DialSchemaRenderer`, `DialTagInput`, `DialFileName` and `DialConditionalResizableContainer`. Eleven spec files reference one of these names, one line each, as an import or a mock; any mock that reads legacy prop names (for example `options` on a segmented control) must follow the 2.0 names.

## Goals / Non-Goals

**Goals:**
- Replace the fourteen legacy components in app source and specs, keeping layout and behaviour as they are today.
- Land as one reviewable PR with both typecheck gates at zero.

**Non-Goals:**
- Legacy components with no 2.0 counterpart, and components used in more than 10 files (see proposal).

## Decisions

### Seven components are renames
`DialErrorText`, `DialTextarea`, `DialSearch`, `DialPasswordInput`, `DialButtonDropdown`, `DialFileName` and `DialConditionalResizableContainer` keep every prop the app passes today.
- `Textarea.resize` widens from `boolean` to `boolean | TextareaResize`; no site passes it.
- `PasswordInput` omits `type` and `iconAfter` from `InputProps`; no site passes either.
- `ButtonDropdown` extends the 2.0 `ButtonProps`, so `variant` and `appearance` keep working with the already-migrated button enums.
- `DialSearch` call sites pass `id`, `value`, `onChange`, `placeholder` and one `size`; `SearchProps` covers all of them.

### CollapsibleSidebar: `containerClassName` → `className`, drop `iconSize`
Every one of the ten sites passes `containerClassName`; it becomes `className`. `iconSize={24}` (two sites: `Containers/View/ExecutionLog/ExecutionLog.tsx`, `FoldersStorage/FoldersStorage.tsx`) has no 2.0 equivalent and is dropped. The 2.0 sidebar adds `collapseLabel` and `expandLabel`; the defaults stay, so no new i18n keys. Visual check on the two `border-transparent mr-0` sites, since `className` now lands on the root of a redesigned container.

### SegmentedControl: `options` → `items`, `ariaLabel` → `aria-label`
The option shape is identical (`value`, `label`, `icon`, `disabled`), but the type is now `SegmentedControlItem`. The app's `SegmentedControlOption` type imports (9 files) are renamed with it. The control changes from a bordered bar to a pill with a raised selected segment; accepted as the 2.0 look.

### Radio: `inputId`/`label`/`checked` map to `id`/`labelProps`/`isSelected`
| Legacy | 2.0 |
|---|---|
| `inputId` | `id` |
| `checked` | `isSelected` |
| `label` | `labelProps={{ label }}` |
| `caption` | `caption` (string only; the legacy prop accepted `ReactNode`) |
| `oneLineCaption` (2 uses) | dropped |
| `className="size-[18px]"` | dropped for the two grid renderers |

Points to watch:
- 2.0 `Radio` always draws its own 20px circle and applies `className` to the wrapper row, not the circle, so the `size-[18px]` the two grid renderers pass (`RadioButtonRenderer`, `RadioNameCellRenderer`) stops sizing anything. Drop it and check the row still fits the 24px / 40px cells they sit in.
- `Radio` calls `onChange(value)` only when the input becomes checked. The legacy `DialRadioButton` callers that pass `onChange={() => handle(...)}` need no change; the `NodePoolItem` call that passes `onSelect` directly receives the `value` argument as before.
- `RadioButtonRenderer` passes `checked` without `onChange`; `isSelected` without `onChange` is equally read-only.
- Every `caption` the app passes is a `t()` string, so the `string`-only prop type is not a problem. `oneLineCaption` is used only in `TestSuites/Metrics/ScoreSettings/TestCaseOverallScore.tsx`; check that the caption wrapping still looks right there once it is dropped.

### FileIcon: pass `type`, `name` and `fileExtension`
The legacy icon took only `extension`. The 2.0 `FileIcon` requires `type` (`DialItemType.File`) and `name`, and derives the glyph from `fileExtension` or the name's suffix. Decisions per site shape:
- Sites that have a file name (`ApplicationFileManager`, `ValueFile`, `ImportFileType` name callback, `EnvVarValueCellRenderer`, `SelectedFile`): pass `type={DialItemType.File}`, `name={fileName}` and the extension they already compute.
- Sites that pass a literal `"zip"` or `"json"` (`ImportFileType`, `ImportConfig/Files`, `ExtraDataCellRenderer`): pass `name="file.zip"` / `"file.json"`, i.e. a constant name whose only job is to select the glyph.
- All of them are decorative except `TestSuites/TestCases/Import/SelectedFile.tsx`: pass `decorative`. The 2.0 icon otherwise exposes `role="img"` with an `aria-label` like "ZIP file", and every site already shows the file name next to it. This is the same rule `a11y.md` applies to icons inside an already-labelled control. `SelectedFile` keeps its icon exposed because its spec asserts which type icon shows for `.csv` and `.zip`, and the legacy icon was exposed there too; the expected names become "CSV file" and "ZIP file".

Alternative considered: a local wrapper that keeps the `extension` API. Rejected: it invents a shape the kit does not have for eleven call sites that are easy to convert.

### TagInput, RadioGroupPopupField, SchemaRenderer: single-site rewrites
- `TagInput`: `elementId` → `id`, `initialTags` → `defaultValue`, `captionDescription` → `caption`, `errorText` → `error`, `label` → `labelProps={{ label }}`. `initialTags` was uncontrolled; `defaultValue` is too.
- `RadioGroupPopupField` (2 sites): the legacy field took `radioButtons`, `selectedRadioValue`, `onChangeRadioField`, `onApply()`, `htmlFor`/`label`, `isValid`, `customInputValue`. The 2.0 field takes `items`, `value`, `selectedValue`, `onSelectionChange`, `onApply(value?)`, `labelProps`, `isValid`, `customValue`. The legacy `selectedValue` was the displayed value and `selectedRadioValue` the selection state, so they become `value` and `selectedValue`. The items change from `RadioButtonWithContent` (`id`, `name`) to `RadioGroupItem` (`value`, `label`) at these two sites only; every other radio group stays on the legacy `DialRadioGroup` and its legacy item type, so `RadioButtonWithContent` imports elsewhere are left alone. `ExtraDataField` shows its value through `customValue` and `placeholder`, with no `value`, so the selected item's label is never shown there. `ForwardAuthTokenField` passes its selected id as both `value` and `selectedValue`. `emptyValueText` was never reached in `ForwardAuthTokenField` (its value always matches an item), so it is dropped; `inputClassName` becomes `fieldClassName`; `valueClassName` is dropped because the 2.0 value span already truncates.
- `SchemaRenderer`: `jsonEditorTheme` is gone from the 2.0 props. Remove it, along with the now-unused `EditorThemes` import and `currentTheme` cast in `SchemaUIRenderer.tsx` if nothing else reads them, and confirm the embedded JSON editor still follows the app theme.

### Mechanics
The seven renames are scripted replaces of import and JSX, then reviewed. The other seven are done by hand, one component at a time, because the props change. Import from `@epam/ai-dial-ui-kit` as today. Specs keep asserting on role and accessible name per `testing.md`; any spec that mocks one of these names by string or queries the old DOM is updated in the same commit as its component.

## Risks / Trade-offs

- [Visual drift: `SegmentedControl` pill, `Radio` and field styling, sidebar container] → accepted 2.0 look; list in the PR description.
- [Radio grid renderers lose their 18px sizing] → drop `className`, verify the cell renders and the row stays clickable; fall back to a wrapper `div` with the size class if it clips.
- [A `FileIcon` that was silent becomes an announced image] → `decorative` at every site except `SelectedFile`, whose spec asserts the icon.
- [Unused imports and types left behind (`EditorThemes`, `SegmentedControlOption`, legacy prop types)] → both typecheck gates plus a grep of `apps/ai-dial-admin` for all fourteen legacy names at the end; none may remain.
- [A spec still asserts the old DOM and passes by accident] → update the eleven known specs in the same commit as the component; grep specs for each legacy name.

## Open Questions

None.
