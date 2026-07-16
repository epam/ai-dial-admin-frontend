import { render, screen, waitFor } from '@testing-library/react';
import { FC, useCallback, useState } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import HeatMapTab from '@/src/components/Runs/Compare/HeatMap/HeatMapTab';
import { HeatMapColorDisplayMode } from '@/src/components/Runs/Compare/HeatMap/models';
import { HeatMapTabUiState } from '@/src/components/Runs/Compare/models';
import { createDefaultCompareViewTabState } from '@/src/components/Runs/Compare/use-compare-view-tab-state';

const getRunMock = vi.fn();
const getTestCaseRunResultsMock = vi.fn();

vi.mock('@/src/app/[lang]/runs/actions', () => ({
  getRun: (...args: unknown[]) => getRunMock(...args),
  getTestCaseRunResults: (...args: unknown[]) => getTestCaseRunResultsMock(...args),
}));

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: ({ rowData }: { rowData: { id: string; label: string; groupKey: string; rowType: string }[] }) => (
    <div role="table">
      {rowData.map((row) => (
        <div key={row.id}>{row.rowType === 'group' ? row.groupKey : row.label}</div>
      ))}
    </div>
  ),
}));

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    DialLoader: ({ size }: { size: number }) => <div aria-label={`loading-${size}`} />,
  };
});

const ControlledHeatMapTab: FC<{
  colorDisplayMode?: HeatMapColorDisplayMode;
  selectedMetricGroups?: Set<string>;
  initialState?: Partial<HeatMapTabUiState>;
  onAvailableMetricGroupsChange?: (groups: string[]) => void;
}> = ({
  colorDisplayMode = HeatMapColorDisplayMode.Absolute,
  selectedMetricGroups = new Set(['Accuracy']),
  initialState,
  onAvailableMetricGroupsChange = vi.fn(),
}) => {
  const [heatMapState, setState] = useState<HeatMapTabUiState>(() => ({
    ...createDefaultCompareViewTabState().heatMap,
    ...initialState,
  }));

  const setHeatMapState = useCallback((patch: Partial<HeatMapTabUiState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  return (
    <div className="w-[1200px] h-[600px] flex flex-col">
      <HeatMapTab
        primaryRunId="run-1"
        comparedRunId="run-sibling"
        primaryRunName="Run #316"
        comparedRunName="Run #317"
        colorDisplayMode={colorDisplayMode}
        onColorDisplayModeChange={vi.fn()}
        selectedMetricGroups={selectedMetricGroups}
        onAvailableMetricGroupsChange={onAvailableMetricGroupsChange}
        heatMapState={heatMapState}
        setHeatMapState={setHeatMapState}
      />
    </div>
  );
};

const renderHeatMapTab = (
  colorDisplayMode = HeatMapColorDisplayMode.Absolute,
  selectedMetricGroups = new Set(['Accuracy']),
  initialState?: Partial<HeatMapTabUiState>,
) =>
  render(
    <ControlledHeatMapTab
      colorDisplayMode={colorDisplayMode}
      selectedMetricGroups={selectedMetricGroups}
      initialState={initialState}
    />,
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
              Quality: { score: isPrimary ? 0.6 : 0.7 },
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

  test('renders delta color scale in delta mode', async () => {
    renderHeatMapTab(HeatMapColorDisplayMode.Delta);

    await waitFor(() => {
      expect(screen.queryByLabelText('loading-40')).not.toBeInTheDocument();
    });

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('-1')).toBeInTheDocument();
    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  test('shows only selected metric groups in the grid', async () => {
    renderHeatMapTab(HeatMapColorDisplayMode.Absolute, new Set(['Accuracy']));

    await waitFor(() => {
      expect(screen.getByText('Accuracy')).toBeInTheDocument();
    });

    expect(screen.queryByText('Quality')).not.toBeInTheDocument();
  });

  test('keeps collapsed groups when switching color display mode', async () => {
    const content = [
      {
        id: 'result-1',
        testCaseId: 'tc-1',
        responseStatusCode: 200,
        runIndex: 0,
        executionStatus: 'SUCCESS',
        testCaseName: 'Test Case 1',
        metricValues: {
          Accuracy: { precision: 0.5 },
          Quality: { score: 0.6 },
        },
      },
    ];
    const comparedContent = [
      {
        ...content[0],
        id: 'result-2',
        metricValues: {
          Accuracy: { precision: 0.8 },
          Quality: { score: 0.7 },
        },
      },
    ];

    const ModeSwitchHarness: FC<{ colorDisplayMode: HeatMapColorDisplayMode }> = ({ colorDisplayMode }) => {
      const [heatMapState, setState] = useState<HeatMapTabUiState>(() => ({
        ...createDefaultCompareViewTabState().heatMap,
        results: content,
        comparedResults: comparedContent,
        expandedGroups: new Set(['Accuracy']),
        areExpandedGroupsInitialized: true,
      }));

      const setHeatMapState = useCallback((patch: Partial<HeatMapTabUiState>) => {
        setState((prev) => ({ ...prev, ...patch }));
      }, []);

      return (
        <div className="w-[1200px] h-[600px] flex flex-col">
          <HeatMapTab
            primaryRunId="run-1"
            comparedRunId="run-sibling"
            primaryRunName="Run #316"
            comparedRunName="Run #317"
            colorDisplayMode={colorDisplayMode}
            onColorDisplayModeChange={vi.fn()}
            selectedMetricGroups={new Set(['Accuracy', 'Quality'])}
            onAvailableMetricGroupsChange={vi.fn()}
            heatMapState={heatMapState}
            setHeatMapState={setHeatMapState}
          />
        </div>
      );
    };

    const { rerender } = render(<ModeSwitchHarness colorDisplayMode={HeatMapColorDisplayMode.Absolute} />);

    await waitFor(() => {
      expect(screen.getByText('Accuracy')).toBeInTheDocument();
    });

    expect(screen.getAllByText('precision').length).toBeGreaterThan(0);
    expect(screen.queryByText('score')).not.toBeInTheDocument();

    rerender(<ModeSwitchHarness colorDisplayMode={HeatMapColorDisplayMode.Delta} />);

    await waitFor(() => {
      expect(screen.getByText('Accuracy')).toBeInTheDocument();
    });

    expect(screen.getAllByText('precision').length).toBeGreaterThan(0);
    expect(screen.queryByText('score')).not.toBeInTheDocument();
  });
});
