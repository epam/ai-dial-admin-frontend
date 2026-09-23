## Why

The sidebar offers two dashboards: `Dashboard` in the Audit group, over realtime telemetry, and
`Usage` in the Analytics group, over the usage log. An operator sees two entries for one job, and
neither name says which to open. Analytics is about to grow preset and user-built boards with
several widget types, and `Usage` names one board's content rather than the section that will hold
them.

The page that added `Usage` kept the two apart on purpose, so a reader could compare them side by
side (D2 of the archived `redesign-system-dashboard`). That comparison has served its purpose; one
entry in the menu is now worth more than the ability to open both at once.

## What Changes

- **One route, `/dashboards`.** It renders the analytics page when `ANALYTICS_ENABLED` and
  `ANALYTICS_USAGE_ENABLED` are both on, and the telemetry dashboard when they are not and the
  admin API is configured; otherwise it answers as not found.
- **`/dashboard` and `/usage` redirect to `/dashboards`**, so bookmarks and links keep working.
- **One `Dashboards` menu item in every configuration**: first in the Analytics group while the
  analytics page is on, in the Audit group where `Dashboard` sits today while it is off, and absent
  when neither page can render.
- **`Dashboards` replaces `Usage` and `Dashboard`** as the section's name, in the menu and as the
  analytics page's heading. The per-entity `Dashboard` tab, `System Usage` and the trace detail's
  `Usage` label keep their text: each names something else.
- **`DISABLE_MENU_ITEMS`**: the existing `dashboard` token hides the unified item in either group.
  The `analyticsusage` token stops matching; `/usage` and that token never shipped in a release, so
  no deployment depends on them.

## Non-goals

- **Changing either page.** Both render exactly as today; only the route that reaches them, the
  menu item and one heading change.
- **Retiring the telemetry dashboard.** While the analytics page is on it has no standalone page,
  but it keeps living in every entity's Audit tab, which this change does not touch.
- **User-built boards.** The name makes room for them; building them is a change of its own.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics/dashboards`: the gating requirements change from two pages reachable at once to one
  route choosing between them, one menu item, and redirects from the two old paths.
- `menu-group-visibility`: the Audit group's item list names `Dashboards`, present there only while
  the analytics page is off.
- `admin-api-availability`: `/dashboard` leaves the list of admin-API-only routes that redirect home;
  it redirects to `/dashboards`, which answers as not found without the admin API unless it serves
  the analytics page.

## Impact

- **New**: `src/app/[lang]/dashboards/page.tsx`.
- **Modified**: `src/app/[lang]/dashboard/page.tsx` and `src/app/[lang]/usage/page.tsx` (now
  redirects), `src/types/routes.ts` (`Dashboard` becomes `/dashboards`, `AnalyticsUsage` goes),
  `src/components/Menu/menu-configuration.tsx`, `src/constants/i18n.ts` and `src/locales/en.ts`
  (`Menu.Dashboard` relabelled, `Menu.AnalyticsUsage` removed), the analytics page's heading,
  `src/utils/help/get-help-url.ts` and `Header/HelpButton` (no telemetry help link over the
  analytics page), `docs/INFRA-CHANGELOG.md`.
- **Moved**: the telemetry server actions, from `src/app/[lang]/dashboard/actions.ts` to
  `src/app/[lang]/dashboards/actions.ts`, beside the page that now serves them.
- **Follow the new path unedited**: `Telemetry/**`, which compares a `route` prop against
  `ApplicationRoute.Dashboard` (only its actions import path changes); the breadcrumb and
  help-documentation entries keyed by it.
- **Untouched**: `EntityTabs/Audit/**` and the `dashboardEnabled` flag that gates the entity tabs.
- No environment variable is added or removed.
