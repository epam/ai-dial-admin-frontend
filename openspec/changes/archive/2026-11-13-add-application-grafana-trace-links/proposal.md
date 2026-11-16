## Why

Troubleshooting an application today means leaving the admin console, opening Grafana, and rebuilding the
trace filter by hand. Runs, extraction rows and try-out already link straight into Grafana, but only because
the evaluation backend hands the frontend a finished URL; there is nothing equivalent for an application.
The application's identity is already on the page, so the frontend can build the link itself.

## What Changes

- Add one "Traces in Grafana" dropdown button to the asset application detail page (`/assets-applications/[id]`)
  with two options, each opening Grafana Explore (Tempo, TraceQL) in a new tab:
  - **All traces** — every trace of this application.
  - **Errors only** — the same filter plus `status = error`.
- Build the URLs on the server, in the page, from the application's Core path, and pass the result
  to the views. When Grafana is not configured the page passes nothing and no link renders.
- The URL shape mirrors the evaluation backend's `GrafanaLinkBuilder`: `{base}/explore` with
  `schemaVersion=1`, a URL-encoded `panes` JSON (datasource, one TraceQL query with `tableType: "traces"`,
  time range) and `orgId`.
- Configuration, defaulting to the evaluation backend's values:
  - `GRAFANA_TRACES_URL` — new; the Grafana root the links are built on (trailing slash tolerated). A variable
    of its own: `GRAFANA_LINK` stays what it is, the Dashboard page's Open Grafana target, and is not read here.
  - `GRAFANA_TEMPO_DATASOURCE_UID` — new; default `tempo`.
  - `GRAFANA_ORG_ID` — new; default `1`; an empty or non-numeric value falls back to `1`.
- The application is matched on the `dial.deployment` span attribute by a suffix regex over its Core path:
  all traces `{ span.dial.deployment =~ ".*<path>" }`, errors only
  `{ span.dial.deployment =~ ".*<path>" } >> { status = error }`. The attribute and both query shapes live
  in one constants file, so adjusting them stays a one-line change.
- Both views render the links through one shared component passed as the header's `children`, which both
  `SimpleEntityHeader` (`Platform/Applications/View`) and `AssetHeader` (`Assets/Entities/Apps/View`) already
  place beside Delete.
- Document the two new variables in `.env.template`, the README env table and `docs/INFRA-CHANGELOG.md`.

## Capabilities

### New Capabilities
- `application-grafana-trace-links`: when and how the asset application page offers all-traces and
  errors-only Grafana links — configuration and defaults, hiding when unconfigured, the Explore URL
  contract, escaping of the application path, and opening in a new tab.

### Modified Capabilities
<!-- None: no existing requirement changes. `platform-applications` and `application-resources-core-api`
     describe data and CRUD, not the page header. -->

## Impact

- **Code:** `app/[lang]/assets-applications/[id]/page.tsx` (builds and passes the URLs); a new pure
  URL-builder util under `src/utils/` with its own models/constants; `Assets/Platform/Applications/View.tsx`;
  `Assets/Entities/Apps/View.tsx`; a new header dropdown component; i18n keys in `locales/en.ts` and
  `constants/i18n.ts`.
- **Shared components:** none changed. `SimpleEntityHeader` and `AssetHeader` are only consumed, through
  their existing `children` slot.
- **Config / ops:** three new optional env variables. The links appear only where `GRAFANA_TRACES_URL` is set,
  so no existing deployment changes until an operator sets it; `GRAFANA_LINK` is untouched. A deployment whose
  datasource UID is not `tempo` must set `GRAFANA_TEMPO_DATASOURCE_UID` or the links open an empty Explore.
- **Backends:** none. No admin-backend or Core change, and no Grafana API call.
- **Dependencies:** none.

## Non-goals

- Links for other entities (models, toolsets, routes, the classic `/applications/[id]` page). The URL
  builder is generic over the filter value so they can follow, but only asset applications get an entry
  point here.
- Calling Grafana's API, validating the base URL or datasource UID, or detecting whether any trace exists.
- A product decision on the best time range: the links default to the last 24 hours and the range is a
  constant, not a setting.
- Changing how `GRAFANA_LINK` is used by the Dashboard page, or reading it for the trace links.
- Guaranteeing that Core and the application runtime emit `dial.deployment` and error status on every span;
  the link only expresses the query, and an application that emits neither opens an empty result.
