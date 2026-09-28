## Why

DIAL Core's `Deployment`/`DeploymentInterface`/`Upstream` config already support a richer property set
than the admin frontend exposes: an entity-level `base_url`, an independent `Upstream.baseUrl` (peer of
`endpoint`/`key`), per-interface `mode` (`passthrough` | `translator`), a `translator` reference (named,
resolved against the platform `Translator` assets `add-platform-translators` introduces, or inline
`{ base_url, out }`), per-interface `default_headers`, and per-interface `defaults`/`features` overrides.
None of this is wired into the UI today — `Assets > Models`, the platform bucket of
`Assets > Applications`, and `Assets > Applications` (public bucket) all still edit only a bare
`base_url`/`baseUrl` string per interface via `InterfacesField`/`InterfaceRow`, with no way to add
headers, switch an interface to translator mode, or set an upstream's own `baseUrl`. `add-platform-translators`
(25/26 tasks complete) deliberately built the `Translator` asset type but scoped out wiring a reference to
it from a model's/app's own interfaces — this change is that follow-on.

## What Changes

- Add a top-level `base_url` (asset surfaces, snake_case) / `baseUrl` (admin-backend surfaces, camelCase)
  endpoint field to platform models, platform applications, and asset applications' Properties views,
  positioned between `OverrideNameControl` and `InterfacesField` — matching the field order already
  staged (uncommitted) in `Assets/Apps/Properties.tsx`. Validated as a URL, consistent with the existing
  per-interface `base_url` validation (`getUrlError`).
- Add a `baseUrl` field to each upstream row (`UpstreamEndpoints`/`Endpoint.tsx`), on the same line as
  `Key`, ordered `Base Url → Key`. This is genuinely new — Core's `Upstream.baseUrl` is independent of the
  existing `endpoint` field, which the frontend's `DialModelEndpoint`/`Endpoint.tsx` already expose.
- Add a `default_headers`/`defaultHeaders` key-value editor, built as a new non-imperative variant of the
  `ParamsTab` pattern (own "Add" button below the grid, no `forwardRef`/`useImperativeHandle`), placed in
  `src/components/Common/` as a reusable building block. Wire it at both the entity level and per-interface
  level for the three surfaces above.
- Add a `mode` selector (`passthrough` default | `translator`) to each configured interface row in
  `InterfacesField`/`InterfaceRow`:
  - `passthrough` (default): keeps today's `base_url` input.
  - `translator`: replaces the input with a select of available translators (platform `Translator` assets,
    fetched the way `platform-models/[id]/page.tsx` fetches its other option lists) plus a `Custom` entry.
    Selecting `Custom` reveals an inline `base_url` input and an `out` interface-type select (excluding
    `Custom`), matching Core's `TranslatorRef` (`name` reference vs. inline `Translator`).
- Add two buttons per configured interface, each opening a popup:
  - `Defaults`: a Monaco JSON editor over that interface's `defaults` object.
  - `Features`: a modal reusing the existing entity-level Features controls, scoped to that interface's
    `features` overrides.
- Extend `DialDeploymentInterface`/`DialResourceInterface` (and sibling asset-resource interface models)
  with `mode`, `translator`, `defaultHeaders`/`default_headers`, `defaults`, and `features`, matching
  Core's `DeploymentInterface.java`. Add `baseUrl` to `DialModelEndpoint` (the upstream model).

## Capabilities

### New Capabilities
- `deployment-entity-base-url`: the new top-level entity `base_url`/`baseUrl` field and the new upstream
  `baseUrl` field, for platform models, platform applications, and asset applications — placement,
  casing convention, and validation.

### Modified Capabilities
- `deployment-interfaces-config`: extend the shared "Interfaces" section (today covering Entities →
  Models/Applications/Interceptors and Assets → Applications) to (a) also apply to Assets → Models
  (platform models use the same `InterfacesField`/`isAsset` path and currently fall outside this spec's
  stated scope), and (b) add the per-interface `mode`/translator-picker/`Custom` flow, per-interface
  `default_headers` editor, and the `Defaults`/`Features` popup buttons.

## Non-Goals

- Platform Interceptors and Routes keep their current Interfaces UI unchanged — out of scope for this
  change, even though they share `InterfacesField`/`Endpoint.tsx`.
- No change to the `Translator` asset type itself, its list/detail view, or `add-platform-translators`'
  remaining lint/test task.
- No change to the existing legacy per-model `endpoint` field (`EndpointControl`, `endpointLegacyCaption`)
  on platform models — it stays where it is, distinct from the new entity-level `base_url`.
- No change to `DialUpstreamInterface` (the per-upstream interface override: `endpoint`/`key`/`extraData`)
  — that Core `UpstreamInterface` type has no `baseUrl`/`mode`/`translator`/`defaultHeaders` and is
  unaffected.
- Entity-level `Defaults` (`components/Defaults/Defaults.tsx`) and the entity-level `Features` tab keep
  their current accordion/tab UI — only the new per-interface popups use a JSON editor / modal.

## Impact

- **Models**: `src/models/dial/interfaces.ts` (`DialDeploymentInterface`, `DialResourceInterface`),
  `src/models/dial/model.ts` (`DialModelEndpoint`), `src/models/dial/resource.ts` (asset interface types).
- **Components**: `BaseControls/InterfacesField/{InterfacesField,InterfaceRow}.tsx`,
  `UpstreamEndpoints/{UpstreamEndpoints,Endpoint/Endpoint}.tsx`, new `Common/` key-value grid component,
  new per-interface Defaults/Features popup components.
- **Properties views**: `Assets/Platform/Models/Properties.tsx`, `Assets/Apps/Properties.tsx` (shared by
  platform and public bucket), and wherever `Assets/Platform/Applications` composes its Properties.
- **Data source**: platform model's `page.tsx` (`app/[lang]/platform-models/[id]/page.tsx`) and the
  equivalent app/asset-app pages gain a translator-list fetch, reusing `add-platform-translators`'
  `getTranslators` server action, threaded down as a prop to `InterfacesField`.
- **i18n**: new keys for the base_url field, upstream baseUrl, default headers grid, mode selector,
  translator/custom pickers, and the two popup buttons/titles.
- Does not affect Entities → Models/Applications/Interceptors (the non-asset, admin-BE-backed surfaces) —
  those keep today's Interfaces UI; only the three named asset/platform surfaces gain the new fields.
