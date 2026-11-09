## Context

Core #2152 added `Policy` and `PolicyAssignment` records, stored under `policies/platform/...` and
`policy_assignments/platform/...`, admin-only, ETag-guarded, validated server-side (400 malformed, 422
semantically invalid, 409 conflicts such as deleting a referenced policy or a priority tie). Nothing reads
them into the enforced config yet.

The console already has a family of Core-direct platform resources (models, applications, toolsets,
translators, routes, app runners, catalog schemas, interceptors, roles, keys) built on one shape: an `ApplicationRoute`,
a `createFolderContext` provider, `BaseAssetList` driven by `switch (view)` helpers, a `View` +
`TabsContent`, server actions over `assetApi`, and a per-resource `platform-*` spec. Routes and Roles are
the closest siblings and are **flat**; policies are not.

What differs from every sibling:

| | Sibling (Routes, Roles) | Policies / Assignments |
|---|---|---|
| Path | `<name>` | policy `[<costObject>/]<name>`; assignment `<costObject>/<id>` (exactly one folder level) |
| Folder UI | hidden | the folder **is** the cost object |
| Cross-record rules | none | 409 on deleting a referenced policy; re-check of assignments when a policy changes |
| Nested editor | Roles has an Entities grid | `subject` is a list of rule objects, on both records |

## Goals / Non-Goals

**Goals**
- Both entities listable, creatable, editable, deletable, duplicable and bulk-deletable, on the existing
  platform-resource shape.
- Folder semantics that make the cost-object relationship hard to get wrong.
- A form (not JSON-only) including a dedicated **Subjects** tab.
- Core stays the single validator; its messages reach the user unchanged.

**Non-Goals**
- Enforcement, usage display, and links from models/apps/roles/keys to policies.
- Fields Core rejects as "not supported yet" (`attachedTo`, `harness`, `broker`, `packages`, `per` ≠
  `["subject"]`).
- Client-side port of V1–V11 or the priority-tie rule.

## Decisions

### D1 — Two resource types, treated as folder-nested versionless
Add `ResourceType.POLICY` and `ResourceType.POLICY_ASSIGNMENT`, registered in `RESOURCE_TYPE_PREFIX`
(`policies`, `policy_assignments`) and in `asset-metadata.ts` with the folder-nested versionless
parsing path (`parseEncodedFolderPath`) used by prompts, **not** `flatMetadataFields`. A `__` in a name
therefore stays part of the name, and `folderId` is the cost object.

*Alternative — reuse `flatMetadataFields` with a composite name* (`costObject/name` as the "name"): rejected.
It would leak a `/` into every place that treats `name` as a single segment (routes, breadcrumbs,
duplicate modal, validation), and the folder tree would never get a node.

### D2 — A "nested platform" view category, one folder level, owned by Core
Today "platform" means flat in the file manager: `isFlatPlatformView` decides the root (`platform/`), how
create and duplicate build paths, and whether move exists (`FileManager`, `BaseAssetList`, `CreateAsset`,
`Modals`, `Assets/utils.ts`). Policies are stored under `platform/` but nest one level, so neither
existing category fits. Add a third one, `isNestedPlatformView` (next to `isFlatPlatformView` in
`utils/files/root-folder.ts`), for the two policy views:

- **Root** stays `platform/` (`getRootFolder` returns it for both flat and nested views).
- **One folder level:** a folder is a cost object. Core folders are implicit — they exist only while they
  hold a record, and there is no folder-marker write — so the tree offers **no** create-folder, rename or
  move (`FileManager` withholds `onCreateFolder` for nested views). The create modal takes the cost object
  instead. Core stays the authority (`At most one folder level`, 400).
- **Create and duplicate** take the folder from the list's current path instead of forcing a bare name, so
  `team-a/team-cap` is written as that path and the new record keeps its folder.
- **Policies:** root entries are global policies; folder entries are project policies of that cost object.
  The create modal has an optional Cost object (blank = global), pre-filled from the current folder, and
  the budget fields — Core requires `priority`, `object` and a cost window on every write, so a name-only
  create would always be refused.
- **Assignments:** a root entry cannot exist; the create modal requires a cost object and also takes the
  subject rules, since most policies leave `subject` to their assignments.

Everything that tests `isFlatPlatformView` is revisited once: it either also accepts the nested category
(root, platform-bucket path rules) or stays flat-only (move, flat create path). That is its own task group,
ahead of the entity work, so the shared change reviews on its own.

*Alternative — treat policies as flat with a composite name* (`team-a/team-cap`): rejected. It leaks a `/`
into every place that treats `name` as one segment (breadcrumbs, duplicate modal, name validation) and the
folder tree never gets a node.

*Alternative — a flat list with a "Cost object" column:* rejected; it hides the one structural fact (the
folder equals the cost object).

