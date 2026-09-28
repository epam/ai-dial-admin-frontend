## Context

See proposal.md — Why. The current state that shapes the approach:

- **`ApplicationRoute.Dashboard` is a mode as well as a URL.** The telemetry components compare a
  `route` prop against it to decide which controls and grids the standalone page shows, as opposed
  to an entity's Audit tab. The breadcrumb map and the help-documentation map are keyed by it.
- **`DISABLE_MENU_ITEMS` is matched two ways.** The menu drops an item whose i18n key, after the
  namespace, equals a token exactly (`Menu.Dashboard` → `dashboard`). The `dashboardEnabled` flag,
  which also gates the entity Audit tabs, is a substring test on the raw variable.
- **The Analytics group is removed whole** when `ANALYTICS_ENABLED` is off, and the Audit group
  when the admin API is not configured. An item placed in one group vanishes with it.
- **The two pages have different guards.** The telemetry page redirects home without the admin
  API; the analytics page answers not found without both flags, and 403 without analytics access.

## Goals / Non-Goals

**Goals:**

- Neither page's module changes; the route, the menu and one heading are the whole diff.
- A deployment that sets nothing new sees one `Dashboards` item and a working page.

**Non-Goals:**

- No change to `dashboardEnabled` or to how the entity Audit tabs are gated.
- No shared wrapper around the two pages: the route chooses one and renders it.

## Decisions

### D1. Keep the `Dashboard` enum member and change its value to `/dashboards`

The alternative is a new `Dashboards` member, which would mean editing every telemetry component
that compares against `Dashboard` and both route-keyed maps. Changing the value keeps the member
as the mode discriminator it already is, and every comparison and map key follows the new path
without being touched. `AnalyticsUsage` is removed: nothing but the menu item and the redirect
used it.

### D2. The page chooses, the old routes redirect

`/dashboards/page.tsx` reads the same environment the layout reads — both analytics flags, then
`DIAL_ADMIN_API_URL` together with the `dashboardEnabled` test — and renders one of the two
existing page roots. The usage flag without the analytics flag is a misconfiguration and takes the
telemetry branch, as if the usage flag were off. The analytics branch keeps
its `isAnalyticsForbidden` check. The telemetry branch's "redirect home" becomes "not found" when
neither page can render, because with one route there is no longer a page-specific fallback.

This also takes `/dashboard` out of the admin-API-only routes that redirect home
(`admin-api-availability`): a route that can serve the analytics page cannot send every visitor
without the admin API home.

`/dashboard` and `/usage` keep their page files and `redirect` to `/dashboards`, the pattern the
telemetry page already uses. A rewrite in `next.config` was rejected: the routes sit under the
`[lang]` segment, and a page-level redirect needs no path matching to stay correct.

### D3. One menu key in two groups, filtered by the flag

The item is `{ key: MenuI18nKey.Dashboard, href: ApplicationRoute.Dashboard }`, declared first in
the Analytics group and in the Audit group, and removed from one of them by `analyticsEnabled` and
`analyticsUsageEnabled` together — the same filtering shape the menu uses for every other gated
item. The layout already ANDs the two into `analyticsUsageEnabled`; the menu checks both anyway, so
the item cannot follow a hidden Analytics group away if the flags are ever built differently. Reusing `Menu.Dashboard`
rather than adding `Menu.Dashboards` keeps the `dashboard` token of `DISABLE_MENU_ITEMS` working
for every deployment that already sets it. It also sidesteps the substring test: a new
`dashboards` token would contain `dashboard` and switch off the entity Audit tabs as a side effect.

The group removals already cover the remaining rows of the spec's table: with `ANALYTICS_ENABLED`
off the Analytics copy goes with its group, and without the admin API the Audit copy goes with
its.

### D4. No help link over the analytics page

The help-documentation map is keyed by route, and its `/dashboards` entry documents the telemetry
dashboard. `getHelpUrl` takes the feature flags and returns no link for that route while both
analytics flags are on; `HelpButton` reads them from `AppContext`. Adding an analytics entry was
rejected: there is no analytics documentation page to point at yet.

### D5. Relabel, don't rename, the i18n keys

`Menu.Dashboard` changes its English value to `Dashboards`, and the analytics page's heading reads
it. `Menu.AnalyticsUsage` is deleted rather than relabelled, since nothing references it after D3.
`Tabs.Dashboard` names one entity's board and stays singular.

## Risks / Trade-offs

- **The telemetry dashboard loses its standalone page** wherever analytics is on. → Accepted: it
  stays in every entity's Audit tab, and turning the usage flag off brings the page back.
- **`analyticsusage` stops matching.** → It never shipped in a release; nothing to migrate.
- **A test or link hard-coding `/dashboard`** keeps working through the redirect but hides the
  move. → The unit tests assert the new path; the redirect is covered by its own test.

## Migration Plan

1. Ship. A deployment with the analytics flags off sees `Dashboards` in Audit, serving the
   telemetry page at `/dashboards`; with them on, `Dashboards` first in Analytics.
2. Rollback is a revert of this change; no stored state or variable depends on it.
