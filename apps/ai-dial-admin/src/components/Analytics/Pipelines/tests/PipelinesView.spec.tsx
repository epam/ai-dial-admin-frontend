import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { deletePipeline, getPipelines } from '@/src/app/[lang]/pipelines/actions';
import { getEvaluators } from '@/src/app/[lang]/evaluators/actions';
import PipelinesView from '@/src/components/Analytics/Pipelines/PipelinesView';
import { ACTIONS_COLUMN_CEL_ID } from '@/src/constants/ag-grid';
import { UNAVAILABLE_VALUE } from '@/src/constants/analytics/sessions-trace';
import { ActionMenuOperationI18nKey, AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { EvaluatorType } from '@/src/models/analytics/evaluator';
import { PipelineListItem, TriggerKind, PipelineKind } from '@/src/models/analytics/pipeline';

vi.mock('@/src/app/[lang]/pipelines/actions');
vi.mock('@/src/app/[lang]/evaluators/actions');
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@epam/ai-dial-ui-kit')>();
  return {
    ...actual,
    DialEllipsisTooltip: ({ text }: { text: string }) => <span>{text}</span>,
  };
});

const showNotification = vi.fn();
vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification }),
}));

interface MockActionItem {
  id: string;
  onClick?: (entity?: PipelineListItem) => void;
}

interface MockColDef {
  colId?: string;
  field?: string;
  sortable?: boolean;
  valueGetter?: (params: { data: PipelineListItem }) => unknown;
  cellRendererParams?: { items?: MockActionItem[] };
}

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: ({ rowData, columnDefs }: { rowData?: PipelineListItem[]; columnDefs?: MockColDef[] }) => {
    const items = columnDefs?.find((c) => c.field === ACTIONS_COLUMN_CEL_ID)?.cellRendererParams?.items ?? [];
    const versionColumn = columnDefs?.find((c) => c.colId === 'versionColumn');

    return (
      <div>
        <div>rows: {rowData?.length ?? 0}</div>
        <div>cols: {columnDefs?.map((c) => c.colId ?? c.field).join('|')}</div>
        <div>
          sortable:{' '}
          {columnDefs?.filter((c) => c.field !== ACTIONS_COLUMN_CEL_ID).some((c) => c.sortable === false)
            ? 'disabled'
            : 'not-disabled'}
        </div>
        {rowData?.map((row) => (
          <div key={row.name}>
            <span>{`version-column-${row.name}: ${versionColumn?.valueGetter?.({ data: row })}`}</span>
            {items.map((item) => (
              <button key={item.id} onClick={() => item.onClick?.(row)}>
                {item.id}:{row.name}
              </button>
            ))}
          </div>
        ))}
      </div>
    );
  },
}));

const rule = (overrides: Partial<PipelineListItem> = {}): PipelineListItem => ({
  name: 'turn-feedback-live',
  kind: PipelineKind.Enrich,
  evaluator_name: 'feedback-rollup',
  evaluator_version: 2,
  evaluator: { name: 'feedback-rollup', version: 2, type: EvaluatorType.Sql },
  target: 'turn_feedback',
  inputs: ['response_ratings'],
  grain_key: 'response_id',
  version_column: '_updated_at',
  trigger: { kind: TriggerKind.OnIngest },
  enabled: true,
  generation: 5,
  updated_at: '2026-08-21T09:37:29Z',
  ...overrides,
});