### D3 — Assignment `costObject` is derived from the folder, never typed twice
The assignment create modal asks for **Cost object** (the folder), **ID**, and **Policy**. The saved body
sets `costObject` from the folder; on the Properties tab it is read-only. When create is launched from
inside a folder the cost object is pre-filled and locked. This removes the "`costObject` ≠ folder" failure
class on the client instead of explaining it after a 422.

For **policies** the `costObject` body field is the pin for a *self-applying* policy and is editable, but
Core requires it to equal the folder when set. The form states this next to the field and defaults it
empty; Core's 422 is shown if it conflicts.

### D4 — Fields shown, and the single legal values
Core's validator accepts one combination today, so the form does not offer illegal ones:

- `kind` → select with `budget` only.
- `quantity` → select with `cost` only (Core: "a budget must have quantity 'cost'").
- `per` → fixed to `["subject"]`, not editable.
- `priority` (required integer), `object` (required), `cost.day` / `cost.month` (decimals, > 0, at least one).
- `object` is a two-mode control: **All deployments** (`"*"`) or a **list of deployment names**; an
  empty list is not submittable.

The enums stay complete in the model (`PolicyQuantity` has `tokens`/`requests`) so a later Core release
only widens the options.

### D5 — Subjects as a dedicated tab, one component for both entities
`subject` is `PolicySubjectRule[]`: `{ source, function, targets[] }`, `function ∈ TRUE | FALSE | EQUAL |
CONTAIN | REGEX`, rules OR-composed. It is a repeating structure on both records, so it gets its own tab
backed by one shared `SubjectRulesEditor` placed next to the two entity folders (not in `Common/`, because
it carries the policy domain model).

Rules in the editor:
- `source` is free text with a `roles` suggestion (Core: `roles` or a dotted claim path).
- `TRUE` / `FALSE` take no targets — the targets control is disabled and cleared when selected.
- `targets` is a multi-value text input; `REGEX` targets are not validated on the client (Core is).
- An empty rule list is **not saved as `[]`**: the field is omitted. Core rejects an empty list as
  matching everybody.
- **Pinned exactly once** (Core): a policy and its assignments split `subject`/`costObject` between them.
  The tabs show an informational note, but do not enforce — the rule needs the other record.

*Alternative — subjects inline on Properties:* not chosen; the rule list would dominate the form.

### D6 — Policy selector on the assignment
`policy` is a path into `policies`. A single-select, loaded through the metadata listing
(`ResourceType.POLICY`), shows global policies and the project policies of the assignment's own cost
object. Core rejects other cost objects' project policies with 422, so the selector filters them out.
The list is fetched when the modal / Properties tab mounts, and a fetch failure degrades to a text
input so a transient listing error never blocks the form. This is the only cross-entity read, and it is
needed for the form to be usable at all.

### D7 — Server actions and payloads
`src/app/[lang]/platform-policies/actions.ts` and `platform-policy-assignments/actions.ts` mirror
`platform-routes/actions.ts`: `getUserToken` → `assetApi` (`list`, `put`, `getMergedWithEtag`, `delete`),
`bulkDeleteAssets` for bulk delete. A `toPolicyPayload` / `toAssignmentPayload` helper strips
`_metadata`, `description`/`createdAt`/`updatedAt` that the generic create form seeds (the same hazard
`toRoutePayload` documents), omits `id` (Core: "when set it must match the path"), and omits empty
optional fields. No `configFileApi` calls: these resources have no config-file population.

*Alternative — send `id`:* rejected; it adds a mismatch failure with no benefit.

### D8 — Error surface: Core's message, not ours
`assetApi` already maps non-2xx to `{ success: false, errorHeader, errorMessage }`. The 422/409 bodies
are rendered through `getErrorNotification` unchanged. The client checks only: required fields present,
priority is an integer, cost amounts are positive decimals, `expiresAt` parses as an offset date-time. The
semantic rules (policy exists and belongs to the cost object, priority ties, referenced-policy delete) stay
in Core.

### D9 — Menu placement
Governance, after `Interceptors`, before `Approvals`, dropped when `featureFlags.policiesEnabled` is false
(see D11). Icons: a coin/wallet for Policies, a
link/ticket for Policy Assignments, in `menu-item-icons.tsx`. Both items carry `badge: MenuBadge.Preview` (a per-item badge; `menu-badges` only says Governance has no *group* badge), matching the `[Preview]` tag on the flag.

### D11 — `POLICIES_ENABLED`: one opt-in switch, default off
Core stores policies but does not enforce them, so an operator who sees a "Policies" page may believe
limits are active. The feature is therefore opt-in: `POLICIES_ENABLED`, truthy per `isValueTruthy`,
unset means off. It follows the `ANALYTICS_CUSTOM_DASHBOARDS_ENABLED` precedent end to end:

