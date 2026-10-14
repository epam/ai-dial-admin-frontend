import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FC } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useCompareRunLauncher } from '../useCompareRunLauncher';

const getRunsMock = vi.fn();
const getTestSuiteMock = vi.fn();
const getDatasetTestSuitesMock = vi.fn();

vi.mock('@/src/app/[lang]/runs/actions', () => ({
  getRuns: (...args: unknown[]) => getRunsMock(...args),
}));

vi.mock('@/src/app/[lang]/test-suites/actions', () => ({
  getTestSuite: (...args: unknown[]) => getTestSuiteMock(...args),
}));

vi.mock('@/src/app/[lang]/datasets/actions', () => ({
  getDatasetTestSuites: (...args: unknown[]) => getDatasetTestSuitesMock(...args),
}));

vi.mock('../SelectCompareRunModal', () => ({
  default: ({
    runs,
    onApply,
    onClose,
  }: {
    runs: { id: string; testSuiteName?: string }[];
    onApply: (id: string) => void;
    onClose: () => void;
  }) => (
    <div>
      <ul>
        {runs.map((run) => (
          <li key={run.id}>{`${run.id}:${run.testSuiteName ?? ''}`}</li>
        ))}
      </ul>
      <button type="button" onClick={() => onApply('run-sibling')}>
        apply-compare
      </button>
      <button type="button" onClick={onClose}>
        close-compare
      </button>
    </div>
  ),
}));

const TestHarness: FC = () => {
  const { openCompareRun, compareRunModal } = useCompareRunLauncher();

  return (
    <>
      <button
        type="button"
        onClick={() =>
          openCompareRun({
            id: 'run-1',
            testSuiteId: 'suite-1',
            testRunName: 'Run #316',
          })
        }
      >
        Compare
      </button>
      {compareRunModal}
    </>
  );
};

describe('useCompareRunLauncher', () => {
  beforeEach(() => {
    getRunsMock.mockReset();
    getTestSuiteMock.mockReset();
    getDatasetTestSuitesMock.mockReset();
    getTestSuiteMock.mockResolvedValue({ response: { id: 'suite-1', name: 'Suite One' } });
    vi.spyOn(window, 'open').mockImplementation(() => null);
    getRunsMock.mockResolvedValue({
      content: [
        { id: 'run-1', testSuiteId: 'suite-1', status: 'COMPLETED' },
        { id: 'run-sibling', testSuiteId: 'suite-1', testRunName: 'Run #317', status: 'COMPLETED' },
      ],
    });
  });

  test('opens select run modal on openCompareRun', async () => {
    const user = userEvent.setup();
    render(<TestHarness />);

    await user.click(screen.getByRole('button', { name: 'Compare' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'apply-compare' })).toBeInTheDocument();
    });
  });

  test('opens compare page in new tab on confirm', async () => {
    const user = userEvent.setup();
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(<TestHarness />);

    await user.click(screen.getByRole('button', { name: 'Compare' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'apply-compare' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'apply-compare' }));

    expect(windowOpenSpy).toHaveBeenCalledWith('/runs/compare?runs=run-1,run-sibling', '_blank');
  });

  test('offers completed runs of other suites on the same dataset, labelled with their suite', async () => {
    const user = userEvent.setup();
    getTestSuiteMock.mockResolvedValue({ response: { id: 'suite-1', name: 'Suite One', datasetId: 'dataset-1' } });
    getDatasetTestSuitesMock.mockResolvedValue({
      response: [
        { id: 'suite-1', name: 'Suite One' },
        { id: 'suite-2', name: 'Suite Two' },
      ],
    });
    getRunsMock.mockImplementation((_page, _size, _sorts, filters: { column: string; value: string }[]) => {
      const suiteId = filters.find((filter) => filter.column === 'testSuiteId')?.value;
      return Promise.resolve({
        content:
          suiteId === 'suite-1'
            ? [
                { id: 'run-1', testSuiteId: 'suite-1' },
                { id: 'run-sibling', testSuiteId: 'suite-1' },
              ]
            : [{ id: 'run-other', testSuiteId: 'suite-2' }],
      });
    });

    render(<TestHarness />);
    await user.click(screen.getByRole('button', { name: 'Compare' }));

    await waitFor(() => {
      expect(screen.getByText('run-other:Suite Two')).toBeInTheDocument();
    });
    expect(screen.getByText('run-sibling:Suite One')).toBeInTheDocument();
    expect(screen.queryByText('run-1:Suite One')).not.toBeInTheDocument();
    expect(getDatasetTestSuitesMock).toHaveBeenCalledWith('dataset-1');
  });

  test('offers only the own suite runs when the suite has no dataset', async () => {
    const user = userEvent.setup();

    render(<TestHarness />);
    await user.click(screen.getByRole('button', { name: 'Compare' }));

    await waitFor(() => {
      expect(screen.getByText('run-sibling:Suite One')).toBeInTheDocument();
    });
    expect(getDatasetTestSuitesMock).not.toHaveBeenCalled();
    expect(getRunsMock).toHaveBeenCalledTimes(1);
  });
});
