import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { ButtonsI18nKey, EntitiesI18nKey, TabsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { Metric } from '@/src/models/evaluation/metric';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import Metrics from '../Metrics';
import { MetricBindingType } from '../../../../types/evaluation';

const mockGetTestSuiteMetricsAggregated = vi.fn();
const mockGetTestSuiteMetrics = vi.fn();
const mockGetDetailedMetricDeclarations = vi.fn();
const mockCreateTestSuiteMetric = vi.fn();
const mockDeleteTestSuiteMetric = vi.fn();
const mockUpdateTestSuiteMetric = vi.fn();

vi.mock('@/src/app/[lang]/test-suites/actions', () => ({
  getTestSuiteMetricsAggregated: (...args: unknown[]) => mockGetTestSuiteMetricsAggregated(...args),
  getTestSuiteMetrics: (...args: unknown[]) => mockGetTestSuiteMetrics(...args),
  getDetailedMetricDeclarations: (...args: unknown[]) => mockGetDetailedMetricDeclarations(...args),
  createTestSuiteMetric: (...args: unknown[]) => mockCreateTestSuiteMetric(...args),
  deleteTestSuiteMetric: (...args: unknown[]) => mockDeleteTestSuiteMetric(...args),
  updateTestSuiteMetric: (...args: unknown[]) => mockUpdateTestSuiteMetric(...args),
}));

vi.mock('../AddMetric/AddMetricModal', () => ({
  default: ({ isModalOpen, onClose, onConfirm, editingMetric }: any) =>
    isModalOpen ? (
      <div role="dialog" aria-label={editingMetric ? 'Edit metric' : 'Add metric'}>
        {editingMetric?.condition && <span>editing-condition:{editingMetric.condition}</span>}
        <button type="button" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          onClick={() =>
            onConfirm(
              editingMetric
                ? { id: editingMetric.id, name: 'Edited Metric', metricDeclarationVersion: { id: 'ver' } }
                : { id: 'new-metric', name: 'New Metric' },
            )
          }
        >
          Confirm modal
        </button>
      </div>
    ) : null,
}));

vi.mock('../ScoreSettings/ScoreSettings', () => ({
  default: ({ metrics }: any) => (
    <div role="region" aria-label="score-settings">
      {metrics?.map((m: any) => (
        <span key={m.id}>
          {m.id}:{Object.keys(m.outputSchema?.properties ?? {}).join(',')}
        </span>
      ))}
    </div>
  ),
}));

vi.mock('../MetricCard', () => ({
  default: ({ metric, onEdit, onDelete }: any) => (
    <div role="article" aria-label={metric.name}>
      <span>{metric.name}</span>
      {metric.description ? <span>{metric.description}</span> : null}
      <span>{metric.condition?.trim() || TestSuitesI18nKey.ConditionAlwaysRun}</span>
      {metric.configBindings?.length ? (
        <div role="region" aria-label="metric-bindings">
          <span>{TestSuitesI18nKey.Configuration}</span>
          {metric.configBindings.map((binding: any) => (
            <div key={binding.property}>
              {binding.property}: {binding.source.value}
            </div>
          ))}
        </div>
      ) : null}
      <button type="button" onClick={onDelete}>
        {ButtonsI18nKey.Delete}
      </button>
      <button type="button" onClick={onEdit}>
        {ButtonsI18nKey.Edit}
      </button>
    </div>
  ),
}));

vi.mock('@epam/ai-dial-ui-kit', () => ({
  Spinner: () => <div role="progressbar" aria-label="loading" />,
  NoDataContent: ({ title }: any) => (
    <div role="status" aria-label={title}>
      {title}
    </div>
  ),
  PrimaryButton: ({ label, onClick, disabled }: any) => (
    <button type="button" onClick={onClick} disabled={disabled}>
      {label}
    </button>
  ),
  ConfirmationPopup: ({ open, onConfirm, confirmLabel }: any) =>
    open ? (
      <div role="dialog" aria-label="delete-metric-confirmation">
        <button type="button" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    ) : null,
}));

describe('Metrics', () => {
  const selectedTestSuite: TestSuite = { id: 'suite-1', description: 'Suite' };
  const metric: Metric = {
    id: 'metric-1',
    name: 'Metric One',
    displayName: 'Metric One',
    description: 'First metric',
    configBindings: [{ property: 'threshold', source: { $type: MetricBindingType.Constant, value: '0.5' } }],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTestSuiteMetricsAggregated.mockResolvedValue([]);
    mockGetTestSuiteMetrics.mockResolvedValue({ content: [], page: 0, size: 1000 });
    mockGetDetailedMetricDeclarations.mockResolvedValue([]);
    mockCreateTestSuiteMetric.mockResolvedValue({ success: true, response: { id: 'created-metric' } });
    mockDeleteTestSuiteMetric.mockResolvedValue({ success: true });
    mockUpdateTestSuiteMetric.mockResolvedValue({ success: true });
  });

  test('loads metrics with the aggregated and plain-list requests and shows empty state when list is empty', async () => {
    render(<Metrics selectedTestSuite={selectedTestSuite} onChange={vi.fn()} />);

    expect(await screen.findByRole('status', { name: EntitiesI18nKey.NoMetrics })).toBeInTheDocument();
    expect(mockGetTestSuiteMetricsAggregated).toHaveBeenCalledWith('suite-1');
    expect(mockGetTestSuiteMetricsAggregated).toHaveBeenCalledOnce();
    expect(mockGetTestSuiteMetrics).toHaveBeenCalledWith('suite-1', 0, 1000);
    expect(screen.getByText(`${TabsI18nKey.Metrics}: 0`)).toBeInTheDocument();
  });

  test('does not fetch metric declarations when the tab loads', async () => {
    mockGetTestSuiteMetricsAggregated.mockResolvedValue([metric]);

    render(<Metrics selectedTestSuite={selectedTestSuite} onChange={vi.fn()} />);

    await screen.findByText('Metric One');

    expect(mockGetDetailedMetricDeclarations).not.toHaveBeenCalled();
  });

  test('hides Overall Score card when there are no metrics', async () => {
    render(<Metrics selectedTestSuite={selectedTestSuite} onChange={vi.fn()} />);

    await screen.findByRole('status', { name: EntitiesI18nKey.NoMetrics });

    expect(screen.queryByRole('region', { name: 'score-settings' })).not.toBeInTheDocument();
  });

  test('shows Overall Score card when metrics exist', async () => {
    mockGetTestSuiteMetricsAggregated.mockResolvedValue([metric]);

    render(<Metrics selectedTestSuite={selectedTestSuite} onChange={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Metric One')).toBeInTheDocument();
    });

    expect(screen.getByRole('region', { name: 'score-settings' })).toBeInTheDocument();
  });

  test('renders output schema from the aggregated response without a per-metric request', async () => {
    mockGetTestSuiteMetricsAggregated.mockResolvedValue([
      {
        ...metric,
        outputSchema: { type: 'object', properties: { score: {}, latency: {} } },
      },
    ]);

    render(<Metrics selectedTestSuite={selectedTestSuite} onChange={vi.fn()} />);

    expect(await screen.findByText('metric-1:score,latency')).toBeInTheDocument();

    expect(mockGetTestSuiteMetricsAggregated).toHaveBeenCalledOnce();
  });

  test('takes output schema from the aggregated metric declaration version', async () => {
    mockGetTestSuiteMetricsAggregated.mockResolvedValue([
      {
        ...metric,
        metricDeclarationVersion: { outputSchema: { type: 'object', properties: { accuracy: {}, recall: {} } } },
      },
    ]);

    render(<Metrics selectedTestSuite={selectedTestSuite} onChange={vi.fn()} />);

    expect(await screen.findByText('metric-1:accuracy,recall')).toBeInTheDocument();
  });

  test('renders Add button with correct label', async () => {
    render(<Metrics selectedTestSuite={selectedTestSuite} onChange={vi.fn()} />);

    await screen.findByRole('status', { name: EntitiesI18nKey.NoMetrics });

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Add })).toBeInTheDocument();
  });

  test('opens Add metric dialog when Add button is clicked', async () => {
    const user = userEvent.setup();

    render(<Metrics selectedTestSuite={{ ...selectedTestSuite, datasetId: 'ds-1' }} dataset={{}} onChange={vi.fn()} />);

    await screen.findByRole('status', { name: EntitiesI18nKey.NoMetrics });

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Add }));

    expect(screen.getByRole('dialog', { name: 'Add metric' })).toBeInTheDocument();
  });

  test('fetches metric declarations once the Add metric dialog opens', async () => {
    const user = userEvent.setup();

    render(<Metrics selectedTestSuite={{ ...selectedTestSuite, datasetId: 'ds-1' }} dataset={{}} onChange={vi.fn()} />);

    await screen.findByRole('status', { name: EntitiesI18nKey.NoMetrics });

    expect(mockGetDetailedMetricDeclarations).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Add }));

    await vi.waitFor(() => expect(mockGetDetailedMetricDeclarations).toHaveBeenCalledOnce());
  });

  test('renders metric card and bindings when metrics exist', async () => {
    mockGetTestSuiteMetricsAggregated.mockResolvedValue([metric]);

    render(<Metrics selectedTestSuite={selectedTestSuite} onChange={vi.fn()} />);

    expect(await screen.findByText('Metric One')).toBeInTheDocument();
    expect(screen.getByText('First metric')).toBeInTheDocument();
    const bindingsRegion = screen.getByRole('region', { name: 'metric-bindings' });
    expect(within(bindingsRegion).getByText(TestSuitesI18nKey.Configuration)).toBeInTheDocument();
    expect(within(bindingsRegion).getByText('threshold: 0.5')).toBeInTheDocument();
  });

  test('creates metric after add modal confirmation', async () => {
    const user = userEvent.setup();

    render(<Metrics selectedTestSuite={{ ...selectedTestSuite, datasetId: 'ds-1' }} dataset={{}} onChange={vi.fn()} />);

    await screen.findByRole('status', { name: EntitiesI18nKey.NoMetrics });

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Add }));
    await user.click(screen.getByRole('button', { name: 'Confirm modal' }));

    expect(mockCreateTestSuiteMetric).toHaveBeenCalledWith('suite-1', { id: 'new-metric', name: 'New Metric' });
  });

  test('deletes metric and refreshes list', async () => {
    const user = userEvent.setup();
    mockGetTestSuiteMetricsAggregated.mockResolvedValue([metric]);

    render(<Metrics selectedTestSuite={selectedTestSuite} onChange={vi.fn()} />);

    await screen.findByText('Metric One');

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Delete }));

    await user.click(
      within(screen.getByRole('dialog', { name: 'delete-metric-confirmation' })).getByRole('button', {
        name: ButtonsI18nKey.Delete,
      }),
    );

    expect(mockDeleteTestSuiteMetric).toHaveBeenCalledWith('suite-1', 'metric-1');
    await vi.waitFor(() => expect(mockGetTestSuiteMetricsAggregated).toHaveBeenCalledTimes(2));
    expect(mockGetTestSuiteMetricsAggregated).toHaveBeenLastCalledWith('suite-1');
  });

  test('opens edit modal and updates metric on confirmation', async () => {
    const user = userEvent.setup();
    mockGetTestSuiteMetricsAggregated.mockResolvedValue([metric]);

    render(<Metrics selectedTestSuite={selectedTestSuite} onChange={vi.fn()} />);

    await screen.findByText('Metric One');

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Edit }));

    expect(screen.getByRole('dialog', { name: 'Edit metric' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Confirm modal' }));

    expect(mockUpdateTestSuiteMetric).toHaveBeenCalledWith(
      'suite-1',
      expect.objectContaining({ id: 'metric-1', name: 'Edited Metric' }),
    );
  });

  test('renders metric condition when present', async () => {
    const metricWithCondition: Metric = {
      ...metric,
      condition: 'turn.value > 0.5',
    };
    mockGetTestSuiteMetricsAggregated.mockResolvedValue([metricWithCondition]);

    render(<Metrics selectedTestSuite={selectedTestSuite} onChange={vi.fn()} />);

    await screen.findByText('Metric One');

    expect(screen.getByText('turn.value > 0.5')).toBeInTheDocument();
  });

  test('renders "Always run" when metric has no condition', async () => {
    const metricWithoutCondition: Metric = {
      ...metric,
      condition: undefined,
    };
    mockGetTestSuiteMetricsAggregated.mockResolvedValue([metricWithoutCondition]);

    render(<Metrics selectedTestSuite={selectedTestSuite} onChange={vi.fn()} />);

    await screen.findByText('Metric One');

    expect(screen.getByText(TestSuitesI18nKey.ConditionAlwaysRun)).toBeInTheDocument();
  });

  test('backfills condition from the plain metrics list when the aggregated response omits it', async () => {
    mockGetTestSuiteMetricsAggregated.mockResolvedValue([{ ...metric, condition: undefined }]);
    mockGetTestSuiteMetrics.mockResolvedValue({
      content: [{ ...metric, condition: '$exists(data.expected)' }],
      page: 0,
      size: 1000,
    });

    render(<Metrics selectedTestSuite={selectedTestSuite} onChange={vi.fn()} />);

    await screen.findByText('Metric One');

    expect(screen.getByText('$exists(data.expected)')).toBeInTheDocument();
    expect(screen.queryByText(TestSuitesI18nKey.ConditionAlwaysRun)).not.toBeInTheDocument();
  });

  test('prefers the aggregated response condition over the plain-list backfill when both are present', async () => {
    mockGetTestSuiteMetricsAggregated.mockResolvedValue([{ ...metric, condition: 'from-aggregated' }]);
    mockGetTestSuiteMetrics.mockResolvedValue({
      content: [{ ...metric, condition: 'from-plain-list' }],
      page: 0,
      size: 1000,
    });

    render(<Metrics selectedTestSuite={selectedTestSuite} onChange={vi.fn()} />);

    await screen.findByText('Metric One');

    expect(screen.getByText('from-aggregated')).toBeInTheDocument();
  });

  test('prefills the edit modal with the backfilled condition', async () => {
    const user = userEvent.setup();
    mockGetTestSuiteMetricsAggregated.mockResolvedValue([{ ...metric, condition: undefined }]);
    mockGetTestSuiteMetrics.mockResolvedValue({
      content: [{ ...metric, condition: '$exists(data.expected)' }],
      page: 0,
      size: 1000,
    });

    render(<Metrics selectedTestSuite={selectedTestSuite} onChange={vi.fn()} />);

    await screen.findByText('Metric One');

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Edit }));

    expect(screen.getByText('editing-condition:$exists(data.expected)')).toBeInTheDocument();
  });
});
