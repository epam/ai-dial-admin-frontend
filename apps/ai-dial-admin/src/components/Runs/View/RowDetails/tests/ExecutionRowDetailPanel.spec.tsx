import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getTestCaseRunResultDetails } from '@/src/app/[lang]/runs/actions';
import { SidebarPosition } from '@/src/components/Common/Sidebar/models';
import { RunsI18nKey } from '@/src/constants/i18n';
import ExecutionRowDetailPanel from '../ExecutionRowDetailPanel';

vi.mock('@/src/app/[lang]/runs/actions', () => ({
  getTestCaseRunResultDetails: vi.fn(),
}));

vi.mock('@/src/components/Runs/View/RowDetails/ExecutionRowDetailPivotTable', () => ({
  default: ({ sections }: { sections: unknown[] }) => <div data-testid="pivot" data-sections={sections.length} />,
}));

vi.mock('@/src/components/Runs/View/RowDetails/ExecutionRowDetailTable', () => ({
  default: ({ sections, focusFieldKey }: { sections: unknown[]; focusFieldKey?: string | null }) => (
    <div data-testid="table" data-sections={sections.length} data-focus={focusFieldKey ?? ''} />
  ),
}));

vi.mock('@/src/components/Runs/View/RowDetails/ExecutionRowDetailDisplayPanel', () => ({
  default: () => <div data-testid="display-panel" />,
}));

const detail = {
  id: 'r1',
  testCaseName: 'Row11',
  runIndex: 0,
  executionStatus: 'SUCCESS',
  testCaseData: { question: 'Who?' },
  extractedColumns: { answer: 'Romans' },
};

const renderPanel = (props: Partial<React.ComponentProps<typeof ExecutionRowDetailPanel>> = {}) =>
  render(
    <ExecutionRowDetailPanel
      resultId="r1"
      position={SidebarPosition.Bottom}
      onClose={vi.fn()}
      onSwitchDisplayMode={vi.fn()}
      {...props}
    />,
  );

describe('ExecutionRowDetailPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getTestCaseRunResultDetails).mockResolvedValue(detail as never);
  });

  test('renders the pivot at the bottom', async () => {
    renderPanel({ position: SidebarPosition.Bottom });

    expect(await screen.findByTestId('pivot')).toBeInTheDocument();
    expect(screen.queryByTestId('table')).not.toBeInTheDocument();
  });

  test('renders the table on the right', async () => {
    renderPanel({ position: SidebarPosition.Right });

    expect(await screen.findByTestId('table')).toBeInTheDocument();
    expect(screen.queryByTestId('pivot')).not.toBeInTheDocument();
  });

  test('shows the test case title in the header', async () => {
    renderPanel({ position: SidebarPosition.Right });

    expect(await screen.findByRole('heading', { name: 'Row11' })).toBeInTheDocument();
  });

  test.each([
    [SidebarPosition.Bottom, RunsI18nKey.SwitchToSidebar],
    [SidebarPosition.Right, RunsI18nKey.SwitchToBottom],
  ])('the header switch for %s is titled %s and calls the handler', async (position, title) => {
    const onSwitchDisplayMode = vi.fn();
    renderPanel({ position, onSwitchDisplayMode });

    await screen.findByTestId(position === SidebarPosition.Bottom ? 'pivot' : 'table');
    await userEvent.click(screen.getByTitle(title));

    expect(onSwitchDisplayMode).toHaveBeenCalledTimes(1);
  });

  test('forwards the focus field to the table', async () => {
    renderPanel({ position: SidebarPosition.Right, focusFieldKey: 'answer', focusRequestId: 1 });

    expect(await screen.findByTestId('table')).toHaveAttribute('data-focus', 'answer');
  });

  test('shows a load error and keeps the header usable', async () => {
    vi.mocked(getTestCaseRunResultDetails).mockResolvedValue(null as never);
    const onClose = vi.fn();
    renderPanel({ position: SidebarPosition.Right, onClose });

    expect(await screen.findByText(RunsI18nKey.LoadError)).toBeInTheDocument();
    expect(screen.queryByTestId('table')).not.toBeInTheDocument();
    expect(screen.getByTitle(RunsI18nKey.SwitchToBottom)).toBeEnabled();
  });

  test('shows a load error when the request rejects', async () => {
    vi.mocked(getTestCaseRunResultDetails).mockRejectedValue(new Error('boom'));
    renderPanel({ position: SidebarPosition.Right });

    expect(await screen.findByText(RunsI18nKey.LoadError)).toBeInTheDocument();
  });

  test('reports the built Display tree and seeds from a persisted one', async () => {
    const onDisplayTreeChange = vi.fn();
    renderPanel({ position: SidebarPosition.Right, onDisplayTreeChange });

    await waitFor(() => expect(onDisplayTreeChange).toHaveBeenCalled());
    const [tree] = onDisplayTreeChange.mock.calls.at(-1) as [unknown[]];
    expect(tree.length).toBeGreaterThan(0);
  });

  test('loads the details again when another row is selected', async () => {
    const { rerender } = renderPanel({ position: SidebarPosition.Right });
    await screen.findByTestId('table');

    rerender(
      <ExecutionRowDetailPanel
        resultId="r2"
        position={SidebarPosition.Right}
        onClose={vi.fn()}
        onSwitchDisplayMode={vi.fn()}
      />,
    );

    await waitFor(() => expect(getTestCaseRunResultDetails).toHaveBeenCalledWith('r2'));
  });
});
