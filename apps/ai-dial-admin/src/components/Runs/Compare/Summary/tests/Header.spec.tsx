import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { getCompareRuns } from '../../utils';
import Header from '../Header';
import { RunsI18nKey } from '@/src/constants/i18n';
import { Run } from '@/src/models/evaluation/run';
import { TestSuite } from '@/src/models/evaluation/test-suite';

vi.mock('@/src/hooks/use-local-date-time-string', () => ({
  useLocalDateTimeString: () => undefined,
}));

vi.mock('@/src/components/Runs/Summary/DeploymentExternalLink', () => ({ default: () => null }));

const RUNS = getCompareRuns({ id: 'run-1', name: 'Run #1' }, { id: 'run-2', name: 'Run #2' });

const renderHeader = (primary: Partial<Run>, compared: Partial<Run>, suites: [TestSuite | null, TestSuite | null]) =>
  render(
    <Header
      primaryRun={{ id: 'run-1', ...primary }}
      comparedRun={{ id: 'run-2', ...compared }}
      runs={RUNS}
      primaryTestSuite={suites[0]}
      comparedTestSuite={suites[1]}
    />,
  );

describe('Compare Summary :: Header test suite', () => {
  test('shows a single test suite when both runs belong to it', () => {
    renderHeader({ testSuiteId: 'suite-1' }, { testSuiteId: 'suite-1' }, [
      { id: 'suite-1', name: 'Suite One' },
      { id: 'suite-1', name: 'Suite One' },
    ]);

    expect(screen.getAllByText('Suite One')).toHaveLength(1);
    expect(screen.getByText(RunsI18nKey.TestSuite)).toBeInTheDocument();
  });

  test('shows the test suite of each run when the runs belong to different suites', () => {
    renderHeader({ testSuiteId: 'suite-1' }, { testSuiteId: 'suite-2' }, [
      { id: 'suite-1', name: 'Suite One' },
      { id: 'suite-2', name: 'Suite Two' },
    ]);

    expect(screen.getByText('Suite One')).toBeInTheDocument();
    expect(screen.getByText('Suite Two')).toBeInTheDocument();
    expect(screen.getByText('Run #1')).toBeInTheDocument();
    expect(screen.getByText('Run #2')).toBeInTheDocument();
  });

  test('falls back to the suite id while the suite is not loaded', () => {
    renderHeader({ testSuiteId: 'suite-1' }, { testSuiteId: 'suite-2' }, [null, null]);

    expect(screen.getByText('suite-1')).toBeInTheDocument();
    expect(screen.getByText('suite-2')).toBeInTheDocument();
  });
});
