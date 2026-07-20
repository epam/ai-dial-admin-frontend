## Context

DIAL core (0.46.0+) and ai-dial-admin-backend both model a per-deployment `interfaces` map:
`Map<string, { base_url: string }>`, keyed by interface type. Admin-backend's
`DeploymentInterfaceTypes` registry restricts which keys are legal per entity kind:

- Models: `openaiChatCompletions`, `openaiResponses`, `anthropicMessages` (up to 3)
- Applications (entity) and Interceptors: `openaiChatCompletions` only (exactly 1)
- Assets → Applications (core-backed, no server-side restriction today, but documented/intended
  restriction matches entity Applications): `openaiChatCompletions` only (exactly 1)

The admin frontend has no UI for this property. Four separate entity views need a new "Interfaces"
section, each with its own DTO casing and allowed-type list, but identical interaction rules. There is
no existing reusable "add → dropdown of remaining options → collapses into typed input → hide when
exhausted" component in the codebase (confirmed by search — closest analogues are `ResourceMultiAuth`,
`ContainerVariables`, `GlobalInterceptors`/`RouteRoles`, none of which match all the required behaviors).

## Goals / Non-Goals

**Goals:**
- One generic, domain-free component (`Common/`) that renders the add/dropdown/input/delete UI, driven
  entirely by props (allowed types, labels, current value map, change handler).
- Thin per-view wrapper usage in each of the four Properties components, each supplying its own allowed
  types and DTO field casing.
- Support both restriction shapes without a dropdown when there's only one allowed type: the single
  input is created directly on "+ Add" click, no type-selection step is ever shown.
- Strip blank `base_url` entries from the save payload for all four entities, mirroring the existing
  `stripExternalServiceAuthStatuses` precedent in `assets-applications/actions.ts`.

**Non-Goals:**
- No changes to `externalServices`/`ResourceMultiAuth` (already implemented, unrelated feature).
- No validation of `base_url` format beyond what existing input/URL controls already provide (backend
  already validates `@Endpoint`/`@NotBlank` server-side for entity views).
- No reordering/drag-and-drop of interface rows.
- No support for editing the *type* of an already-added interface row (delete and re-add instead).
- Assets → Toolsets/Prompts are out of scope (no `interfaces` support planned there).

## Decisions

### D1: New component lives under `Common/`, not nested inside `SourceField`/`Endpoints`

Per user direction, `InterfacesField` is a standalone sibling component — **not** wired into the
`SourceField`/`Endpoints` dispatcher (`ModelEndpoint.tsx`/`ApplicationEndpoint.tsx`/
`InterceptorEndpoint.tsx`). It is rendered directly by each entity's Properties component, next to (not
inside) the existing `SourceField`/`ResourceSourceField` call — the same placement pattern already used
for `ResourceMultiAuth` in `Assets/Apps/Properties.tsx:109-120`.

Rendered in:
- `components/ModelView/ModelProperties/ModelProperties.tsx` (after `DeploymentProperties`)
- `components/Applications/View/Properties/Properties.tsx` (after `SourceField`)
- `components/Interceptors/View/Properties/Properties.tsx` (after `SourceField`)
- `components/Assets/Apps/Properties.tsx` (after `ResourceSourceField`, alongside `ResourceMultiAuth`)

**Alternative considered**: embed inside the endpoint components so it visually reads as part of
"routing config." Rejected per explicit user feedback — keeps the endpoint components focused on the
legacy `endpoint`/`responsesEndpoint` fields and keeps `InterfacesField` reusable/testable in isolation.

### D2: Component is generic, parameterized by allowed types + labels — one implementation, four callers

```
Common/InterfacesField/InterfacesField.tsx

Props {
  value: Record<string, { <baseUrlKey>: string }>   // current interfaces map
  onChange: (next: Record<string, { <baseUrlKey>: string }>) => void
  allowedTypes: InterfaceTypeOption[]                // ordered list: { value: InterfaceType, label: string }
  baseUrlKey: 'baseUrl' | 'base_url'                  // casing differs entity-backed vs core-backed
  disabled?: boolean                                  // read-only admin / immutable entity
}
```

- `allowedTypes.length === 1`: "+ Add" directly creates that one type's row (no dropdown ever renders).
  Button hides once `value` has that key.
- `allowedTypes.length > 1`: "+ Add" opens a `DialSelectField`-style dropdown listing
  `allowedTypes.filter(t => !(t.value in value))`. Selecting an option adds that key to `value` with an
  empty `base_url` and closes the dropdown, revealing the labeled input. Button hides once
  `Object.keys(value).length === allowedTypes.length`.
- Each existing row: label + text input (bound to `value[type][baseUrlKey]`) + red `IconTrashX` delete
  button (`DialGhostIconButton` with `icon={<IconTrashX size={16} className="text-error" />}`, matching
  the existing delete-button convention in `Analytics/QueryBuilder/Common/ChipRow.tsx:57-60` and
  `ResourceMultiAuth.tsx`). Delete removes that key from `value`.
