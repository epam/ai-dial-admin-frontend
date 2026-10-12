## MODIFIED Requirements

### Requirement: Resource columns available on container listings

The container listing pages for model-servings and containers (`/containers`) SHALL expose CPU request, CPU limit, memory request, and memory limit columns. The model-servings listing SHALL additionally expose a GPU column. These columns SHALL read from the `Container.resources` sub-object: CPU columns from `resources.requests.cpu` and `resources.limits.cpu`, memory columns from `resources.requests.memory` and `resources.limits.memory`, and the GPU column from `resources.requests['nvidia.com/gpu']`.

#### Scenario: CPU and memory columns appear on every container listing route

- **WHEN** a user navigates to `/model-servings` or `/containers` and opens the column panel
- **THEN** the panel SHALL list options for "CPU request", "CPU limit", "Memory request", and "Memory limit"

#### Scenario: GPU column appears only on model-servings

- **WHEN** a user opens the column panel on `/model-servings`
- **THEN** the panel SHALL list a "GPU" option in addition to the CPU and memory options
- **WHEN** a user opens the column panel on `/containers`
- **THEN** the panel SHALL NOT list a "GPU" option

#### Scenario: Resource columns are absent from deployment-images

- **WHEN** a user navigates to `/deployment-images` and opens the column panel
- **THEN** the panel SHALL NOT list any CPU, memory, or GPU resource options

### Requirement: Resource columns hidden by default and opt-in via column panel

All five resource columns SHALL be hidden by default. A user SHALL be able to toggle each column's visibility via the existing column panel. Selections SHALL persist per route in localStorage using the existing column-visibility storage mechanism.

#### Scenario: Default view shows no resource columns

- **WHEN** a user with no prior column-panel customization loads any container listing
- **THEN** none of the resource columns (CPU request, CPU limit, memory request, memory limit, GPU) SHALL be visible in the grid

#### Scenario: User opts in and selection persists across reloads

- **WHEN** a user enables "CPU limit" on `/model-servings` via the column panel
- **THEN** the CPU limit column SHALL become visible in the grid
- **WHEN** the user reloads the page or returns later
- **THEN** the CPU limit column SHALL remain visible

#### Scenario: Per-route persistence

- **WHEN** a user enables "Memory request" on `/model-servings`
- **THEN** the column visibility on `/containers` SHALL be unchanged
