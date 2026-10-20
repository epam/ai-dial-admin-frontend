## Why

An asset toolset's Audit tab showed the Usage tab and then nothing — no figures, no frame, no empty
state. The dashboard resolves an asset's deployment name from `entity.path` alone, and a merged
Core-resource detail entity carries its identity only in `_metadata`. The name came back null, the
scope with it, and the component returned `null`.

Two faults, and the second is why the first went unreported for as long as it did: a blank panel
reads as a layout glitch, not as a dashboard that could not find its entity.

## What Changes

- An asset's path is read the way every other write path in the repo reads it — the flat field
  first, then the merge metadata.
- Where no name can be resolved, the panel states that the entity cannot be matched to the usage
  log instead of rendering nothing, and issues no request.

## Impact

- Affected specs: `analytics/dashboards`
- Affected code: `Usage/utils/entity-scope.ts`, `Usage/EntityUsageDashboard.tsx`, two i18n keys
- No query, request count or figure changes for an entity that already resolved.
