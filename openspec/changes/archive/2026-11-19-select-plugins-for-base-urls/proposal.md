## Why

Core supports using a named plugin as a model or translator base URL, but the console's URL controls do not provide a plugin picker and reject the `dial-plugin://` scheme. Following the Plugins entity introduced in PR #5563, administrators need to select existing plugins without assembling references by hand.

## What Changes

- Add a reusable base-URL control with **Url** and **Plugin** radio choices after the field label. Url is the default for a new empty field and retains the existing text input; Plugin shows a simple selector whose option labels and values are `dial-plugin://<plugin-name>`.
- Offer this control on the platform model's entity-level base URL, on each model interface's **Passthrough** base URL, and on the standalone Translator entity's base URL in both create and detail forms. Keep the interface's existing Passthrough and Translator modes: Plugin is a base-URL choice, not a new Core interface mode.
- Populate choices from existing Platform and config.json plugins, deduplicating names. Preserve Core's Platform precedence for duplicate names and do not require a referenced plugin to exist in order to retain its saved value.
- Recognize existing `dial-plugin://` values as Plugin selections. Preserve the entire stored value, including an optional path suffix, on unrelated edits and when options are missing or unavailable; do not add suffix editing in Plugin mode.
- Preserve existing model/interface base-URL fallback and required-field behavior. Handle Core's restriction on `overridePaths` for interfaces whose effective URL is a plugin, including inherited model URLs, without silently deleting configured paths.
- Keep normal save, discard, read-only, validation and accessibility behavior. Distinguish an unavailable plugin source from an empty list where the API permits and avoid clearing existing references on load failure.

### Non-goals

- A new `plugin` interface mode, or changing how Translator mode selects a translator.
- Adding the picker to custom inline translators, applications, routers, interceptors, upstreams or other URL fields.
- Editing plugin URL path suffixes in Plugin mode, managing plugin implementations or settings, or introducing plugin-existence enforcement or deletion blocking.
- Changing Core's API, authorization model, or plugin execution behavior.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `platform-plugins`: replace the blanket no-linking requirement with plugin selection on the specified model and translator fields, while retaining the existing behavior for other entities and plugin deletion.
- `deployment-entity-base-url`: extend the platform model's entity-level base URL with the Url/Plugin choice without changing other entity surfaces or fallback behavior.
- `deployment-interfaces-config`: extend platform model passthrough interface base URLs with the Url/Plugin choice and account for plugin URLs and effective-URL restrictions, without adding an interface mode.
- `platform-translators`: extend the standalone translator create and Properties base URL controls with the Url/Plugin choice.

## Impact

- **Frontend:** platform model Properties and its page/view data flow; shared `InterfacesField`/`InterfaceRow`, scoped to the model surface; standalone Translator create and detail flows; a reusable base-URL control, field-scoped validation, i18n and tests. Reuse the existing translator selector and plugin listing patterns rather than introducing a separate entity management flow.
- **Data and permissions:** obtain Platform plugin metadata and config.json plugin names through existing Core APIs, with explicit admin access. Plugin-source failures and Core versions without plugin support must not erase an existing reference; Platform listing currently may collapse HTTP errors into an empty result and requires care when presenting availability.
- **Compatibility:** save the existing `baseUrl`/`base_url` property with a `dial-plugin://` value; no new persisted mode or backend contract is needed. Existing file-defined and read-only views must remain non-mutating. The shared interface and URL controls serve other entities, so integration must not change their behavior.
