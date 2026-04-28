### Requirement: Validation context supports field removal
The `SaveValidationContext` SHALL support a `RemoveField` action that removes a named key from the validation map and recomputes the aggregate `isValid` signal. After removal, `isValid` SHALL reflect only the remaining registered fields.

#### Scenario: Removing the only invalid field restores isValid
- **WHEN** a field is registered as invalid in the context
- **AND** `RemoveField` is dispatched for that field
- **THEN** the field is absent from the map
- **AND** `isValid` becomes `true`

#### Scenario: Removing a valid field from a mix
- **WHEN** multiple fields are registered (some valid, some invalid)
- **AND** `RemoveField` is dispatched for a valid field
- **THEN** that field is absent from the map
- **AND** `isValid` remains `false` (invalid fields still present)

---

### Requirement: DisplayNameControl cleans up its validation entry on unmount
When `trackGlobalValidity` is `true` (the default), `DisplayNameControl` SHALL dispatch `RemoveField` for its registered key when the component unmounts. No stale entry SHALL remain in the validation context after the component is no longer rendered.

#### Scenario: Switching tabs removes stale displayName entry
- **WHEN** a `DisplayNameControl` is rendered on Tab A and registers its key
- **AND** the user navigates to Tab B causing Tab A to unmount
- **THEN** the key registered by Tab A's `DisplayNameControl` is removed from the validation map

#### Scenario: Switching active app route clears previous route's entry
- **WHEN** Route A is the active route and its `DisplayNameControl` registers its key
- **AND** the user switches to Route B
- **THEN** Route A's `DisplayNameControl` unmounts and its key is removed from the map
- **AND** Route B's `DisplayNameControl` mounts and registers its own key

---

### Requirement: DisplayNameControl can opt out of global validation context
`DisplayNameControl` SHALL accept a `trackGlobalValidity` prop (boolean, default `true`). When `false`, the component SHALL only maintain local inline error state and SHALL NOT read from or write to the global `SaveValidationContext`. All other behavior (inline error display, onChange callback) SHALL be unaffected.

#### Scenario: Opt-out component does not affect aggregate validity
- **WHEN** a `DisplayNameControl` is rendered with `trackGlobalValidity={false}`
- **AND** the input value is invalid
- **THEN** an inline error is shown
- **AND** no entry is written to the global validation map
- **AND** `isValid` in the context is unchanged

#### Scenario: Opt-out component unmount does not dispatch RemoveField
- **WHEN** a `DisplayNameControl` with `trackGlobalValidity={false}` unmounts
- **THEN** no `RemoveField` action is dispatched to the context

---

### Requirement: EntityRoutes tracks validity of all app routes eagerly
`EntityRoutes` SHALL maintain a single `"appRouteNames"` key in the global validation context. This key SHALL reflect whether **all** app route names pass validation (non-empty, alphanumeric, unique within the route list). The key SHALL be recomputed whenever the routes array changes. The key SHALL be removed from the context when `EntityRoutes` unmounts.

#### Scenario: All routes have valid names
- **WHEN** all routes have non-empty, alphanumeric, unique names
- **THEN** `"appRouteNames"` is registered as valid in the context

#### Scenario: One route has an invalid name
- **WHEN** any route has an empty or non-alphanumeric name
- **THEN** `"appRouteNames"` is registered as invalid
- **AND** the aggregate `isValid` is `false`

#### Scenario: Route with invalid name is removed
- **WHEN** a route with an invalid name is removed from the list
- **AND** all remaining routes have valid names
- **THEN** `"appRouteNames"` is recomputed and registered as valid

#### Scenario: EntityRoutes unmounts
- **WHEN** the AppRoutes tab is left and `EntityRoutes` unmounts
- **THEN** the `"appRouteNames"` key is removed from the validation map

---

### Requirement: App route DisplayNameControl uses local validation only
In the `RouteProperties` component, when rendered for an app route in the ApplicationRunner context (`isAppRoute && isAppRunnerView`), the `DisplayNameControl` SHALL be rendered with `trackGlobalValidity={false}`. Inline errors SHALL still display. The aggregate validity for route names SHALL come exclusively from the `EntityRoutes` `"appRouteNames"` key.

#### Scenario: Invalid route name shows inline error but does not double-register
- **WHEN** a user clears the name field of an active app route
- **THEN** an inline error is shown in the `DisplayNameControl`
- **AND** no `"displayName"` key is written to the validation context by `DisplayNameControl`
- **AND** `"appRouteNames"` in the context is updated to invalid by `EntityRoutes`

---

### Requirement: Route switching is never blocked by validation state
Users SHALL be able to switch between app routes in `AppRouteList` at any time, regardless of whether the current route has validation errors. The `pointer-events-none` guard on route list items SHALL be removed.

#### Scenario: User switches route while current route has errors
- **WHEN** the active route has a validation error in any field
- **AND** the user clicks a different route in the sidebar
- **THEN** the selected route becomes active
- **AND** inline errors are cleared (new route's fields initialize)
- **AND** the aggregate validity (`isValid`) reflects all routes via `"appRouteNames"`
