import { describe, expect, test } from 'vitest';

import { CompareRunSlot, CompareViewTab } from '../constants';
import { getCompareRunsPath, getCompareRunsUrn, getCompareViewTabs, getSelectableCompareRuns } from '../utils';
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
  test('disables summary and metrics tabs when runsCompareEnabled is false', () => {
    const tabs = getCompareViewTabs(t, false);

    expect(tabs).toEqual([
      { id: CompareViewTab.SummaryOverview, label: RunsI18nKey.RunCompareTabSummaryOverview, disabled: true },
      { id: CompareViewTab.MetricsDetails, label: RunsI18nKey.RunCompareTabMetricsDetails, disabled: true },
      { id: CompareViewTab.ExecutionResults, label: RunsI18nKey.RunCompareTabExecutionResults },
    ]);
  });

  test('enables all tabs when runsCompareEnabled is true', () => {
    const tabs = getCompareViewTabs(t, true);

    expect(tabs).toEqual([
      { id: CompareViewTab.SummaryOverview, label: RunsI18nKey.RunCompareTabSummaryOverview, disabled: false },
      { id: CompareViewTab.MetricsDetails, label: RunsI18nKey.RunCompareTabMetricsDetails, disabled: false },
      { id: CompareViewTab.ExecutionResults, label: RunsI18nKey.RunCompareTabExecutionResults },
    ]);
  });
});
