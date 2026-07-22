## ADDED Requirements

### Requirement: Metrics tab availability per deployment type
The system SHALL show a **Metrics** tab in the deployment/container detail view for MCP, Interceptor, Adaptor, Application containers and Model Servings. The system SHALL NOT show the Metrics tab for Images. The tab SHALL be disabled while the deployment status is not `RUNNING`, consistent with the Resources and Prompts tabs.

#### Scenario: Metrics tab shown for a running container deployment
- **WHEN** a user opens the detail view of a running MCP, Interceptor, Adaptor, Application container or Model Serving
- **THEN** a "Metrics" tab is present and enabled

#### Scenario: Metrics tab disabled when not running
- **WHEN** a user opens the detail view of such a deployment whose status is not `RUNNING` (e.g. stopped, pending)
- **THEN** the "Metrics" tab is present but disabled

#### Scenario: No Metrics tab for Images
- **WHEN** a user opens an Image detail view
- **THEN** no "Metrics" tab is present

### Requirement: Live snapshot fetch on tab open
The system SHALL fetch a single live metrics snapshot from `GET /deployments/{id}/metrics` when the Metrics tab is opened, using the existing deployment server-action pattern (authenticated via `getUserToken`). The system SHALL show a loading indicator while the request is in flight and SHALL NOT poll automatically.

#### Scenario: Snapshot loaded on open
- **WHEN** the user opens the Metrics tab for a deployment
- **THEN** the system calls `GET /deployments/{id}/metrics` once and renders the returned metrics

#### Scenario: Loading state
- **WHEN** the snapshot request is in flight
- **THEN** the system shows a loading indicator in the metric cards

#### Scenario: No automatic polling
- **WHEN** the snapshot has loaded and the user takes no action
- **THEN** the system does not re-request the endpoint on a timer

### Requirement: Metric sections rendered from the snapshot
The system SHALL render the snapshot as grouped, operator-oriented sections, each with a section title and a responsive row of metric cards. The **Scale & Health** and **Compute** sections SHALL render for every deployment type. The inference sections — **Latency**, **Throughput**, **Load** — and the inference-only cards (request error ratio in Scale & Health; GPU memory in Compute) SHALL render only on Model Servings (inference) views, gated additionally by the relevant block availability. Within Model Servings, the card set is further filtered by the deployment's inference task type (see *Gauge filtering by inference task type*). On all non-Model-Serving deployment views (MCP, Interceptor, Adaptor, Application containers) the inference sections and inference-only cards SHALL be hidden entirely — including their titles and any "No Data" cards — regardless of what the snapshot returns. Each card SHALL display the metric label, value, and unit.

#### Scenario: Scale & Health and Compute for any deployment
- **WHEN** the snapshot is rendered for any deployment type
- **THEN** a Scale & Health section shows ready and total replicas, and a Compute section shows total CPU (millicores) and total memory (bytes) across pods

#### Scenario: Inference sections and cards for a Model Serving
- **WHEN** the snapshot is rendered for a Model Serving (inference) deployment with no inference task type set, whose serving/operational blocks are available
- **THEN** Latency (TTFT, inter-token latency, e2e latency, request latency), Throughput (tokens/sec, requests/sec) and Load (running requests, queue depth, KV-cache usage) sections are shown, the Scale & Health section additionally shows request error ratio, and the Compute section additionally shows GPU memory

#### Scenario: Inference sections and cards hidden on non-inference views
- **WHEN** the snapshot is rendered for a non-Model-Serving deployment (MCP, Interceptor, Adaptor, Application container)
- **THEN** only Scale & Health (replicas) and Compute (CPU, memory) are shown — no Latency/Throughput/Load section, no request-error-ratio card, and no GPU cards appear — even if the snapshot happens to carry those blocks

### Requirement: Gauge filtering by inference task type
On Model Servings views, the system SHALL filter the metric cards by the deployment's `inferenceTask` so that gauges that cannot have data for the deployment's task type are not rendered:
- **Universal cards** (shown for any task type): Ready replicas, CPU, Memory, GPU memory, Requests/sec, E2E latency. GPU memory stays universal because its emptiness is hardware-gated (GPU pool + DCGM exporter), not task-type-gated.
- **Text classification only:** Request latency (p50/p95/p99).
- **Text generation only:** Request error ratio, Tokens/sec, TTFT, Inter-token latency, Running requests, Queue depth, KV-cache usage.

