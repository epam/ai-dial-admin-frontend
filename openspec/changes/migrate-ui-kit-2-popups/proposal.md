## Why

Issue #5147 moves the admin app from the legacy `Dial*` ui-kit components to the 2.0 generation, one batch at a time. Buttons, Tooltips, Switch, Label, ConfirmationPopup, NoDataContent, Spinner and the small-component batch are done. The popup family is what remains of the large components that have a 2.0 counterpart, and `DialFormPopup` and `DialInputPopup` have none: ui-kit 0.15.3 ships `Popup` and `ConfirmationPopup` under `components/New/` and nothing else. `Popup` takes `mainButtons`, so a form popup is a `Popup` with its buttons declared at the call site.

## What Changes

- `DialPopup` → `Popup` (25 source files, 2 specs). Props carry over; `dividers` / `dividerFooter` become `headerDivider` / `footerDivider`, and a `ReactNode` `header` gets an `ariaLabel`.
- `DialFormPopup` → the 2.0 `Popup` with `mainButtons` declared at each of the ~60 call sites. Two small shared pieces in `components/Common/FormPopup/` keep the sites short: `getFormPopupButtons` (Cancel + primary Submit as `ButtonProps[]`) and `PopupLoader` (the 120px spinner body shown while loading).
- `DialInputPopup` → a new local `InputPopup` in `components/Common/InputPopup/`, built on the 2.0 `Input` and `TagInput`. It keeps the legacy prop contract for its 12 call sites.
- Specs that import, mock or assert on these names move in the same change.
- The ten capability specs that name `DialPopup`, `DialFormPopup` or `DialInputPopup` in a requirement are updated to the new names.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
No behaviour changes; each delta only renames the component a requirement names.
- `analytics-bottom-drawer`: the pivot-cell full-value popup is a `Popup`
- `argument-template-editor`: the JSON editor dialog is a `Popup`
- `container-source-field-layout`: `InternalImageField` is built on `InputPopup`
- `deployments-node-pool-selector`: the node pool modal shell is a `Popup`
- `global-firewall-preview`: `GlobalFirewallCompareModal` is a `Popup`
- `inline-source-field-warnings`: the warning icon goes into `InputPopup`'s `iconBefore`
- `mcp-registry-source`: `McpRegistryModal` is built on `Popup` with `mainButtons`
- `mcp-target-selection`: `ChangeMcpToolModal` is a `Popup`
- `save-as-new-image-on-rename`: the rename modal is a `Popup` with `mainButtons`
- `stopped-container-display`: the container name shows in `InputPopup`

## Non-goals

- Upstreaming a 2.0 `InputPopup` to ui-kit. The local component is written so a later swap is one file.
- `DialConfirmationPopup` (already migrated) and `DialRadioGroupPopupField` (migrated in the small-components batch).
- Fixing accessibility gaps at migrated sites beyond what the 2.0 component requires of the call site.
- Redesigning the dialogs. Visual deltas come from the kit.

## Impact

- ~95 source files and ~10 spec files under `apps/ai-dial-admin/src`; `test-setup.tsx` only if it mocks one of these names.
- New shared code with specs: `Common/FormPopup` (`getFormPopupButtons`, `PopupLoader`) and `Common/InputPopup`.
- Visual deltas accepted from the kit: 2.0 popups default to no header or footer rule; the footer is the 2.0 button row; the `InputPopup` trigger follows the 2.0 `Input` look.
- Accessibility: `Popup` with a `ReactNode` header is unnamed without `ariaLabel`; the legacy `InputPopup` trigger had the fixed names `open-popup` and `input-popup-field`, which become real accessible names.
- No server, API, or context changes.
