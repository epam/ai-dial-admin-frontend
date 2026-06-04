## Why

When a deployment pod crash-loops, the Execution log header shows only the restart count, last restart time, and a mapped "Last reason" enum label. To learn *why* it actually failed (e.g. bad model arguments), operators must inspect the pod's last state directly in Kubernetes. The deployment-manager backend now exposes the human-readable `lastTerminationMessage` (epam/ai-dial-admin-deployment-manager-backend#344, PR #343), so we can surface that detail in the admin UI. Resolves frontend issue #1907.

## What Changes

- Add `lastTerminationMessage?: string` to the `Pod` model so the field from the `/pods` response is typed.
- Display the message in the pod metadata header of the Execution log tab, labelled **"Termination message"**, alongside the existing Restarts / Last restarted at / Last reason fields.
- Show it only when a message is present (no empty label), and handle long messages without breaking the header layout.
- Add the `TerminationMessage` i18n key and its English string.

## Capabilities

### New Capabilities
- `pod-termination-message`: Showing a pod's last Kubernetes termination message in the Execution log header.

### Modified Capabilities
<!-- None — no existing spec covers the Execution log pod header. -->

## Impact

- **Model**: `apps/ai-dial-admin/src/models/deployments/containers.ts` (`Pod` interface).
- **Component**: `apps/ai-dial-admin/src/components/Containers/View/ExecutionLog/PodView.tsx` (header render).
- **i18n**: `apps/ai-dial-admin/src/constants/i18n.ts` (`EntityFieldsI18nKey`), `apps/ai-dial-admin/src/locales/en.ts`.
- **No API/server-action change** — the field arrives on the existing `getContainerPods` (`/deployments/{id}/pods`) response.
- **Non-goals**: streaming logs from already-terminated containers (the broader original #1907 scope), surfacing `lastExitCode`/`lastSignal`, and any change to the `RESTART_REASONS` mapping for "Last reason".
