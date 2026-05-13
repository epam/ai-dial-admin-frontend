# deployments-node-pool-selector Specification

## Purpose

Provide a discoverable UI for choosing the Kubernetes node pool a container targets, backed by the `/node-pools` API contract, supporting an explicit "Any node pool" default and visible handling of dangling pool references.

## Requirements

### Requirement: Node pools API contract

The `getNodePools()` server action SHALL issue a GET to `${API}/node-pools` with the authenticated user's token via `BaseApi.getAction`. On success the response SHALL be of the shape `{ pools: NodePool[] }` where `NodePool` is `{ id: string; name: string; description?: string }`. On failure the action SHALL return `{ success: false, errorMessage }` and the UI SHALL treat this as a load error.

#### Scenario: Successful listing returns `{ pools: [...] }`

- **WHEN** the user opens a container detail and the `/node-pools` endpoint returns 200 with body `{ pools: [{ id: "gpu-pool", name: "GPU pool", description: "..." }, ...] }`
- **THEN** `getNodePools()` SHALL return `{ success: true, response: { pools: [...] } }` and the selector field SHALL transition out of the loading state

#### Scenario: Non-2xx surfaces as a load error

- **WHEN** the `/node-pools` endpoint returns a non-success status or the request throws
- **THEN** `getNodePools()` SHALL return `{ success: false, errorHeader?, errorMessage?, requestId? }` and the field SHALL surface a toast notification (see "Listing failures surface as a toast notification" below)

### Requirement: Container model carries `nodePoolId` and cached `nodePoolName`

The `Container` model SHALL declare `nodePoolId?: string | null` (source of truth, submitted to the backend) and `nodePoolName?: string | null` (read-only display cache captured at selection time). A container with neither field set SHALL render as "Any node pool".

#### Scenario: Default state is "Any node pool"

- **WHEN** a container has no `nodePoolId` (undefined or null)
- **THEN** the selector display SHALL show `DeploymentsI18nKey.NodePoolAny` ("Any node pool") with the `DeploymentsI18nKey.NodePoolAnyDescription` hint, and the action button SHALL read `DeploymentsI18nKey.NodePoolSelect`

#### Scenario: Confirmed selection writes id and name

- **WHEN** the user opens the selector modal, picks the pool with id `"gpu-pool"` and name `"GPU pool"`, and clicks Apply
- **THEN** `setContainer` SHALL be called with an object whose `nodePoolId === "gpu-pool"` and `nodePoolName === "GPU pool"`

#### Scenario: Confirming "Any" clears both fields

- **WHEN** the user opens the modal with a current selection and picks the "Any node pool" row, then clicks Apply
- **THEN** `setContainer` SHALL be called with `nodePoolId: null` and `nodePoolName: null`

### Requirement: Selector field renders two distinct states

The `ContainerNodePool` field SHALL render exactly one of two states at a time: loading or ready. The action button SHALL only be rendered in the ready state and SHALL be disabled when the container is in a read-only status (`isEditDisabled(container)`), when the parent passes `disabled`, or when the loaded `pools` list is empty.

#### Scenario: Loading state

- **WHEN** pools are being fetched
- **THEN** the field body SHALL render a `DialLoader` (size 32) and no action button

#### Scenario: Ready state with no selection

- **WHEN** pools have loaded and `nodePoolId` is null
- **THEN** the field body SHALL render the "Any node pool" display and a button labelled `DeploymentsI18nKey.NodePoolSelect`

#### Scenario: Ready state with a selection

- **WHEN** pools have loaded and `nodePoolId` matches a loaded pool
- **THEN** the field body SHALL render that pool's display and a button labelled `ButtonsI18nKey.Change`

### Requirement: Listing failures surface as a toast notification

When the pool listing fails, the field SHALL NOT render an inline error region. Instead, it SHALL show a toast via `useNotification().showNotification(getErrorNotification(...))` carrying the backend's `errorHeader`, `errorMessage`, and `requestId`. When the server omits `errorHeader`, the toast title SHALL fall back to `DeploymentsI18nKey.NodePoolLoadError`. The field SHALL leave the loaded `pools` list empty, transition out of the loading state, and leave the Change / Select button disabled (since `pools.length === 0`).

#### Scenario: Server returns an error payload

- **WHEN** `getNodePools()` resolves with `{ success: false, errorHeader: "Service unavailable", errorMessage: "boom", requestId: "req-42" }`
- **THEN** `showNotification` SHALL be called with a notification of type `NotificationType.error`, title `"Service unavailable"`, description `"boom"`, and `requestId: "req-42"`
- **AND** the field body SHALL transition out of the loading state with no inline error region

#### Scenario: Server omits the error header

- **WHEN** `getNodePools()` resolves with `{ success: false }`
- **THEN** the toast title SHALL be `DeploymentsI18nKey.NodePoolLoadError`

#### Scenario: Request throws

- **WHEN** `getNodePools()` rejects
- **THEN** the field SHALL show a toast with title `DeploymentsI18nKey.NodePoolLoadError` and leave the loaded list empty

