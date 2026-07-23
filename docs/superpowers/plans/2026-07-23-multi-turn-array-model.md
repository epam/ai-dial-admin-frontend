# Multi-turn (array-model) + Conditional Metrics — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add data-driven multi-turn test cases (single test case holding an ordered `multiTurnData` array), optional per-turn JSONata metric conditions, per-turn run-results display, CSV multi-row round-trip, and an MCP-suite run guard — reusing the grouped-grid / conditional-metric / turn-results UX from `feature/multi-turn-support-2`.

**Architecture:** A test case is single-turn (`data`) OR multi-turn (`multiTurnData: Record<string,unknown>[]`), mutually exclusive, turns contiguous `0..N-1` by array order. The authoring grid expands a multi-turn case into one editable TURN row per array element (all sharing the case `id`, ordered by a client-only `_turnIndex`) and collapses them back into one DTO on save. Grouping/rendering reuses the PoC's shared grid primitive (`test-case-grouping` util/model + `use-turn-group-projection` hook + three cell renderers), retargeted so the group key is the case `id` and turn order is `_turnIndex`. Conditional metrics and turn-results display are lifted near-verbatim from the PoC.

**Tech Stack:** Next.js + React + TypeScript, AG Grid (`ag-grid-community`), `@epam/ai-dial-ui-kit`, Vitest + Testing Library. `@/` path alias resolves from `apps/ai-dial-admin/`.

## Global Constraints

- Import via the `@/` alias only; never relative paths climbing out of the current dir.
- Types/interfaces live in `src/models/` or an adjacent `models.ts`; no inline anonymous object types in interface props.
- Enums (not string-literal unions) for fixed value sets. `constants.ts` (values) separate from `models.ts` (types).
- Comments only for non-obvious decisions; no restating what a name/type shows.
- **Reference branch (UX + liftable code):** `feature/multi-turn-support-2`. Read/copy its files with `git show "feature/multi-turn-support-2:<path>"`. Its **data model differs** (row-based: persisted `multiTurnId`/`turnIndex`); this plan targets the **array model**, so lifted grouping code must be retargeted per the tasks.
- `data` and `multiTurnData` are **mutually exclusive** on every write — never both, never neither, never an empty `multiTurnData`.
- Client-only grid fields `_turnIndex` are **never** persisted and **never** merged into `data`.
- Test runner: from `apps/ai-dial-admin/`, run `npx vitest run <relative-spec-path>`. Test mocks are centralized in `apps/ai-dial-admin/test-setup.tsx` — check before adding new mocks.
- Design spec: `docs/superpowers/specs/2026-07-23-multi-turn-array-model-design.md`.
- Phases are independently shippable in order: **P0 models → P1 grouping primitive → P2 authoring → P3 conditional metrics → P4 results → P5 CSV → P6 MCP guard.** P3 is independent of P1/P2 and may be done anytime after P0.

---

## Phase 0 — Model foundation

### Task 0.1: Multi-turn + turnIndex-warning fields on test-case models

**Files:**

- Modify: `apps/ai-dial-admin/src/models/evaluation/dataset.ts` (`DatasetTestCase`)
- Modify: `apps/ai-dial-admin/src/models/evaluation/test-suite.ts` (`TestCase`, `ValidationWarning`)

**Interfaces:**

- Produces: `DatasetTestCase.multiTurnData?: Record<string, unknown>[]`, `TestCase.multiTurnData?: Record<string, unknown>[]`, `ValidationWarning.turnIndex?: number | null`.

- [ ] **Step 1: Read the current models**

Run: read `dataset.ts` (`DatasetTestCase`, ~lines 23-31) and `test-suite.ts` (`TestCase` ~104-113, `ValidationWarning` — find it via `grep -n "interface ValidationWarning" apps/ai-dial-admin/src/models/evaluation/test-suite.ts`).

- [ ] **Step 2: Add `multiTurnData` to `DatasetTestCase`**

In `dataset.ts`, inside `interface DatasetTestCase`, directly after the `data?: Record<string, unknown>;` line add:

```ts
  /** Present only for multi-turn cases — an ordered array of per-turn data maps. Mutually exclusive with `data`. */
  multiTurnData?: Record<string, unknown>[];
```

- [ ] **Step 3: Add `multiTurnData` to `TestCase` and `turnIndex` to `ValidationWarning`**

In `test-suite.ts`, inside `interface TestCase`, after `data?: Record<string, unknown>;` add the same `multiTurnData` field (same doc comment). Inside `interface ValidationWarning` add:

```ts
  /** 0-based turn index the warning originates from; null for single-turn cases. */
  turnIndex?: number | null;
```

- [ ] **Step 4: Typecheck**

Run: `cd apps/ai-dial-admin && npx tsc --noEmit -p tsconfig.json`
Expected: no new errors referencing these files.

- [ ] **Step 5: Commit**

```bash
git add apps/ai-dial-admin/src/models/evaluation/dataset.ts apps/ai-dial-admin/src/models/evaluation/test-suite.ts
git commit -m "feat(models): add multiTurnData to test cases and turnIndex to ValidationWarning"
```

### Task 0.2: `condition` on Metric; turn fields on ResultDto

**Files:**

- Modify: `apps/ai-dial-admin/src/models/evaluation/metric.ts` (`Metric`)
- Modify: `apps/ai-dial-admin/src/models/evaluation/run.ts` (`ResultDto`)

**Interfaces:**

- Produces: `Metric.condition?: string`; `ResultDto.turnIndex?: number`, `ResultDto.totalTurns?: number`.

- [ ] **Step 1: Add `condition` to `Metric`**

In `metric.ts`, inside `interface Metric`, add (sibling of the bindings fields):

```ts
  /** Optional JSONata condition evaluated per result row (per turn) over {data, response, turn}; blank/omitted ⇒ always runs. */
  condition?: string;
```

- [ ] **Step 2: Add turn fields to `ResultDto`**

In `run.ts`, inside `interface ResultDto`, after `extractedColumns?: Record<string, unknown>;` add:

```ts
  /** 0-based turn number of this result row (single-turn = 0). */
  turnIndex?: number;
  /** Total turn count of the conversation (single-turn = 1). */
  totalTurns?: number;
```

Note: do **not** add `multiTurnId` — this model has no such field; results group on `testCaseId` + `runIndex` (Phase 4).

- [ ] **Step 3: Typecheck + commit**

Run: `cd apps/ai-dial-admin && npx tsc --noEmit -p tsconfig.json` → no new errors.

```bash
git add apps/ai-dial-admin/src/models/evaluation/metric.ts apps/ai-dial-admin/src/models/evaluation/run.ts
git commit -m "feat(models): add Metric.condition and ResultDto turnIndex/totalTurns"
```

---

## Phase 1 — Grouping primitive (retargeted to id + \_turnIndex)

### Task 1.1: Copy + retarget the grouping model & util

**Files:**

- Create: `apps/ai-dial-admin/src/models/evaluation/test-case-grouping.ts`
- Create: `apps/ai-dial-admin/src/utils/evaluation/test-case-grouping.ts`
- Test: `apps/ai-dial-admin/src/utils/evaluation/tests/test-case-grouping.spec.ts`

**Interfaces:**

