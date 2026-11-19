## Context

Core's `InterfaceMode` contains only `passthrough` and `translator`. A URL `dial-plugin://<name>[/path]` identifies a plugin instance as the target of a model, an interface, or a translator, and a passthrough interface without its own base URL inherits the model's. Core rejects `overridePaths` for an interface whose effective passthrough URL is a plugin. It accepts references to missing plugin instances, although requests to them fail. See `ai-dial-core` `config/.../InterfaceMode.java`, `server/.../util/DeploymentEndpointUtil.java`, and `server/.../config/ConfigPostProcessor.java`.

The console uses `EndpointControl` for platform model and translator base URLs, a direct input in `InterfacesField/InterfaceRow` for interface URLs, and a named-translator selector in `TranslatorField`. The URL validator accepts HTTP(S), not plugin URLs. Plugin metadata and config-file names are independent, admin-only Core sources; the generic config-entity options reader already merges sources and reports partial failures but does not yet register plugins.

## Goals / Non-Goals

**Goals:**
- Offer a reusable, accessible Url/Plugin base-URL control on the three requested surfaces while retaining their existing wire formats and validation semantics.
- Select named Platform and config-file plugins and preserve pre-existing references, including missing entries and optional path suffixes.
- Respect model/interface inheritance, permissions, read-only views, and Core's override-path restriction without changing unrelated consumers of shared controls.

**Non-Goals:**
- A new interface mode, plugin options for custom inline translators or other entities, path-suffix editing, or existence enforcement.
- Changing Core APIs, authorizations, plugin lifecycle, or delete semantics.

## Decisions

### D1. Separate URL source from interface mode

Create a focused shared base-URL control under `BaseControls`, composing existing labeled input, radio and selector primitives; follow `EndpointControl`'s validation registration and the translator selector's option pattern. Pass plugin options and availability in as data rather than fetching inside the component. Place Url/Plugin radio buttons after the label, with one associated label and keyboard-operable, named group. Only the platform model entity field, its passthrough rows, and the standalone translator create/detail field opt in. `InterfacesField` remains shared: pass explicit opt-in and options through its props, preserving existing behavior everywhere else. Reuse ui-kit controls after checking their supported props; use translated labels and warnings.

The stored field remains the existing string, with no persisted source mode. Empty/new values start in Url; an existing value with the exact Core prefix starts in Plugin. Switching source clears the active field value; selecting a plugin writes its prefixed name. Optional blank model/interface fields remain absent, while a required translator or required interface remains invalid until populated. Discard and external value resets must rederive the correct source, not retain stale local state. An alternative third interface mode would create a value Core rejects and conflate routing with transport.

### D2. Preserve references and suffixes without enabling editing

Parse only the exact `dial-plugin://` prefix and split the rest at the first slash, matching Core rather than browser URL host parsing; underscores in names remain valid. Build option label and value from the prefix plus the plugin instance name, never the resource path or provider type. For an existing value with a suffix, show the corresponding plugin name selected and keep the full raw value unchanged until the user selects a different plugin or explicitly switches source. An absent name in the available list is represented as a retained option, not an automatic mutation or existence error. New plugin selections use the bare prefixed name. No suffix editor is introduced.

The control validates the relevant mode without broadening the generic HTTP URL validator, preserves requiredness and field-specific validation IDs, and registers/clears validation correctly on mode changes, unmount, reset and discard. Exact malformed plugin URLs remain visibly invalid; previously saved syntactically valid but missing references remain intact. No `onChange` fires merely because options load or change. This avoids corruption from a selector whose options arrive late, from deleted plugins, or from an older Core.

### D3. Load both Core populations once per owning flow

Extend the existing `getConfigEntityOptions` path and its `METADATA_RESOURCE_TYPE` registration for plugin metadata. It paginates, reads Platform and config-file names independently, and combines successful results with Platform precedence; do not use `assetApi.list`, which collapses failed HTTP reads into an empty array. Fetch using the caller's token, never an elevated or unit-mode proxy. Model detail and translator detail load options in their server-page data flows; the translator create modal must also receive options through the owning list/create flow. A failure of one source does not block entity loading or the other source. Surface an accessible localized partial/total-load warning; retain the current value and show usable surviving options. Do not turn an unavailable list into a missing-reference validation error.

This reuses existing centralized source-union behavior rather than fetching content for every plugin or duplicating a per-component data loader. The config-file endpoint remains distinct from Platform metadata and requires full admin access. Read-only/config-file entities show values without allowing changes.

### D4. Validate effective interface URL and override paths

Compute an interface's effective passthrough URL from its own value when present, otherwise the model base URL. If it is a plugin and `overridePaths` is nonempty, show a localized actionable validation error and prevent save until the user removes the paths or changes the effective URL. Recompute when either URL, mode, or paths change. Do not erase paths automatically: a model-level change can affect several inheriting interfaces, and a later switch back to HTTP may need those settings. A model-level plugin does not invalidate an interface with its own HTTP URL. Translator mode retains its existing handling.

### D5. Existing saving and accessible interaction

Use existing model and translator actions and ETags; preserve their success and failure notifications and failed-save drafts. Source radios need a programmatic group label and checked state, and the selector and warnings must remain keyboard and screen-reader accessible. Follow existing localized status and error patterns, not a separate unannounced visual indicator.

## Risks / Trade-offs

- [Unavailable or partial option data appears empty] → use the failure-preserving options reader, warn, and retain the raw stored reference.
- [Suffix or missing reference is lost] → separate the selected instance name from the full value and write only on an explicit source/selection change.
- [Shared field changes affect applications or interceptors] → explicitly opt in only platform models and test existing consumers.
- [A plugin inherited by several interfaces makes path overrides invalid] → validate each effective URL and retain paths until the user resolves the conflict.
- [Old Core or insufficient permissions] → keep URL-mode editing and existing references functional and report option-load failure; no capability probe or permission escalation.

## Migration Plan

No data migration is required: existing HTTP values remain URL inputs and existing plugin strings are interpreted without rewriting. Deploy frontend against a Core supporting plugin resources; on rollback, plugin strings remain in persisted configuration, although the old form cannot validate them. No backend schema changes are introduced.

## Open Questions

None for the agreed scope. The user declined the optional automated browser-verification task.
