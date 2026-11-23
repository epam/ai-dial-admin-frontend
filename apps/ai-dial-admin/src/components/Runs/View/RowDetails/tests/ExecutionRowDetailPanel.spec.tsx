import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentProps, useState } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getTestCaseRunResultDetails } from '@/src/app/[lang]/runs/actions';
import { SidebarPosition } from '@/src/components/Common/Sidebar/models';
import { RunsI18nKey } from '@/src/constants/i18n';
import { RowDetailSection } from '@/src/components/Runs/Details/RowDetails/models';
import { AnalyticsResult, ExtractionResultStatus } from '@/src/models/evaluation/run';
import ExecutionRowDetailPanel from '../ExecutionRowDetailPanel';

vi.mock('@/src/app/[lang]/runs/actions', () => ({
  getTestCaseRunResultDetails: vi.fn(),
}));

vi.mock('@/src/components/Runs/View/RowDetails/ExecutionRowDetailPivotTable', () => ({
  default: ({ sections }: { sections: RowDetailSection[] }) => (
    <div role="region" aria-label="pivot table">
      <output aria-label="overall score">
        {sections.flatMap((section) => section.rows).find((row) => row.fieldKey === 'overallScore')?.primaryRaw ??
          'none'}
      </output>
      <output aria-label="score threshold">
        {String(
          sections.flatMap((section) => section.rows).find((row) => row.fieldKey === 'overallScore')?.primaryThreshold,
        )}
      </output>
    </div>
  ),
}));

vi.mock('@/src/components/Runs/View/RowDetails/ExecutionRowDetailTable', () => ({
  default: function TableStub() {
    const [value, setValue] = useState('');
    return (
      <div role="region" aria-label="field table">
        <input aria-label="table local state" value={value} onChange={(event) => setValue(event.target.value)} />
      </div>
    );
  },
}));

vi.mock('@/src/components/Runs/View/RowDetails/ExecutionRowDetailDisplayPanel', () => ({
  default: ({ onClose }: { onClose: () => void }) => (
    <div role="dialog" aria-label="display panel">
      <button onClick={onClose}>close display</button>
    </div>
  ),
}));

const detail = (overrides: Partial<AnalyticsResult> = {}): AnalyticsResult =>
  ({
    id: 'r1',
    testCaseName: 'Row11',
    executionStatus: ExtractionResultStatus.SUCCESS,
    ...overrides,
  }) as AnalyticsResult;

