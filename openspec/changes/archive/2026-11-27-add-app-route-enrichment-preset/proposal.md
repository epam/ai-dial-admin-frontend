## Why

The analytics service lets an `llm` enrichment transform call a DIAL application's custom route
(`POST /v1/deployments/{id}/route/{path}`) instead of chat completions, and gates it behind an instance
allowlist of `(deployment, route)` pairs. The console can author neither: the transform editor knows one
preset, and the allowlist has no page, so a route pipeline can be built and enabled only through the API.

## What Changes

- The transform editor offers the **call preset** of an `llm` transform: `chat_completion` or
  `dial_app_route`. Under `dial_app_route` it presents a **route** field and sends `transform.route`; under
  `chat_completion` and for a `sql` transform it presents and sends none.
- Under `dial_app_route` the deployment and the route are picked from DIAL Core's applications and their
  routes, with a typed value always accepted.
- Under `chat_completion` the deployment is picked from DIAL Core's models and applications, with a typed
  value always accepted.
- Under `dial_app_route` an output's transform refinement is **`source`** (JSONata over the route's response)
  in place of `jsonata`. The value list and the prose are unchanged.
- The request template's placeholder reading accepts **`{{name:json}}`** as a use of `name`, so the
  placeholder correspondence and the group-grain `{{members}}` check stay correct.
- A new **Enrichment routes** tab on the System Properties page edits the `app-routes` allowlist: a list of
  `(deployment, route)` pairs, read and saved against the analytics service.
- The transform editor states, before enable, that the declared pair is not on the allowlist, and points to
  the tab. An author who cannot read the setting gets no hint and meets the service's refusal at enable, as
  today.

### Non-goals

- No check that a deployment or a route exists in DIAL Core. The service does not check it either.
- No change to catalog import: an imported route pipeline already reports why it cannot be armed.
- No change to the Enrichment Runner contract, its version, or anything on the Runtime tab.
- No deep link to a System Properties tab; the hint links to the page and names the tab.

## Capabilities

### New Capabilities

- `analytics/app-routes`: the instance allowlist of DIAL application routes an enrichment pipeline may
  call — its shape, where it is edited and stored, its validation, and how a refused write is reported.

### Modified Capabilities

- `analytics/pipelines`: the transform's call preset and route, the route output's `source`, the
  `:json` placeholder suffix, and the allowlist hint before enable.
- `system-properties`: a fourth independent tab, Enrichment routes, with its own Save and Discard.

## Impact

- **Backend contract** (analytics service, `ai-dial-analytics` PR 68): `transform.preset` value
  `dial_app_route`, `transform.route`, per-output `source`, `GET`/`PUT /v1/settings/app-routes`, error codes
  `app_route_in_use` (409) and `pipeline_validation_failed` (422). The console change is inert until that
  build is deployed: an older service refuses the new preset value and answers 404 for the setting.
- **Admin backend**: read-only use of the existing applications and models listings for suggestions; no new
  endpoint.
- **Code**: `src/components/Analytics/Pipelines/Enrich/` (transform section, outputs editor, form hook),
  `src/utils/analytics/` (transform DTO, template placeholders), `src/models/analytics/`,
  `src/components/SystemProperties/`, `src/server/analytics/`, `src/app/[lang]/system-properties/actions.ts`,
  `src/app/[lang]/pipelines/` actions, i18n keys and `locales/en.ts`.
- **Shared components**: `Common/AutocompleteInput` is used as is; no new props.
- **Docs**: the Analytics index (`openspec/specs/analytics/spec.md`), `AGENTS.md` and
  `openspec/config.yaml` name the sub-capability count and gain the `analytics/app-routes` row.