- Produces: `GridRowType` (enum `GROUP|TURN|SINGLE`), `TestCaseRow`, `TestCaseGroup`, `GroupedGridRow` (model); and util fns `readGroupKey(row)`, `readTurnIndex(row)`, `groupTestCaseRows(rows)`, `renumberTurns`, `promoteToMultiTurn`, `demoteToSingle`, `reorderTurns`, `aggregateValidity`, `projectGroupsToGridRows`, `regroupSortedRows`.
- Consumes: `ValidationWarning` from `@/src/models/evaluation/test-suite` (Task 0.1).

- [ ] **Step 1: Copy both files from the reference branch verbatim**

```bash
git show "feature/multi-turn-support-2:apps/ai-dial-admin/src/models/evaluation/test-case-grouping.ts" > apps/ai-dial-admin/src/models/evaluation/test-case-grouping.ts
git show "feature/multi-turn-support-2:apps/ai-dial-admin/src/utils/evaluation/test-case-grouping.ts" > apps/ai-dial-admin/src/utils/evaluation/test-case-grouping.ts
```

- [ ] **Step 2: Retarget the two reader functions in the util**

In `apps/ai-dial-admin/src/utils/evaluation/test-case-grouping.ts`, **replace** `readMultiTurnId` with a group-key reader that treats a row as a multi-turn turn iff it carries a client `_turnIndex`, and derives the group key from the case `id`:

```ts
/**
 * Group key for a multi-turn turn row: the shared case `id`. A row is a multi-turn turn iff it carries
 * a client-only `_turnIndex` (set at load when expanding a `multiTurnData` case). Returns null for
 * single-turn rows (no `_turnIndex`), which are grouped individually by their own id.
 */
export const readGroupKey = (row: TestCaseRow): string | null => {
  if (readTurnIndex(row) === null) return null;
  const id = row.id;
  return typeof id === 'string' && id.trim() !== '' ? id : null;
};
```

Then in `readTurnIndex`, change the field it reads from `row.turnIndex` to `row._turnIndex` (keep the number-or-numeric-string coercion body unchanged):

```ts
export const readTurnIndex = (row: TestCaseRow): number | null => {
  const raw = row._turnIndex;
  // ...unchanged body...
};
```

- [ ] **Step 3: Point `groupTestCaseRows` and mutation helpers at the retargeted fields**

In the same file:

- In `groupTestCaseRows`, replace the call `readMultiTurnId(row)` with `readGroupKey(row)` (everything else — the multi/single maps, first-appearance order — stays).
- In `sortTurns`, `renumberTurns`: already sort/renumber by `readTurnIndex`/`turnIndex` — change every write of `turnIndex: index` to `_turnIndex: index`.
- `promoteToMultiTurn(singleRow, _unused?)`: change body to set only the ordering field — `({ ...singleRow, _turnIndex: 0 })` (the group key derives from the existing `id`; no separate id arg needed — keep a second param for signature stability but ignore it, or drop it and update callers in Task 2.x).
- `demoteToSingle(turnRow)`: strip the ordering field — `const { _turnIndex, ...rest } = turnRow; return rest;`.
- In `groupTestCaseRows`'s returned `TestCaseGroup`, the `key` for a multi group is the shared `id` (already produced by `readGroupKey`).

Leave `projectGroupsToGridRows`, `regroupSortedRows`, `aggregateValidity`, `toSingleRow/toGroupRow/toTurnRow` unchanged (they operate on `groupKey`/`turns`/`turnNumber`, not the persisted fields).

- [ ] **Step 4: Update the model doc comments to match**

In `apps/ai-dial-admin/src/models/evaluation/test-case-grouping.ts`, adjust the top comment and the `TestCaseGroup.key` / `GroupedGridRow.groupKey` comments to say the group key is the case `id` and turn order is the client-only `_turnIndex` (no persisted `multiTurnId`/`turnIndex`). No structural type change.

- [ ] **Step 5: Write the retargeting test**

Create `apps/ai-dial-admin/src/utils/evaluation/tests/test-case-grouping.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { groupTestCaseRows, readGroupKey, readTurnIndex, promoteToMultiTurn, demoteToSingle, reorderTurns } from '@/src/utils/evaluation/test-case-grouping';

describe('test-case-grouping (array model)', () => {
  it('reads group key from id only when _turnIndex is present', () => {
    expect(readGroupKey({ id: 'c1', _turnIndex: 0 })).toBe('c1');
    expect(readGroupKey({ id: 'c1', _turnIndex: 2 })).toBe('c1');
    expect(readGroupKey({ id: 'c1' })).toBeNull(); // single-turn
  });

  it('coerces numeric-string _turnIndex and treats 0 as present', () => {
    expect(readTurnIndex({ _turnIndex: 0 })).toBe(0);
    expect(readTurnIndex({ _turnIndex: '2' })).toBe(2);
    expect(readTurnIndex({})).toBeNull();
  });

  it('groups turn rows sharing an id into one multi-turn case, sorted by _turnIndex', () => {
    const groups = groupTestCaseRows([
      { id: 'c1', _turnIndex: 1, testCaseName: 'flow' },
      { id: 'c1', _turnIndex: 0, testCaseName: 'flow' },
      { id: 's1', testCaseName: 'solo' },
    ]);
    expect(groups).toHaveLength(2);
    const multi = groups.find((g) => g.isMulti)!;
    expect(multi.key).toBe('c1');
    expect(multi.turns.map((t) => t._turnIndex)).toEqual([0, 1]);
    expect(groups.find((g) => !g.isMulti)!.key).toBe('s1');
  });

  it('promote sets _turnIndex 0; demote strips it; reorder renumbers contiguously', () => {
    expect(promoteToMultiTurn({ id: 'c1', data: {} })._turnIndex).toBe(0);
    expect('_turnIndex' in demoteToSingle({ id: 'c1', _turnIndex: 0 })).toBe(false);
    const reordered = reorderTurns([{ _turnIndex: 0 }, { _turnIndex: 1 }, { _turnIndex: 2 }], 2, 0);
    expect(reordered.map((t) => t._turnIndex)).toEqual([0, 1, 2]);
  });
});
```

- [ ] **Step 6: Run tests**

Run: `cd apps/ai-dial-admin && npx vitest run src/utils/evaluation/tests/test-case-grouping.spec.ts`
Expected: PASS (all 4).

- [ ] **Step 7: Commit**

```bash
git add apps/ai-dial-admin/src/models/evaluation/test-case-grouping.ts apps/ai-dial-admin/src/utils/evaluation/test-case-grouping.ts apps/ai-dial-admin/src/utils/evaluation/tests/test-case-grouping.spec.ts
git commit -m "feat(grouping): add id/_turnIndex-based test-case grouping primitive"
```

### Task 1.2: Copy the grid render primitives (hook, renderers, grouped columns)

**Files:**

- Create: `apps/ai-dial-admin/src/components/Grid/hooks/use-turn-group-projection.tsx`
- Create: `apps/ai-dial-admin/src/components/Grid/CellRenderers/TestCaseNameCellRenderer.tsx`
- Create: `apps/ai-dial-admin/src/components/Grid/CellRenderers/StackedTurnsCellRenderer.tsx`
- Create: `apps/ai-dial-admin/src/components/Grid/CellRenderers/TurnExpanderCellRenderer.tsx`
- Create: `apps/ai-dial-admin/src/components/TestSuites/utils/grouped-columns.tsx`

**Interfaces:**

- Consumes: the grouping util/model from Task 1.1.
- Produces: `useTurnGroupProjection({ rawRows, defaultExpanded, singlesFirst, onGridReady })` → `{ rowData, onToggleExpand, expandGroup, onFilterChanged, getRowId, getRowHeight, onGridReady }`; renderers keyed off `data.rowType`/`data.turnNumber`/`data.turnCount`; `getTurnExpanderColumn(onToggleExpand)`.

