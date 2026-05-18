## ADDED Requirements

### Requirement: Resource columns available on container listings

The container listing pages for model-servings, mcp-containers, adapter-containers, application-containers, and interceptor-containers SHALL expose CPU request, CPU limit, memory request, and memory limit columns. The model-servings listing SHALL additionally expose a GPU column. These columns SHALL read from the `Container.resources` sub-object: CPU columns from `resources.requests.cpu` and `resources.limits.cpu`, memory columns from `resources.requests.memory` and `resources.limits.memory`, and the GPU column from `resources.requests['nvidia.com/gpu']`.

#### Scenario: CPU and memory columns appear on every container listing route

- **WHEN** a user navigates to `/model-servings`, `/mcp-containers`, `/adapter-containers`, `/application-containers`, or `/interceptor-containers` and opens the column panel
- **THEN** the panel SHALL list options for "CPU request", "CPU limit", "Memory request", and "Memory limit"

#### Scenario: GPU column appears only on model-servings

- **WHEN** a user opens the column panel on `/model-servings`
- **THEN** the panel SHALL list a "GPU" option in addition to the CPU and memory options
- **WHEN** a user opens the column panel on `/mcp-containers`, `/adapter-containers`, `/application-containers`, or `/interceptor-containers`
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
- **THEN** the column visibility on `/mcp-containers`, `/adapter-containers`, `/application-containers`, and `/interceptor-containers` SHALL be unchanged

### Requirement: Resource values displayed in fixed millicore and megabyte units

CPU columns SHALL display values converted by the existing `convertCoresToMilliCores` utility, suffixed with " m". Memory columns SHALL display values converted by the existing `convertBytesToMb` utility, suffixed with " Mb". The GPU column SHALL display the stored value as a plain integer (no suffix, no unit conversion). A missing or empty value SHALL render as an empty cell. The system SHALL NOT automatically switch units based on value magnitude (no `Gi`, `Mi`, `Ki`).

#### Scenario: CPU value rendered in millicores with suffix

- **WHEN** a container has `resources.requests.cpu = "0.5"`
- **THEN** the "CPU request" cell SHALL display "500 m"
- **WHEN** a container has `resources.limits.cpu = "2"`
- **THEN** the "CPU limit" cell SHALL display "2000 m"

#### Scenario: Memory value rendered in megabytes with suffix

- **WHEN** a container has `resources.requests.memory = "4294967296"` (4 Gi expressed in bytes)
- **THEN** the "Memory request" cell SHALL display "4096 Mb"

#### Scenario: GPU value rendered as plain integer

- **WHEN** a container has `resources.requests['nvidia.com/gpu'] = "1"`
- **THEN** the "GPU" cell SHALL display "1" with no unit suffix

#### Scenario: Missing values render empty

- **WHEN** a container has no `resources.requests.cpu` field
- **THEN** the "CPU request" cell SHALL render empty
- **WHEN** a container has `resources` undefined
- **THEN** all resource cells for that row SHALL render empty

### Requirement: Resource columns sortable numerically and filterable by substring

Each resource column SHALL be sortable by AG Grid's default numeric sort, operating on the converted numeric value (millicores for CPU, megabytes for memory, plain integer for GPU). Each column SHALL expose AG Grid's `agTextColumnFilter` against the displayed string (including the `m` / `Mb` suffix), with the default "Contains" operator so partial input matches. Rows with missing values SHALL sort and filter consistently with AG Grid's standard handling of null/blank cells.

#### Scenario: Sorting CPU limit ascending

- **WHEN** the grid contains rows with `resources.limits.cpu` values of `"2"`, `"0.5"`, and unset, and the user sorts "CPU limit" ascending
- **THEN** the row with `"0.5"` (500 m) SHALL appear before the row with `"2"` (2000 m), and the row with unset value SHALL appear at the end

#### Scenario: Filtering by partial numeric substring

- **WHEN** the user opens the "CPU request" filter and enters `5`
- **THEN** the grid SHALL show rows whose displayed CPU request value contains `5`, including `"500 m"`, `"50 m"`, and `"1500 m"`

#### Scenario: Filtering by unit substring

- **WHEN** the user opens the "Memory request" filter and enters `Mb`
- **THEN** the grid SHALL show all rows that have any displayed memory-request value

#### Scenario: Filtering GPU by value substring

- **WHEN** the user opens the "GPU" filter and enters `1`
- **THEN** the grid SHALL show rows whose `resources.requests['nvidia.com/gpu']` formatted value contains `1`, e.g. `"1"`, `"10"`, `"21"`