describe('ExecutionRowDetailPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getTestCaseRunResultDetails).mockResolvedValue(detail());
  });

  const renderPanel = (props?: Partial<ComponentProps<typeof ExecutionRowDetailPanel>>) =>
    render(
      <ExecutionRowDetailPanel
        resultId="r1"
        position={SidebarPosition.Bottom}
        onClose={vi.fn()}
        onSwitchDisplayMode={vi.fn()}
        {...props}
      />,
    );

  describe('body', () => {
    test('shows the pivot in the bottom position', async () => {
      renderPanel({ position: SidebarPosition.Bottom });

      expect(await screen.findByRole('region', { name: 'pivot table' })).toBeTruthy();
      expect(screen.queryByRole('region', { name: 'field table' })).toBeNull();
    });

    test('shows the Field | Values table in the right position', async () => {
      renderPanel({ position: SidebarPosition.Right });

      expect(await screen.findByRole('region', { name: 'field table' })).toBeTruthy();
      expect(screen.queryByRole('region', { name: 'pivot table' })).toBeNull();
    });

    test('shows the load error when the row cannot be loaded', async () => {
      vi.mocked(getTestCaseRunResultDetails).mockResolvedValue(null);
      renderPanel({ position: SidebarPosition.Right });

      expect(await screen.findByText(RunsI18nKey.LoadError)).toBeTruthy();
      expect(screen.queryByRole('region', { name: 'field table' })).toBeNull();
    });

    test('shows the row’s overall score in the Execution section, which the detail endpoint does not return', async () => {
      renderPanel({ position: SidebarPosition.Bottom, testCaseScore: 0.7 });

      expect(await screen.findByRole('status', { name: 'overall score' })).toHaveTextContent('0.7');
    });

    test('hands the run’s threshold to the score row for its above/below icon', async () => {
      renderPanel({ position: SidebarPosition.Bottom, testCaseScore: 0.7, scoreThreshold: 0.6 });

      expect(await screen.findByRole('status', { name: 'score threshold' })).toHaveTextContent('0.6');
    });

    test('leaves the threshold off when the run has none', async () => {
      renderPanel({ position: SidebarPosition.Bottom, testCaseScore: 0.7 });

      expect(await screen.findByRole('status', { name: 'score threshold' })).toHaveTextContent('undefined');
    });

    test('shows a zero score as a score', async () => {
      renderPanel({ position: SidebarPosition.Bottom, testCaseScore: 0 });

      expect(await screen.findByRole('status', { name: 'overall score' })).toHaveTextContent('0');
    });

    test('leaves the overall score empty for a row without one', async () => {
      renderPanel({ position: SidebarPosition.Bottom });

      expect(await screen.findByRole('status', { name: 'overall score' })).toHaveTextContent('none');
    });

    test('shows the row title in the header once loaded', async () => {
      renderPanel({ position: SidebarPosition.Right });

      expect(await screen.findByRole('heading', { name: 'Row11' })).toBeTruthy();
    });

    test('starts the table from a clean state when another row is opened', async () => {
      const user = userEvent.setup();
      const { rerender } = renderPanel({ position: SidebarPosition.Right });
      await user.type(await screen.findByRole('textbox', { name: 'table local state' }), 'abc');
      expect(screen.getByRole('textbox', { name: 'table local state' })).toHaveValue('abc');

      rerender(
        <ExecutionRowDetailPanel
          resultId="r2"
          position={SidebarPosition.Right}
          onClose={vi.fn()}
          onSwitchDisplayMode={vi.fn()}
        />,
      );

      expect(await screen.findByRole('textbox', { name: 'table local state' })).toHaveValue('');
    });
  });

  describe('header', () => {
    test('offers to switch to the bottom drawer from the side panel', async () => {
      const user = userEvent.setup();
      const onSwitchDisplayMode = vi.fn();
      renderPanel({ position: SidebarPosition.Right, onSwitchDisplayMode });

      await user.click(await screen.findByRole('button', { name: RunsI18nKey.SwitchToBottom }));

      expect(onSwitchDisplayMode).toHaveBeenCalledOnce();
    });

    test('offers to switch to the side panel from the bottom drawer', async () => {
      renderPanel({ position: SidebarPosition.Bottom });

      expect(await screen.findByRole('button', { name: RunsI18nKey.SwitchToSidebar })).toBeTruthy();
    });

    test('shows the Grafana link only when the row has a trace', async () => {
      vi.mocked(getTestCaseRunResultDetails).mockResolvedValue(detail({ grafanaTraceUrl: 'https://grafana/trace' }));
      renderPanel({ position: SidebarPosition.Right });

      expect(await screen.findByRole('button', { name: RunsI18nKey.GrafanaDetails })).toBeTruthy();
    });

    test('omits the Grafana link when the row has no trace', async () => {
      renderPanel({ position: SidebarPosition.Right });

      await screen.findByRole('region', { name: 'field table' });
      expect(screen.queryByRole('button', { name: RunsI18nKey.GrafanaDetails })).toBeNull();
    });

    test('calls onClose from the close button', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      renderPanel({ position: SidebarPosition.Right, onClose });
      await screen.findByRole('region', { name: 'field table' });

      await user.click(screen.getByRole('button', { name: /close/i }));

      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  describe('display', () => {
    test('opens and closes the Display panel from the header', async () => {
      const user = userEvent.setup();
      renderPanel({ position: SidebarPosition.Right });

      await user.click(await screen.findByRole('button', { name: RunsI18nKey.RunCompareDisplay }));
      expect(screen.getByRole('dialog', { name: 'display panel' })).toBeTruthy();

      await user.click(screen.getByRole('button', { name: 'close display' }));
      expect(screen.queryByRole('dialog', { name: 'display panel' })).toBeNull();
    });
  });
});