- [ ] **Step 1: Copy the five files verbatim from the reference branch**

```bash
for f in \
  src/components/Grid/hooks/use-turn-group-projection.tsx \
  src/components/Grid/CellRenderers/TestCaseNameCellRenderer.tsx \
  src/components/Grid/CellRenderers/StackedTurnsCellRenderer.tsx \
  src/components/Grid/CellRenderers/TurnExpanderCellRenderer.tsx \
  src/components/TestSuites/utils/grouped-columns.tsx ; do
  git show "feature/multi-turn-support-2:apps/ai-dial-admin/$f" > "apps/ai-dial-admin/$f"
done
```

- [ ] **Step 2: Reconcile turn labels/ids with the retargeted util**

Read each copied file. The hook + renderers consume `GroupedGridRow` fields (`rowType`, `turnNumber`, `turnCount`, `expanded`, `groupKey`, `id`) produced by `projectGroupsToGridRows` — these are unchanged by Task 1.1, so **no edits are expected**. Confirm none of the five files read the persisted `multiTurnId`/`turnIndex` directly (grep):

```bash
grep -rn "multiTurnId\|\.turnIndex" apps/ai-dial-admin/src/components/Grid/hooks/use-turn-group-projection.tsx apps/ai-dial-admin/src/components/Grid/CellRenderers/TestCaseNameCellRenderer.tsx apps/ai-dial-admin/src/components/Grid/CellRenderers/StackedTurnsCellRenderer.tsx apps/ai-dial-admin/src/components/Grid/CellRenderers/TurnExpanderCellRenderer.tsx apps/ai-dial-admin/src/components/TestSuites/utils/grouped-columns.tsx
```

If any hit reads `row.turnIndex` for grouping/ordering, change it to `_turnIndex`; if any reads `row.multiTurnId`, change it to derive from `id` via the util. (Expected: no hits — the hook groups via `groupTestCaseRows` which Task 1.1 already retargeted.)

- [ ] **Step 3: Typecheck**

Run: `cd apps/ai-dial-admin && npx tsc --noEmit -p tsconfig.json`
Expected: resolves all five files with no new errors (i18n keys they use — `TurnLabel`, `TurnCount` etc. — are added in Step 4 if missing).

- [ ] **Step 4: Add any i18n keys the renderers reference**

```bash
git diff development.."feature/multi-turn-support-2" -- apps/ai-dial-admin/src/constants/i18n.ts apps/ai-dial-admin/src/locales/en.ts | grep -iE "turn"
```

For each key the renderers use (e.g. a `Turn {index}` label, a `{count} turns` badge), add the enum key to the matching `*I18nKey` block in `apps/ai-dial-admin/src/constants/i18n.ts` and its English string to `apps/ai-dial-admin/src/locales/en.ts`, copying values from the diff above.

- [ ] **Step 5: Commit**

```bash
git add apps/ai-dial-admin/src/components/Grid apps/ai-dial-admin/src/components/TestSuites/utils/grouped-columns.tsx apps/ai-dial-admin/src/constants/i18n.ts apps/ai-dial-admin/src/locales/en.ts
git commit -m "feat(grid): add turn-group projection hook, cell renderers, grouped columns"
```

---

## Phase 2 — Multi-turn authoring (both surfaces)

### Task 2.1: Expand/collapse round-trip in `TestSuites/utils/data.ts`

**Files:**

- Modify: `apps/ai-dial-admin/src/components/TestSuites/utils/data.ts`
- Test: `apps/ai-dial-admin/src/components/TestSuites/utils/tests/data.spec.ts`

**Interfaces:**

- Produces: `getTestCaseGridData(testCases)` now expands multi-turn cases to N TURN rows (shared `id`, `_turnIndex = i`); `collapseRowsToTestCases(rows): TestCase[]` groups grid rows by `id` and emits one DTO each (single `data` or multi `multiTurnData`), never both, stripping `_turnIndex`.
- Consumes: `TestCase` (Task 0.1).

- [ ] **Step 1: Write failing tests**

Add to `apps/ai-dial-admin/src/components/TestSuites/utils/tests/data.spec.ts` (create the file if absent, mirroring the import style of the existing util tests):

```ts
import { describe, expect, it } from 'vitest';
import { getTestCaseGridData, collapseRowsToTestCases } from '@/src/components/TestSuites/utils/data';

describe('getTestCaseGridData (multi-turn)', () => {
  it('keeps a single-turn case as one row with no _turnIndex', () => {
    const rows = getTestCaseGridData([{ id: 's1', testCaseName: 'solo', data: { prompt: 'hi' }, createdAt: 0 } as any]);
    expect(rows).toHaveLength(1);
    expect(rows[0]._turnIndex).toBeUndefined();
    expect(rows[0].prompt).toBe('hi'); // flattened
  });

  it('expands a multi-turn case to one row per turn, sharing id, ordered by _turnIndex', () => {
    const rows = getTestCaseGridData([{ id: 'c1', testCaseName: 'flow', multiTurnData: [{ prompt: 'a' }, { prompt: 'b' }], createdAt: 0 } as any]);
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.id === 'c1')).toBe(true);
    expect(rows.map((r) => r._turnIndex)).toEqual([0, 1]);
    expect(rows.map((r) => (r.data as any).prompt)).toEqual(['a', 'b']);
    expect(rows.map((r) => r.prompt)).toEqual(['a', 'b']); // flattened per turn
  });
});

describe('collapseRowsToTestCases', () => {
  it('collapses turn rows sharing an id into one multiTurnData DTO in _turnIndex order, no data', () => {
    const [dto] = collapseRowsToTestCases([
      { id: 'c1', _turnIndex: 1, testCaseName: 'flow', data: { prompt: 'b' }, createdAt: 0 },
      { id: 'c1', _turnIndex: 0, testCaseName: 'flow', data: { prompt: 'a' }, createdAt: 0 },
    ]);
    expect(dto.multiTurnData).toEqual([{ prompt: 'a' }, { prompt: 'b' }]);
    expect(dto.data).toBeUndefined();
    expect((dto as any)._turnIndex).toBeUndefined();
  });

  it('emits a single-turn DTO with data and no multiTurnData', () => {
    const [dto] = collapseRowsToTestCases([{ id: 's1', testCaseName: 'solo', data: { prompt: 'hi' }, createdAt: 0 }]);
    expect(dto.data).toEqual({ prompt: 'hi' });
    expect(dto.multiTurnData).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `cd apps/ai-dial-admin && npx vitest run src/components/TestSuites/utils/tests/data.spec.ts`
Expected: FAIL (`collapseRowsToTestCases` not exported / multi-turn not expanded).

- [ ] **Step 3: Implement expand in `getTestCaseGridData`**

Replace the body of `getTestCaseGridData` so a `multiTurnData` case expands to per-turn rows:

```ts
const flatten = (data?: Record<string, unknown>): Record<string, unknown> =>
  Object.keys(data || {}).reduce((acc: Record<string, unknown>, key) => {
    acc[key] = data?.[key];
    return acc;
  }, {});

