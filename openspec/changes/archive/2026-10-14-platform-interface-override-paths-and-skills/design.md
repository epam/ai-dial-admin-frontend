## Context

Core's `DeploymentInterface.overridePaths` is a `Map<String,String>` keyed by operation. The key set
is closed per interface type (`InterfacePathMapping`), values may use `{id}` and `{overrideName}`, and
Core rejects on load: a known key under the wrong interface, `{id}` on an operation with no id, and
any `overridePaths` on a `mode: translator` interface. Unknown keys are tolerated. The wire name is
camelCase `overridePaths` on every resource, including the snake_case Application (the nested class
has no naming strategy). `skills_supported` is a boolean on Core's shared `Features` class,
snake_case on the wire, default `false`, valid in per-interface `features` too.

The platform surfaces share one `InterfaceRow`, which already handles mode, translator, headers,
Defaults and Features. `InterfaceFeaturesButton` already picks the model or application feature set
from `view`.

## Decisions

1. **Add-button flow with one input per added operation, not a free key-value grid.** Mirrors how
   interface types are added: an "Add override path" button opens a dropdown of the operations not yet
   added, or adds the only remaining one directly. The key set is closed per type, so wrong-interface
   keys are unrepresentable. Alternatives: all inputs always visible (noisy for Responses' four
   operations); `KeyValueGrid` as for headers (permits exactly the invalid states Core rejects).
   An added-but-empty row is tracked in the editor's own state, not as an empty-valued key in the
   entity: an empty path would reach Core as a present, broken path, and an `undefined`-valued key did
   not reliably survive the view's draft state. The row is therefore lost if the editor remounts before
   it is filled, which costs nothing since it carries no data.
2. **Per-type operation table in `constants.ts`**, `{ key, isIdApplicable }` per
   `DeploymentInterfaceType`, mirroring `InterfacePathMapping`. Rendering iterates the table for the
   row's type, so surfaces automatically show only supported operations (Applications and
   Interceptors offer only chat completions; Models offer all four).
3. **Preserve unknown keys.** The editor reads and writes only table keys; the rest of the map is
   spread through. Deleting a row removes its key, and the map is cleared when none remain.
4. **Translator mode clears `overridePaths`**, alongside the existing `baseUrl` clearing, and the
   section is hidden in translator mode.
5. **Client-side `{id}` check** on operations whose `isIdApplicable` is false, reported as a field
   error that blocks save through the existing `SaveValidationContext`. Other malformed input is
   forwarded as written, as Core does.
6. **Field name `overridePaths` (camelCase) for all surfaces**, unlike `base_url`/`default_headers`.
   `BaseUrlInterfaceValue` and `DialResourceInterface` gain `overridePaths?`.
7. **`skills_supported`:** add to `DialResourceFeatures` (shared), so both label maps (typed
   `Record<keyof …>`) fail to compile until it is added. It joins the tools group in
   `modelResourceSwitchGroups` and `resourceSwitchGroups`. The per-interface popup follows.
8. **Shared group key, new label.** Keep `GroupToolsFunctionCalling`, change the `en.ts` string to
   "Tools, Functions & Skills". The entity-level tab shows the same label with no skills switch;
   accepted.

## Risks / Trade-offs

- [Entity-level tab shows "Skills" without a switch] → accepted; revisit with a separate key if it
  confuses users.
- [FE `{id}` rule drifts from Core's operation table] → single table with a comment naming
  `InterfacePathMapping`; Core remains the authority and its error is surfaced on save.
- [`default_headers` vs `defaultHeaders` mismatch in `DialResourceInterface`] pre-existing; not touched
  here.

## Open Questions

- Exact label wording ("Tools, Functions & Skills") may be adjusted in review.
