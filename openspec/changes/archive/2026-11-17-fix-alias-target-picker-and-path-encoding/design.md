## Context

Core parses an alias `target.path` with `ResourceDescriptorFactory.fromAnyUrl` (`AliasService.toTargetResource`). It
splits off `type/bucket/` and passes the rest to `fromEncoded`, so the relative path must be percent-encoded. The
file-manager tree reports a Public row's `path` decoded (`public/QA/Code Apps ALS/app__1.0.0`), and
`toAliasTargetPath` (`utils/aliases/target.ts`) concatenates it raw. Platform and config.json picks are bare names.

The picker's Platform and config.json bodies are `FlatAssetGrid` in `isSelectMode`. It passes `getHref` to
`getFlatAssetColumns`, so `DisplayNameCellRenderer` wraps the name in `EntityLinkCell`; and it passes
`getEmptyStateContent(view, t)` as the empty state whatever the source or mode.

## Goals / Non-Goals

**Goals:**
- A Public target with any characters in its path is accepted by Core and shown readably.
- Picker grid names are plain text next to a radio/checkbox; empty states never advertise an unavailable action.

**Non-Goals:**
- Restyling `TargetField`; touching Platform/config.json targets; the Roles limit key.

## Decisions

**Encode in `toAliasTargetPath`, decode in `parseAliasTargetPath`.** Split the picked path on `/`, apply
`encodeURIComponent` per segment, rejoin. Core decodes each segment with its own `UrlUtil.decodePath`, so the
mapping is the inverse. `parseAliasTargetPath` decodes `reference` so `Target.tsx` and any re-pick see the readable
form. Alternative: encode in the server action payload. Rejected: the stored value would then differ from what the
form holds, and the parse side would need the same inverse anyway. A malformed escape in a stored path must not
throw: `parse` keeps returning `null` for what it cannot read, and the form already shows that as plain text.

**Select mode drops the link by not passing `getHref`.** In `FlatAssetGrid`, build columns with an href getter that
returns `undefined` when `isSelectMode`. `DisplayNameCellRenderer` already renders plain `EllipsisTooltip` without an
href, so no new renderer. Radios come from the existing `SINGLE_ROW_SELECTION` (`RADIO_BUTTON_COL_DEF`), already
applied for `isSingleSelect`. Alternative: a dedicated picker name renderer. Rejected as a second shape for the same
cell; this repo prefers reusing the sibling.

**Empty state derived in `FlatAssetGrid`, not in `getEmptyStateContent`.** The helper is per view and shared by the
Public file manager. `FlatAssetGrid` knows source and mode, so it blanks `description` when `isSelectMode` or
`source === ConfigFile`. The Platform listing tab keeps the full text.

**Radio inside the name cell.** The `SINGLE_ROW_SELECTION` selection column hides its checkbox (`NO_CHECKBOX_CLASS`)
and expects a custom renderer, so it showed up as an empty bordered column. Single-select picker grids use
`RadioNameCellRenderer` with `SINGLE_ROW_SELECTION_NO_CHECKBOX`, as `RadioSelectGrid` does for the test suite target.

**Target field via `InputPopup`.** Same trigger as the app runner field; `SelectEntitiesPopup` is its child, rendered
only while open. **Public tree chrome.** The library draws the breadcrumb only if `showNavigationPanel` is set and pads
the tree panel only through its heading, so `PublicEntityTree` turns the breadcrumb on and pads the `aside` itself.

## Risks / Trade-offs

- [Radios reported missing in #5568 although the config already adds them] → verify in the browser once links are
  gone; if still absent, the cause is in the selection column, fixed within this change.
- [Pre-existing aliases saved with a raw path] → they were never accepted by Core, so none exist for paths with
  spaces; paths without special characters encode to themselves.
- [Empty-state change reaches every `FlatAssetGrid` user] → intended; the listing specs name the exceptions.
