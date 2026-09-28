## Why

Issue #4561: on Assets → Platform Models, saving is blocked with "This field is required" on an
interface-level Base URL even though the model-level Base URL is populated. DIAL Core treats an
interface's `base_url` as optional — `DeploymentEndpointUtil.passthroughBaseUrl` falls back to the
deployment-level `Deployment.getBaseUrl()`, and `ConfigPostProcessor` only flags a passthrough
interface when *both* the interface `base_url` and the model `baseUrl` are missing. The frontend's
unconditional required validation (introduced in #4017 to replace save-time stripping, before the
entity-level `base_url` field existed in #4524) is stricter than the backend and blocks valid
configuration.

## What Changes

- The per-interface Base URL input on the three surfaces that render an entity-level `base_url`
  field — Assets → Platform Models, Assets → Platform Applications, Assets → Applications — becomes
  required **only when the entity-level `base_url` is empty**, mirroring Core's fallback semantics.
  The required asterisk on the label follows the same condition.
- Entity-backed surfaces (Entities → Models / Applications / Interceptors, Assets → Platform
  Interceptors) keep the unconditional requirement: the deployment-level base URL there derives
  from the adapter/container source, which the frontend cannot see, and Core rejects the save when
  no fallback exists.
- An emptied interface Base URL is stored as `undefined` in draft state at `onChangeBaseUrl`, so the
  save payload omits the field entirely. Core treats `base_url: ""` as a *present* base URL (the
  `== null` checks never fire, and `passthroughBaseUrl` returns the empty string verbatim), so an
  empty string on the wire would reintroduce the #4014 routing bug this validation was built to
  prevent.
- The stale "Stripping empty interface values on save" requirement in
  `deployment-interfaces-config` is replaced: whole-entry stripping (unimplemented since #4017)
  would now destroy translator-mode rows and passthrough rows carrying defaults/features/headers.
  The new contract is field-level: an empty `base_url` is omitted from the entry, the entry itself
  is kept.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `deployment-interfaces-config`: the per-interface `base_url` requiredness becomes conditional on
  the entity-level `base_url` being absent on the three asset surfaces that render it; the
  save-time stripping requirement is rewritten from whole-entry removal to field-level omission.

## Impact

- `apps/ai-dial-admin/src/components/BaseControls/InterfacesField/InterfaceRow.tsx` — requiredness
  and validation become conditional on a new prop; `onChangeBaseUrl` normalizes empty to
  `undefined`.
- `apps/ai-dial-admin/src/components/BaseControls/InterfacesField/InterfacesField.tsx` — threads the
  entity-level base URL down to each row.
- `apps/ai-dial-admin/src/components/Assets/Platform/Models/Properties.tsx` (passes `asset.baseUrl`)
  and `apps/ai-dial-admin/src/components/Assets/Apps/Properties.tsx` (passes `asset.base_url`; this
  one component serves both Assets → Applications and Assets → Platform Applications).
- Tests: `InterfacesField.spec.tsx`, `Assets/Platform/Models/tests/Properties.spec.tsx`,
  `Assets/Apps/tests/Properties.spec.tsx`.
- No API or payload-shape changes beyond omitting an empty `base_url` field; no backend changes.

## Non-goals

- Relaxing requiredness on entity-backed surfaces (Entities → Models / Applications / Interceptors,
  Platform Interceptors) — no FE-visible deployment base URL exists there.
- Changing Core's `''`-vs-null semantics; the frontend simply never sends an empty string.
- `supportsResponsesInterface` (`utils/models/responses-interface.ts`) treating an empty
  interfaces-map `base_url` as "no Responses support" on a model whose Responses interface falls
  back to the entity-level `base_url` — a real but separate gap; file as its own issue if wanted.