A deployment whose `inferenceTask` is unset or `none` SHALL render the full card set (no filtering). A section whose cards are all filtered out SHALL be hidden entirely, title included. Task-type filtering SHALL compose with the existing route and availability gates rather than replace them.

#### Scenario: Text classification serving hides generation-only gauges
- **WHEN** the Metrics tab is rendered for a Model Serving with `inferenceTask = text_classification`
- **THEN** Scale & Health shows replicas only (no request error ratio), Throughput shows requests/sec only (no tokens/sec), Latency shows request latency and E2E latency only (no TTFT, no inter-token latency), the Load section is not rendered at all, and Compute still shows CPU, memory and GPU memory

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
- **KV-cache usage** (and other 0–1 ratios) → a gauge.
- All other scalars (CPU, memory, GPU memory, request error ratio, requests/sec, running requests, queue depth) → a single-value card with its unit.

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

### Requirement: Status thresholds and color
Threshold-bearing metrics SHALL be colored by health status — `ok` (green), `warn` (amber), `crit` (red) — applied to the card value and accent. Metrics without a meaningful threshold SHALL stay neutral and never signal an alarm. The thresholds are: replicas degraded (amber when some pods not ready, red when under half or zero ready), request error ratio (amber > 0.5%, red > 2%), and KV-cache usage (amber > 0.7, red > 0.9).

#### Scenario: KV-cache critical
- **WHEN** KV-cache usage exceeds 0.9
- **THEN** its card is colored red (crit)

#### Scenario: Error ratio within bounds
- **WHEN** the request error ratio is at or below 0.5%
- **THEN** its card is colored green (ok)

#### Scenario: Neutral metric never alarms
- **WHEN** a metric without a threshold (e.g. CPU, memory, tokens/sec) is rendered
- **THEN** its card uses the neutral color regardless of value

### Requirement: Byte values rendered in the most readable unit
Byte-valued metrics (memory, GPU memory) SHALL be displayed in the most readable binary unit (B / KB / MB / GB / TB), choosing the unit so the number stays in a human-friendly range, rounded to one decimal.

#### Scenario: Large memory scales to GB
- **WHEN** a memory value is about 15.4 billion bytes
- **THEN** it is shown as "14.3 GB", not "14.7K MB"

### Requirement: Graceful handling of unavailable metric values
The system SHALL render a metric card in the existing "No Data" state when its value is null or its block is marked unavailable in the snapshot. A missing or unavailable metric SHALL NOT hide a section that is otherwise available, and SHALL NOT cause an error.

#### Scenario: Null field shows No Data
- **WHEN** an available section contains a metric whose value is null (e.g. GPU placeholder, or a field the engine does not expose)
- **THEN** that card renders the "No Data" state while sibling cards render their values

#### Scenario: Partial snapshot does not error
- **WHEN** the snapshot omits or nulls some blocks while populating others
- **THEN** the available metrics render and the tab does not show an error

### Requirement: Manual refresh
The system SHALL provide a manual Refresh control in the Metrics tab that re-fetches the snapshot and updates the cards.

#### Scenario: Refresh re-fetches
- **WHEN** the user clicks Refresh
- **THEN** the system re-requests `GET /deployments/{id}/metrics` and updates the cards with the new snapshot

### Requirement: Request failure handling
The system SHALL handle a failed metrics request without breaking the tab: it SHALL stop the loading state, show an error notification, render the cards in the "No Data" state rather than crashing, and keep the Refresh control usable to retry.

#### Scenario: Request fails
- **WHEN** the metrics request returns an error or throws
- **THEN** loading stops, an error notification is shown, the cards render in the "No Data" state, and the user can click Refresh to retry

#### Scenario: Stale response ignored
- **WHEN** the user switches to another deployment (or leaves the tab) before an in-flight request resolves
- **THEN** the late response is discarded and does not overwrite the current view
