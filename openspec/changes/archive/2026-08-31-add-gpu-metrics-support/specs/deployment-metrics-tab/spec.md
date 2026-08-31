## ADDED Requirements

### Requirement: GPU cards limited to INFERENCE Model Servings and gated on GPU telemetry availability
The system SHALL render the GPU Memory and GPU Utilization cards in the Compute section only for INFERENCE-type Model Servings (`CONTAINER_TYPE.HF`) whose snapshot's `resources.gpu` availability block reports `available: true`. NIM Model Servings SHALL NOT show either GPU card, even when `resources.gpu.available` is `true` — GPU telemetry is engine-independent and NIM deployments commonly request a GPU, so `resources.gpu` alone does not distinguish NIM from INFERENCE. When `resources.gpu.available` is `false` for an INFERENCE deployment — for any reason (the deployment does not request a GPU, the DCGM exporter is absent/unreachable, GPU collection is disabled, or there are no running pods) — both GPU cards SHALL be omitted entirely, not rendered in a "No Data" state. These gates apply in addition to, not instead of, the existing route (Model Servings only) and task-type (universal) gates.

#### Scenario: GPU cards shown for an INFERENCE deployment when GPU telemetry is available
- **WHEN** the snapshot for an INFERENCE Model Serving reports `resources.gpu.available: true`
- **THEN** the Compute section shows the GPU Memory and GPU Utilization cards with their values

#### Scenario: GPU cards hidden for a non-GPU INFERENCE deployment
- **WHEN** the snapshot for an INFERENCE Model Serving reports `resources.gpu.available: false` because the deployment requests no GPU
- **THEN** the Compute section shows only CPU and Memory — no GPU Memory or GPU Utilization card appears, and no "No Data" placeholder is shown in their place

#### Scenario: GPU cards hidden when the exporter is absent or telemetry fails
- **WHEN** the snapshot for a GPU-requesting INFERENCE Model Serving reports `resources.gpu.available: false` because the DCGM exporter is absent, unreachable, or collection is disabled
- **THEN** the Compute section shows only CPU and Memory — the GPU cards are hidden the same as the non-GPU case, with no distinct message

#### Scenario: GPU cards never shown for a NIM deployment
- **WHEN** the snapshot for a NIM Model Serving reports `resources.gpu.available: true`
- **THEN** the Compute section shows only CPU and Memory — neither GPU card appears, regardless of GPU telemetry availability

## MODIFIED Requirements

### Requirement: Metric sections rendered from the snapshot
The system SHALL render the snapshot as grouped, operator-oriented sections, each with a section title and a responsive row of metric cards. The **Scale & Health** and **Compute** sections SHALL render for every deployment type. The inference sections — **Latency**, **Throughput**, **Load** — and the request-error-ratio card SHALL render only on Model Servings (inference) views, gated additionally by the relevant block availability. GPU Memory and GPU Utilization in Compute SHALL render only on **INFERENCE-type** (`CONTAINER_TYPE.HF`) Model Servings — never on NIM — and additionally only when `resources.gpu` reports available (see *GPU cards limited to INFERENCE Model Servings and gated on GPU telemetry availability*). Within Model Servings, the card set is further filtered by the deployment's inference task type (see *Gauge filtering by inference task type*). On all non-Model-Serving deployment views (MCP, Interceptor, Adaptor, Application containers) the inference sections and inference-only cards SHALL be hidden entirely — including their titles and any "No Data" cards — regardless of what the snapshot returns. Each card SHALL display the metric label, value, and unit.

#### Scenario: Scale & Health and Compute for any deployment
- **WHEN** the snapshot is rendered for any deployment type
- **THEN** a Scale & Health section shows ready and total replicas, and a Compute section shows total CPU (millicores) and total memory (bytes) across pods

#### Scenario: Inference sections and cards for an INFERENCE Model Serving
- **WHEN** the snapshot is rendered for an INFERENCE Model Serving with no inference task type set, whose serving/operational/GPU blocks are available
- **THEN** Latency (TTFT, inter-token latency, e2e latency, request latency), Throughput (tokens/sec, requests/sec) and Load (running requests, queue depth, KV-cache usage) sections are shown, the Scale & Health section additionally shows request error ratio, and the Compute section additionally shows GPU Memory and GPU Utilization

#### Scenario: Inference sections and cards hidden on non-inference views
- **WHEN** the snapshot is rendered for a non-Model-Serving deployment (MCP, Interceptor, Adaptor, Application container)
- **THEN** only Scale & Health (replicas) and Compute (CPU, memory) are shown — no Latency/Throughput/Load section, no request-error-ratio card, and no GPU cards appear — even if the snapshot happens to carry those blocks

### Requirement: Gauge filtering by inference task type
On Model Servings views, the system SHALL filter the metric cards by the deployment's `inferenceTask` so that gauges that cannot have data for the deployment's task type are not rendered:
- **Universal cards** (shown for any task type, on INFERENCE Model Servings): Ready replicas, CPU, Memory, GPU Memory, GPU Utilization, Requests/sec, E2E latency. GPU Memory and GPU Utilization stay universal *within INFERENCE* because their emptiness is hardware-gated (GPU pool + DCGM exporter presence) and availability-gated (`resources.gpu`), not task-type-gated — but they are deployment-type-gated (INFERENCE only, never NIM), independently of task type.
- **Text classification only:** Request latency (p50/p95/p99).
- **Text generation only:** Request error ratio, Tokens/sec, TTFT, Inter-token latency, Running requests, Queue depth, KV-cache usage.

