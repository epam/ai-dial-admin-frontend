## Why

The `showConfigFiles` toggle (PR #4536, `config-file-entity-views`) is hidden whenever the admin
backend is configured, so an admin with the admin API available has no way to browse Core's
config-file (`aidial.config.json`) entity population — they can only see the admin-backend's stored
entities. The config-file read path is fully independent of the admin API (`configFileApi` targets
`DIAL_CORE_API_URL`, and every list swap / detail-page branch keys off `showConfigFiles` or the
`configFile=true` query param, not the flag), so the gate is purely a UI decision, and it withholds
a working capability.

## What Changes

- `ConfigFilesToggle` no longer self-hides when `featureFlags.adminApiEnabled` is `true`: the toggle
  renders on the seven covered views regardless of the admin API's availability. With the admin API
  on, toggle-off keeps the admin-backend asset browser and toggle-on swaps to the read-only,
  names-only config-file list — turning the toggle from a no-admin-API fallback into a side-by-side
  view of the two populations.
- The toggle's doc comment and the spec scenarios pinning the old gating are updated to match.
- No changes to `ConfigFileListSwap`, `BaseAssetList`, the `PageList` components, server actions, or
  detail pages — all of them are already flag-agnostic.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `config-file-entity-views`: the "toggle control is rendered only where it applies" requirement
  drops its `adminApiEnabled is false` condition (and its "toggle absent with the admin API
  configured" scenario); the Purpose paragraph is reworded accordingly. All other requirements —
  placement on the seven covered views, the in-place list swap, the lazy names-only fetch, the
  `configFile=true` read-only detail pages — are unchanged.

## Impact

- `apps/ai-dial-admin/src/components/Common/ConfigFilesToggle/ConfigFilesToggle.tsx` — remove the
  `adminApiEnabled` early return; update the doc comment.
- `apps/ai-dial-admin/src/components/Common/ConfigFilesToggle/tests/ConfigFilesToggle.spec.tsx` — the
  renders-null-with-admin-API assertion flips to assert the toggle renders.
- `openspec/specs/config-file-entity-views/spec.md` — Purpose and toggle-placement requirement
  updated in the same change (per AGENTS.md).
- UX consequence, accepted: `showConfigFiles` persists to `localStorage`, so a user who flips it on
  with the admin API configured sees names-only config-file lists on all seven covered views until
  they flip it back. Consistent with the toggle's existing persistence behavior.

## Non-goals

- Mounting the toggle on catalog-level list pages (`/models`, `/applications`, `/interceptors`) —
  those pages redirect home without `DIAL_ADMIN_API_URL` and have no toggle wiring; expanding
  coverage is a separate change if wanted.
- Any change to how config-file entities are fetched, rendered, or navigated — only the toggle's
  visibility condition changes.
