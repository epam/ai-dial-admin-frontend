## Why

Config-file entities are currently exposed through a global persisted toggle that replaces each affected list with a separate name-only grid. This breaks the existing folder browsing model, duplicates list plumbing, and makes a source-specific view behave like a cross-application preference rather than a distinct, read-only source.

## What Changes

- Replace the global `showConfigFiles` toggle and swapped config-file grid with a synthetic, flat `file` root in the shared FileManager.
- Show `file` alongside `platform` for supported platform entity views, and as a third root after `platform` and `public` for Assets Applications and Toolsets.
- Load file-backed names lazily when the `file` root is first opened; file rows remain name-only and read-only.
- Route file rows to the existing platform/asset detail views, preserving their config-file reads and read-only presentation. Preserve Catalog Schema's existing `$id` fallback route behavior.
- Add file-root coverage and read-only detail support for Translators; add file-root discovery for Catalog Schemas; continue excluding Keys.
- Retain the existing `schemas` mapping for Platform App Runners, documenting it as Core application-type schemas rather than a standalone app-runner collection.
- Remove the toggle, persisted context state, swap/list components and hooks, wrapper pages, and obsolete config-file-list-only plumbing.

### Non-goals

- Change the existing read-only detail UX, edit controls, or normal platform/public list behavior.
- Treat `file` as a physical Core resource bucket or add Core write APIs for config-file entities.
- Add config-file support for Keys.
- Retain individual source-file provenance, which Core does not expose for merged file-defined entities.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `config-file-entity-views`: Replace toggle/swapped-list requirements with synthetic file-root listing, source-aware navigation, and read-only file-row actions.
- `platform-translators`: Allow file-defined translator discovery and read-only detail rendering.
- `platform-catalog-schemas`: Add file-root discovery while preserving the existing `$id`-based read-only detail fallback.
- `platform-applications`: Add the read-only file root to the existing platform/public multi-root list.
- `platform-toolsets`: Add the read-only file root to the existing platform/public multi-root list.

## Impact

- Shared asset listing and FileManager root/source modeling, including folder context, row navigation, column/action gating, and open-in-new-tab URLs.
- Config-file API type allow-list and route-to-config-type mapping, including `translators`.
- Existing platform and asset detail routes remain the source of config-file reads and read-only rendering.
- Removes global `AppContext` state and local-storage persistence that only support the retired display mode.
