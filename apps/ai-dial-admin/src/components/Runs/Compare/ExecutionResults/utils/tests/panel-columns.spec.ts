import { ColDef, ColGroupDef } from 'ag-grid-community';
import { describe, expect, test } from 'vitest';

import EllipsisHeaderGroup from '@/src/components/Grid/HeaderComponents/EllipsisHeaderGroup';
import { CompareAnalyticsRow } from '@/src/components/Runs/View/models';
import {
  DEFAULT_COMPARE_DELTA_HEADER,
  EXECUTION_GROUP_HEADER,
  EXECUTION_STATUS_GROUP_HEADER,
  EXTRACTED_GROUP_HEADER,
} from '@/src/components/Runs/Compare/ExecutionResults/constants';
import { CompareColumnPanelContext } from '@/src/components/Runs/Compare/ExecutionResults/models';
import { getCompareRuns } from '@/src/components/Runs/Compare/utils';
import { getCompareColumnsCompare } from '@/src/components/Runs/Compare/ExecutionResults/utils/columns';
import {
  buildComparePanelColumnTree,
  columnStateFromComparePanelTree,
  flattenComparePanelColumnTree,
  orderComparePanelTree,
  preserveFlatColDefHideState,
  preservePanelHideState,
} from '@/src/components/Runs/Compare/ExecutionResults/utils/panel-columns';

const runNames = { primary: 'Run #316', secondary: 'Run #315' };
const primaryRun = { id: 'run-316', name: runNames.primary };
const comparedRun = { id: 'run-315', name: runNames.secondary };
const runs = getCompareRuns(primaryRun, comparedRun);
const reversedRuns = getCompareRuns(primaryRun, comparedRun).reverse();

const makeRow = (overrides: Partial<CompareAnalyticsRow> = {}): CompareAnalyticsRow => ({
  responseStatusCode: 200,
  runIndex: 0,
  _compared: null,
  ...overrides,
});

const makeResult = (overrides: Partial<CompareAnalyticsRow> = {}): CompareAnalyticsRow => ({
  responseStatusCode: 200,
  runIndex: 1,
  ...overrides,
});

const getFlatDefs = () =>
  getCompareColumnsCompare([
    makeRow({
      metricValues: { 'Overall Accuracy': { Precision: 0.8 } },
      extractedColumns: { answer: 'yes' },
      _compared: makeResult({
        metricValues: { 'Overall Accuracy': { Precision: 0.5 } },
        extractedColumns: { answer: 'no' },
      }),
    }),
  ]) as ColDef[];

const getChildren = (node: ColDef): ColDef[] =>
  'children' in node && node.children ? (node.children as ColDef[]) : [];

const getColId = (col: ColDef): string | undefined => (col.colId ?? col.field) as string | undefined;

