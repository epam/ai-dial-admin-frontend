## Why

Today a Platform Role asset (`/platform-roles/{name}`) has a Properties tab only — cost limits and
sharing — with no way to attach per-model token limits to the role itself. DIAL Core's `Role.limits`
map already supports keying numeric minute/day/week/month token limits by model name; the admin
console has no surface to read or write it. The entity-side `Entities > Roles` surface
(`/roles/{name}`) already solves the equivalent problem for admin-backend roles with its own
`Entities` tab, so Platform Roles should gain an analogous tab rather than a bespoke one.

## What Changes

- Add an `Entities` tab to the Platform Role asset detail view, positioned after `Properties`,
  following the shape of the existing `/roles` Entities tab (`components/Roles/View/TabsContent.tsx`):
  a header reading `Entities: {n}` with an `+Add` button, and a grid of attached models.
- The `+Add` popup lists only models — sourced from both DIAL Core's `platform` population and its
  config-file population (the same merged Api/ConfigFile population `Assets > Models` already reads),
  not applications, routes, toolsets, or any other entity type — and supports selecting several models
  at once before applying.
- Adding a model inserts it into the role's `limits` map (initially with no token limits set) and it
  appears as a row in the main Entities grid.
- The Entities grid shows `Name`, `Tokens per minute`, `Tokens per day`, `Tokens per week`, and
  `Tokens per month` columns per attached model. Each token column is independently editable and
  writes a plain number into `limits["<model-name>"]`.
- A token column with no configured value shows a "No limits" placeholder for that model.
- Entering `0` in a token column is stored as the number `0` (distinct from no limit); clearing a
  previously entered value removes that specific field from the model's limit entry entirely — the
  model's row and its other token values are unaffected, and the model stays attached (listed) even if
  every one of its token fields ends up cleared.
- Editing token values across several rows in sequence does not force a full grid rebuild — the grid
  keeps its scroll position, focus, and any in-progress edit on another row, matching the
  `isSkipRefresh` inline-edit convention already used by `EntityView/Roles` and
  `TestSuites/TestCaseSchema/SchemaManager`.
- Removing a model (row action) deletes its entry from `limits` entirely and removes the row.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `platform-roles`: the role asset detail view gains a second tab, `Entities`, changing the existing
  "Properties only, no Entities tab" requirement; adds new requirements for the Entities tab's grid,
  add-model popup, token-limit editing, and the no-limit/zero/clear semantics for `limits` map entries.

## Impact

- `apps/ai-dial-admin/src/components/Assets/Platform/Roles/TabsContent.tsx` — render the new Entities
  tab content.
- `apps/ai-dial-admin/src/utils/tabs/utils.ts` — `getTabsForAsset` gains an
  `ApplicationRoute.PlatformRoles` branch returning `[propertiesTab(t), entitiesTab(t)]`.
- New component(s) under `apps/ai-dial-admin/src/components/Assets/Platform/Roles/` for the Entities
  tab and its add-model popup, reusing `EntityView/AddEntitiesGrid` for the multi-select popup shell
  and following the token-column/`isSkipRefresh` conventions in `EntityView/Roles/utils.ts` and
  `TestSuites/TestCaseSchema/SchemaManager.tsx` — adapted for Core's plain-number, no-sentinel `limits`
  shape rather than the admin-backend's string/`UNLIMITED_VALUE` one.
- `apps/ai-dial-admin/src/models/dial/resource.ts` — no shape change; `DialRoleResource.limits` already
  supports this.
- `apps/ai-dial-admin/src/app/[lang]/platform-roles/actions.ts` — verify `updateRole`'s existing
  `limits` write-normalization covers per-model entries with partial token sets (it already strips
  unsupported fields and normalizes `costLimit`/`limits` to Core's wire shape).
- No admin-backend involvement — the Entities tab reads/writes only through Core, consistent with the
  rest of this capability.
- `openspec/specs/platform-roles/spec.md` — delta spec for the changed tab-set requirement and the new
  Entities-tab requirements.
