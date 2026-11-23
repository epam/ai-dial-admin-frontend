## Why

The existing plugin URL picker covers platform models and standalone translators, but routers and custom inline translators cannot reliably use the same choice and option data. Repeated visible source labels also add noise, and the plugin create form uses an unsuitable type placeholder.

## What Changes

- Extend the existing `BaseUrlControl` to router entity and passthrough interface base URLs, retaining router fallback, validation, decision-mode and save behavior.
- Supply plugin choices to custom inline translator base URLs on platform models and routers, leaving custom translators on other entity surfaces unchanged.
- Remove redundant visible URL/Plugin labels within the shared source control while preserving the field label, accessible names, required state and keyboard behavior.
- Show the localized placeholder `Enter type` in the plugin create type input without changing its validation or detail behavior.
- Preserve the existing plugin selector's option loading, reference round-trip, errors, permissions and wire contracts.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `platform-plugins`: reconcile the stale no-linking requirement with the archived selector contract and extend its supported fields and accessible presentation; correct the plugin create placeholder.
- `platform-routers`: add plugin choices to the router and its passthrough interfaces while preserving router-specific rules.
- `deployment-interfaces-config`: add plugin support to router passthrough and model/router custom inline translator fields, and retain model passthrough support.
- `deployment-entity-base-url` and `platform-translators`: reconcile the existing model and standalone translator selector contracts from the archived change with their stale consolidated requirements.

## Impact

- Shared `BaseUrlControl`, `InterfacesField` and `TranslatorField`, router server page/view data flow, model and router custom translator controls, plugin create UI, i18n and tests. Shared-control changes affect existing model and standalone translator consumers and need regression coverage.
- Existing Core `baseUrl`/`base_url` and inline translator fields remain the persistence contract; there is no backend API, new persisted mode, dependency or migration change.
- The archived `select-plugins-for-base-urls` delta is not folded into several consolidated specs; this change's deltas must preserve its accepted behavior and remove conflicting blanket exclusions rather than assume the archive updated the baseline.

## Non-goals

- Plugin selection on application, interceptor, or publication custom translators, other entity or passthrough URLs, upstream URLs, plugin path-suffix editing, plugin existence enforcement or plugin lifecycle changes.
- Adding an interface mode, changing translator `out` options, router decision behavior, or changing backend validation and notification contracts.
