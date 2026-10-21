## Why

Issue #5147 moves the admin app from the legacy `Dial*` ui-kit components to the 2.0 generation, one component at a time. Buttons, Tooltips and Switch are done. `DialLabel`, `DialConfirmationPopup`, `DialNoDataContent` and `DialLoader` are the next batch, and the 2.0 `ConfirmationPopup` already sits on the 2.0 `Button` and `Popup` we now use everywhere else.

## What Changes

- `DialLabel` → `Label` (51 files). Straight rename; `htmlFor` usage is left exactly as it is.
- `DialConfirmationPopup` → `ConfirmationPopup` (42 files). The two call sites passing `dividers` move to `headerDivider` + `footerDivider`.
- `DialNoDataContent` → `NoDataContent` (57 files). The single `containerClassName` becomes `className` (two uses).
- `DialLoader` → `Spinner` (127 files). Every call site pins `size` and `fullWidth` so layout does not depend on the changed defaults. The one `iconClassName` use is dropped.
- Specs that mock `DialLoader` (22 files) and spec assertions on the other three (23 lines) move to the new names in the same change.
- One PR for all four components.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
No behaviour changes; each delta only renames the ui-kit component the requirement names.
- `container-source-field-layout`: InternalImageField names `Label`
- `deployment-export-preview`: loader is a `Spinner`
- `deployment-import`: empty state is `NoDataContent`
- `deployment-import-preview`: loader is a `Spinner`
- `deployments-node-pool-selector`: `Spinner` loading state, `NoDataContent` no-matches
- `mcp-registry-source`: server details sidebar loading/empty components
- `mcp-target-selection`: MCP and tool step loaders are `Spinner`
- `stop-image-build`: confirmation modal built on `ConfirmationPopup`
- `usage-log-pagination`: no-rows overlay renders `NoDataContent`

## Non-goals

- Fixing `DialLabel` usages that lack `htmlFor` (separate a11y change).
- Turning on `NoDataContent`'s new `live` announcement.
- Migrating `DialLabelledText`, `DialInputPopup` or other legacy components.
- Restyling spinners to match the old SVG loader or recolouring them.

## Impact

- ~230 source and spec files under `apps/ai-dial-admin/src`, plus mocks in `test-setup.tsx` if any reference these components.
- Visual deltas accepted from the kit: ConfirmationPopup description type scale (`dial-small-paragraph-text`), 120px loading placeholder and no popup dividers by default; Spinner is a CSS ring rather than the SVG loader icon; `Spinner` no longer takes `iconClassName` and its colour is fixed, so `text-primary`/`text-secondary` classes on loaders stop having an effect.
- No server, API, or context changes.
