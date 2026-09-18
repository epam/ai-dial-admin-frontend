## Why

Issue [#4349](https://github.com/epam/ai-dial-admin-frontend/issues/4349): duplicating a Catalog
App Runner whose `$id` needs URL-encoding (it is always a URI, so it always does) shows a success
notification alongside a 404 page instead of landing on the new entity. The entity is created
correctly — only the client-side redirect is wrong.

`getEntityPath` (`apps/ai-dial-admin/src/utils/open-in-new-tab.ts`) builds the redirect URL for the
six flat platform entity types from `name || encodeURIComponent($id)`, then always applies
`encodeURIComponent` again on return. For a runner (the only type that falls to the `$id` branch —
Models/Interceptors always have `name`), that pre-encodes `$id` and then encodes it a second time,
producing a doubly-encoded URL segment Next.js's single automatic decode cannot unwind back to the
resource Core actually stores. Row-click navigation (which reads the grid row's already-decoded
`name`) only ever encodes once and works correctly — confirmed against real captured URLs for the
same entity: the working row-click link ends in `...%3A%2F%2Fmydial.epam.com%2F...`, the broken
post-duplicate redirect in `...%253A%252F%252Fmydial.epam.com%252F...`.

The double-encoding was reintroduced by commit `0e7f530df` ("restore double-encoding for $id in
open-in-new-tab", shipped in PR #4340) on the mistaken assumption that the `$id` branch needed an
extra encoding layer to match Core's stored resource name. It doesn't: the shared final
`encodeURIComponent` call already provides the one encoding layer every branch needs.

## What Changes

- `getEntityPath`'s flat-platform-entity branch: stop pre-encoding `$id` — use it raw, so it goes
  through the same single final `encodeURIComponent` the `name` branch already relies on.
- Update the tests that currently assert the double-encoded output as correct
  (`open-in-new-tab.spec.ts`, `path-round-trip.spec.ts`, `review-fixes.spec.ts`) to expect
  single-encoding instead, matching the working row-click behavior.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `platform-app-runners`: add a requirement that duplicating a runner with a URI-shaped `$id`
  navigates to the newly created runner instead of a 404.

## Impact

- `apps/ai-dial-admin/src/utils/open-in-new-tab.ts` — `getEntityPath`'s flat-platform-entity
  branch (affects `PlatformModels`/`PlatformAppRunners`/`PlatformInterceptors`/`PlatformRoutes`/
  `PlatformRoles`/`PlatformKeys`, though only App Runners ever exercises the `$id` fallback today).
- `apps/ai-dial-admin/src/utils/tests/open-in-new-tab.spec.ts`
- `apps/ai-dial-admin/src/components/Assets/Platform/AppRunners/tests/path-round-trip.spec.ts`
- `apps/ai-dial-admin/src/components/Assets/Platform/AppRunners/tests/review-fixes.spec.ts`