### Requirement: Selected-pool display reconciles live data, cache, and dangling state

The selector display SHALL prefer the live `NodePool` from the loaded list when the `nodePoolId` matches one, fall back to the cached `nodePoolName` when no live match exists, and surface a visible warning only when both are missing.

#### Scenario: Live pool match renders id, name, optional description

- **WHEN** `nodePoolId === "gpu-pool"` and the loaded pools include `{ id: "gpu-pool", name: "GPU pool", description: "High-end inference pool" }`
- **THEN** the display SHALL render the pool's `name` (semibold primary, with `title` for full text), the `id` in monospace as secondary text, and the `description` as a secondary line

#### Scenario: Cached name covers a not-yet-loaded match

- **WHEN** `nodePoolId === "gpu-pool"` is set, `nodePoolName === "GPU pool"` is set, and the live list does not yet contain a matching pool
- **THEN** the display SHALL render the cached `nodePoolName` instead of the dangling-reference warning

#### Scenario: Dangling reference renders an error-styled warning

- **WHEN** `nodePoolId` is set but neither a live match nor a cached `nodePoolName` is available
- **THEN** the display SHALL render `DeploymentsI18nKey.NodePoolUnknown` (interpolating `{id}`) in the error color and the `DeploymentsI18nKey.NodePoolUnknownHint` secondary line

### Requirement: Selector modal composition

The selector modal SHALL be composed of three components:

- `Deployments/Modals/ContainerNodePoolModal/ContainerNodePoolModal.tsx` — the `DialPopup` shell (`PopupSize.Lg`, fixed-height container) with Cancel / Apply footer buttons; owns the pending selection and resets it to the field's current `nodePoolId` on every open.
- `Deployments/NodePool/NodePoolList.tsx` — the `DialSearch` input plus a `<ul>` of radio rows including the pinned "Any node pool" entry; owns the search query, which is reset to empty on every mount (i.e., every modal open).
- `Deployments/NodePool/NodePoolItem.tsx` — a single radio row, wrapped in a `<label htmlFor=...>` so clicking anywhere in the row toggles the radio.

#### Scenario: Modal lists "Any node pool" plus one row per loaded pool

- **WHEN** the modal opens with loaded pools `[{ id: "gpu-pool", name: "GPU pool", description: "..." }, { id: "cpu-pool", name: "CPU pool" }]`
- **THEN** the list SHALL include, in order: an "Any node pool" row at the top, then a row for "GPU pool" showing name + monospace id + description, then a row for "CPU pool" showing name + monospace id and an empty description cell

#### Scenario: Pending selection is initialised from the field

- **WHEN** the modal opens for a container with `nodePoolId === "gpu-pool"`
- **THEN** the "GPU pool" row SHALL be checked and the "Any node pool" row SHALL NOT be checked
- **WHEN** the modal opens for a container with `nodePoolId` null
- **THEN** the "Any node pool" row SHALL be checked

#### Scenario: Search filters by id, name, or description (case-insensitive)

- **WHEN** the user types a query in the search box
- **THEN** the rendered pool rows SHALL be exactly those whose `id`, `name`, or `description` contains the query as a case-insensitive substring; the "Any node pool" row SHALL remain visible regardless of the query

#### Scenario: No matches but pools exist

- **WHEN** the search yields zero pool matches but the loaded list is non-empty
- **THEN** the modal SHALL render `DeploymentsI18nKey.NodePoolNoMatches` via `DialNoDataContent` below the "Any" row

#### Scenario: Apply submits the pending id; Cancel discards

- **WHEN** the user picks a pool row and clicks the `ButtonsI18nKey.Apply` button
- **THEN** the modal SHALL call `onConfirm` with that pool's id and then call `onClose`
- **WHEN** the user picks the "Any node pool" row and clicks Apply
- **THEN** the modal SHALL call `onConfirm(null)` and then `onClose`
- **WHEN** the user clicks the `ButtonsI18nKey.Cancel` button (with or without a pending change)
- **THEN** the modal SHALL call `onClose` and SHALL NOT call `onConfirm`

### Requirement: Accessibility and string handling

All user-facing strings in the field and modal SHALL flow through `useI18n()`. Truncated text SHALL expose the full content via the `title` attribute so it is reachable without truncation. Radio rows SHALL use native `<label>` + `DialRadioButton` semantics so they are keyboard-operable and screen-reader-friendly.

#### Scenario: No hardcoded user-visible strings

- **WHEN** the field or modal renders any label, hint, button, placeholder, or error message
- **THEN** that string SHALL be sourced from `EntityFieldsI18nKey`, `DeploymentsI18nKey`, or `ButtonsI18nKey` via `t(...)`

#### Scenario: Truncated text is reachable via `title`

- **WHEN** the pool name, id, or description in the display or a modal row is truncated by `truncate`
- **THEN** the corresponding element SHALL carry a `title` attribute holding the full value
