## Why

`Catalog ▸ Catalog Schemas` renders the `Show config entities` toggle, and it should not.
`apply-catalog-schemas-to-deployments` added the view as an eighth covered surface because DIAL Core
exposes `catalog_schemas` on its file-config route — a technical fact, not a product decision about
which views carry the toggle. Issue #4605 reports it as a bug: the toggle belongs to the seven views
whose population is genuinely split between the admin backend and Core's configuration file.

## What Changes

- Withdraw `platform-catalog-schemas` from the covered config-file views: no toggle next to the page
  title, no list swap, no config-file-backed name list, no lazy names fetch. The covered set returns
  to the seven views it had before.
- Remove the list-names server action and the `configFile=true` branch of the catalog-schema detail
  page. Nothing links to that branch once the list is gone, and the capability that owns the
  `configFile=true` detail rendering never listed this route among the seven it covers.
- Keep resolving a file-declared schema on the ordinary detail address: the detail route already
  falls back to the config-file read when no bucket resource exists, and renders what it finds
  read-only. That fallback is what makes `Open` work on a schema a deployment points at, so it stays
  — and it is now specified rather than merely implemented.

## Capabilities

### Modified Capabilities

- `config-file-entity-views`: the covered set drops from eight views to seven; the requirement that
  made catalog schemas a covered type is removed, and a scenario pins the toggle's absence there.
- `platform-catalog-schemas`: the requirement that this surface renders the toggle and swaps its list
  is removed, replaced by one stating how a file-declared schema is reached instead.

## Non-goals

- The other seven covered views. Their toggle, list swap, lazy fetch, and `configFile=true` detail
  rendering are untouched.
- The schema picker on a deployment. It reads Core's merged configuration in one request and keeps
  offering both populations — that is a different surface with a different contract.
- Another way to browse file-declared catalog schemas. If operators need a list of them, that is its
  own change; today they are reachable by address, from the picker, and from Core's own route.
- `READABLE_CONFIG_FILE_TYPES`. `CatalogSchemas` stays in it because the surviving single-entity
  read is guarded by that same set.

## Impact

- `constants/config-file-entity-views.ts`, `constants/config-file-core.ts` (comment only),
  `components/Assets/Platform/CatalogSchemas/PageList.tsx` (deleted),
  `app/[lang]/platform-catalog-schemas/page.tsx`, `app/[lang]/platform-catalog-schemas/actions.ts`,
  `app/[lang]/platform-catalog-schemas/[id]/page.tsx`.
- Specs: `config-file-entity-views`, `platform-catalog-schemas`.
- No API, dependency, or environment change. Issue #4605.
