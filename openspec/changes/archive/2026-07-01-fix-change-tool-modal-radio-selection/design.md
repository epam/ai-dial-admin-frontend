## Context

The tool picker (`Create/McpTool.tsx` → `Grid/GridView/RadioSelectGrid.tsx`) renders a radio in ag-grid's selection column via `RadioButtonRenderer`. The radio's checked visual is derived purely from the `selectedId` prop:

```
RadioButtonRenderer.isChecked = params.data[idField] === selectedId
```

`RadioSelectGrid` fires `onSelect(row)` on row selection but never mutates `selectedId` itself — by design, the **parent owns** the selected id and must feed the new value back down. `AgGridWrapper` spreads `additionalGridOptions` onto `AgGridReact`, so when `selectedId` changes the renderer re-runs and the radio updates.

- **Create flow (`CreateTestSuite.tsx`)** honors this contract: `onToolSelect` writes `testSuite.toolRef.name`, and it passes `initialToolName={testSuite.toolRef?.name}` — which changes on every click. Radio updates correctly.
- **Change Tool modal (`ChangeMcpToolModal.tsx`)** breaks it: `onToolSelect` only calls `setPendingTool(tool)`, while `initialToolName={testSuite.toolRef?.name}` stays frozen at the previously-saved tool. `selectedId` never changes, so the radio never re-fills. This is issue #3752.

## Goals / Non-Goals

**Goals:**
- The Change Tool modal's radio always reflects the tool that Save would apply.
- Keep the fix minimal and consistent with the existing parent-owns-selection pattern.

**Non-Goals:**
- No change to `RadioSelectGrid`, `RadioButtonRenderer`, `AgGridWrapper`, or ag-grid selection wiring.
- No behavior change to the Create flow, `Target`, or other `RadioSelectGrid` consumers.
- Not refactoring `RadioSelectGrid` into an internally-controlled component (larger blast radius, deferred).

## Decisions

**Decision: Drive the picker's `selectedId` from the pending selection in `ChangeMcpToolModal`.**

Pass `pendingTool?.name ?? testSuite.toolRef?.name` down to the picker instead of only the saved tool name. The modal already holds `pendingTool`, so no new state is introduced — the fix reconnects the existing state to the radio's `selectedId`.

- *Rationale:* Matches how `CreateTestSuite` already drives selection; smallest possible change; no shared-component risk.
- *Alternative considered — make `RadioSelectGrid` internally controlled:* fixes every consumer at the source, but changes behavior for components that already work and risks controlled/uncontrolled drift when data reloads (tab switches in `Target`). Rejected for this bug; can be revisited separately.
- *Alternative considered — drive the renderer off `params.node.isSelected()`:* couples the visual to ag-grid's native selection and needs explicit cell refresh on selection change; more moving parts than the prop fix. Rejected.

**Decision: Rename `McpTool`'s `initialToolName` prop to `selectedToolName`.**

Once the value tracks the live selection it is no longer "initial". Rename the prop on `Create/McpTool.tsx` and update both call sites (`ChangeMcpToolModal.tsx`, `CreateTestSuite.tsx`). `onFirstDataRendered` in `RadioSelectGrid` still handles the open-time pre-select + scroll from the same `selectedId`.

- *Rationale:* Keeps the prop name truthful; low cost (two call sites).
- *Alternative:* Leave the name as-is to shrink the diff. Acceptable but mildly misleading; rename preferred per code-standards clarity.

## Risks / Trade-offs

- [Risk] Renaming the prop touches the Create flow call site → **Mitigation:** the value passed is unchanged (`testSuite.toolRef?.name`); only the prop identifier changes. Covered by existing Create tests.
- [Risk] `pendingTool` and the picker's `selectedId` could diverge → **Mitigation:** both derive from the same `onToolSelect`/`pendingTool` source of truth, so they stay in lockstep.
- [Trade-off] `RadioSelectGrid` still relies on parents to round-trip `selectedId` (latent footgun for future consumers). Accepted here; a follow-up could make it internally controlled.
