import { beforeEach, describe, expect, test, vi } from 'vitest';

import { CompareRunEdge, CompareRunSlot, CompareViewTab } from '../constants';
import {
  fetchCompareCandidateRuns,
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

const getRunsQueryMock = vi.fn();
const getTestSuiteMock = vi.fn();
const getDatasetTestSuitesMock = vi.fn();

vi.mock('@/src/app/[lang]/runs/actions', () => ({
  getRunsQuery: (...args: unknown[]) => getRunsQueryMock(...args),
}));

vi.mock('@/src/app/[lang]/test-suites/actions', () => ({
  getTestSuite: (...args: unknown[]) => getTestSuiteMock(...args),
}));

vi.mock('@/src/app/[lang]/datasets/actions', () => ({
  getDatasetTestSuites: (...args: unknown[]) => getDatasetTestSuitesMock(...args),
}));

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

describe('Runs Compare :: fetchCompareCandidateRuns', () => {
  beforeEach(() => {
    getRunsQueryMock.mockReset();
    getTestSuiteMock.mockReset();
    getDatasetTestSuitesMock.mockReset();
    getRunsQueryMock.mockImplementation((_page, _size, _sorts, filters: { column: string; value: string }[]) => {
      const suiteId = filters.find((filter) => filter.column === 'testSuiteId')?.value;
      return Promise.resolve({ content: [{ id: `run-of-${suiteId}`, testSuiteId: suiteId }] });
    });
  });

  test('lists the own suite first, then the other suites of the same dataset, each tagged with its suite name', async () => {
    getTestSuiteMock.mockResolvedValue({ response: { id: 'suite-1', name: 'One', datasetId: 'ds-1' } });
    getDatasetTestSuitesMock.mockResolvedValue({
      response: [{ id: 'suite-2', name: 'Two' }, { id: 'suite-1', name: 'One' }, { name: 'no id' }],
    });

    const runs = await fetchCompareCandidateRuns('suite-1');

    expect(runs.map(({ id, testSuiteName }) => [id, testSuiteName])).toEqual([
      ['run-of-suite-1', 'One'],
      ['run-of-suite-2', 'Two'],
    ]);
  });

  test('only requests completed runs of each suite', async () => {
    getTestSuiteMock.mockResolvedValue({ response: { id: 'suite-1', name: 'One' } });

    await fetchCompareCandidateRuns('suite-1');

    expect(getRunsQueryMock).toHaveBeenCalledWith(
      0,
      100,
      [],
      expect.arrayContaining([
        expect.objectContaining({ column: 'testSuiteId', value: 'suite-1' }),
        expect.objectContaining({ column: 'status', value: 'COMPLETED' }),
      ]),
    );
  });

  test('stays within the own suite when it has no dataset', async () => {
    getTestSuiteMock.mockResolvedValue({ response: { id: 'suite-1', name: 'One' } });

    const runs = await fetchCompareCandidateRuns('suite-1');

    expect(getDatasetTestSuitesMock).not.toHaveBeenCalled();
    expect(runs.map((run) => run.id)).toEqual(['run-of-suite-1']);
  });

  test('falls back to the own suite when the dataset lookup fails', async () => {
    getTestSuiteMock.mockResolvedValue({ response: { id: 'suite-1', name: 'One', datasetId: 'ds-1' } });
    getDatasetTestSuitesMock.mockRejectedValue(new Error('boom'));

    const runs = await fetchCompareCandidateRuns('suite-1');

    expect(runs.map(({ id, testSuiteName }) => [id, testSuiteName])).toEqual([['run-of-suite-1', 'One']]);
  });
});
