import { ColDef } from 'ag-grid-community';
import { describe, expect, test } from 'vitest';

import { CompareAnalyticsRow } from '@/src/components/Runs/View/models';
import {
  DEFAULT_COMPARE_DELTA_HEADER,
  EXECUTION_GROUP_HEADER,
  EXECUTION_STATUS_GROUP_HEADER,
  EXTRACTED_GROUP_HEADER,
} from '@/src/components/Runs/Compare/ExecutionResults/constants';
import { CompareColumnPanelContext } from '@/src/components/Runs/Compare/ExecutionResults/models';
import { getCompareColumnsCompare } from '@/src/components/Runs/Compare/ExecutionResults/utils/columns';
import {
  buildComparePanelColumnTree,
  flattenComparePanelColumnTree,
  preservePanelHideState,
} from '@/src/components/Runs/Compare/ExecutionResults/utils/panel-columns';

const runNames = { primary: 'Run #316', secondary: 'Run #315' };

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
    const panelTree = buildComparePanelColumnTree(getFlatDefs(), runNames);
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
  });

  test('buildComparePanelColumnTree nests execution status and metric groups', () => {
    const panelTree = buildComparePanelColumnTree(getFlatDefs(), runNames);
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
    const panelTree = buildComparePanelColumnTree(getFlatDefs(), runNames);
    const extractedGroup = panelTree.find((col) => col.headerName === EXTRACTED_GROUP_HEADER) as ColDef;
    const answerGroup = getChildren(extractedGroup).find((col) => col.headerName === 'answer') as ColDef;

    expect(getChildren(answerGroup)).toHaveLength(2);
    expect(getColId(getChildren(answerGroup)[0])).toBe('extracted_answer');
    expect(getColId(getChildren(answerGroup)[1])).toBe('cmp_extracted_answer');
  });

  test('flatten roundtrip preserves flat grid colIds and order', () => {
    const flatDefs = getFlatDefs();
    const panelTree = buildComparePanelColumnTree(flatDefs, runNames);
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

    expect(collectColIds(flattened)).toEqual(collectColIds(flatDefs.filter((col) => getColId(col) !== 'compare_action')));
  });

  test('preservePanelHideState copies hide flags by colId', () => {
    const flatDefs = getFlatDefs();
    const panelTree = buildComparePanelColumnTree(flatDefs, runNames);
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
    const hiddenPanelTree = buildComparePanelColumnTree(hiddenFlatDefs, runNames);
    const mergedPanelTree = preservePanelHideState(panelTree, hiddenPanelTree);

    const flattened = flattenComparePanelColumnTree(mergedPanelTree);
    const executionGroup = flattened.find((col) => col.headerName === EXECUTION_GROUP_HEADER) as ColDef;
    const httpCol = getChildren(executionGroup).find((col) => getColId(col) === 'http');

    expect(httpCol?.hide).toBe(true);
  });
});
