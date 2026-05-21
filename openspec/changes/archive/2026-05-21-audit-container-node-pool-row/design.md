## Context

Container snapshots returned by `GET /api/v1/.../revision/{n}` carry `nodePoolId?: string | null` and `nodePoolName?: string | null` (`apps/ai-dial-admin/src/models/deployments/containers.ts:35-36`).

The audit diff engine in `apps/ai-dial-admin/src/components/ActivityAudit/View/utils/generate-diffs.ts` walks each top-level snapshot key. Primitive values route through `getPrimitiveBucket()` into `result.properties` (or a container section per `CONTAINER_PRIMITIVE_SECTION_ROUTING`). The "Parameter" column in `apps/ai-dial-admin/src/components/ActivityAudit/EntityGrid/constants.ts:formatParameter` then looks each key up in `CONTAINER_ROW_LABEL_KEYS` to render a human label; any missing key falls through as the raw key.

Today, neither `nodePoolId` nor `nodePoolName` is in the label map, so both render as raw keys (confirmed in screenshot of activity `019e45ec-f230-7e29-82a4-c4fe8ce6a686`). Additionally, when both sides of a diff have the field null/missing, the default `compareSimpleTypes` path emits an empty-valued row.

## Goals / Non-Goals

**Goals:**
- Render `nodePoolId` and `nodePoolName` rows with friendly labels.
- Suppress each row when both compared sides are null/undefined/empty for that field.
- Keep the rest of the audit's primitive-diff behavior intact.

**Non-Goals:**
- No collapsing of the id/name pair into a single synthetic row. Two storage fields → two rows.
- No special vocabulary for "Any node pool" / "Unknown pool: \<id\>". Snapshots store the raw id and name; the audit shows them verbatim.
- No live validation against the current `/node-pools` API.

## Decisions

### 1. Two rows, distinct labels

`nodePoolId` and `nodePoolName` are two separate storage fields. Each gets its own row in the audit, labelled with a distinct i18n key:

- `nodePoolId` → `EntityFieldsI18nKey.NodePoolId` ("Node pool ID")
- `nodePoolName` → `EntityFieldsI18nKey.NodePoolName` ("Node pool name")

This mirrors the storage shape one-for-one and avoids needing a synthetic-row projection layer.

### 2. Hide each row independently when both sides are empty

The existing `getPrimitiveBucket()` already supports skipping a row when both sides are empty — but only for keys routed via `CONTAINER_PRIMITIVE_SECTION_ROUTING`. We extend the same `isEmptyPrimitive(val1) && isEmptyPrimitive(val2)` check to a small new set `CONTAINER_HIDE_IF_EMPTY_KEYS` that lives alongside the routing table.

This keeps the rule scoped (other primitive container fields still show "unchanged" rows with empty values, preserving today's behavior) and reuses the existing emptiness predicate. The hide rule runs before the routing check so it applies regardless of which bucket the key would otherwise land in.

### 3. No new value formatter

Values are stored as plain strings; the audit shows them verbatim. No `CONTAINER_VALUE_FORMATTERS` entry is needed. If a snapshot stored `nodePoolName: "CPU pool"`, the audit shows "CPU pool" exactly.

## Risks

- **`nodePoolName` drift**: if the backend snapshot stores a name that has since been renamed, the audit shows the historical name. Correct for snapshot replay; same concern applies to any cached display name.
- **Two identical-looking rows for one logical action**: setting "Node pool" in the form writes both `nodePoolId` and `nodePoolName`, so each user action produces two audit rows ("Node pool ID" and "Node pool name"). Acceptable per the simplified design — the labels are distinct enough that users can read the diff without confusion.
