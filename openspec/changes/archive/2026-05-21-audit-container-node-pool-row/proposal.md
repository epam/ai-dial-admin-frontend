## Why

Container audit detail rows for the new `nodePoolId` and `nodePoolName` snapshot fields currently render as raw object keys instead of human labels, and emit empty rows when both sides of a diff have no value stored. The two fields need friendly labels in the audit detail's "Parameter" column, and rows should only appear when there is something to show.

## What Changes

- **Label** `nodePoolId` as "Node pool ID" and `nodePoolName` as "Node pool name" in container audit details.
- **Hide** the `nodePoolId` row when both compared snapshots have `nodePoolId` null, undefined, or empty. Same rule for `nodePoolName`. Each row is hidden independently.
- Otherwise, rows follow the existing primitive diff semantics — ADDED when set on one side only, CHANGED when both sides differ, plain row when both sides match.

## Non-goals

- No changes to how node pools are stored, fetched, or selected in the live form.
- No collapse of the id/name pair into a single row — they remain two separate rows, mirroring the snapshot's storage shape.
- No live validation against the current `/node-pools` API.

## Capabilities

### Modified Capabilities
- `activity-audit-deployments-detail`: adds the two "Node pool ID" / "Node pool name" labels for container audit details and the hide-when-both-empty rule for those keys.

## Impact

- **Components**: `apps/ai-dial-admin/src/components/ActivityAudit/View/utils/generate-diffs.ts` (adds `CONTAINER_HIDE_IF_EMPTY_KEYS` and a one-line check inside `getPrimitiveBucket`), `apps/ai-dial-admin/src/components/ActivityAudit/EntityGrid/container-formatters.ts` (two new label entries).
- **Tests**: scenarios in `generate-diffs.spec.ts` and a small label-mapping spec in `EntityGrid/tests/container-formatters.spec.ts`.
- **i18n**: two new keys — `EntityFieldsI18nKey.NodePoolId` ("Node pool ID") and `EntityFieldsI18nKey.NodePoolName` ("Node pool name") — added to `i18n.ts` and `en.ts`.
- **Backend**: no changes.
