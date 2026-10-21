## Why

For all six flat platform entities (Models, App Runners, Interceptors, Routes, Roles, Keys),
`parseEncodedFlatPath` always yields `path === name`, so the `?path=` query parameter on their
detail-page URLs carries exactly the same data as the `[id]` URL segment. The parameter was
inherited from versioned asset entities where `name ≠ path`; it has no semantic value for flat
resources and adds noise to URLs.

## What Changes

- `open-in-new-tab.ts` `getEntityPath`: remove `?path=<encoded>` from the six
  `ApplicationRoute.PlatformXxx` cases; also drop the `toCoreRunnerName($id)` fallback that was
  only needed to produce the path component.
- Six `[id]/page.tsx` pages (`platform-models`, `platform-app-runners`, `platform-interceptors`,
  `platform-routes`, `platform-roles`, `platform-keys`): read identity from
  `decodeURIComponent(params.id)` instead of `searchParams.path`. Drop the `searchParams`
  prop entirely.
- Tests for `getEntityPath` and the six page components updated to match the new URL shape.

## Non-goals

- No change to the `ApplicationRoute.ApplicationRunners` (Entities section) page — it already uses
  `params.id` directly and has no `?path=`.
- No change to versioned asset entities (`AssetsApplications`, `AssetsToolsets`, `Prompts`,
  `Conversations`) — their `name ≠ path`, so `?path=` remains required.
- Existing links or bookmarks that include `?path=` will continue to open the correct page;
  the parameter is simply ignored after the change.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `platform-entity-routes`: add requirement that platform entity detail pages are addressed
  by the `[id]` segment alone, with no `?path=` query parameter.
- `platform-keys`: update the "User opens a key detail" scenario to remove the stale
  `?path=<encodedPath>` fragment from the expected URL.

## Impact

- `apps/ai-dial-admin/src/utils/open-in-new-tab.ts` — `getEntityPath` for the six
  `PlatformXxx` route cases.
- `apps/ai-dial-admin/src/app/[lang]/platform-{models,app-runners,interceptors,routes,roles,keys}/[id]/page.tsx`
  — six page components.
- Test files co-located with `open-in-new-tab.ts` and any that assert on the URL shape or
  page navigation for the six platform entities.
