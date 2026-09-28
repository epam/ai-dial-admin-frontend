# Design: fix-interface-base-url-fallback

## Context

`InterfaceRow` (`components/BaseControls/InterfacesField/InterfaceRow.tsx`) renders each configured
interface's Base URL input as unconditionally required: `labelProps.required: true` and
`getUrlError(url, t, true)`. That validation arrived in #4017 as the replacement for save-time
`stripEmptyInterfaces` (both fixed the #4014 alias-routing infinite loop). #4524 then introduced the
entity-level `base_url` field on the asset surfaces, and DIAL Core's semantics make the interface
`base_url` optional wherever that field exists:

- `DeploymentEndpointUtil.passthroughBaseUrl` — `iface.baseUrl ?? deployment.baseUrl`
- `ConfigPostProcessor` (line 466) flags a passthrough interface only when **both** the interface
  `base_url` and the model `baseUrl` are `null`.

Surfaces with an FE-visible entity-level base URL: Assets → Platform Models
(`Assets/Platform/Models/Properties.tsx`, `asset.baseUrl`), and Assets → Applications plus Assets →
Platform Applications (both render `Assets/Apps/Properties.tsx`, `asset.base_url`). Entity-backed
surfaces (Entities → Models / Applications / Interceptors, Assets → Platform Interceptors) have no
such field — the deployment base URL derives from the adapter/container source, invisible to the FE.

One wire-format constraint drives half this design: Core never normalizes `""`. Its `== null` checks
do not fire for an empty string and `passthroughBaseUrl` returns it verbatim, so `base_url: ""` on
the wire is a *present, broken* base URL — the exact #4014 failure mode. The FE must omit the field,
never send it empty.

A second mechanism drives the other half: the save button's disabled state is computed **live** from
`SaveValidationContext.isValid` (`EntityHeaderControls/Buttons/AssetChangedEntityButtons.tsx:45`),
not re-evaluated at save-click. Field validity is dispatched on mount, on change, and on the discard
`Reset` — nothing else re-triggers a row.

## Goals / Non-Goals

**Goals:**

- Interface Base URL required only when the entity-level `base_url` is empty, on the three asset
  surfaces that render that field; label asterisk follows the same condition.
- The save payload omits an empty interface `base_url` (entry retained) so Core's fallback engages.
- Clearing the entity-level `base_url` re-flags an existing empty interface row immediately (live
  requiredness flip), keeping the save button's live gating truthful.

**Non-Goals:**

- Relaxing requiredness on entity-backed surfaces (no FE-visible deployment base URL; Core rejects
  the save with no fallback).
- Changing Core's `""`-vs-null semantics.
- `supportsResponsesInterface` treating an empty interfaces-map `base_url` as "no Responses
  support" (separate issue).
- The JSON-editor save path (`isEditorEnabled` bypasses field validation entirely) — pre-existing
  behavior, Core validates there.

## Decisions

### D1: Pass the entity-level value, not a derived boolean

`InterfacesField` gains `entityBaseUrl?: string` and threads it to every `InterfaceRow`.
`InterfaceRow` computes `isRequired = !entityBaseUrl` and uses it for both `getUrlError`'s
`required` argument and the label's `required` prop.

Alternative rejected: an `isBaseUrlRequired` boolean computed at each of the three call sites — it
duplicates the same condition three times and invites drift; the single comparison belongs where
requiredness is decided (code-standards: state a fact once at its source of truth). The prop is
optional and absent on entity-backed surfaces, so their behavior is untouched by construction.

### D2: Normalize empty to `undefined` in draft state at the write site

`onChangeBaseUrl` stores `trimmed || undefined` instead of `trimmed || ''`, and
`InterfacesField.createEmptyValue` seeds `{ [baseUrlKey]: undefined }` rather than `''`. The input
stays controlled through the existing `value[baseUrlKey] || ''` read.

Alternatives rejected:

- Save-time field-stripping in the payload builders (`toModelPayload` et al.) — normalizes three
  builders instead of one write site, and leaves `''` sitting in draft state where the JSON editor
  view (`ExportFormat.CORE` / editor toggle) renders it verbatim; saving from the editor would put
  `base_url: ""` on the wire anyway. Normalizing at the write site keeps every downstream consumer
  (payload, editor, `isChanged` comparison) clean by construction.

Side benefit: `isEqualSkippingUndefined` already treats `undefined` as absent, so a typed-then-cleared
field compares equal to a never-set one — `isChanged` behaves more correctly than with `''`.

### D3: Re-validate when `entityBaseUrl` changes

`InterfaceRow` adds `entityBaseUrl` to a `useEffect` dependency (alongside the existing
`resetCounter` effect) so a passthrough row re-runs `validate(baseUrl)` when the entity-level value
flips. This is required by the live-gated save button: without it, a row registered valid-optional
stays green after the entity base_url is cleared, the save button stays enabled, and the failure
surfaces only as a backend validation rejection after the round-trip.

### D4: The stripped-entry spec requirement becomes field-level omission

The consolidated `deployment-interfaces-config` spec's "Stripping empty interface values on save"
(whole-entry removal) has been unimplemented since #4017, and whole-entry removal would now destroy
legitimate config: translator-mode rows carry no `base_url` by design, and a passthrough row with an
empty `base_url` may still carry `defaults` / `features` / `default_headers`. An entry whose only
content is an omitted `base_url` is itself meaningful — per `DeploymentInterface`'s contract, it
declares the interface served by the deployment-level base URL. The delta rewrites the requirement
as field-level omission with the entry retained.

## Risks / Trade-offs

- [An entity loaded from the backend with a literal `base_url: ""` passes through untouched] →
  Pre-existing pass-through behavior, unchanged by this design; Core's config validation is the
  backstop. Not worth a load-time normalization pass.
- [Requiredness now depends on a value the user can edit elsewhere on the same form] → Mitigated by
  D3's revalidation effect; covered by a dedicated component test (clear entity base_url → row
  shows required error; refill → error clears).
- [Translator-mode rows and wholly-empty rows now persist as entries where the old spec promised
  removal] → The delta spec replaces the old scenarios explicitly; `InterfacesField.spec.tsx`
  expectations are updated in the same change so spec, code, and tests stay in lockstep.
- [Entity-backed surfaces keep a requiredness stricter than Core's] → Deliberate (Non-Goal): the FE
  cannot know the deployment base URL there, and pre-flagging beats a post-save BE rejection.

## Migration Plan

Pure frontend change; no payload-shape change beyond omitting an empty field Core already treats as
absent. Deploy and roll back with the app itself — no data migration, no backend coordination.

## Open Questions

(none — scope and normalization approach confirmed during exploration)
