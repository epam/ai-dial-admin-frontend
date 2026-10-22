## Why

Next sub-task of the component-by-component 2.0 migration (issue #5147), after buttons, switch/tooltips and
label/popup/no-data/spinner. The app still draws tags, banners, checkboxes and radio groups with the legacy
`DialTag`, `DialNotification`, `DialCheckbox` and `DialRadioGroup` from `@epam/ai-dial-ui-kit` (about 110
source files). Move them over together; `DialTabs` is deliberately left out (see Non-goals).

## What Changes

- `DialCheckbox` → `Checkbox` at ~24 files. API change: `checked` → `isSelected`, `indeterminate` →
  `isIndeterminate`, `label` → `labelProps={{ label }}`, `ariaLabel` → `aria-label`. `onChange` is now
  `(value: boolean)`, so the `!!v` guards on the old optional value go.
- `DialRadioGroup` → `RadioGroup` at ~22 files. Shape change: `radioButtons` (`{id, name, content, caption}`)
  → `items` (`{value, label, content, caption}`), `activeRadioButton` → `value`, `elementId` → `id`,
  `fieldTitle` / `labelDescription` → `labelProps` / `caption`. Option arrays are converted through one shared
  mapper rather than hand-edited.
- `DialNotification` → `Notification` at ~41 files. Prop shape is near-identical; adds `type` and `action`.
  In-page banners use `type={NotificationType.SectionMessage}`.
- `DialTag` → `Tag` for real tags (closable chips, schema type, autocomplete and multi-select values), and →
  `Badge` for the status-style sites that hand-style a tag with `className` (`ReadOnlyBadge`, "Approved",
  turn-count, version chips). `Tag`'s `onRemove` gets an i18n `removeLabel`.
- **BREAKING** (visual): 2.0 checkboxes, radios, banners and chips differ in size, spacing and radius, so every
  screen using them changes slightly.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `deployment-banner`: `EntityBanner` names `DialNotification` in two requirements.
- `deployment-import-preview-validation-errors`: the per-tab `ValidationBanner` names `DialNotification`.
- `entity-container-status-banner`: the "Go to Container" CTA and `EntityBanner` delegation name it.
- `image-status-banner`: the removed inline `DialNotification` is renamed.
- `inline-source-field-warnings`: "Top banners remain unchanged" names it.
- `mcp-try-it-out`: the response status badge names it.

No behaviour changes; each delta only renames the component in normative text so the specs don't go stale.

## Non-goals

- `DialTabs` → `Tabs`. The 2.0 `TabItem` has no `invalid` / `warning`, which `ConfigurationPreview.utils`,
  `Publications/View` and `ContainerView` rely on, and no responsive collapse or `desktopTabClassName`.
  Deferred until the kit closes that gap or a decision is made; its own follow-up.
- `DialTagInput` / `TagInput` and every other legacy component (`Input`, `Select`, `Loader`, …).
- `NotificationPortal` and the toast context: they render the app's own `Notification` component, not the kit's.
- Redesigning any banner copy, option label or tag content.

## Impact

- ~110 files under `apps/ai-dial-admin/src` change their ui-kit import, tag name and props; specs that assert
  legacy classes or names are updated.
- Shared components touched: `EntityBanner`, `ReadOnlyBanner`, `ReadOnlyBadge`, `CheckboxList`,
  `MultiSelectTagsRenderer` (its hidden-clone width measurement sits on `Tag`), `ConfigScopeSelector`,
  `ModelType`, `SingleValueAutocomplete`, `MultiValueAutocomplete`.
- No dependency bump: `@epam/ai-dial-ui-kit` stays at 0.15.3.