export const getTestCaseGridData = (testCases?: DatasetTestCase[] | null) => {
  return (
    testCases?.reduce((acc: Record<string, unknown>[], testCase: DatasetTestCase) => {
      const { multiTurnData, data, ...rest } = testCase;
      if (multiTurnData && multiTurnData.length > 0) {
        multiTurnData.forEach((turn, index) => {
          acc.push({ ...rest, id: testCase.id, _turnIndex: index, data: turn, ...flatten(turn) });
        });
      } else {
        acc.push({ ...rest, data: data ?? {}, ...flatten(data) });
      }
      return acc;
    }, []) || []
  );
};
```

- [ ] **Step 4: Implement `collapseRowsToTestCases`**

Add:

```ts
export const collapseRowsToTestCases = (rows: Record<string, unknown>[]): TestCase[] => {
  const byId = new Map<string, Record<string, unknown>[]>();
  const order: string[] = [];
  rows.forEach((row) => {
    const id = row.id as string;
    if (!byId.has(id)) {
      byId.set(id, []);
      order.push(id);
    }
    byId.get(id)!.push(row);
  });

  return order.map((id) => {
    const group = byId.get(id)!;
    const first = group[0];
    const base: TestCase = {
      id,
      enabled: first.enabled as boolean,
      testCaseName: first.testCaseName as string | undefined,
      createdAt: first.createdAt as number,
      updatedAt: first.updatedAt as number | undefined,
      valid: first.valid as boolean | undefined,
      validationWarnings: first.validationWarnings as TestCase['validationWarnings'],
    };
    const isMulti = group.some((r) => r._turnIndex != null);
    if (isMulti) {
      const sorted = [...group].sort((a, b) => (a._turnIndex as number) - (b._turnIndex as number));
      return { ...base, multiTurnData: sorted.map((r) => r.data as Record<string, unknown>) };
    }
    return { ...base, data: first.data as Record<string, unknown> };
  });
};
```

Keep the existing `rowToTestCase` (used for single new rows via `createTestCase`) unchanged.

- [ ] **Step 5: Run tests → PASS**

Run: `cd apps/ai-dial-admin && npx vitest run src/components/TestSuites/utils/tests/data.spec.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/ai-dial-admin/src/components/TestSuites/utils/data.ts apps/ai-dial-admin/src/components/TestSuites/utils/tests/data.spec.ts
git commit -m "feat(test-cases): expand/collapse multiTurnData round-trip (test-suites grid)"
```

### Task 2.2: Same round-trip in `Datasets/utils/data.ts`

**Files:**

- Modify: `apps/ai-dial-admin/src/components/Datasets/utils/data.ts`
- Test: `apps/ai-dial-admin/src/components/Datasets/utils/tests/data.spec.ts`

**Interfaces:**

- Produces: `getDatasetTestCaseGridData` (expands), `collapseRowsToDatasetTestCases(rows): DatasetTestCase[]` (collapses). Same semantics as Task 2.1 but `DatasetTestCase` (no `enabled`).

- [ ] **Step 1: Write failing tests** — copy Task 2.1's tests into `Datasets/utils/tests/data.spec.ts`, importing from `@/src/components/Datasets/utils/data`, using `collapseRowsToDatasetTestCases`, and dropping the `enabled` assertions.

- [ ] **Step 2: Run → FAIL.** `cd apps/ai-dial-admin && npx vitest run src/components/Datasets/utils/tests/data.spec.ts`

- [ ] **Step 3: Implement** — mirror Task 2.1 Steps 3-4 in `Datasets/utils/data.ts` (shared `flatten`, expand in `getDatasetTestCaseGridData`, add `collapseRowsToDatasetTestCases` returning `DatasetTestCase[]` — the `base` omits `enabled`). Keep `rowToDatasetTestCase` unchanged.

- [ ] **Step 4: Run → PASS.**

- [ ] **Step 5: Commit**

```bash
git add apps/ai-dial-admin/src/components/Datasets/utils/data.ts apps/ai-dial-admin/src/components/Datasets/utils/tests/data.spec.ts
git commit -m "feat(test-cases): expand/collapse multiTurnData round-trip (datasets grid)"
```

### Task 2.3: Turn-aware columns + name/validity on group rows (`TestSuites/utils/columns.tsx`)

**Files:**

- Modify: `apps/ai-dial-admin/src/components/TestSuites/utils/columns.tsx` (`getTestCaseColumns`)
- Test: `apps/ai-dial-admin/src/components/TestSuites/utils/tests/columns.spec.ts`

**Interfaces:**

- Consumes: `getTurnExpanderColumn` + renderers (Task 1.2); `GridRowType` (Task 1.1).
- Produces: `getTestCaseColumns(...)` returns columns where (a) a leading expander column is prepended, (b) `testCaseName` uses `TestCaseNameCellRenderer`, (c) each data column uses `StackedTurnsCellRenderer` on GROUP rows and stays editable on TURN/SINGLE rows, and (d) data-cell `valueGetter` reads the per-turn `data`.

- [ ] **Step 1: Study the reference adaptation**

```bash
git diff development.."feature/multi-turn-support-2" -- apps/ai-dial-admin/src/components/TestSuites/utils/columns.tsx
```

This shows exactly how the PoC turned the flat columns into grouped columns (`withStackedGroup`, name-selector, prepended expander). The array model's column shape is identical (same schema, same per-turn `data`), so the diff applies directly.

- [ ] **Step 2: Apply the grouped-column wiring**

In `getTestCaseColumns`, prepend `getTurnExpanderColumn(onToggleExpand)` (thread a new `onToggleExpand` param through the signature — see Task 2.5 for the caller). For the `testCaseName` column, set `cellRenderer` to `TestCaseNameCellRenderer`. For each schema data column, wrap the `cellRendererSelector` so `params.data?.rowType === GridRowType.GROUP` → `StackedTurnsCellRenderer` (read-only, stacks each turn's value) and otherwise keeps the existing type-based editable renderer. Keep `valueGetter: params.data?.data?.[field] ?? params.data?.[field] ?? ''` (per-turn `data` already carries the right values from Task 2.1).

- [ ] **Step 3: Keep identity/validity on the group**

Ensure `testCaseName`, `enabled`, and the validity status column render their value from the GROUP row (the projection's `toGroupRow` already aggregates `valid`/`validationWarnings` and carries `testCaseName`). No per-turn name editing.

- [ ] **Step 4: Write/extend the column test**

In `columns.spec.ts` assert: the first column is the expander (`colId` from `getTurnExpanderColumn`); `testCaseName` column's `cellRenderer` is `TestCaseNameCellRenderer`; a data column's `cellRendererSelector` returns `StackedTurnsCellRenderer` for `{ rowType: GridRowType.GROUP }` and the editable renderer for `{ rowType: GridRowType.TURN }`.

- [ ] **Step 5: Run → PASS.** `cd apps/ai-dial-admin && npx vitest run src/components/TestSuites/utils/tests/columns.spec.ts`

- [ ] **Step 6: Commit**

```bash
git add apps/ai-dial-admin/src/components/TestSuites/utils/columns.tsx apps/ai-dial-admin/src/components/TestSuites/utils/tests/columns.spec.ts
git commit -m "feat(test-cases): turn-aware grouped columns (test-suites grid)"
```

### Task 2.4: Same columns for `Datasets/utils/columns.tsx`

**Files:**

- Modify: `apps/ai-dial-admin/src/components/Datasets/utils/columns.tsx` (`getDatasetTestCaseColumns`)
- Test: `apps/ai-dial-admin/src/components/Datasets/utils/tests/columns.spec.ts`

- [ ] **Step 1:** Apply the Task 2.3 wiring to `getDatasetTestCaseColumns` (schema from `dataset.testCaseSchema`, no `enabled` column). Thread `onToggleExpand`.
- [ ] **Step 2:** Mirror the column test in the Datasets tests dir.
- [ ] **Step 3: Run → PASS**, then commit:

```bash
git add apps/ai-dial-admin/src/components/Datasets/utils/columns.tsx apps/ai-dial-admin/src/components/Datasets/utils/tests/columns.spec.ts
git commit -m "feat(test-cases): turn-aware grouped columns (datasets grid)"
```

### Task 2.5: Wire projection + save-collapse + add/remove/reorder into `TestSuites/TestCases/TestCasesList.tsx`

**Files:**

- Modify: `apps/ai-dial-admin/src/components/TestSuites/TestCases/TestCasesList.tsx`
- Test: `apps/ai-dial-admin/src/components/TestSuites/TestCases/tests/TestCasesList.spec.tsx`

**Interfaces:**

- Consumes: `useTurnGroupProjection` (Task 1.2), `getTestCaseColumns(..., onToggleExpand)` (Task 2.3), `collapseRowsToTestCases` (Task 2.1), grouping mutation helpers (Task 1.1).
- Produces: grid rendered via projection (`rowData`, `getRowId`, `getRowHeight`, `onToggleExpand`, `onFilterChanged`), `onCellChange` excluding `_turnIndex` from `data`, `getDirtyTestCases()` collapsing whole groups, and Add-turn / Remove-turn / Reorder row actions.

- [ ] **Step 1: Feed rows through the projection**

Wrap the grid data: `const projection = useTurnGroupProjection({ rawRows: getTestCaseGridData(testCases), defaultExpanded: false, singlesFirst: false, onGridReady });`. Pass `columnDefs={getTestCaseColumns(suite, onCellChange, t, activeSchema, isReadOnly, projection.onToggleExpand)}`, `rowData={projection.rowData}`, `getRowId={projection.getRowId}`, `getRowHeight={projection.getRowHeight}`, `onFilterChanged={projection.onFilterChanged}` to the `GridView`. (`defaultExpanded: false` = collapsed authoring grid — turns hidden until the user expands, matching the reference test-case grid.)

- [ ] **Step 2: Exclude `_turnIndex` in `onCellChange`**

In `onCellChange` change the exclusion condition to also skip `_turnIndex`:

```ts
if (field !== 'testCaseName' && field !== 'enabled' && field !== '_turnIndex' && data.data != null) {
  data.data = { ...(data.data as Record<string, unknown>), [field]: value };
}
```

- [ ] **Step 3: Collapse groups in `getDirtyTestCases`**

Change `getDirtyTestCases` to gather **all** grid rows for each dirty/new id and collapse them together (a turn edit must not lose sibling turns). Using the grid api captured in `onGridReady`:

```ts
getDirtyTestCases: () => {
  const dirtyIds = new Set<string>([...dirtyRowsRef.current.keys(), ...newTestCases.map((r) => r.id as string)]);
  const rowsById = new Map<string, Record<string, unknown>[]>();
  gridApiRef.current?.forEachNode((node) => {
    const row = node.data as Record<string, unknown> | undefined;
    if (row && dirtyIds.has(row.id as string) && row.rowType !== 'GROUP') {
      const bucket = rowsById.get(row.id as string) ?? [];
      bucket.push(row);
      rowsById.set(row.id as string, bucket);
    }
  });
  return collapseRowsToTestCases([...rowsById.values()].flat());
},
```

(Exclude synthetic GROUP rows — only TURN/SINGLE rows carry real `data`.) Keep `dirtyRowsRef` as a dirty-id marker; its stored value is no longer read for the payload.

- [ ] **Step 4: Add turn / remove turn / reorder actions**

Add row actions (context-menu or action-cell, following the existing action pattern in this file):

- **Add turn** on a SINGLE row → `promoteToMultiTurn` the current row (its `data` becomes turn 0), append an empty turn 1 (`{ id: sameId, _turnIndex: 1, testCaseName, data: {} }`); mark id dirty; refresh via `projection.expandGroup(id)`.
- **+ add turn** on a GROUP/TURN row → append `{ id, _turnIndex: N, testCaseName, data: {} }`; mark dirty.
- **Remove turn** → drop the TURN row, `renumberTurns` the remainder; if one turn remains, `demoteToSingle` (its `data` becomes the case `data`); mark dirty.
- **Reorder up/down** → `reorderTurns`; mark dirty.
  After each, re-set the grid rows from the recomputed group and re-run the projection.

- [ ] **Step 5: Extend the component test**

In `TestCasesList.spec.tsx` add:

- editing a data cell on a TURN row writes into that row's `data` and never sets `data._turnIndex`.
- `getDirtyTestCases()` after editing one turn of a 2-turn case returns ONE DTO with a 2-element `multiTurnData` (both turns preserved).
- "Add turn" on a single case makes `getDirtyTestCases()` return a `multiTurnData` DTO (no `data`).
- Removing down to one turn returns a single-turn `data` DTO.

Mock `gridApiRef.current.forEachNode` to iterate the test rows (see `test-setup.tsx` for the AG Grid mock; extend it only if needed).

- [ ] **Step 6: Run → PASS.** `cd apps/ai-dial-admin && npx vitest run src/components/TestSuites/TestCases/tests/TestCasesList.spec.tsx`

- [ ] **Step 7: Commit**

```bash
git add apps/ai-dial-admin/src/components/TestSuites/TestCases/TestCasesList.tsx apps/ai-dial-admin/src/components/TestSuites/TestCases/tests/TestCasesList.spec.tsx
git commit -m "feat(test-cases): grouped multi-turn authoring + save-collapse (test-suites)"
```

### Task 2.6: Same wiring in `Datasets/TestCases/TestCasesList.tsx`

**Files:**

- Modify: `apps/ai-dial-admin/src/components/Datasets/TestCases/TestCasesList.tsx`
- Test: `apps/ai-dial-admin/src/components/Datasets/TestCases/tests/TestCasesList.spec.tsx`

- [ ] **Step 1:** Apply Task 2.5 Steps 1-4 to the Datasets list (uses `getDatasetTestCaseColumns`, `getDatasetTestCaseGridData`, `collapseRowsToDatasetTestCases`; `onCellChange` here only excludes `testCaseName` today — add `_turnIndex`; no `enabled`).
- [ ] **Step 2:** Mirror the component tests.
- [ ] **Step 3: Run → PASS**, then commit:

```bash
git add apps/ai-dial-admin/src/components/Datasets/TestCases/TestCasesList.tsx apps/ai-dial-admin/src/components/Datasets/TestCases/tests/TestCasesList.spec.tsx
git commit -m "feat(test-cases): grouped multi-turn authoring + save-collapse (datasets)"
```

### Task 2.7: Widen create-body types to carry `multiTurnData`

**Files:**

- Modify: `apps/ai-dial-admin/src/server/eval/datasets-api.ts` (`createTestCase`)
- Modify: `apps/ai-dial-admin/src/server/eval/test-suites-api.ts` (`createTestCase`)
- Modify: `apps/ai-dial-admin/src/app/[lang]/datasets/actions.ts` (`createTestCase` wrapper); and the test-suites actions wrapper if it exposes create.

**Interfaces:**

- Produces: create body type `Pick<DatasetTestCase, 'testCaseName' | 'data' | 'multiTurnData'>` (and the `TestCase` equivalent).

- [ ] **Step 1:** In each `createTestCase`, widen the `body` parameter type from `Pick<…, 'testCaseName' | 'data'>` to additionally include `'multiTurnData'`. `updateTestCases` (PUT batch) needs **no** change — it already sends full DTOs, so `multiTurnData` flows via `collapseRowsToTestCases`. Do **not** touch the bulk PATCH whitelist.

- [ ] **Step 2: Typecheck**

Run: `cd apps/ai-dial-admin && npx tsc --noEmit -p tsconfig.json` → no new errors.

- [ ] **Step 3: Commit**

```bash
git add apps/ai-dial-admin/src/server/eval/datasets-api.ts apps/ai-dial-admin/src/server/eval/test-suites-api.ts apps/ai-dial-admin/src/app/[lang]/datasets/actions.ts
git commit -m "feat(api): allow multiTurnData in test-case create body"
```

---

## Phase 3 — Conditional metrics (lift from reference)

### Task 3.1: Constants, guard util, and i18n

**Files:**

- Modify: `apps/ai-dial-admin/src/components/TestSuites/Metrics/AddMetric/constants.ts`
- Modify: `apps/ai-dial-admin/src/components/TestSuites/Metrics/AddMetric/utils.ts`
- Modify: `apps/ai-dial-admin/src/constants/i18n.ts`, `apps/ai-dial-admin/src/locales/en.ts`
- Test: `apps/ai-dial-admin/src/components/TestSuites/Metrics/AddMetric/tests/utils.spec.ts`

**Interfaces:**

- Produces: `CONDITION_MAX_LENGTH = 2000`, `SYSTEM_FUNCTION_CONDITION_REGEX`, `isReservedSystemFunctionCondition(condition?): boolean`; i18n `TestSuitesI18nKey.{Condition, ConditionHint, ConditionAlwaysRun, ConditionSystemFunctionUnavailable}`.

- [ ] **Step 1: Add the constants**

To `AddMetric/constants.ts` add (verbatim from reference):

```ts
export const CONDITION_MAX_LENGTH = 2000;

