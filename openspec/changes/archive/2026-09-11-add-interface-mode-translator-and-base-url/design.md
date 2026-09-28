## Context

DIAL Core's `Deployment`/`DeploymentInterface`/`Upstream` config classes (`ai-dial-core`,
`config/src/main/java/com/epam/aidial/core/config/`) already carry fields the admin frontend has never
exposed: `Deployment.baseUrl`, `Upstream.baseUrl` (independent of `Upstream.endpoint`),
`DeploymentInterface.mode` (`InterfaceMode`: `PASSTHROUGH` default, `TRANSLATOR`), `.translator`
(`TranslatorRef`: a `name` string resolved against the platform `Translator` registry, or an `inline`
`Translator`), `.defaultHeaders`, `.defaults`, `.features`. Core's canonical wire format for the
multi-word fields is snake_case (`@JsonProperty("base_url")`), with camelCase accepted only via
`@JsonAlias` for backwards compatibility.

The frontend already has a live convention for this exact split — `InterfacesField`'s `isAsset` prop
switches `baseUrlKey` between `'base_url'` (Core-direct "resource" surfaces: platform models, platform
applications, asset applications) and `'baseUrl'` (admin-backend-owned surfaces: entity Models/Applications,
Interceptors). This design extends that convention rather than introducing a new one, and — per the
proposal's scope decision — touches only the three Core-direct, `isAsset=true` surfaces named in the
proposal (platform models, platform applications, asset applications). Entity Models/Applications and
Interceptors keep today's bare-`base_url` Interfaces UI.

`add-platform-translators` (25/26 tasks, only a final lint/test task open) already built the `Translator`
platform asset (`in`/`out`/`baseUrl`) and its list/detail view, but explicitly scoped out wiring a
reference to it from another entity's `interfaces.<type>.translator` field — that wiring is this change.

## Goals / Non-Goals

**Goals:**
- Add the entity-level `base_url`/`baseUrl` field and the upstream-level `baseUrl` field to the three
  named surfaces, following existing validation (`getUrlError`) and casing (`isAsset`) conventions.
- Add a reusable, non-imperative key-value grid (`Common/`) for `default_headers`/`defaultHeaders`, used
  at both the entity level and the per-interface level.
- Extend `InterfacesField`/`InterfaceRow` with `mode`, translator selection (named or inline `Custom`),
  per-interface headers, and the `Defaults`/`Features` popups — for the three named surfaces only.
- Keep the change additive to Core's contract: no Core-side change is needed: every field this change
  writes is already accepted by `DeploymentInterface`/`Upstream`/`Deployment`.

**Non-Goals:**
- Entity Models/Applications/Interceptors' Interfaces UI (camelCase, admin-BE-backed) — unchanged.
- Platform Interceptors/Routes — unchanged, even though they share `InterfacesField`/`Endpoint.tsx`.
- The `Translator` asset type's own CRUD/UI, or `add-platform-translators`' outstanding task.
- `DialUpstreamInterface` (`endpoint`/`key`/`extraData`/`secretExtraData`) — Core's `UpstreamInterface`
  has no `baseUrl`/`mode`/`translator`/`defaultHeaders`, so this per-upstream-interface-override row
  (`InterfaceEndpointRow`) is untouched.
- Entity-level `Defaults`/`Features` components — their accordion/tab UI is unchanged; only new,
  separate per-interface popups are added.

## Decisions

