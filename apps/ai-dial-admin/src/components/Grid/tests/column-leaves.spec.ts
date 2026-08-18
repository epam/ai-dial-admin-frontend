import { ColDef, ColumnState } from 'ag-grid-community';
import { describe, expect, test } from 'vitest';

import { checkGroupedColDefsChanges } from '@/src/components/Grid/comparators/base-column-comparator';
import {
  applyColumnStateOrderToGroupedColDefs,
  haveGroupedColDefsSamePanelState,
  isGroupedColDefs,
  toColumnLeaves,
  withLeafMoved,
  withLeafVisibility,
} from '@/src/components/Grid/utils';

const FLAT: ColDef[] = [
  { field: 'a', headerName: 'A' },
  { field: 'b', headerName: 'B', hide: true },
  { field: 'c', headerName: 'C' },
];

const GROUPED = [
  {
    groupId: 'left',
    children: [
      { field: 'a', headerName: 'A' },
      { field: 'b', headerName: 'B', hide: true },
    ],
  },
  { groupId: 'right', children: [{ field: 'c', headerName: 'C' }] },
] as unknown as ColDef[];

const state = (colIds: string[], hidden: string[] = []): ColumnState[] =>
  colIds.map((colId) => ({ colId, hide: hidden.includes(colId) }) as ColumnState);

describe('isGroupedColDefs', () => {
  test('reports a flat list as not grouped', () => {
    expect(isGroupedColDefs(FLAT)).toBe(false);
  });

  test('reports definitions carrying children as grouped', () => {
    expect(isGroupedColDefs(GROUPED)).toBe(true);
  });

  test('reports nothing as not grouped', () => {
    expect(isGroupedColDefs(undefined)).toBe(false);
  });
});

describe('toColumnLeaves', () => {
  test('returns a flat list unchanged, with no group attribution', () => {
    expect(toColumnLeaves(FLAT)).toEqual([
      { field: 'a', headerName: 'A', hide: undefined, sort: undefined, suppressColumnsToolPanel: undefined },
      { field: 'b', headerName: 'B', hide: true, sort: undefined, suppressColumnsToolPanel: undefined },
      { field: 'c', headerName: 'C', hide: undefined, sort: undefined, suppressColumnsToolPanel: undefined },
    ]);
  });

  test('flattens groups to their children, each carrying its group', () => {
    expect(toColumnLeaves(GROUPED).map((leaf) => [leaf.field, leaf.groupId])).toEqual([
      ['a', 'left'],
      ['b', 'left'],
      ['c', 'right'],
    ]);
  });

  test('carries the leaf visibility and sort through', () => {
    const defs = [{ groupId: 'g', children: [{ field: 'a', hide: true, sort: 'desc' }] }] as unknown as ColDef[];

    expect(toColumnLeaves(defs)[0]).toMatchObject({ hide: true, sort: 'desc' });
  });
});

describe('withLeafVisibility', () => {
  test('hides a column of a flat list', () => {
    expect(withLeafVisibility(FLAT, 'a', true)[0].hide).toBe(true);
  });

  test('hides a column inside its group', () => {
    const next = withLeafMoved(withLeafVisibility(GROUPED, 'a', true), 'a', 0);
    expect(toColumnLeaves(next).find((leaf) => leaf.field === 'a')?.hide).toBe(true);
  });

  test('leaves the other group untouched', () => {
    const next = withLeafVisibility(GROUPED, 'a', true);

    expect(next[1]).toBe(GROUPED[1]);
  });

  test('shows a hidden column again', () => {
    expect(toColumnLeaves(withLeafVisibility(GROUPED, 'b', false)).find((leaf) => leaf.field === 'b')?.hide).toBe(
      false,
    );
  });
});

describe('withLeafMoved', () => {
  test('reorders a flat list by the flattened index', () => {
    expect(withLeafMoved(FLAT, 'c', 0).map((col) => col.field)).toEqual(['c', 'a', 'b']);
  });

  test('reorders within a group', () => {
    expect(toColumnLeaves(withLeafMoved(GROUPED, 'b', 0)).map((leaf) => leaf.field)).toEqual(['b', 'a', 'c']);
  });

  test('leaves the order unchanged when the drop belongs to another group', () => {
    expect(withLeafMoved(GROUPED, 'a', 2)).toBe(GROUPED);
  });

  test('leaves the order unchanged for an unknown field', () => {
    expect(withLeafMoved(GROUPED, 'zz', 0)).toBe(GROUPED);
  });

  test('leaves the order unchanged for an out-of-range index', () => {
    expect(withLeafMoved(GROUPED, 'a', 99)).toBe(GROUPED);
  });

  test('leaves the order unchanged when the column is already at the index', () => {
    expect(withLeafMoved(GROUPED, 'a', 0)).toBe(GROUPED);
  });
});

describe('applyColumnStateOrderToGroupedColDefs', () => {
  test('orders leaves within their group and applies visibility', () => {
    const next = applyColumnStateOrderToGroupedColDefs(GROUPED, state(['b', 'a', 'c'], ['a']));
    const leaves = toColumnLeaves(next);

    expect(leaves.map((leaf) => leaf.field)).toEqual(['b', 'a', 'c']);
    expect(leaves.find((leaf) => leaf.field === 'a')?.hide).toBe(true);
  });

  test('keeps a column the stored state does not mention, after the ones it does', () => {
    const leaves = toColumnLeaves(applyColumnStateOrderToGroupedColDefs(GROUPED, state(['b'])));

    expect(leaves.map((leaf) => leaf.field)).toEqual(['b', 'a', 'c']);
  });

  test('ignores a stored column that no longer exists', () => {
    const leaves = toColumnLeaves(applyColumnStateOrderToGroupedColDefs(GROUPED, state(['gone', 'a', 'b'])));

    expect(leaves.map((leaf) => leaf.field)).toEqual(['a', 'b', 'c']);
  });
});

describe('haveGroupedColDefsSamePanelState', () => {
  test('reports identical definitions as the same', () => {
    expect(haveGroupedColDefsSamePanelState(GROUPED, GROUPED)).toBe(true);
  });

  test('reports a visibility change as different', () => {
    expect(haveGroupedColDefsSamePanelState(GROUPED, withLeafVisibility(GROUPED, 'a', true))).toBe(false);
  });

  test('reports an order change as different', () => {
    expect(haveGroupedColDefsSamePanelState(GROUPED, withLeafMoved(GROUPED, 'b', 0))).toBe(false);
  });
});

describe('checkGroupedColDefsChanges', () => {
  test('reports no change against the same definitions', () => {
    expect(checkGroupedColDefsChanges(GROUPED, GROUPED)).toBe(false);
  });

  test('reports a hidden column as a change', () => {
    expect(checkGroupedColDefsChanges(withLeafVisibility(GROUPED, 'a', true), GROUPED)).toBe(true);
  });

  test('reports a reordered column as a change', () => {
    expect(checkGroupedColDefsChanges(withLeafMoved(GROUPED, 'b', 0), GROUPED)).toBe(true);
  });

  test('reports a differing column count as a change', () => {
    const fewer = [{ groupId: 'left', children: [{ field: 'a' }] }] as unknown as ColDef[];

    expect(checkGroupedColDefsChanges(fewer, GROUPED)).toBe(true);
  });
});
