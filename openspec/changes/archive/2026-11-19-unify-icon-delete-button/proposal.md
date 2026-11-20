## Why

Delete/remove controls are drawn two different ways. The shared `Common/RemoveButton` renders an icon-only
button with a red outline, while about fourteen call sites hand-roll a borderless `GhostIconButton` with a
red trash icon. The borderless form is the intended look for an icon-only control; a bordered one is for a
button that carries a label. Every new row editor re-decides which to use, and the two keep drifting.

Separately, issue #5602: a long unbroken string in a toast (a resource path, a Request ID) cannot wrap and
runs past the right edge of the notification card.

## What Changes

- `Common/RemoveButton` becomes the single delete/remove control. Without a `label` it renders a borderless
  ghost icon button with a red trash icon; with a `label` it renders a bordered danger button with the
  trash icon before the text.
- Every icon-only delete/remove control moves onto it: the ~14 hand-rolled `GhostIconButton` +
  `IconTrashX` sites (Analytics pipeline editors, `SubjectRulesEditor`, `EnrichmentRoutes`,
  `ResourceMultiAuth`, `FileUploadField`, `ChipRow`, `FilterGroup`, `AggregateForm`, …) and the existing
  `RemoveButton` consumers, which lose their border.
- Labelled delete buttons all get the border: the entity header wrappers, `PromptDetails`, `AddNewTool`,
  `Datasets/TestCases/Header`, `UndeclaredPropertiesBanner` already do and move onto the shared button;
  `MetricCard`, the saved-query Delete in `QueryBuilder`, and the Delete all in `FileUploadField` currently
  do not and gain it.
- `RemoveButton` call sites that mean "clear", not "delete" (`AppRunnersResource`) get a clear control
  instead of a trash icon.
- `Notification` description wraps long unbroken text (`break-words`, `min-w-0`) so the path and Request
  ID stay inside the card (#5602).
- `.claude/rules/components.md` gains a rule for new components: before hand-rolling a control with a
  shared equivalent (delete/remove first), reuse it; extend the shared component when a variant is missing.

## Capabilities

### New Capabilities
- `delete-button`: how the shared delete/remove button looks and behaves with and without a label.
- `notification-text-wrapping`: toast description and Request ID wrap inside the card.

### Modified Capabilities
<!-- None: no existing spec states how delete controls are styled. -->

## Impact

- `src/components/Common/RemoveButton/RemoveButton.tsx` (new `label` variant) and its spec.
- ~35 consumer files under `src/components/` (list in design.md); their specs that query by role/name
  keep working because the accessible name is unchanged.
- `src/components/Notification/Notification.tsx`.
- `.claude/rules/components.md` (mirrors regenerate on pre-commit).
- Visual change app-wide: bordered icon-only delete buttons lose the border.

## Non-goals

- `IconX` clear/close buttons (`ValueFile`, `LifecycleDateField`, `SingleValueAutocomplete`, …).
- Grid action-menu items in `constants/grid-columns/actions.tsx` and `AppRouteList` (menu entries, not buttons).
- Changing the ui-kit button components.
