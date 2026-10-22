## MODIFIED Requirements

### Requirement: Selector modal composition

The selector modal SHALL be composed of three components:

- `Deployments/Modals/ContainerNodePoolModal/ContainerNodePoolModal.tsx` — the `Popup` shell (`PopupSize.Lg`, fixed-height container) with Cancel / Apply footer buttons; owns the pending selection and resets it to the field's current `nodePoolId` on every open.
- `Deployments/NodePool/NodePoolList.tsx` — the `Search` input plus a `<ul>` of radio rows including the pinned "Any node pool" entry; owns the search query, which is reset to empty on every mount (i.e., every modal open).
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
- **THEN** the modal SHALL render `DeploymentsI18nKey.NodePoolNoMatches` via `NoDataContent` below the "Any" row

#### Scenario: Apply submits the pending id; Cancel discards

- **WHEN** the user picks a pool row and clicks the `ButtonsI18nKey.Apply` button
- **THEN** the modal SHALL call `onConfirm` with that pool's id and then call `onClose`
- **WHEN** the user picks the "Any node pool" row and clicks Apply
- **THEN** the modal SHALL call `onConfirm(null)` and then `onClose`
- **WHEN** the user clicks the `ButtonsI18nKey.Cancel` button (with or without a pending change)
- **THEN** the modal SHALL call `onClose` and SHALL NOT call `onConfirm`