describe('Pipelines :: PipelinesView', () => {
  beforeEach(() => {
    vi.mocked(getEvaluators).mockResolvedValue({
      success: true,
      response: [{ name: 'feedback-rollup', latest_version: 2 }],
    });
    vi.mocked(getPipelines).mockResolvedValue({ success: true, response: [rule()] });
    vi.mocked(deletePipeline).mockResolvedValue({ success: true });
    showNotification.mockClear();
  });

  test('renders an empty grid rather than failing when no rule is registered', () => {
    render(<PipelinesView initialPipelines={[]} />);

    expect(screen.getByText('rows: 0')).toBeInTheDocument();
    expect(screen.queryByText(AnalyticsPipelinesI18nKey.PipelinesLoadFailed)).not.toBeInTheDocument();
  });

  // An operator must be able to tell "nothing registered" from "the service is unreachable"; the report
  // is a notification carrying the service's own words, not a sentence above the grid.
  test('reports a seeded load failure by notification rather than as text above the grid', async () => {
    render(
      <PipelinesView
        initialPipelines={[]}
        loadFailure={{ errorHeader: 'Upstream unavailable', errorMessage: 'registry timed out', requestId: 'trace-1' }}
      />,
    );

    await waitFor(() =>
      expect(showNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Upstream unavailable',
          description: 'registry timed out',
          requestId: 'trace-1',
        }),
      ),
    );
    expect(screen.queryByText(AnalyticsPipelinesI18nKey.PipelinesLoadFailed)).not.toBeInTheDocument();
    expect(screen.getByText('rows: 0')).toBeInTheDocument();
  });

  test('falls back to its own title when the seeded failure carries no header', async () => {
    render(<PipelinesView initialPipelines={[]} loadFailure={{}} />);

    await waitFor(() =>
      expect(showNotification).toHaveBeenCalledWith(
        expect.objectContaining({ title: AnalyticsPipelinesI18nKey.PipelinesLoadFailed }),
      ),
    );
  });

  test('raises exactly one report for one seeded failure', async () => {
    render(<PipelinesView initialPipelines={[]} loadFailure={{ errorMessage: 'registry timed out' }} />);

    await waitFor(() => expect(showNotification).toHaveBeenCalledTimes(1));
    expect(showNotification).toHaveBeenCalledTimes(1);
  });

  test('renders the seeded rules and the specified columns', () => {
    render(<PipelinesView initialPipelines={[rule()]} />);

    expect(screen.getByText('rows: 1')).toBeInTheDocument();
    expect(screen.getByText(/cols:/)).toHaveTextContent(
      'name|kind|target|inputs|trigger|evaluator|enabled|generation|updatedAt',
    );
  });

  test('carries no resolved-only columns', () => {
    render(<PipelinesView initialPipelines={[rule()]} />);

    expect(screen.getByText(/cols:/)).not.toHaveTextContent('grainKey');
    expect(screen.getByText(/cols:/)).not.toHaveTextContent('versionColumn');
  });

  test('does not re-request the listing on first render — the page already fetched it', () => {
    render(<PipelinesView initialPipelines={[rule()]} />);

    expect(getPipelines).not.toHaveBeenCalled();
  });

  test('offers the create action to a full admin', async () => {
    render(<PipelinesView initialPipelines={[rule()]} />);

    await waitFor(() => expect(screen.getByText(AnalyticsPipelinesI18nKey.CreatePipeline)).toBeEnabled());
  });

  // The modal is where the missing evaluator is visible and where submission is blocked; disabling the
  // action here would hide that explanation behind a control the operator cannot open.
  test('still offers the create action when no evaluator is registered', async () => {
    vi.mocked(getEvaluators).mockResolvedValue({ success: true, response: [] });

    render(<PipelinesView initialPipelines={[rule()]} />);

    await waitFor(() => expect(getEvaluators).toHaveBeenCalled());
    expect(screen.getByText(AnalyticsPipelinesI18nKey.CreatePipeline)).toBeEnabled();
    expect(screen.queryByText(AnalyticsPipelinesI18nKey.NoEvaluatorsNote)).not.toBeInTheDocument();
  });

  test('deletes a rule and refreshes the listing', async () => {
    const user = userEvent.setup();
    render(<PipelinesView initialPipelines={[rule()]} />);

    await user.click(screen.getByText(`${ActionMenuOperationI18nKey.Delete}:turn-feedback-live`));
    expect(screen.getByText('turn-feedback-live')).toBeInTheDocument();

    await user.click(screen.getByText(AnalyticsPipelinesI18nKey.DeletePipeline));

    await waitFor(() => expect(deletePipeline).toHaveBeenCalledWith('turn-feedback-live'));
    await waitFor(() => expect(getPipelines).toHaveBeenCalled());
  });

  test('reports a failed delete with the service message and keeps the row', async () => {
    vi.mocked(deletePipeline).mockResolvedValue({
      success: false,
      errorHeader: 'rule_validation_failed',
      errorMessage: 'the rule is referenced elsewhere',
    });
    const user = userEvent.setup();
    render(<PipelinesView initialPipelines={[rule()]} />);

    await user.click(screen.getByText(`${ActionMenuOperationI18nKey.Delete}:turn-feedback-live`));
    await user.click(screen.getByText(AnalyticsPipelinesI18nKey.DeletePipeline));

    await waitFor(() =>
      expect(showNotification).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'rule_validation_failed', description: 'the rule is referenced elsewhere' }),
      ),
    );
    expect(screen.getByText('rows: 1')).toBeInTheDocument();
  });

  test('a failed re-fetch leaves the previously fetched rows in place and quotes the service', async () => {
    const user = userEvent.setup();
    vi.mocked(getPipelines).mockResolvedValue({
      success: false,
      status: 503,
      errorHeader: 'Upstream unavailable',
      errorMessage: 'registry timed out',
      requestId: 'trace-2',
    });
    render(<PipelinesView initialPipelines={[rule()]} />);

    await user.click(screen.getByText(`${ActionMenuOperationI18nKey.Delete}:turn-feedback-live`));
    await user.click(screen.getByText(AnalyticsPipelinesI18nKey.DeletePipeline));

    await waitFor(() =>
      expect(showNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Upstream unavailable',
          description: 'registry timed out',
          requestId: 'trace-2',
        }),
      ),
    );
    expect(screen.getByText('rows: 1')).toBeInTheDocument();
  });

  test('a delete refresh re-reads the whole registry', async () => {
    const user = userEvent.setup();
    render(<PipelinesView initialPipelines={[rule()]} />);

    await user.click(screen.getByText(`${ActionMenuOperationI18nKey.Delete}:turn-feedback-live`));
    await user.click(screen.getByText(AnalyticsPipelinesI18nKey.DeletePipeline));

    await waitFor(() => expect(getPipelines).toHaveBeenCalledWith());
  });

  test('a successful re-fetch after a seeded failure raises no further report', async () => {
    const user = userEvent.setup();
    render(<PipelinesView initialPipelines={[rule()]} loadFailure={{ errorMessage: 'registry timed out' }} />);
    await waitFor(() => expect(showNotification).toHaveBeenCalledTimes(1));

    await user.click(screen.getByText(`${ActionMenuOperationI18nKey.Delete}:turn-feedback-live`));
    await user.click(screen.getByText(AnalyticsPipelinesI18nKey.DeletePipeline));

    await waitFor(() => expect(getPipelines).toHaveBeenCalledWith());
    expect(showNotification).toHaveBeenCalledWith(expect.objectContaining({ title: expect.any(String) }));
    expect(showNotification.mock.calls.filter(([n]) => n.description === 'registry timed out')).toHaveLength(1);
  });

  // Narrowing is the grid's job now that the toolbar is gone, so no data column may opt out of it.
  test('leaves every data column sortable through the grid', () => {
    render(<PipelinesView initialPipelines={[rule()]} />);

    expect(screen.getByText(/sortable:/)).toHaveTextContent('sortable: not-disabled');
  });
});