describe('panel-columns', () => {
  test('buildComparePanelColumnTree nests execution fields under run leaves', () => {
    const panelTree = buildComparePanelColumnTree(getFlatDefs(), runs);
    const executionGroup = panelTree.find((col) => col.headerName === EXECUTION_GROUP_HEADER) as ColDef;
    const httpGroup = getChildren(executionGroup).find((col) => col.headerName === 'HTTP') as ColDef;
    const httpLeaves = getChildren(httpGroup);

    expect(httpLeaves).toHaveLength(2);
    expect((httpLeaves[0].context as CompareColumnPanelContext).panelName).toBe('Run #316');
    expect((httpLeaves[0].context as CompareColumnPanelContext).panelRunIndex).toBe('1');
    expect(getColId(httpLeaves[0])).toBe('http');
    expect((httpLeaves[1].context as CompareColumnPanelContext).panelName).toBe('Run #315');
    expect((httpLeaves[1].context as CompareColumnPanelContext).panelRunIndex).toBe('2');
    expect(getColId(httpLeaves[1])).toBe('cmp_http');
    expect(httpLeaves.every((leaf) => leaf.hide === true)).toBe(true);
  });

  test('buildComparePanelColumnTree hides execution leaves by default', () => {
    const panelTree = buildComparePanelColumnTree(getFlatDefs(), runs);
    const executionGroup = panelTree.find((col) => col.headerName === EXECUTION_GROUP_HEADER) as ColDef;
    const executionLeaves = getChildren(executionGroup).flatMap((fieldGroup) => getChildren(fieldGroup));

    expect(executionLeaves.every((leaf) => leaf.hide === true)).toBe(true);
  });

  test('buildComparePanelColumnTree exposes Request and Turn as execution field groups', () => {
    const panelTree = buildComparePanelColumnTree(getFlatDefs(), runs);
    const executionGroup = panelTree.find((col) => col.headerName === EXECUTION_GROUP_HEADER) as ColDef;
    const fieldGroups = getChildren(executionGroup);

    expect(fieldGroups.map((group) => group.headerName)).toEqual([
      '# Run number',
      'Request',
      'Turn',
      'HTTP',
      'Duration',
    ]);

    const requestLeaves = getChildren(fieldGroups[1]);
    const turnLeaves = getChildren(fieldGroups[2]);

    expect(requestLeaves.map(getColId)).toEqual(['requestIndex', 'cmp_requestIndex']);
    expect(turnLeaves.map(getColId)).toEqual(['turnIndex', 'cmp_turnIndex']);
  });

  test('buildComparePanelColumnTree nests execution status and metric groups', () => {
    const panelTree = buildComparePanelColumnTree(getFlatDefs(), runs);
    const statusGroup = panelTree[0] as ColDef;
    const metricGroup = panelTree.find((col) => col.headerName === 'Overall Accuracy') as ColDef;
    const precisionGroup = getChildren(metricGroup).find((col) => col.headerName === 'Precision') as ColDef;
    const precisionLeaves = getChildren(precisionGroup);

    expect((statusGroup.context as CompareColumnPanelContext).panelName).toBe(EXECUTION_STATUS_GROUP_HEADER);
    expect(getChildren(statusGroup)).toHaveLength(2);
    expect(getChildren(precisionGroup)).toHaveLength(3);
    expect((precisionLeaves[2].context as CompareColumnPanelContext).panelName).toBe(DEFAULT_COMPARE_DELTA_HEADER);
    expect((precisionLeaves[2].context as CompareColumnPanelContext).panelRunIndex).toBeUndefined();
  });

  test('buildComparePanelColumnTree nests extracted fields under run leaves', () => {
    const panelTree = buildComparePanelColumnTree(getFlatDefs(), runs);
    const extractedGroup = panelTree.find((col) => col.headerName === EXTRACTED_GROUP_HEADER) as ColDef;
    const answerGroup = getChildren(extractedGroup).find((col) => col.headerName === 'answer') as ColDef;

    expect(getChildren(answerGroup)).toHaveLength(2);
    expect(getColId(getChildren(answerGroup)[0])).toBe('extracted_answer');
    expect(getColId(getChildren(answerGroup)[1])).toBe('cmp_extracted_answer');
  });

  test('flatten roundtrip preserves flat grid colIds and order', () => {
    const flatDefs = getFlatDefs();
    const panelTree = buildComparePanelColumnTree(flatDefs, runs);
    const flattened = flattenComparePanelColumnTree(panelTree);

    const collectColIds = (cols: ColDef[]): string[] =>
      cols.flatMap((col) => {
        const children = getChildren(col);
        if (children.length === 0) {
          const colId = getColId(col);
          return colId ? [colId] : [];
        }
        return collectColIds(children);
      });

    expect(collectColIds(flattened)).toEqual(collectColIds(flatDefs));
  });

  test('flatten keeps the metric level so the grid stays three levels deep', () => {
    const flatDefs = getFlatDefs();
    const flattened = flattenComparePanelColumnTree(buildComparePanelColumnTree(flatDefs, runs));
    const metricGroup = flattened.find((col) => col.headerName === 'Overall Accuracy') as ColDef;
    const precisionGroup = getChildren(metricGroup)[0];

    expect(precisionGroup.headerName).toBe('Precision');
    expect((precisionGroup as ColGroupDef).headerGroupComponent).toBe(EllipsisHeaderGroup);
    expect(getChildren(precisionGroup).map(getColId)).toEqual([
      'Overall Accuracy_Precision',
      'cmp_Overall Accuracy_Precision',
      'delta_Overall Accuracy_Precision',
    ]);
    expect(getChildren(precisionGroup).every((leaf) => leaf.context == null)).toBe(true);
  });

  test('flatten keeps the extracted field level so the grid stays three levels deep', () => {
    const flattened = flattenComparePanelColumnTree(buildComparePanelColumnTree(getFlatDefs(), runs));
    const extractedGroup = flattened.find((col) => col.headerName === EXTRACTED_GROUP_HEADER) as ColDef;
    const answerGroup = getChildren(extractedGroup)[0];

    expect(answerGroup.headerName).toBe('answer');
    expect(getChildren(answerGroup).map(getColId)).toEqual(['extracted_answer', 'cmp_extracted_answer']);
    expect(getChildren(answerGroup).every((leaf) => leaf.context == null)).toBe(true);
  });

  test('preservePanelHideState copies hide flags by colId', () => {
    const flatDefs = getFlatDefs();
    const panelTree = buildComparePanelColumnTree(flatDefs, runs);
    const hiddenFlatDefs = flatDefs.map((col) => {
      const children = getChildren(col);
      if (children.length === 0) {
        return col;
      }

      return {
        ...col,
        children: children.map((child) => (getColId(child) === 'http' ? { ...child, hide: true } : child)),
      };
    });
    const hiddenPanelTree = buildComparePanelColumnTree(hiddenFlatDefs, runs);
    const mergedPanelTree = preservePanelHideState(panelTree, hiddenPanelTree);

    const flattened = flattenComparePanelColumnTree(mergedPanelTree);
    const executionGroup = flattened.find((col) => col.headerName === EXECUTION_GROUP_HEADER) as ColDef;
    const httpCol = getChildren(executionGroup).find((col) => getColId(col) === 'http');

    expect(httpCol?.hide).toBe(true);
  });

  test('preserveFlatColDefHideState copies hide flags from previous flat defs', () => {
    const flatDefs = getFlatDefs();
    const visibleFlatDefs = preserveFlatColDefHideState(
      flatDefs,
      flatDefs.map((col) => {
        const children = getChildren(col);
        if (children.length === 0) {
          return col;
        }

        return {
          ...col,
          children: children.map((child) =>
            [
              'runIndex',
              'cmp_runIndex',
              'requestIndex',
              'cmp_requestIndex',
              'turnIndex',
              'cmp_turnIndex',
              'http',
              'cmp_http',
              'duration',
              'cmp_duration',
            ].includes(getColId(child) ?? '')
              ? { ...child, hide: false }
              : child,
          ),
        };
      }),
    );

    const executionGroup = visibleFlatDefs.find((col) => col.headerName === EXECUTION_GROUP_HEADER) as ColDef;
    const executionLeaves = getChildren(executionGroup);

    expect(executionLeaves.every((leaf) => leaf.hide !== true)).toBe(true);
  });
});