A deployment whose `inferenceTask` is unset or `none` SHALL render the full card set (no filtering). A section whose cards are all filtered out SHALL be hidden entirely, title included. Task-type filtering SHALL compose with the existing route and availability gates rather than replace them.

#### Scenario: Text classification serving hides generation-only gauges
- **WHEN** the Metrics tab is rendered for an INFERENCE Model Serving with `inferenceTask = text_classification` whose `resources.gpu` is available
- **THEN** Scale & Health shows replicas only (no request error ratio), Throughput shows requests/sec only (no tokens/sec), Latency shows request latency and E2E latency only (no TTFT, no inter-token latency), the Load section is not rendered at all, and Compute still shows CPU, memory, GPU Memory and GPU Utilization

#### Scenario: Text generation serving hides the request latency card
- **WHEN** the Metrics tab is rendered for a Model Serving with `inferenceTask = text_generation`
- **THEN** the Latency section shows TTFT, inter-token latency and E2E latency but no request latency card, and all generation gauges (error ratio, tokens/sec, running requests, queue depth, KV-cache) are shown

#### Scenario: Untyped serving keeps the full card set
- **WHEN** the Metrics tab is rendered for a Model Serving whose `inferenceTask` is unset or `none`
- **THEN** every card renders as before filtering was introduced (full set, including request latency and all generation gauges)
The system SHALL render each metric with the card type that best fits its shape, so a metric is shown in one card rather than split across several:
- **Replicas** → a ratio card showing `ready / total`.
- **Latency** metrics (TTFT, inter-token, e2e, request latency) → a distribution card showing the p50 / p95 / p99 percentiles together.
- **Tokens/sec** → a dual-value card showing prompt and generation side by side.
- **KV-cache usage** (and other bare 0–1 ratios) → a gauge showing a percentage.
- **GPU Memory** → a ratio card showing used vs. total with a shared unit suffix (e.g. "12.4 / 14.6 GB"), the same card kind used for replicas.
- **GPU Utilization** → a single-value card showing a percentage, averaged across the deployment's pods.
- All other scalars (CPU, memory, request error ratio, requests/sec, running requests, queue depth) → a single-value card with its unit.

#### Scenario: Replicas as a ratio
- **WHEN** the Scale & Health section renders replicas
- **THEN** one card shows ready over total (e.g. "2 / 3"), not two separate cards

#### Scenario: Latency as a percentile distribution
- **WHEN** a latency metric is rendered
- **THEN** one card shows its p50, p95 and p99 values together

#### Scenario: Tokens/sec as a dual value
- **WHEN** the Throughput section renders tokens/sec
- **THEN** one card shows the prompt and generation rates together

#### Scenario: KV-cache as a gauge
- **WHEN** the Load section renders KV-cache usage
- **THEN** a gauge shows the current value against its colored zones and labels where the zones start

#### Scenario: GPU Memory as a used/total ratio
- **WHEN** the Compute section renders GPU Memory for an INFERENCE deployment whose `resources.gpu` is available
- **THEN** a ratio card shows the used and total values with a shared unit suffix (e.g. "12.4 / 14.6 GB"), colored by status, with no dial/gauge visualization

#### Scenario: GPU Utilization as a single percentage value
- **WHEN** the Compute section renders GPU Utilization for an INFERENCE deployment whose `resources.gpu` is available
- **THEN** a single-value card shows the percentage utilization averaged across the deployment's pods, colored by status, with no dial/gauge visualization

### Requirement: Status thresholds and color
Threshold-bearing metrics SHALL be colored by health status — `ok` (green), `warn` (amber), `crit` (red) — applied to the card value and accent. Metrics without a meaningful threshold SHALL stay neutral and never signal an alarm. The thresholds are: replicas degraded (amber when some pods not ready, red when under half or zero ready), request error ratio (amber > 0.5%, red > 2%), KV-cache usage (amber > 0.7, red > 0.9), GPU Memory usage ratio (amber > 0.7, red > 0.9), and GPU Utilization (amber > 0.7, red > 0.9).

#### Scenario: KV-cache critical
- **WHEN** KV-cache usage exceeds 0.9
- **THEN** its card is colored red (crit)

#### Scenario: Error ratio within bounds
- **WHEN** the request error ratio is at or below 0.5%
- **THEN** its card is colored green (ok)

#### Scenario: GPU Memory near capacity
- **WHEN** GPU Memory used ÷ total exceeds 0.9
- **THEN** its card is colored red (crit)

#### Scenario: Neutral metric never alarms
- **WHEN** a metric without a threshold (e.g. CPU, memory, tokens/sec) is rendered
- **THEN** its card uses the neutral color regardless of value

### Requirement: Graceful handling of unavailable metric values
The system SHALL render a metric card in the existing "No Data" state when its value is null while its containing block is otherwise available. A missing or unavailable metric SHALL NOT hide a section that is otherwise available, and SHALL NOT cause an error. This "No Data" behavior is distinct from GPU card visibility: on NIM deployments, or when `resources.gpu` itself is unavailable on an INFERENCE deployment, the GPU cards are omitted entirely rather than rendered as "No Data" (see *GPU cards limited to INFERENCE Model Servings and gated on GPU telemetry availability*).

#### Scenario: Null field shows No Data
- **WHEN** an available section contains a metric whose value is null (e.g. a field the engine does not expose)
- **THEN** that card renders the "No Data" state while sibling cards render their values

#### Scenario: Partial snapshot does not error
- **WHEN** the snapshot omits or nulls some blocks while populating others
- **THEN** the available metrics render and the tab does not show an error
