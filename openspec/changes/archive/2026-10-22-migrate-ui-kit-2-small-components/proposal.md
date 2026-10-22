## Why

Issue #5147 moves the admin app from the legacy `Dial*` ui-kit components to the 2.0 generation, one batch at a time. Buttons, Tooltips, Switch, Label, ConfirmationPopup, NoDataContent and Spinner are done. This batch takes every remaining legacy component that has a 2.0 counterpart and is used in 10 files or fewer, so the long tail goes in one PR and the large ones (`DialInput`, `DialSelectField`, `DialFormPopup`, …) can follow separately.

## What Changes

Straight renames (props line up):
- `DialErrorText` → `ErrorText` (8 files)
- `DialTextarea` → `Textarea` (6 files)
- `DialSearch` → `Search` (5 files)
- `DialPasswordInput` → `PasswordInput` (9 files)
- `DialButtonDropdown` → `ButtonDropdown` (8 files)
- `DialFileName` → `FileName` (1 file)
- `DialConditionalResizableContainer` → `ConditionalResizableContainer` (1 file)

Renames that need prop changes at the call site:
- `DialCollapsibleSidebar` → `CollapsibleSidebar` (10 files): `containerClassName` → `className`, `iconSize` dropped (2 uses).
- `DialSegmentedControl` → `SegmentedControl` (9 files): `options` → `items`, `ariaLabel` → `aria-label`.
- `DialRadioButton` → `Radio` (7 files, 14 uses): `inputId` and `label` / `checked` move to `id`, `labelProps` and `isSelected`; `className` and `oneLineCaption` have no equivalent.
- `DialFileIcon` → `FileIcon` (7 files, 11 uses): the 2.0 icon needs `type` and `name`, not just `extension`.
- `DialTagInput` → `TagInput` (1 file): `elementId`, `initialTags`, `captionDescription`, `errorText`, flat label props → `id`, `defaultValue`, `caption`, `error`, `labelProps`.
- `DialSchemaRenderer` → `SchemaRenderer` (1 file): `jsonEditorTheme` no longer exists.
- `DialRadioGroupPopupField` → `RadioGroupPopupField` (2 files): different API (`items`, `value`, `onApply(value)`, `labelProps`).

Specs that import or assert on these names (11 files) move in the same change. One PR for all fourteen components.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
No behaviour changes; each delta only renames the ui-kit component the requirement names.
- `analytics/query-builder`: the mode switch is a `SegmentedControl`
- `analytics/sessions-listing`: the rating filter reuses `SegmentedControl`
- `container-variables-row-layout`: `ValueFile` renders `ErrorText`
- `deployments-node-pool-selector`: the node pool search input is a `Search`; radio rows use `Radio` semantics
- `mcp-docker-image-source`: the Create button is a `ButtonDropdown`
- `mcp-registry-images`: the Add button is a `ButtonDropdown`

## Non-goals

- Legacy components with no 2.0 counterpart: `DialSteps`, `DialAnalyticsCard`, `DialAnalyticsHistogram`, `DialAnalyticsBarGroup`, `DialLoadFileAreaField`, `DialLoadFileArea`. They stay on the legacy components and need a decision per component.
- Components used in more than 10 files: `DialInput`, `DialSelectField`, `DialSelect`, `DialFormPopup`, `DialInputPopup`, `DialNotification`, `DialNumberInput`, `DialCheckbox`, `DialPopup`, `DialRadioGroup`, `DialTabs`, `DialTag`, `DialDropdown`, `DialLabelledText`.
- Fixing existing accessibility gaps at migrated sites beyond what the 2.0 component requires of the call site.
- `@epam/ai-dial-react-file-manager` components, grid and editor wrappers.

## Impact

- ~75 source files and 11 spec files under `apps/ai-dial-admin/src`; `test-setup.tsx` only if it mocks one of these names (it does not today).
- Visual deltas accepted from the kit: `SegmentedControl` is a pill with a raised selected segment instead of a bordered bar; `Radio`, `Textarea`, `Search`, `PasswordInput` and `TagInput` follow the 2.0 field styling; `CollapsibleSidebar` gains its own collapse and expand labels.
- Accessibility changes from the kit that specs now assert: `SegmentedControl` is a `radiogroup` of `radio` items with `aria-checked`, not a `tablist` of tabs; a required `Textarea` label announces "(required)" instead of "*".
- No server, API, or context changes.