describe('Runs Compare :: buildComparePanelColumnTree run order', () => {
  const getLeafPanelNames = (node: ColDef): (string | undefined)[] =>
    ((node as ColGroupDef).children as ColDef[]).map((leaf) => (leaf.context as CompareColumnPanelContext)?.panelName);

  test('lists the compared run before the primary run in every pair, keeping delta last', () => {
    const tree = buildComparePanelColumnTree(getFlatDefs(), reversedRuns);
    const metricGroup = tree.find((node) =>
      ((node as ColGroupDef).children as ColGroupDef[])?.some((child) => child.headerName === 'Precision'),
    ) as ColGroupDef;
    const metric = (metricGroup.children as ColGroupDef[])[0];
    const status = tree.find(
      (node) => (node.context as CompareColumnPanelContext | undefined)?.panelName === EXECUTION_STATUS_GROUP_HEADER,
    ) as ColDef;

    expect(getLeafPanelNames(metric)).toEqual([runNames.secondary, runNames.primary, DEFAULT_COMPARE_DELTA_HEADER]);
    expect(getLeafPanelNames(status)).toEqual([runNames.secondary, runNames.primary]);
  });

  test('flattening a reversed tree keeps the compared column first in the grid defs', () => {
    const tree = buildComparePanelColumnTree(getFlatDefs(), reversedRuns);
    const flat = flattenComparePanelColumnTree(tree);
    const status = flat.find((node) => (node as ColGroupDef).children?.some((c) => (c as ColDef).colId === 'status'));

    expect(((status as ColGroupDef).children as ColDef[]).map((leaf) => leaf.colId)).toEqual(['cmp_status', 'status']);
  });

  test('orderComparePanelTree keeps one metric group while its fields are adjacent', () => {
    const tree = buildComparePanelColumnTree(getSetComparisonDefs(), runs);

    const rows = orderComparePanelTree(tree, toState(leafIds(tree)));

    expect(rows.map(rowSummary)).toContain('Set Comparison[precision|recall]');
  });

  test('orderComparePanelTree splits a metric group around a block placed between its fields', () => {
    const tree = buildComparePanelColumnTree(getSetComparisonDefs(), runs);

    const rows = orderComparePanelTree(tree, toState(recallAfterExtracted(tree)));
    const summaries = rows.map(rowSummary);
    const precisionIndex = summaries.indexOf('Set Comparison[precision]');
    const extractedIndex = summaries.indexOf('Extracted[intents_array]');
    const recallIndex = summaries.indexOf('Set Comparison[recall]');

    expect(precisionIndex).toBeGreaterThan(-1);
    expect(precisionIndex).toBeLessThan(extractedIndex);
    expect(extractedIndex).toBeLessThan(recallIndex);
    expect(rows[precisionIndex].headerName).toBe('Set Comparison');
    expect(panelKey(rows[precisionIndex])).not.toBe(panelKey(rows[recallIndex]));
  });

  test('a panel move that puts the split pieces side by side joins them back', () => {
    const initial = buildComparePanelColumnTree(getSetComparisonDefs(), runs);
    const split = orderComparePanelTree(initial, toState(recallAfterExtracted(initial)));
    const recallIndex = split.findIndex((row) => rowSummary(row) === 'Set Comparison[recall]');
    const extractedIndex = split.findIndex((row) => rowSummary(row) === 'Extracted[intents_array]');
    const moved = [...split];
    const [recall] = moved.splice(recallIndex, 1);
    moved.splice(extractedIndex, 0, recall);

    const nextState = columnStateFromComparePanelTree(
      moved,
      leafIds(split).map((colId) => ({ colId, hide: false })),
    );
    const rows = orderComparePanelTree(moved, nextState);

    expect(rows.map(rowSummary)).toContain('Set Comparison[precision|recall]');
    expect(panelKey(rows.find((row) => row.headerName === 'Set Comparison') as ColDef)).toBeUndefined();
  });

  test('flattening a split panel tree keeps separate metric groups for the grid', () => {
    const initial = buildComparePanelColumnTree(getSetComparisonDefs(), runs);
    const split = orderComparePanelTree(initial, toState(recallAfterExtracted(initial)));

    const flat = flattenComparePanelColumnTree(split);
    const headers = flat.map((node) => node.headerName);

    expect(headers.filter((name) => name === 'Set Comparison')).toHaveLength(2);
    expect(headers.indexOf('Set Comparison')).toBeLessThan(headers.indexOf(EXTRACTED_GROUP_HEADER));
    expect(headers.lastIndexOf('Set Comparison')).toBeGreaterThan(headers.indexOf(EXTRACTED_GROUP_HEADER));
  });
});

