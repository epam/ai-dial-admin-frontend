import { describe, expect, test } from 'vitest';

import { CompareRunEdge, CompareRunSlot, CompareViewTab } from '../constants';
import {
  getCompareRunsPath,
  getCompareRunsUrn,
  getCompareViewTabs,
  getSelectableCompareRuns,
  getCompareRowResult,
  getCompareRunColId,
  getCompareRunEdge,
  getCompareRuns,
} from '../utils';
import { RunsI18nKey } from '@/src/constants/i18n';

describe('Runs Compare :: getSelectableCompareRuns', () => {
  const suiteRuns = [
    { id: 'run-1', testSuiteId: 'suite-1' },
    { id: 'run-2', testSuiteId: 'suite-1' },
    { id: 'run-3', testSuiteId: 'suite-1' },
  ] as const;

  test('excludes compared run when selecting primary run', () => {
    const runs = getSelectableCompareRuns([...suiteRuns], CompareRunSlot.Primary, 'run-1', 'run-2');
    expect(runs.map((run) => run.id)).toEqual(['run-1', 'run-3']);
  });

  test('excludes primary run when selecting secondary run', () => {
    const runs = getSelectableCompareRuns([...suiteRuns], CompareRunSlot.Secondary, 'run-1', 'run-2');
    expect(runs.map((run) => run.id)).toEqual(['run-2', 'run-3']);
  });
});

describe('Runs Compare :: getCompareRunsPath', () => {
  test('returns compare path with encoded run ids', () => {
    expect(getCompareRunsPath('run-1', 'run-2')).toBe('compare?runs=run-1,run-2');
  });
});

describe('Runs Compare :: getCompareRunsUrn', () => {
  test('returns full compare url', () => {
    expect(getCompareRunsUrn('run-1', 'run-2')).toBe('/runs/compare?runs=run-1,run-2');
  });
});

const t = (key: string) => key;

describe('Runs Compare :: getCompareViewTabs', () => {
  test('returns summary overview, heat map, and execution results tabs', () => {
    const tabs = getCompareViewTabs(t);

    expect(tabs).toEqual([
      { id: CompareViewTab.SummaryOverview, label: RunsI18nKey.RunCompareTabSummaryOverview },
      { id: CompareViewTab.HeatMap, label: RunsI18nKey.RunCompareTabHeatMap },
      { id: CompareViewTab.ExecutionResults, label: RunsI18nKey.RunCompareTabExecutionResults },
    ]);
  });
});

describe('Runs Compare :: getCompareRuns', () => {
  const primary = { id: 'run-1', name: 'Run #1' };
  const compared = { id: 'run-2', name: 'Run #2' };

  test('lists the baseline first by default', () => {
    expect(getCompareRuns(primary, compared)).toEqual([
      { ...primary, slot: CompareRunSlot.Primary, index: '1', isBaseline: true },
      { ...compared, slot: CompareRunSlot.Secondary, index: '2', isBaseline: false },
    ]);
  });

  test('flipping only reverses the order: the primary run stays the baseline and keeps its index', () => {
    const runs = getCompareRuns(primary, compared, true);

    expect(runs.map((run) => run.id)).toEqual(['run-2', 'run-1']);
    expect(runs.map((run) => run.isBaseline)).toEqual([false, true]);
    expect(runs.map((run) => run.index)).toEqual(['2', '1']);
  });
});

describe('Runs Compare :: getCompareRowResult / getCompareRunColId / getCompareRunEdge', () => {
  test('resolves the result a row holds for each slot', () => {
    const compared = { id: 'cmp' };
    const row = { id: 'primary', _compared: compared } as never;

    expect(getCompareRowResult(row, CompareRunSlot.Primary)).toBe(row);
    expect(getCompareRowResult(row, CompareRunSlot.Secondary)).toBe(compared);
  });

  test('prefixes secondary column ids only', () => {
    expect(getCompareRunColId(CompareRunSlot.Primary, 'status')).toBe('status');
    expect(getCompareRunColId(CompareRunSlot.Secondary, 'status')).toBe('cmp_status');
  });

  test('the first position is the start of the pair, later ones the end', () => {
    expect(getCompareRunEdge(0)).toBe(CompareRunEdge.Start);
    expect(getCompareRunEdge(1)).toBe(CompareRunEdge.End);
  });
});
