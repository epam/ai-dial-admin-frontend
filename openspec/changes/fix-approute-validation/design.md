## Context

`SaveValidationContext` manages a flat `Map<string, boolean>` where each field control registers its validity by a string key. `DisplayNameControl` defaults to key `"displayName"` when no `validationPrefix` is provided.

In the ApplicationRunner config view, the **Properties tab** registers `"dial:applicationTypeDisplayName"` (explicit prefix). The **AppRoutes tab** renders one `DisplayNameControl` per route (only the active route is mounted at any time), all writing to the same `"displayName"` key with no cleanup on unmount.

This creates three compounding bugs:
1. Switching routes leaves the old route's validity entry in the map (no cleanup).
2. All routes share the same key — only the active route's validity is visible to the context.
3. Stale `"displayName"` entries persist when switching away from the AppRoutes tab.

A previous workaround disabled route switching when `!isValid`, which deadlocked users with invalid routes and must be removed.

## Goals / Non-Goals

**Goals:**
- Aggregate `isValid` in context always reflects reality regardless of which tab or route is active
- Switching tabs or routes never leaves stale validation entries
- Users can freely switch routes and tabs without validation state corruption
- All app routes' name validity is tracked even when unmounted

**Non-Goals:**
- Changing how other field controls (Id, Description, etc.) interact with validation context
- Refactoring `SaveValidationContext` to a more general-purpose form library
- Per-route validation for fields other than `displayName` (status, methods, endpoints already handle removal correctly via `onRemoveRoute`)

## Decisions

### Decision 1: Add `RemoveField` action to `SaveValidationContext`

**Chosen:** Add `RemoveField` action that deletes the key from the map and recomputes `isValid`.

**Why:** The context has no way to clean up entries. This is the minimal addition needed by cleanup effects without restructuring the reducer. All other actions are set-style — `RemoveField` is a natural complement.

**Alternative considered:** Reset the whole context on tab switch. Rejected: triggers full re-validation flash and requires coordinating the reset with every tab change site.

---

### Decision 2: `DisplayNameControl` cleans up its key on unmount

**Chosen:** Add a `useEffect` cleanup that dispatches `RemoveField` for this component's key when it unmounts. Only fires when `trackGlobalValidity` is true (see Decision 3).

**Why:** Stale entries from unmounted controls are the direct cause of cross-tab corruption. Cleanup at the source is the most reliable fix — no coordination needed with parent components.

**Alternative considered:** Parent components explicitly clear keys. Rejected: too fragile, requires every usage site to know about validation context lifecycle.

---

### Decision 3: `trackGlobalValidity` prop on `DisplayNameControl` (default `true`)

**Chosen:** Add optional `trackGlobalValidity?: boolean` prop. When `false`, the component renders inline errors but never reads or writes the global validation context.

**Why:** For app routes, `EntityRoutes` will own the aggregate key (Decision 4). If `DisplayNameControl` also dispatches to the context, the same problem recurs — multiple instances write to the same or different keys, and unmounted routes vanish from the map. Opting out of global tracking for the per-route case is cleaner than threading a unique prefix through four component layers.

**Alternative considered:** Thread a unique stable ID (`uuid`) per route down as `validationPrefix`. Rejected: adds complexity (stable ID management in `EntityRoutes`, prop threading through `RouteContent` → `RouteProperties`), and still leaves the "unmounted routes not tracked" problem unless the parent also computes validity.

---

### Decision 4: `EntityRoutes` eagerly computes aggregate route-name validity

**Chosen:** A `useEffect` in `EntityRoutes` watches `routes` and validates **all** route names (uniqueness + alphanumeric) using the existing `getErrorForAppRouteName` utility. It dispatches `SetField("appRouteNames", allValid)` and cleans up with `RemoveField("appRouteNames")` on unmount.

**Why:** Only `EntityRoutes` has access to all routes simultaneously. Mounted components can only track the route currently on screen. Moving the aggregate check to the data owner (not the rendering layer) means validity is always correct regardless of which route is active.

**Validation logic reuse:** `getErrorForAppRouteName(name, otherNames, t)` already exists in `src/utils/validation/name-error.ts`. For each route at index `i`, `otherNames` is `routes.filter((_, j) => j !== i).map(r => r.name || '')`.

---

### Decision 5: Remove route-switching lock

**Chosen:** Remove `pointer-events-none` guard on `AppRouteList` items when `!isValid`, and remove the `disabled` check on the "Add" button that was tied to `isValid`.

**Why:** With Decision 4, `isValid` in context reflects all routes (not just the mounted one). The lock was a workaround for stale state — it's no longer needed and was worse UX than the bug it tried to prevent. The "Add" button should remain disabled while there are validation errors (prevents adding a route on top of existing errors).

## Risks / Trade-offs

- **`getErrorForAppRouteName` called for every route on every routes change** → O(n²) for uniqueness checks. Routes arrays are small (typically < 20), so this is not a concern in practice.

- **`trackGlobalValidity={false}` is a new prop pattern** → Adds conceptual surface to `DisplayNameControl`. Mitigated by making it optional with a safe default, and documenting via prop name only.

- **`RemoveField` makes `isValid` flip to `true` transiently** → When a component unmounts and removes its (invalid) key, `isValid` briefly becomes `true` before the replacement mounts. In practice the two effects fire in the same React commit/flush, so there is no observable UI flicker.