- **Getter:** `src/utils/env/get-policies-toggle.ts` exports `getIsPoliciesEnabled()`, the only reader of
  the variable. The layout builds `featureFlags.policiesEnabled` from it and the pages call it directly, so
  no two places can disagree.
- **Menu:** the two items are filtered by `policiesEnabled` alone. Because `Governance` still holds other
  items, the group never empties.
- **Routes:** `platform-policies/page.tsx`, `[id]/page.tsx` and the two assignment counterparts call
  `notFound()` when the getter is false, so an address the menu never offers is not reachable by URL
  either (the `dashboards/[id]` precedent).
- **Server actions:** not gated. The precedent gates `custom-actions.ts` because that API is a preview
  service; here Core already authorizes every write as admin-only, and the flag is a visibility switch, not
  a security boundary. Gating every action would only add a second place to keep in sync.
- **Provider stack:** the folder contexts stay mounted when the flag is off; they hold no data until a view
  fetches, so the disabled state costs nothing.

*Alternative — reuse `DISABLE_MENU_ITEMS` with a new token:* rejected. That variable is opt-out, so the
default would be "on", and it hides menu entries without closing the route.

*Alternative — two flags, one per entity:* rejected; assignments are meaningless without policies, so a
split would only create a misconfiguration.

### D12 — Remove the `catalogEnabled` flag
`catalogEnabled` was derived from a `catalog` token in `DISABLE_MENU_ITEMS` and gated three things: the
Core-direct menu items (`catalogItems(...)`), and the `platform` bucket root in `CreateAsset`, `FilePath`
and `FileManager`. With policies behind their own opt-in flag it is the last reason to configure it, and the
Core-direct views are no longer Preview in the way the token assumed. Removing it means:

- `FeatureFlags.catalogEnabled`, its line in `[lang]/layout.tsx`, and the `catalogItems` helper go; its
  items become plain entries.
- The three components pass `!isUnitMode` where they passed `catalogEnabled && !isUnitMode`, so unit mode
  still withholds the `platform` root and nothing else changes for it.
- `DISABLE_MENU_ITEMS` is unchanged otherwise: it still matches the last segment of an item's key, so
  `models` or `roles` hides those items. Only the special `catalog` meaning is gone.

**BREAKING for operators who set `catalog`:** the Core-direct items and the `platform` root reappear. The
token is not translated into anything, so there is nothing to migrate; it is simply ignored. The infra
changelog says so under `Removed`.

*Alternative — keep the flag but default it on:* rejected; it keeps a dead configuration surface and the
`catalogItems` indirection for no behavior.

*Alternative — a deprecation period that logs when `catalog` is set:* rejected; the repo has no
deprecation-warning convention for env tokens, and the result of ignoring it is visible in the menu.

### D10 — Order of work
Policies are the dependency of assignments (selector, delete-protection UX), so tasks are ordered:
shared foundations → Policies → Subjects editor → Assignments → tests → quality gates. Each group is
PR-sized and the app typechecks and renders after each.

## Risks / Trade-offs

- **[A folder is implicit in Core, so an empty cost-object folder cannot persist]** → No create-folder
  action is offered; a new cost object is entered in the create modal and appears once its first record
  is written.
- **[Deleting a referenced policy returns 409]** → The delete modal shows Core's message; no pre-flight
  reference scan, which would duplicate Core and race it.
- **[Changing a policy can invalidate its assignments (422)]** → The save error names the assignment;
  shown as-is.
- **[Core rejects the form's legal combinations later (e.g. `tokens` becomes allowed)]** → Options live
  in one constants file next to the enum; widening is a one-line change.
- **[The nested category touches shared file-manager code used by every platform view]** → Flat views keep
  their exact behavior; the new predicate is additive and each changed branch gets a flat-view regression
  assertion.
- **[Wide switch-statement wiring across shared helpers]** → Every `switch (view)` has a sibling case to
  copy; the unit tests for those helpers get one assertion per new view so a missed case fails loudly.
- **[Core build without #2152]** → The list shows the standard load-error state; no feature detection.
  With the flag off by default, an operator on an older Core never sees the pages unless they opt in.
- **[Flag off hides pages but not the server actions]** → Intended, see D11; Core's admin-only
  authorization is the boundary.
- **[Operators miss the variable]** → Documented in `.env.template`, the README table and the infra
  changelog, like the other preview flags.

## Open Questions

- Whether a **global** policy may pin `costObject`. Core's code only constrains it when a folder exists
  ("differs from the folder"); the form allows it and defers to Core.
- `expiresAt` is a validated text input (ISO-8601 with an offset), not the kit's `Calendar`: its value is a
  `Date | string` whose offset behavior is not specified, and the text form matches Core's own error message.
  Revisit if operators ask for a picker.
