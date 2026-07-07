import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import HeatMapTab from '@/src/components/Runs/Compare/HeatMap/HeatMapTab';
import { HeatMapColorDisplayMode } from '@/src/components/Runs/Compare/HeatMap/models';

const getRunMock = vi.fn();
const getTestCaseRunResultsMock = vi.fn();

vi.mock('@/src/app/[lang]/runs/actions', () => ({
  getRun: (...args: unknown[]) => getRunMock(...args),
  getTestCaseRunResults: (...args: unknown[]) => getTestCaseRunResultsMock(...args),
}));

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    DialLoader: ({ size }: { size: number }) => <div aria-label={`loading-${size}`} />,
  };
});

const renderHeatMapTab = () =>
  render(
    <div className="w-[1200px] h-[600px] flex flex-col">
      <HeatMapTab
        primaryRunId="run-1"
        comparedRunId="run-sibling"
        colorDisplayMode={HeatMapColorDisplayMode.Absolute}
        onColorDisplayModeChange={vi.fn()}
      />
    </div>,
  );

describe('HeatMapTab', () => {
  beforeEach(() => {
    getRunMock.mockReset();
    getTestCaseRunResultsMock.mockReset();
    getRunMock.mockImplementation((id: string) =>
      Promise.resolve({
        id,
        testSuiteId: 'suite-1',
        testRunName: id === 'run-1' ? 'Run #316' : 'Run #317',
      }),
    );
    getTestCaseRunResultsMock.mockImplementation((filters: { column: string; value: string }[]) => {
      const runId = filters.find((filter) => filter.column === 'runId')?.value;
      const isPrimary = runId === 'run-1';
      return Promise.resolve({
        content: [
          {
            id: isPrimary ? 'result-1' : 'result-2',
            testCaseId: 'tc-1',
            responseStatusCode: 200,
            runIndex: 0,
            executionStatus: 'SUCCESS',
            testCaseName: 'Test Case 1',
            metricValues: {
              Accuracy: { precision: isPrimary ? 0.5 : 0.8 },
            },
          },
        ],
      });
    });
  });

  test('renders grid and compact color scale after data loads', async () => {
    renderHeatMapTab();

    await waitFor(() => {
      expect(screen.queryByLabelText('loading-40')).not.toBeInTheDocument();
    });

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });
});
