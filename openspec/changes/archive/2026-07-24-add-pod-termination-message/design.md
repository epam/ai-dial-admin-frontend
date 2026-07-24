## Context

The Execution log tab renders a per-pod metadata header in `ExecutionLog/PodView.tsx`. Today it shows Restarts (`pod.restartCount`), Last restarted at (`pod.lastFinishedAt`), and Last reason (`pod.lastTerminationReason` mapped through `RESTART_REASONS` to a friendly label). The block only renders when `restartCount > 0`. The backend now returns an additional `lastTerminationMessage` (the raw K8s `lastState.terminated.message`) on the existing `/pods` response, which the frontend currently drops because the `Pod` type doesn't declare it.

## Goals / Non-Goals

**Goals:**
- Type the new `lastTerminationMessage` field on `Pod`.
- Show it in the existing header as "Termination message", verbatim.
- Keep the change isolated to the model, the header component, and i18n.

**Non-Goals:**
- Streaming logs from already-terminated containers (original broad #1907 scope).
- Surfacing `lastExitCode` / `lastSignal`.
- Changing the `RESTART_REASONS` mapping used by "Last reason".

## Decisions

- **Render verbatim, no mapping.** Unlike `lastTerminationReason` (a short enum mapped to a translated label), `lastTerminationMessage` is already human-readable. Display it as-is via `LabelledText`. Alternative — mapping/parsing the message — adds fragility for no benefit.
- **Decouple the termination message from `restartCount` (message only).** The BE (`AbstractDeploymentManager.extractContainerInfo`) sums `restartCount` independently and derives the `lastTermination*` fields from `mostRecentTermination`, which considers **both** `state.terminated` (current) and `lastState.terminated` (previous). So a fail-to-start / not-yet-restarted container yields `restartCount === 0` with a populated termination message. The pre-existing header wrapped everything in `restartCount > 0`, which would hide the message in exactly that case. We keep the existing restart row (Restarts / Last restarted at / Last reason) gated on `restartCount > 0`, but render the termination message whenever `lastTerminationMessage` is present, and show the header when `restartCount || lastTerminationMessage`. Considered but not taken: fully decoupling every field (showing Last reason / Last restarted at at `restartCount === 0`) — the restart row reads as restart context, so it stays tied to the restart count; the message is the new failure detail and is what must surface in the fail-to-start case.
- **Layout: message on its own line under the field row.** Termination messages can be long; the existing row (`flex gap-10`) is for short values. Placing the message on a line below the row (with width constraint + wrap/truncate) gives it room without squeezing Restarts / Last reason. Mirrors the existing `max-w-[350px]` treatment already used for "Last reason".
- **i18n.** Add `EntityFieldsI18nKey.TerminationMessage = 'EntityFields.TerminationMessage'` and `TerminationMessage: 'Termination message'` in `en.ts`, matching the sibling `Restarts` / `LastRestartedAt` / `LastReason` keys.

## Risks / Trade-offs

- [Very long / multi-line messages could overflow] → constrain width and wrap (or truncate with full text on hover/title); validate against a realistic crash message.
- [Backend may omit the field on older DM versions] → field is optional; the inner presence check means nothing renders when absent — no regression.