// A bare `name()` (no `$`, paths, or operators) is a reserved "system function" call. None ship yet,
// so the backend rejects it with a 400 — we surface that client-side before the request is sent.
export const SYSTEM_FUNCTION_CONDITION_REGEX = /^[A-Za-z_][A-Za-z0-9_]*\(\)$/;
```

- [ ] **Step 2: Add the guard util**

To `AddMetric/utils.ts` add the import of `SYSTEM_FUNCTION_CONDITION_REGEX` from `./constants` and:

```ts
export const isReservedSystemFunctionCondition = (condition?: string): boolean => {
  const trimmed = condition?.trim();
  return !!trimmed && SYSTEM_FUNCTION_CONDITION_REGEX.test(trimmed);
};
```

- [ ] **Step 3: Add i18n keys + strings**

To the `TestSuitesI18nKey` enum in `constants/i18n.ts` add:

```ts
  Condition = 'TestSuites.Condition',
  ConditionHint = 'TestSuites.ConditionHint',
  ConditionAlwaysRun = 'TestSuites.ConditionAlwaysRun',
  ConditionSystemFunctionUnavailable = 'TestSuites.ConditionSystemFunctionUnavailable',
```

Copy the exact English strings from the reference (`ConditionHint` is the long JSONata help; `ConditionAlwaysRun` = `'Always run'`):

```bash
git diff development.."feature/multi-turn-support-2" -- apps/ai-dial-admin/src/locales/en.ts | grep -A1 -iE "Condition"
```

Paste the four `Condition*` entries into the `TestSuites` block of `locales/en.ts`.

- [ ] **Step 4: Write the guard test**

In `AddMetric/tests/utils.spec.ts` add:

```ts
import { isReservedSystemFunctionCondition } from '@/src/components/TestSuites/Metrics/AddMetric/utils';