const getSetComparisonDefs = () =>
  getCompareColumnsCompare([
    makeRow({
      metricValues: { 'Set Comparison': { precision: 0.8, recall: 0.4 } },
      extractedColumns: { intents_array: 'a' },
      _compared: makeResult({
        metricValues: { 'Set Comparison': { precision: 0.5, recall: 0.2 } },
        extractedColumns: { intents_array: 'b' },
      }),
    }),
  ]) as ColDef[];

const toState = (colIds: string[]) => colIds.map((colId) => ({ colId }));

const recallAfterExtracted = (tree: ColDef[]): string[] => {
  const recallIds = leafIdsUnder(tree, 'recall');
  const extractedIds = leafIdsUnder(tree, 'intents_array');
  const withoutRecall = leafIds(tree).filter((colId) => !recallIds.includes(colId));
  const extractedEnd = withoutRecall.findLastIndex((colId) => extractedIds.includes(colId));

  return [...withoutRecall.slice(0, extractedEnd + 1), ...recallIds, ...withoutRecall.slice(extractedEnd + 1)];
};

const rowSummary = (row: ColDef): string =>
  `${row.headerName}[${getChildren(row)
    .map((child) => child.headerName)
    .join('|')}]`;

const panelKey = (row: ColDef): string | undefined => (row.context as CompareColumnPanelContext | undefined)?.panelKey;

const leafIds = (nodes: ColDef[]): string[] =>
  nodes.flatMap((node) => {
    const children = getChildren(node);
    return children.length === 0 ? [getColId(node) ?? ''] : leafIds(children);
  });

const leafIdsUnder = (nodes: ColDef[], headerName: string): string[] =>
  nodes.flatMap((node) => {
    if (node.headerName === headerName) {
      return leafIds([node]);
    }
    return leafIdsUnder(getChildren(node), headerName);
  });
