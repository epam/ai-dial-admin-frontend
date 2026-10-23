## Context

DIAL Core resolves an upstream interface from its explicit `endpoint` and otherwise falls back to the parent upstream's `baseUrl`. `InterfaceEndpointRow` currently validates the interface endpoint as optional without considering that fallback. This lets AI Gateway → Models submit an invalid configuration when both values are absent, and Core returns a post-save validation failure instead of the form preventing the request.

The existing `fix-interface-base-url-fallback` change applies the same conditional-requiredness principle to entity-level interface Base URLs. It deliberately excluded `InterfaceEndpointRow`, leaving this upstream-specific path unresolved.

`SaveValidationContext` determines whether Save is enabled from registered field validity. The interface editor only mounts while upstream details are expanded, so validation owned solely by `InterfaceEndpointRow` is removed on collapse.

## Goals / Non-Goals

**Goals:**

- Mirror Core's fallback rule in the upstream-interface form.
- Keep the required marker, inline error, and Save validity synchronized when a parent upstream Base URL changes.
- Keep the required validation active even when upstream details are collapsed.
- Preserve absent-value normalization for empty interface endpoints.

**Non-Goals:**

- Change DIAL Core validation or payload contracts.
- Change entity-level interface Base URL fallback validation.
- Infer a fallback from model source, adapter, or container configuration.

## Decisions

### D1: Requiredness derives from the parent upstream Base URL

`Endpoint` supplies its current `endpoint.baseUrl` to the endpoint-variant interface editor. `InterfaceEndpointRow` derives `isRequired = !upstreamBaseUrl` and uses it both for its label and `getUrlError` validation.

This matches the backend's resolution rule and keeps the decision where the field is rendered rather than duplicating it at model-level consumers.

Alternative rejected: require every upstream interface endpoint. That would reject the valid and supported configuration in which a parent Base URL serves every declared interface.

### D2: Revalidate reactively when the fallback changes

The interface row re-runs validation when the parent Base URL changes. An empty interface endpoint becomes invalid immediately when its fallback is cleared and becomes valid immediately when its fallback is restored.

Alternative rejected: validate only on Save. The Save button is live-gated through `SaveValidationContext`, so deferred validation would retain the backend-error workflow this change fixes.

### D3: Endpoint owns persistent aggregate validation

`Endpoint` maintains a validation entry derived from its Base URL and configured interface endpoints, independent of whether expanded details are mounted. The visible `InterfaceEndpointRow` continues to own field-level error display while mounted; the persistent entry prevents collapsing the upstream from removing the save-blocking rule.

Alternative rejected: rely exclusively on the row's validation registration. Its unmount cleanup removes the entry when the details collapse, allowing an invalid configuration to be saved.

### D4: Empty interface endpoints remain absent values

An empty interface Endpoint remains normalized to `undefined`, not an empty string. Core distinguishes an absent endpoint, which invokes its fallback, from an empty present endpoint, which is invalid.

Alternative rejected: payload-time cleanup. Normalizing at the input write site keeps draft state, save payloads, and any alternate save path consistent.

## Risks / Trade-offs

- [Aggregate validation and row validation can both represent an expanded interface] → Use distinct validation keys; both report the same condition, so either one blocks save correctly.
- [A Base URL change affects multiple interface rows] → Derive the aggregate result from the full interfaces map and revalidate each visible row on the supplied Base URL change.
- [Existing invalid records can be opened] → They remain editable; the form surfaces the missing field before allowing a new save.

## Migration Plan

This is a frontend-only validation correction. Deploy and roll back with the application; no migration, API versioning, or backend coordination is needed.

## Open Questions

(none)