### D1 — New fields live on the existing interface/model types, not a parallel type
Extend `DialResourceInterface` (asset surfaces) and `DialDeploymentInterface` (kept for symmetry, though
out of this change's touched surfaces) in `models/dial/interfaces.ts` with `mode`, `translator`,
`default_headers`/`defaultHeaders`, `defaults`, `features`. Add `base_url`/`baseUrl` to the resource
entity types already carrying `interfaces` (`DialModelResource`, `DialPlatformApplicationResource`,
`DialApplicationResource`) and `baseUrl` to `DialModelEndpoint` (upstream).
**Alternative rejected**: a separate `DialTranslatorAwareInterface` wrapper type — rejected because it
would fork `InterfacesField`'s generics (already parameterized over `V extends InterfaceValue`) for no
behavioral reason; every one of these fields is optional and additive.

### D2 — `mode`/`translator` shape mirrors Core's `TranslatorRef` exactly
```ts
export enum InterfaceMode { Passthrough = 'passthrough', Translator = 'translator' }

// Discriminated by shape, matching TranslatorRef.toJson(): a bare string is a registry name,
// an object is an inline Translator (no `in` — implicit from the parent interface type).
export type TranslatorReference = string | { base_url: string; out: DeploymentInterfaceType };
```
`mode` defaults to `Passthrough` when absent (matching `InterfaceMode`'s Core-side default), so existing
saved entities with a bare `base_url` and no `mode` render identically to today.
**Alternative considered**: model `translator` as `{ name?: string; inline?: {...} }` (matching Java's
field names literally). Rejected — Core's own `toJson()`/deserializer round-trips a name as a plain
string and an inline definition as a plain object; matching that wire shape avoids a translation layer
between `TranslatorReference` and the JSON actually sent.

### D3 — Translator options are fetched once per page and threaded down as props
Following the existing pattern (`platform-models/[id]/page.tsx` fetches `roles`/`interceptors` and
passes them to `ModelView`), the three surfaces' `page.tsx`/server-side loaders each fetch the platform
`Translator` list via `add-platform-translators`' `getTranslators` action and pass `translators:
DialTranslatorResource[]` down to their Properties component, which passes it to `InterfacesField`,
which passes it to `InterfaceRow`. `InterfaceRow` builds the select options
(`translators.map(name) + Custom`) and, on `Custom`, renders the inline `base_url`/`out` pair.
**Alternative rejected**: fetching translators client-side from within `InterfaceRow` — rejected because
every other option list on these pages (roles, interceptors, global interceptors) is server-fetched and
prop-threaded; a client-side fetch here would be the only exception and would need its own loading/error
states this pattern already avoids.

### D4 — New key-value grid: `Common/KeyValueGrid`, non-imperative
`ParamsTab` is `forwardRef` + `useImperativeHandle` because its "Add" action lives in a toolbar outside
the tab (`RequestTemplate`'s own header). The new component owns its "Add" button directly under the
grid, so no ref/imperative handle is needed — it takes `value: Record<string, string> | KeyValuePair[]`
(TBD in implementation against `ParamsTab`'s existing `{ key, value }[]` shape for consistency) and
`onChange`, matching this repo's controlled-component convention. Reuses `GridView`/`getParamsColumns`-style
column defs and `getDeleteOperation` from `constants/grid-columns/`, per `components.md` §5 (reuse ui-kit/
grid conventions before inventing new ones).
**Placement**: `src/components/Common/KeyValueGrid/` — generic, domain-free, no ties to TestSuites or to
the Interfaces feature, so it belongs in `Common/` per `components.md` §4, reusable by both the entity-level
and interface-level `default_headers` usages this change needs, and by ParamsTab's own future callers if
they want the non-imperative variant.

### D5 — Defaults popup: new Monaco JSON editor; Features popup: reuse existing controls in a modal
Per-interface `defaults` is a freeform `Record<string, unknown>` (temperature, seed, dimensions, etc. —
no fixed schema), so a JSON editor is the right fit, distinct from the fixed key/value/type rows the
entity-level `Defaults` accordion uses for the same reason `add-table-draft-schema-json-editor` chose
Monaco over a form for its freeform JSON. Per-interface `features` overrides the same typed `Features`
shape the entity-level Features tab already renders with typed switches/text controls
(`EntityTabs/Features/Features.tsx`) — reusing those controls inside a modal keeps one visual/interaction
language for "features" everywhere they're edited, rather than introducing a second (JSON) representation
for a value that already has a well-defined shape and typed UI.

### D6 — Upstream `baseUrl` sits beside `Key`, ahead of it
Matches the proposal's explicit ordering (`Base Url → Key`) and reads naturally left-to-right as
"where" then "how to authenticate to it" — consistent with `InterfaceEndpointRow`'s existing
endpoint-then-key ordering for the analogous per-upstream-interface row.

### D7 — `Custom` translator's `out` select also excludes the row's own interface type
Resolves the open question below: `out` is filtered to `MODEL_INTERFACE_TYPES` minus `Custom` minus the
interface type the row itself configures, not just minus `Custom`. A translator whose `out` equals its
own `in` would be a no-op hop with no expressible use case, and Core's own `in ≠ out` intent (noted as
server-validated in `add-platform-translators`) is closer to "the two are always distinct" than to
"only some same-type pairs are valid" — so it reads better to keep the invalid option out of the list
entirely than to let an admin pick it and rely on a server-side rejection after save.
**Alternative rejected**: list all four types and depend on Core's server-side validation to reject
`in == out` — rejected because the client already knows the row's own type, so there's no reason to let
an admin pick a value that can never be saved.

### D8 — `Common/KeyValueGrid` is plain controlled inputs, not `GridView`/ag-grid
Built as a list of two-`DialInput`-wide rows with its own inline "Add"/remove controls, not on
`GridView`/ag-grid despite `components.md` §5/§11's general preference for ag-grid on tabular data and
this change's own initial plan (superseded) to reuse `getParamsColumns`/`getDeleteOperation`.
`default_headers`/`defaultHeaders` is a flat string-to-string map with no per-row typing, sorting,
filtering, or column configuration — the two properties ag-grid's machinery exists to manage — so a
plain controlled list is simpler to read, test, and keep accessible (`getByRole` finds two `DialInput`s
per row directly, no grid cell/renderer indirection) for a component that is, in substance, a small
repeating form.
**Alternative rejected**: `GridView` + `getParamsColumns`/`getDeleteOperation`, matching `ParamsTab` —
rejected because that path pulls in ag-grid's column-def/cell-renderer/grid-API machinery for a shape
that needs none of it, and `ParamsTab`'s own imperative `ref` (needed only because its "Add" button
lives in a separate toolbar) doesn't apply here either, since this component owns its "Add" button
directly.

## Risks / Trade-offs

- **[Risk]** `add-platform-translators` is not yet archived (25/26 tasks); its `getTranslators` action
  and `DialTranslatorResource` type could still shift before this change lands. → **Mitigation**: this
  change's tasks should confirm that change's final state (or its archive) before wiring the fetch, and
  treat it as a hard prerequisite, not a parallel dependency.
- **[Risk]** Three surfaces (platform models, platform applications via the shared
  `ApplicationAssetProperties`, asset applications) all route through the same `InterfacesField`/
  `Endpoint.tsx` — a bug in the shared component surfaces on all three at once. → **Mitigation**: the
  existing `InterfacesField.spec.tsx` pattern already covers multi-surface reuse; extend it rather than
  writing three near-duplicate suites.
- **[Risk]** `mode`/`translator` on `DialDeploymentInterface` (camelCase, admin-BE surfaces) are added
  for type symmetry but have no UI consumer in this change — a future change wiring entity
  Models/Applications could find the type present but unused. → **Mitigation**: call this out explicitly
  in the type's location (comment) so it isn't mistaken for dead code to remove.
- **[Trade-off]** Reusing `EntityFeatures`' controls inside a modal (D5) means the modal's control set is
  coupled to whatever `getSwitchGroups`/`getTextControls` return for the surface's `ApplicationRoute` —
  simpler than a second implementation, but the modal will need its own `view`-scoped subset logic if a
  per-interface feature list differs from the entity-level one.

## Open Questions

Both resolved during implementation — see D7 and D8 above.
