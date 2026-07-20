'use client';

import { GridReadyEvent } from 'ag-grid-community';
import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { useTurnGroupProjection } from '@/src/components/Grid/hooks/use-turn-group-projection';
import { createTestCase, removeTestCase, updateTestCases } from '@/src/app/[lang]/datasets/actions';
import { ensureUniqueTestCaseNames } from '@/src/components/TestSuites/utils/data';
import { DatasetTestCase } from '@/src/models/evaluation/dataset';
import { GroupedGridRow, TestCaseGroup, TestCaseRow } from '@/src/models/evaluation/test-case-grouping';
import { demoteToSingle, promoteToMultiTurn, readTurnIndex } from '@/src/utils/evaluation/test-case-grouping';

/**
 * Generate a fresh, likely-unique test-case name for a newly created turn. The backend enforces
 * name uniqueness within a dataset, so turns cannot share the group's name; matches the app's
 * `new-test-case-<hash>` convention used for new rows.
 */
const newTurnTestCaseName = (): string => `new-test-case-${uuidv4().slice(0, 5)}`;

export interface TurnGroupGridConfig {
  /** Flat backend grid rows (already overlaid with any unsaved edits by the list's refresh). */
  rawRows: TestCaseRow[];
  datasetId?: string;
  /** Reload the grid from the server after a structural change (the list's `refreshGrid`). */
  reload: () => void;
  onError?: (header?: string, message?: string) => void;
  /** Convert a grid row to the entity shape accepted by `updateTestCases`. */
  rowToEntity: (row: TestCaseRow) => DatasetTestCase;
  onGridReady?: (event: GridReadyEvent) => void;
}

const findGroup = (groups: TestCaseGroup[], key: string): TestCaseGroup | undefined =>
  groups.find((group) => group.key === key);

/**
 * Owns UI-side grouping for an editable test-case grid: builds on the read-only
 * `useTurnGroupProjection` primitive (collapsed by default) and adds add/delete/reorder/promote/
 * demote operations against the existing test-case server actions.
 */
export const useTurnGroupGrid = ({
  rawRows,
  datasetId,
  reload,
  onError,
  rowToEntity,
  onGridReady,
}: TurnGroupGridConfig) => {
  const projection = useTurnGroupProjection({ rawRows, onGridReady });
  const { groups, expandGroup } = projection;

  const addTurn = useCallback(
    async (groupKey: string) => {
      if (!datasetId) return;
      const group = findGroup(groups, groupKey);
      if (!group) return;

      if (group.isMulti) {
        const res = await createTestCase(datasetId, {
          testCaseName: newTurnTestCaseName(),
          data: {},
          multiTurnId: group.key,
          turnIndex: group.turns.length,
        });
        if (res?.success) {
          expandGroup(group.key);
          reload();
        } else {
          onError?.(res?.errorHeader, res?.errorMessage);
        }
        return;
      }

      // Single-turn case → promote: attach a generated multiTurnId, then create a second turn.
      const single = group.turns[0];
      const multiTurnId = uuidv4();
      const promote = await updateTestCases(datasetId, [rowToEntity(promoteToMultiTurn(single, multiTurnId))]);
      if (!promote?.success) {
        onError?.(promote?.errorHeader, promote?.errorMessage);
        return;
      }
      const res = await createTestCase(datasetId, {
        testCaseName: newTurnTestCaseName(),
        data: {},
        multiTurnId,
        turnIndex: 1,
      });
      if (res?.success) {
        expandGroup(multiTurnId);
        reload();
      } else {
        onError?.(res?.errorHeader, res?.errorMessage);
      }
    },
    [datasetId, groups, rowToEntity, reload, onError, expandGroup],
  );

  /**
   * Build the update batch for a group's turns after a structural change. Renumbers the turns to
   * their new positions, guarantees unique names across the whole dataset, and returns only the
   * entities whose `turnIndex` OR `testCaseName` actually changed. Name-uniqueness is applied to the
   * full ordered set (not just reindexed turns), so a surviving duplicate name is always repaired
   * regardless of whether that turn's position moved.
   */
  const buildChangedTurnBatch = useCallback(
    (orderedTurns: TestCaseRow[], existing: DatasetTestCase[]): DatasetTestCase[] => {
      const renumbered = orderedTurns.map((turn, index) => ({ ...turn, turnIndex: index }));
      const unique = ensureUniqueTestCaseNames(renumbered.map(rowToEntity), existing);
      return unique.filter((entity, index) => {
        const original = orderedTurns[index];
        const originalName = (original.testCaseName as string | undefined) ?? null;
        return readTurnIndex(original) !== index || (entity.testCaseName ?? null) !== originalName;
      });
    },
    [rowToEntity],
  );

  const deleteTurn = useCallback(
    async (row: GroupedGridRow) => {
      if (!datasetId) return;
      const group = findGroup(groups, row.groupKey);
      if (!group) return;

      const removeRes = await removeTestCase(datasetId, String(row.id));
      if (!removeRes.success) {
        onError?.(removeRes.errorHeader, removeRes.errorMessage);
        return;
      }

      const remaining = group.turns.filter((turn) => String(turn.id) !== String(row.id));
      if (remaining.length === 1) {
        const existing = (rawRows as unknown as DatasetTestCase[]).filter((r) => String(r.id) !== String(row.id));
        const res = await updateTestCases(
          datasetId,
          ensureUniqueTestCaseNames([rowToEntity(demoteToSingle(remaining[0]))], existing),
        );
        if (!res?.success) onError?.(res?.errorHeader, res?.errorMessage);
      } else if (remaining.length > 1) {
        // Exclude the just-deleted row so its stale name isn't counted as "taken".
        const existing = (rawRows as unknown as DatasetTestCase[]).filter((r) => String(r.id) !== String(row.id));
        const toSave = buildChangedTurnBatch(remaining, existing);
        if (toSave.length > 0) {
          const res = await updateTestCases(datasetId, toSave);
          if (!res?.success) onError?.(res?.errorHeader, res?.errorMessage);
        }
      }
      reload();
    },
    [datasetId, groups, rawRows, rowToEntity, reload, onError, buildChangedTurnBatch],
  );

  const moveTurn = useCallback(
    async (row: GroupedGridRow, delta: number) => {
      if (!datasetId) return;
      const group = findGroup(groups, row.groupKey);
      if (!group) return;
      const from = group.turns.findIndex((turn) => String(turn.id) === String(row.id));
      const to = from + delta;
      if (from < 0 || to < 0 || to >= group.turns.length) return;

      const nextOrder = [...group.turns];
      const [moved] = nextOrder.splice(from, 1);
      nextOrder.splice(to, 0, moved);

      const toSave = buildChangedTurnBatch(nextOrder, rawRows as unknown as DatasetTestCase[]);
      if (toSave.length === 0) return;
      const res = await updateTestCases(datasetId, toSave);
      if (res?.success) {
        reload();
      } else {
        onError?.(res?.errorHeader, res?.errorMessage);
      }
    },
    [datasetId, groups, rawRows, reload, onError, buildChangedTurnBatch],
  );

  return {
    ...projection,
    addTurn,
    deleteTurn,
    moveTurn,
  };
};