describe('isReservedSystemFunctionCondition', () => {
  it('flags a bare system-function call', () => {
    expect(isReservedSystemFunctionCondition('name()')).toBe(true);
  });
  it('allows real JSONata and blanks', () => {
    expect(isReservedSystemFunctionCondition('$exists(response.answer)')).toBe(false);
    expect(isReservedSystemFunctionCondition('turn.last')).toBe(false);
    expect(isReservedSystemFunctionCondition('')).toBe(false);
    expect(isReservedSystemFunctionCondition(undefined)).toBe(false);
  });
});
```

- [ ] **Step 5: Run → PASS**, then commit:

```bash
cd apps/ai-dial-admin && npx vitest run src/components/TestSuites/Metrics/AddMetric/tests/utils.spec.ts && cd -
git add apps/ai-dial-admin/src/components/TestSuites/Metrics/AddMetric/constants.ts apps/ai-dial-admin/src/components/TestSuites/Metrics/AddMetric/utils.ts apps/ai-dial-admin/src/components/TestSuites/Metrics/AddMetric/tests/utils.spec.ts apps/ai-dial-admin/src/constants/i18n.ts apps/ai-dial-admin/src/locales/en.ts
git commit -m "feat(metrics): condition constants, reserved-fn guard, i18n"
```

### Task 3.2: Condition input in the Add/Edit Metric modal

**Files:**

- Modify: `apps/ai-dial-admin/src/components/TestSuites/Metrics/AddMetric/Configuration.tsx`
- Modify: `apps/ai-dial-admin/src/components/TestSuites/Metrics/AddMetric/AddMetricModal.tsx`
- Test: `apps/ai-dial-admin/src/components/TestSuites/Metrics/AddMetric/tests/Configuration.spec.tsx`, `.../tests/AddMetricModal.spec.tsx`

**Interfaces:**

- Consumes: `isReservedSystemFunctionCondition`, `CONDITION_MAX_LENGTH`, i18n keys (Task 3.1).
- Produces: `Configuration` accepts `condition`, `conditionError`, `onChangeCondition`; modal hydrates `condition` from `editingMetric`, gates finish on `!conditionError`, includes `condition: condition.trim() || undefined` in the `onConfirm` payload.

- [ ] **Step 1: Port the diffs**

```bash
git diff development.."feature/multi-turn-support-2" -- apps/ai-dial-admin/src/components/TestSuites/Metrics/AddMetric/Configuration.tsx apps/ai-dial-admin/src/components/TestSuites/Metrics/AddMetric/AddMetricModal.tsx
```

Apply them: in `Configuration.tsx` add the `condition`/`conditionError`/`onChangeCondition` props and the `DialInput` block (label `Condition`, caption `ConditionHint`, placeholder `$exists(response.answer)`, `maxLength={CONDITION_MAX_LENGTH}`, `error`/`invalid` wiring) below the Name input, plus `condition` in the JSON-view `MetricConfigurationData`. In `AddMetricModal.tsx` add `const [condition, setCondition] = useState('')`, the hydration effect `useEffect(() => setCondition(editingMetric?.condition ?? ''), [editingMetric?.condition])`, `const conditionError = isReservedSystemFunctionCondition(condition) ? t(TestSuitesI18nKey.ConditionSystemFunctionUnavailable) : undefined`, gate step-2 validity on `!conditionError`, thread the props, and add `condition: condition.trim() || undefined` to the `onConfirm` payload object.

- [ ] **Step 2: Port the modal/config tests** from the same diff (`tests/Configuration.spec.tsx`, `tests/AddMetricModal.spec.tsx`): renders the Condition input; `onChangeCondition` fires; shows `conditionError`; hydrates from `editingMetric`; reserved call blocks finish; payload carries `condition` (and `undefined` when blank).

- [ ] **Step 3: Run → PASS.** `cd apps/ai-dial-admin && npx vitest run src/components/TestSuites/Metrics/AddMetric/tests/`

- [ ] **Step 4: Commit**

```bash
git add apps/ai-dial-admin/src/components/TestSuites/Metrics/AddMetric/Configuration.tsx apps/ai-dial-admin/src/components/TestSuites/Metrics/AddMetric/AddMetricModal.tsx apps/ai-dial-admin/src/components/TestSuites/Metrics/AddMetric/tests
git commit -m "feat(metrics): author condition in add/edit metric modal"
```

### Task 3.3: Show condition (or "Always run") in the metric card

**Files:**

- Modify: `apps/ai-dial-admin/src/components/TestSuites/Metrics/Metrics.tsx`
- Test: `apps/ai-dial-admin/src/components/TestSuites/Metrics/tests/Metrics.spec.tsx`

- [ ] **Step 1:** Port the reference card row into each metric card:

```tsx
<div className="flex flex-row gap-3 items-start">
  <p className="dial-tiny-semi-text">{t(TestSuitesI18nKey.Condition)}:</p>
  <span className="dial-tiny-text break-all">{metric.condition?.trim() || t(TestSuitesI18nKey.ConditionAlwaysRun)}</span>
