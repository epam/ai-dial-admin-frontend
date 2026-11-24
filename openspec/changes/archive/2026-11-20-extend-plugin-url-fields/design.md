## Context

`BaseUrlControl` already implements Url/Plugin source choices, URL validation and round-trip handling. `InterfaceRow` opts platform model passthrough fields into it. Router properties use the plain endpoint input, and router page/view/field option propagation needs to be complete. Custom translators SHALL use plugin choices only on models and routers; application, interceptor and publication surfaces keep their existing URL-only controls.

The archived `2026-11-19-select-plugins-for-base-urls` records accepted selector semantics that were not folded into the consolidated `platform-plugins`, `deployment-entity-base-url`, `deployment-interfaces-config`, and `platform-translators` specs. The deltas reconcile those requirements instead of treating their stale exclusions as the desired behavior. Core's existing `baseUrl`/`base_url` and inline translator representation is unchanged; see that archived design for Core's `DeploymentEndpointUtil` and `ConfigPostProcessor` rules.

## Goals / Non-Goals

**Goals:**
- Reuse the same selector for router main and passthrough URLs and model/router custom translator URLs.
- Keep source choice accessible without repeated visible input labels; correct only the create type placeholder.
- Preserve reference, validation, read-only, loading, notification and save behavior across old and new consumers.

**Non-Goals:**
- Extend plugin choices to unrelated application/interceptor main or passthrough URLs, upstreams, or plugin settings; change Core contracts or add suffix editing.
- Change interface modes, out-type rules, decision-mode translator restrictions, or plugin existence rules.

## Decisions

### Reuse the existing control and option reader

Use `readPluginOptions` with the current user's token on the router detail page and pass its options and partial/total-load error through the router view and tabs to `InterfacesField` and `TranslatorField`. Reuse the existing model option flow. Keep source errors nonfatal, and do not add plugin option reads to application, interceptor or publication pages. Platform metadata and Core config-file reads retain existing deduplication and Platform precedence.

Router `Properties` uses `BaseUrlControl` for its existing `baseUrl` and opts its `InterfacesField` passthrough rows into the same selector. Keep `entityBaseUrl` fallback and recompute plugin `overridePaths` conflicts when the router URL or interface changes, as for models; do not delete paths silently. Decision mode continues to hide translator choices. Custom translators use the plugin selector only on model and router surfaces opted into plugin support; other surfaces retain their existing endpoint control.

### Preserve interaction and wire semantics

Reuse the selector's exact-prefix parsing, missing-reference retention, suffix preservation, requiredness, source switching, reset/discard behavior and field-specific validation lifecycle. A custom translator keeps its existing inline object and `out`; selecting a plugin changes only its base URL. Router save uses the existing Core resource action and ETag; other surfaces retain their existing backend mappings and notifications. Load failures must not clear values or block the surrounding view. Preserve read-only and config-file display.

### One visible label, complete accessible names

Keep the field's visible label and required indication and the visible Url/Plugin radio captions. Suppress only the duplicate visible label on the currently selected input/selector; ensure each control retains a programmatically associated localized name and the group retains an accessible label. Verify actual ui-kit label rendering/props rather than assuming a class on a label prop is forwarded. Do not hide errors or remove keyboard operation. Change the create-only plugin type placeholder through i18n, without changing its detail-view placeholder or validation.

## Risks / Trade-offs

- [A shared field change affects existing consumers] → test model, standalone translator, read-only and non-opted-in surfaces in addition to new surfaces.
- [Option data missing on one owner or source] → test model and router option flows, partial and failed reads, pass surviving options and warn without rewriting the stored reference.
- [Plugin inherited by a router interface conflicts with override paths] → validate the effective URL for each row while preserving the user's paths.
- [Removing duplicate labels removes accessible names] → test named radio group, both radios and the active input or selector by role/name, including required errors.
- [Stale consolidated specs contradict the archived change] → restore its requirements and scenarios in the appropriate deltas, adding only the requested extensions.

## Migration Plan

No data migration is needed. Deploy frontend with the existing Core API; rollback leaves existing plugin strings in place but older UI may not edit the newly supported fields correctly.

## Open Questions

None for the approved scope. The user declined an automated browser-verification task.