- Container: `DialLabel` title "Interfaces" + `rounded border border-primary p-4` wrapper, matching the
  `ResourceMultiAuth` list-mode container styling for visual consistency with the neighboring
  `ResourceMultiAuth`/`ExternalServices` section on Assets → Applications.

**Alternative considered**: separate components per restriction shape (`SingleInterfaceField` vs
`MultiInterfaceField`). Rejected — the "single allowed type" case is just "multi" with `allowedTypes`
of length 1; branching once inside one component is simpler than two call sites and duplicated
row/delete markup.

### D3: Per-view type catalogs and labels live in a shared constants file, not inline

`src/models/dial/interfaces.ts` (or `models.ts` for the feature, per `code-standards.md`'s
constants/models split) declares:

```ts
export enum DeploymentInterfaceType {
  OpenAIChatCompletions = 'openaiChatCompletions',
  OpenAIResponses = 'openaiResponses',
  AnthropicMessages = 'anthropicMessages',
}
```

and `src/constants/deployment-interfaces.ts` declares the three per-view catalogs:

```ts
MODEL_INTERFACE_TYPES = [ChatCompletions, Responses, AnthropicMessages]   // 3
APPLICATION_INTERFACE_TYPES = [ChatCompletions]                           // 1
INTERCEPTOR_INTERFACE_TYPES = [ChatCompletions]                           // 1
ASSET_APPLICATION_INTERFACE_TYPES = [ChatCompletions]                    // 1
```

mirroring admin-backend's `DeploymentInterfaceTypes.java` registry 1:1, so a future backend change
(e.g. allowing Interceptors a second type) is a one-line catalog edit, not a component change. Labels
(`"OpenAI Chat Completions"`, `"OpenAI Responses"`, `"Anthropic Messages"`) go through i18n
(`InterfacesI18nKey` in `constants/i18n.ts`), not hardcoded strings, per `components.md` §10.

### D4: DTO shape — new optional `interfaces` field, per-view casing preserved

Following the existing camelCase (admin-backend) vs snake_case (core) split already present between
`application.ts` and `resource.ts`:

```ts
// models/dial/model.ts, application.ts, interceptor.ts (admin-backend-backed)
interfaces?: Record<string, { baseUrl: string }>;

// models/dial/resource.ts — DialApplicationResource (core-backed)
interfaces?: Record<string, { base_url: string }>;
```

No shared `DeploymentInterface` type with a generic key name — two small interfaces
(`DialDeploymentInterface { baseUrl }` and `DialResourceInterface { base_url }`) keep each DTO
consistent with its existing sibling fields (`endpoint` vs `endpoint`, `viewerUrl` vs `viewer_url`,
etc.) without inline anonymous object types (per `code-standards.md`).

### D5: Empty-value stripping happens in each entity's server action, not in the component

The component always writes whatever the user typed (including blank strings while editing — needed so
users can clear a field without the row disappearing mid-edit). Stripping happens once, at save time, in
each `actions.ts`, mirroring `stripExternalServiceAuthStatuses`:

```ts
function stripEmptyInterfaces<T extends Record<string, { baseUrl?: string } | { base_url?: string }>>(
  interfaces: T | undefined,
): T | undefined {
  if (!interfaces) return interfaces;
  const filtered = Object.fromEntries(
    Object.entries(interfaces).filter(([, v]) => Boolean((v as any).baseUrl ?? (v as any).base_url)),
  );
  return Object.keys(filtered).length ? (filtered as T) : undefined;
}
```

Applied in `updateModel`/`createModel`, `updateApplication`/`createApplication`,
`updateInterceptor`/`createInterceptor`, and alongside `stripExternalServiceAuthStatuses` in
`updateApp`/`createApp`. Empty map is sent as `undefined` (field omitted) rather than `{}`, consistent
with how other optional fields are omitted in these payload builders.

## Risks / Trade-offs

- **[Risk]** Assets → Applications' core-backed restriction to `openaiChatCompletions` is a
  frontend-only convention (core doesn't reject other keys server-side) → **Mitigation**: documented in
  proposal/design as a deliberate FE-side consistency choice; if a future core change genuinely allows
  more types for applications, only the `ASSET_APPLICATION_INTERFACE_TYPES` constant needs updating.
- **[Risk]** New optional field on 4 DTOs touches save payload builders that are exercised by existing
  tests → **Mitigation**: stripping helper is additive (no-op when `interfaces` is undefined), so
  existing tests for those actions should be unaffected; new tests cover the stripping behavior
  specifically.
- **[Trade-off]** Single generic `InterfacesField` component means the "exactly one type" views carry
  slightly more prop plumbing (`allowedTypes={[ONE_ITEM]}`) than a bespoke single-input component would
  — accepted in favor of one tested implementation instead of four.

## Migration Plan

No data migration needed (new optional field, backend already supports it end-to-end). Rollout is a
standard frontend deploy: ship the four Properties changes together since they share the same new
component and constants file. No feature flag — the section simply doesn't render/save anything until
an admin explicitly adds an interface.