</div>
```

- [ ] **Step 2:** Add a test: a metric with a condition renders it; a metric without renders "Always run".

- [ ] **Step 3: Run → PASS**, then commit:

```bash
cd apps/ai-dial-admin && npx vitest run src/components/TestSuites/Metrics/tests/Metrics.spec.tsx && cd -
git add apps/ai-dial-admin/src/components/TestSuites/Metrics/Metrics.tsx apps/ai-dial-admin/src/components/TestSuites/Metrics/tests/Metrics.spec.tsx
git commit -m "feat(metrics): show condition or 'Always run' in metric card"
```

---

## Phase 4 — Run results turn display

### Task 4.1: Turn / Total-turns columns + default sort

**Files:**

- Modify: `apps/ai-dial-admin/src/components/Runs/View/utils.ts`
- Test: `apps/ai-dial-admin/src/components/Runs/View/tests/utils.spec.ts`

**Interfaces:**

- Produces: two columns in the EXECUTION group — `Turn` (`valueGetter` = `turnIndex + 1`, blank when absent), `Total turns` (raw `totalTurns`); default multi-sort `testCaseName → runIndex → turnIndex` (all asc).

- [ ] **Step 1: Study the reference diff**

```bash
git diff development.."feature/multi-turn-support-2" -- apps/ai-dial-admin/src/components/Runs/View/utils.ts
```

Note: the reference diff also carries unrelated refactors (metric cell styling, INPUT BINDINGS group, `theme` arg). **Port only** the `turnIndex`/`totalTurns` columns and the `DEFAULT_SORT_INDEX`/`applyDefaultSort` additions — leave the rest of `development`'s `utils.ts` intact.

- [ ] **Step 2: Add the two columns** into the execution column group (between `runIndex` and HTTP):

```ts
{
  field: 'turnIndex', headerName: 'Turn', colId: 'turnIndex', width: 60,
  valueGetter: (params) => (params.data?.turnIndex != null ? params.data.turnIndex + 1 : null),
},
{
  field: 'totalTurns', headerName: 'Total turns', colId: 'totalTurns', width: 90,
  valueGetter: (params) => params.data?.totalTurns ?? null,
},
```

- [ ] **Step 3: Add the default sort** helper (port `DEFAULT_SORT_INDEX = { testCaseName: 0, runIndex: 1, turnIndex: 2 }` and the recursive `applyDefaultSort` that stamps `sort: 'asc'` + `sortIndex`), and apply it where columns are built.

- [ ] **Step 4: Extend the utils test**: `Turn` valueGetter returns `turnIndex+1` and null when absent; `Total turns` returns raw; the three sort columns carry ascending `sortIndex` 0/1/2.

- [ ] **Step 5: Run → PASS**, then commit:

```bash
cd apps/ai-dial-admin && npx vitest run src/components/Runs/View/tests/utils.spec.ts && cd -
git add apps/ai-dial-admin/src/components/Runs/View/utils.ts apps/ai-dial-admin/src/components/Runs/View/tests/utils.spec.ts
git commit -m "feat(runs): Turn/Total-turns result columns + default turn sort"
```

### Task 4.2: Collapsible conversation grouping in results (keyed on testCaseId+runIndex)

**Files:**

- Create: `apps/ai-dial-admin/src/components/Runs/View/results-grouping-columns.tsx`
- Modify: `apps/ai-dial-admin/src/components/Runs/View/ExtractionResult.tsx`
- Test: `apps/ai-dial-admin/src/components/Runs/View/tests/results-grouping-columns.spec.ts`

**Interfaces:**

- Consumes: `useTurnGroupProjection`, renderers (Task 1.2); `groupTestCaseRows`/`projectGroupsToGridRows` (Task 1.1).
- Produces: `applyResultsGrouping(colDefs, onToggleExpand)`, `getGroupedAnalyticsColumns(results, onToggleExpand)`; a results-specific group-key reader on `${testCaseId}::${runIndex}`.

- [ ] **Step 1: Copy the reference file**

```bash
git show "feature/multi-turn-support-2:apps/ai-dial-admin/src/components/Runs/View/results-grouping-columns.tsx" > apps/ai-dial-admin/src/components/Runs/View/results-grouping-columns.tsx
```

- [ ] **Step 2: Retarget results grouping to the array model's key**

The reference grouped results by `multiTurnId`. This model has none — turns of one conversation share `testCaseId` + `runIndex`. Provide a results-side grouping that keys on `${testCaseId}::${runIndex}` and derives turn order + multi-ness from `turnIndex`/`totalTurns`. Concretely: before projecting, map each result row to carry client fields the projection understands — set `_turnIndex = row.turnIndex` and, when `row.totalTurns > 1`, an `id = \`${row.testCaseId}::${row.runIndex}\``so same-conversation turns share it (single-turn rows keep their own unique id and no`\_turnIndex`). Then reuse `groupTestCaseRows`+`projectGroupsToGridRows(groups, toggled, isSearching, /_defaultExpanded_/ true, /_singlesFirst_/ true)` unchanged.

- [ ] **Step 3: Wire `ExtractionResult.tsx`**

Port the reference wiring: build `projection = useTurnGroupProjection({ rawRows: mappedResults, defaultExpanded: true, singlesFirst: true, onGridReady })`, `groupedColDefs = applyResultsGrouping(colDefs, projection.onToggleExpand)`, and pass `columnDefs={groupedColDefs}`, `rowData={projection.rowData}`, `onGridReady`, `getRowHeight`, `onFilterChanged` to `GridView`. Do **not** set `getRowId` (per the reference comment — re-expanded turns must stay under their group). GROUP rows: row-click no-op; other rows open the detail via `data.id`.

- [ ] **Step 4: Write the grouping test**: two result rows with the same `testCaseId`+`runIndex` and `totalTurns=2` project to one GROUP + two TURN rows (expanded by default); a single-turn result (`totalTurns=1`) projects to one SINGLE row floated first.

- [ ] **Step 5: Run → PASS**, then commit:

```bash
cd apps/ai-dial-admin && npx vitest run src/components/Runs/View/tests/results-grouping-columns.spec.ts && cd -
git add apps/ai-dial-admin/src/components/Runs/View/results-grouping-columns.tsx apps/ai-dial-admin/src/components/Runs/View/ExtractionResult.tsx apps/ai-dial-admin/src/components/Runs/View/tests/results-grouping-columns.spec.ts
git commit -m "feat(runs): collapsible conversation grouping in results (testCaseId+runIndex)"
```

### Task 4.3: Verify conditional-metric skip/error surfacing (no new code expected)

**Files:**

- Test: `apps/ai-dial-admin/src/components/Runs/View/tests/utils.spec.ts` (extend)

- [ ] **Step 1: Confirm existing handling**

Grep to confirm `metricInfos`/`metricError` are already rendered on `development`:

```bash
grep -rn "metricError\|metricInfos" apps/ai-dial-admin/src/components/Runs
```

- [ ] **Step 2: Add a guard test** asserting a result row with a `metricInfos[name].error` produces the `metricError::<name>` column/value, and a metric absent from `metricValues` renders blank (no crash). If the assertion fails, port the minimal rendering from `Runs/Details/RunMetricDetailPanel` / `Runs/Export/utils/group-columns` per the reference; otherwise this task is test-only.

- [ ] **Step 3: Run → PASS**, then commit:

```bash
cd apps/ai-dial-admin && npx vitest run src/components/Runs/View/tests/utils.spec.ts && cd -
git add apps/ai-dial-admin/src/components/Runs/View/tests/utils.spec.ts
git commit -m "test(runs): conditional-metric skip/error surfacing"
```

---

## Phase 5 — CSV import/export

### Task 5.1: `turnIndex` in import preview mapping

**Files:**

- Modify: `apps/ai-dial-admin/src/components/TestSuites/TestCases/Import/models.ts` (`RowMapping`)
- Modify (if needed): `apps/ai-dial-admin/src/components/TestSuites/TestCases/Import/utils.tsx` (`getGridDataFromImportPreview`)
- Test: `apps/ai-dial-admin/src/components/TestSuites/TestCases/Import/tests/utils.spec.tsx` (create if absent)

**Interfaces:**

- Produces: `RowMapping.turnIndex?: number | null`; import preview renders the reserved `turnIndex` column and keeps it out of `data`.

- [ ] **Step 1:** Add `turnIndex?: number | null;` to `interface RowMapping` in `Import/models.ts`.

- [ ] **Step 2:** Confirm `getGridDataFromImportPreview` builds columns from backend `detectedColumns` (so `turnIndex` renders automatically) and that `sampleRows.map(row => ({ ...row, ...row.data }))` does not fold `turnIndex` into `data`. No functional change expected beyond the type; add a preview test asserting a `turnIndex` column appears and each row's `turnIndex` stays top-level (not inside `data`).

- [ ] **Step 3:** Export is backend-driven (frontend just downloads via `exportTestCasesCsv`) — no code change; note it in the commit body.

- [ ] **Step 4: Run → PASS**, then commit:

```bash
cd apps/ai-dial-admin && npx vitest run src/components/TestSuites/TestCases/Import/tests/utils.spec.tsx && cd -
git add apps/ai-dial-admin/src/components/TestSuites/TestCases/Import
git commit -m "feat(csv): carry reserved turnIndex column through import preview"
```

### Task 5.2: Verify import conflict warnings render

**Files:**

- Test: import preview component test (locate the preview/warnings component under `Import/`, e.g. the warnings list, and add/extend its spec).

- [ ] **Step 1:** Confirm `ImportPreview.warnings` (`CaseWarning[]` with `columnName`/`message`) already renders in the preview UI (grep for `warnings` under `Import/`). Add a test feeding a warning with `columnName: 'testCaseName'` and message about non-contiguous/duplicate `turnIndex` and asserting it renders. No new mapping layer — warnings are surfaced as-is.

- [ ] **Step 2: Run → PASS**, then commit:

```bash
git add apps/ai-dial-admin/src/components/TestSuites/TestCases/Import
git commit -m "test(csv): surface multi-turn import conflict warnings"
```

---

## Phase 6 — Run-creation MCP guard

### Task 6.1: Surface the 409 INVALID_OPERATION on run creation

**Files:**

- Locate + Modify (if needed): the run-creation handler (grep `createRun`/run-creation action under `apps/ai-dial-admin/src`) and its error toast.
- Test: the run-creation handler/component spec.

**Interfaces:**

- Produces: a `409 INVALID_OPERATION` from run creation surfaces its backend `{ code, message }` ("Cannot create a run: MCP suites do not support multi-turn test cases") through the existing generic error toast.

- [ ] **Step 1: Find the run-creation path + its error handling**

```bash
grep -rn "runs" apps/ai-dial-admin/src/server/eval/test-suites-api.ts | grep -i "run"
grep -rn "createRun\|createRuns\|/runs" apps/ai-dial-admin/src/app apps/ai-dial-admin/src/components/Runs | head
```

- [ ] **Step 2:** Confirm the existing run-creation error handling shows the backend message from the response (as other 4xx/409 guards do). If it already surfaces `error.message`/`error.code` generically, **no code change** — the new 409 flows through. If run-creation swallows non-2xx, extend it to surface the backend message via the shared error toast used elsewhere in this file.

- [ ] **Step 3:** Add a test: run creation returning `409` with body `{ code: 'INVALID_OPERATION', message: 'Cannot create a run: MCP suites do not support multi-turn test cases' }` triggers the error toast with that message.

- [ ] **Step 4: Run → PASS**, then commit:

```bash
git add apps/ai-dial-admin/src/app apps/ai-dial-admin/src/components/Runs apps/ai-dial-admin/src/server
git commit -m "feat(runs): surface MCP multi-turn 409 on run creation"
```

---

## Final verification

- [ ] **Full app test suite**

Run: `cd apps/ai-dial-admin && npx vitest run`
Expected: all green (fix any regressions in touched areas).

- [ ] **Lint**

Run (repo root): `npm run lint`
Expected: clean.

- [ ] **Typecheck**

Run: `cd apps/ai-dial-admin && npx tsc --noEmit -p tsconfig.json`
Expected: clean.

- [ ] **Manual smoke (optional, via `/run`):** create a multi-turn case (Add turn), edit turns, save, reload → turns persist as `multiTurnData`; add a metric condition; view a multi-turn run's grouped results.

---

## Self-review notes (coverage map)

- Handoff §CHANGED test-cases (multiTurnData request/response) → Tasks 0.1, 2.1-2.7.
- Handoff §PATCH semantics → covered by design decision (frontend uses PUT batch; bulk PATCH unchanged) — Task 2.7 Step 1.
- Handoff §ValidationWarningDto.turnIndex → Task 0.1; surfaced via existing validity column (Tasks 2.3-2.4).
- Handoff §TSMD condition → Tasks 0.2, 3.1-3.3.
- Handoff §run results turnIndex/totalTurns + grouping + conditional surfacing → Tasks 0.2, 4.1-4.3.
- Handoff §eval summaries turnIndex/totalTurns → same `ResultDto` fields (Task 0.2) flow through; no separate summary render change in scope.
- Handoff §CSV → Tasks 5.1-5.2.
- Handoff §run-creation MCP 409 → Task 6.1.
- Handoff §batch-write turn fields → out of scope (frontend does export, not batch-write) — noted in spec §2.
