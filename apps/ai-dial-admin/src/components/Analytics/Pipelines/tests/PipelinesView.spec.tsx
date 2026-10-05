import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { deletePipeline, getPipelines } from '@/src/app/[lang]/pipelines/actions';
import PipelinesView from '@/src/components/Analytics/Pipelines/PipelinesView';
import { ACTIONS_COLUMN_CEL_ID } from '@/src/constants/ag-grid';
import { PIPELINES_NO_RUNTIME_STORAGE_KEY } from '@/src/constants/analytics/pipelines';
import { UNAVAILABLE_VALUE } from '@/src/constants/analytics/sessions-trace';
import { ActionMenuOperationI18nKey, AnalyticsPipelinesI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { PipelineListItem, TriggerKind, PipelineKind, TransformType } from '@/src/models/analytics/pipeline';

vi.mock('@/src/app/[lang]/pipelines/actions');
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
  headerName?: string;
  hide?: boolean;
  sortable?: boolean;
  valueGetter?: (params: { data: PipelineListItem }) => unknown;
  cellRendererParams?: { items?: MockActionItem[] };
}

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: ({
    rowData,
    columnDefs,
    storageKey,
    showColumnsPanel,
    toggleColumnsPanel,
  }: {
    rowData?: PipelineListItem[];
    columnDefs?: MockColDef[];
    storageKey?: string;
    showColumnsPanel?: boolean;
    toggleColumnsPanel?: () => void;
  }) => {
    const items = columnDefs?.find((c) => c.field === ACTIONS_COLUMN_CEL_ID)?.cellRendererParams?.items ?? [];
    const versionColumn = columnDefs?.find((c) => c.colId === 'versionColumn');
    const triggerColumn = columnDefs?.find((c) => c.colId === 'trigger');
    const dataColumns = columnDefs?.filter((c) => c.field !== ACTIONS_COLUMN_CEL_ID) ?? [];

    return (
      <div>
        <div>rows: {rowData?.length ?? 0}</div>
        <div>cols: {columnDefs?.map((c) => c.colId ?? c.field).join('|')}</div>
        <div>
          visible:{' '}
          {dataColumns
            .filter((c) => !c.hide)
            .map((c) => c.colId)
            .join('|')}
        </div>
        <div>
          hidden:{' '}
          {dataColumns
            .filter((c) => c.hide)
            .map((c) => c.colId)
            .join('|')}
        </div>
        <div>
          addressable:{' '}
          {dataColumns.every((c) => !!c.field && c.field === c.colId && !!c.headerName) ? 'all' : 'not-all'}
        </div>
        <div>storage: {storageKey}</div>
        <div>panel: {showColumnsPanel ? 'open' : 'closed'}</div>
        <button onClick={toggleColumnsPanel}>close-panel</button>
        <div>
          sortable:{' '}
          {columnDefs?.filter((c) => c.field !== ACTIONS_COLUMN_CEL_ID).some((c) => c.sortable === false)
            ? 'disabled'
            : 'not-disabled'}
        </div>
        {rowData?.map((row) => (
          <div key={row.name}>
            <span>{`version-column-${row.name}: ${versionColumn?.valueGetter?.({ data: row })}`}</span>
            <span>{`trigger-value-${row.name}: ${String(triggerColumn?.valueGetter?.({ data: row }))}`}</span>
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
  transform_type: TransformType.Sql,
  target: 'turn_feedback',
  inputs: ['response_ratings'],
  trigger: { kind: TriggerKind.Schedule },
  enabled: true,
  generation: 5,
  updated_at: '2026-08-21T09:37:29Z',
  ...overrides,
});

describe('Pipelines :: PipelinesView', () => {
  beforeEach(() => {
    vi.mocked(getPipelines).mockClear();
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
      'name|kind|trigger|transform|enabled|generation|target|inputs|updatedAt',
    );
  });

  test('shows the default columns in order and keeps the rest hidden but available', () => {
    render(<PipelinesView initialPipelines={[rule()]} />);

    expect(screen.getByText(/visible:/)).toHaveTextContent('visible: name|kind|trigger|transform|enabled|generation');
    expect(screen.getByText(/hidden:/)).toHaveTextContent('hidden: target|inputs|updatedAt');
  });

  // The columns panel toggles a column by its `field` and the saved state keys it by `colId`; a column
  // with only one of them would be listed but could never be shown or hidden.
  test('gives every data column a header and a field matching its id', () => {
    render(<PipelinesView initialPipelines={[rule()]} />);

    expect(screen.getByText(/addressable:/)).toHaveTextContent('addressable: all');
  });

  // Without the runner's answer there is no runtime column, and a layout saved without it would push
  // Runtime to the end once it appears; the runtime spec covers the key used once it is read.
  test('keeps a layout saved without the runtime column under its own storage key', () => {
    render(<PipelinesView initialPipelines={[rule()]} />);

    expect(screen.getByText(`storage: ${PIPELINES_NO_RUNTIME_STORAGE_KEY}`)).toBeInTheDocument();
  });

  // The grid's comparator cannot order the trigger object, so sort and filter read its kind.
  test('sorts and filters the trigger column on the trigger kind', () => {
    render(
      <PipelinesView
        initialPipelines={[
          rule(),
          rule({ name: 'sessions-rollup', trigger: { kind: TriggerKind.Schedule, cron: '0 * * * *' } }),
          rule({ name: 'untriggered', trigger: undefined }),
        ]}
      />,
    );

    expect(screen.getByText(`trigger-value-turn-feedback-live: ${TriggerKind.OnIngest}`)).toBeInTheDocument();
    expect(screen.getByText(`trigger-value-sessions-rollup: ${TriggerKind.Schedule}`)).toBeInTheDocument();
    expect(screen.getByText('trigger-value-untriggered: undefined')).toBeInTheDocument();
  });

  test('closes the columns panel when the last pipeline is deleted', async () => {
    vi.mocked(getPipelines).mockResolvedValue({ success: true, response: [] });
    const user = userEvent.setup();
    render(<PipelinesView initialPipelines={[rule()]} />);

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Columns }));
    expect(screen.getByText('panel: open')).toBeInTheDocument();

    await user.click(screen.getByText(`${ActionMenuOperationI18nKey.Delete}:turn-feedback-live`));
    await user.click(screen.getByText(AnalyticsPipelinesI18nKey.DeletePipeline));

    await waitFor(() => expect(screen.getByText('rows: 0')).toBeInTheDocument());
    expect(screen.getByText('panel: closed')).toBeInTheDocument();
  });

  test('opens and closes the columns panel from the toolbar button', async () => {
    const user = userEvent.setup();
    render(<PipelinesView initialPipelines={[rule()]} />);

    const button = screen.getByRole('button', { name: ButtonsI18nKey.Columns });
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('panel: closed')).toBeInTheDocument();

    await user.click(button);
    expect(screen.getByText('panel: open')).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByText('close-panel'));
    expect(screen.getByText('panel: closed')).toBeInTheDocument();
  });

  test('offers no columns button over an empty listing', () => {
    render(<PipelinesView initialPipelines={[]} />);

    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Columns })).not.toBeInTheDocument();
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

  // With the transform on the declaration there is no second registry the create action could depend on.
  test('offers the create action without reading any other registry', async () => {
    render(<PipelinesView initialPipelines={[rule()]} />);

    expect(screen.getByText(AnalyticsPipelinesI18nKey.CreatePipeline)).toBeEnabled();
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
