import type { ColDef } from 'ag-grid-community';
import { describe, expect, test } from 'vitest';

import { CompareRowDetailSection } from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/models';
import {
  applyRowDetailDisplayTree,
  buildRowDetailDisplayTree,
} from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/utils/row-detail-display-tree';
import { MetricDeltaKind } from '@/src/components/Runs/Compare/ExecutionResults/utils/metric-utils';

const field = (fieldKey: string, label: string): CompareRowDetailSection['rows'][number] => ({
  fieldKey,
  label,
  primaryRaw: 'a',
  secondaryRaw: 'b',
  diffKind: MetricDeltaKind.Changed,
  isNumeric: false,
  isScoreIndicator: false,
  isMetric: false,
});

const sections: CompareRowDetailSection[] = [
  { key: 'execution', label: 'Execution', rows: [field('status', 'Status'), field('duration', 'Duration')] },
  { key: 'testCaseData', label: 'Test Case Data', rows: [field('prompt', 'Prompt')] },
];

type ColDefGroup = ColDef & { children?: ColDef[] };

const getChildren = (node: ColDef): ColDef[] =>
  'children' in node && node.children ? (node.children as ColDef[]) : [];

const keyOf = (node: ColDef): string => (node.context as { panelName?: string }).panelName ?? '';

describe('buildRowDetailDisplayTree', () => {
  test('builds a group per section with field leaves', () => {
    const tree = buildRowDetailDisplayTree(sections);

    expect(tree).toHaveLength(2);
    expect(keyOf(tree[0])).toBe('execution');
    expect(tree[0].headerName).toBe('Execution');
    expect(getChildren(tree[0]).map(keyOf)).toEqual(['status', 'duration']);
    expect(tree[0].hide).toBe(false);
  });

  test('returns fresh tree when prev is empty', () => {
    expect(buildRowDetailDisplayTree(sections, [])).toHaveLength(2);
  });

  test('preserves prior order and hide state for matching keys', () => {
    const prev = buildRowDetailDisplayTree(sections);
    // reorder sections and hide a field
    const executionChildren = getChildren(prev[0]);
    const reordered: ColDef[] = [
      prev[1],
      { ...prev[0], children: [executionChildren[1], { ...executionChildren[0], hide: true }] } as ColDef,
    ];

    const merged = buildRowDetailDisplayTree(sections, reordered);

    expect(merged.map(keyOf)).toEqual(['testCaseData', 'execution']);
    const mergedExecutionChildren = getChildren(merged[1]);
    expect(mergedExecutionChildren.map(keyOf)).toEqual(['duration', 'status']);
    expect(mergedExecutionChildren.find((c) => keyOf(c) === 'status')?.hide).toBe(true);
  });

  test('appends new sections not present in prev', () => {
    const prev = buildRowDetailDisplayTree([sections[0]]);
    const merged = buildRowDetailDisplayTree(sections, prev);

    expect(merged.map(keyOf)).toEqual(['execution', 'testCaseData']);
  });
});

describe('applyRowDetailDisplayTree', () => {
  test('returns sections unchanged when tree is empty', () => {
    expect(applyRowDetailDisplayTree(sections, [])).toEqual(sections);
  });

  test('reorders sections to match the tree', () => {
    const tree = buildRowDetailDisplayTree(sections);
    const reordered = [tree[1], tree[0]];

    const result = applyRowDetailDisplayTree(sections, reordered);

    expect(result.map((s) => s.key)).toEqual(['testCaseData', 'execution']);
  });

  test('filters out hidden fields and reorders remaining', () => {
    const tree = buildRowDetailDisplayTree(sections);
    (tree[0] as ColDefGroup).children = [getChildren(tree[0])[1], { ...getChildren(tree[0])[0], hide: true }];

    const result = applyRowDetailDisplayTree(sections, tree);

    expect(result[0].rows.map((r) => r.fieldKey)).toEqual(['duration']);
  });

  test('drops sections whose fields are all hidden', () => {
    const tree = buildRowDetailDisplayTree(sections);
    (tree[0] as ColDefGroup).children = getChildren(tree[0]).map((c) => ({ ...c, hide: true }));

    const result = applyRowDetailDisplayTree(sections, tree);

    expect(result.map((s) => s.key)).toEqual(['testCaseData']);
  });

  test('ignores tree nodes without a matching section', () => {
    const tree = buildRowDetailDisplayTree(sections);
    tree.push({ headerName: 'Ghost', context: { panelName: 'ghost' }, hide: false, children: [] } as ColDef);

    const result = applyRowDetailDisplayTree(sections, tree);

    expect(result.map((s) => s.key)).toEqual(['execution', 'testCaseData']);
  });
});
