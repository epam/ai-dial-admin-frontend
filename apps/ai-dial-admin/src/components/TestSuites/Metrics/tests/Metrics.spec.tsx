import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { ButtonsI18nKey, EntitiesI18nKey, TabsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { Metric } from '@/src/models/evaluation/metric';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import Metrics from '../Metrics';
import { MetricBindingType } from '../../../../types/evaluation';

const mockGetTestSuiteMetrics = vi.fn();
const mockCreateTestSuiteMetric = vi.fn();
const mockDeleteTestSuiteMetric = vi.fn();
const mockUpdateTestSuiteMetric = vi.fn();

vi.mock('@/src/app/[lang]/test-suites/actions', () => ({
  getTestSuiteMetrics: (...args: unknown[]) => mockGetTestSuiteMetrics(...args),
  createTestSuiteMetric: (...args: unknown[]) => mockCreateTestSuiteMetric(...args),
  deleteTestSuiteMetric: (...args: unknown[]) => mockDeleteTestSuiteMetric(...args),
  updateTestSuiteMetric: (...args: unknown[]) => mockUpdateTestSuiteMetric(...args),
}));

vi.mock('../AddMetric/AddMetricModal', () => ({
  default: ({ isModalOpen, onClose, onConfirm, editingMetric }: any) =>
    isModalOpen ? (
      <div role="dialog" aria-label={editingMetric ? 'Edit metric' : 'Add metric'}>
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

vi.mock('../MetricBindingsDisplay', () => ({
  default: ({ title, bindings }: any) =>
    bindings?.length ? (
      <div role="region" aria-label="metric-bindings">
        <span>{title}</span>
        {bindings.map((binding: any) => (
          <div key={binding.property}>
            {binding.property}: {binding.source.value}
          </div>
        ))}
      </div>
    ) : null,
}));

vi.mock('@epam/ai-dial-ui-kit', () => ({
  DialLoader: () => <div role="progressbar" aria-label="loading" />,
  DialNoDataContent: ({ title }: any) => (
    <div role="status" aria-label={title}>
      {title}
    </div>
  ),
  DialPrimaryButton: ({ label, onClick, disabled }: any) => (
    <button type="button" onClick={onClick} disabled={disabled}>
      {label}
    </button>
  ),
  DialNeutralButton: ({ label, onClick }: any) => (
    <button type="button" onClick={onClick}>
      {label}
    </button>
  ),
  ElementSize: { Small: 'small' },
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
    mockGetTestSuiteMetrics.mockResolvedValue({ content: [] });
    mockCreateTestSuiteMetric.mockResolvedValue({ success: true, response: { id: 'created-metric' } });
    mockDeleteTestSuiteMetric.mockResolvedValue({ success: true });
    mockUpdateTestSuiteMetric.mockResolvedValue({ success: true });
  });

  test('loads metrics and shows empty state when list is empty', async () => {
    render(<Metrics selectedTestSuite={selectedTestSuite} />);

    await waitFor(() => {
      expect(mockGetTestSuiteMetrics).toHaveBeenCalledWith('suite-1', 0, 1000);
    });

    expect(screen.getByText(`${TabsI18nKey.Metrics}: 0`)).toBeInTheDocument();
    expect(screen.getByRole('status', { name: EntitiesI18nKey.NoMetrics })).toBeInTheDocument();
  });

  test('renders Add button with correct label', async () => {
    render(<Metrics selectedTestSuite={selectedTestSuite} />);

    await waitFor(() => {
      expect(mockGetTestSuiteMetrics).toHaveBeenCalled();
    });

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Add })).toBeInTheDocument();
  });

  test('opens Add metric dialog when Add button is clicked', async () => {
    const user = userEvent.setup();

    render(<Metrics selectedTestSuite={selectedTestSuite} />);

    await waitFor(() => {
      expect(mockGetTestSuiteMetrics).toHaveBeenCalled();
    });

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Add }));

    expect(screen.getByRole('dialog', { name: 'Add metric' })).toBeInTheDocument();
  });

  test('renders metric card and bindings when metrics exist', async () => {
    mockGetTestSuiteMetrics.mockResolvedValue({ content: [metric] });

    render(<Metrics selectedTestSuite={selectedTestSuite} />);

    await waitFor(() => {
      expect(mockGetTestSuiteMetrics).toHaveBeenCalled();
    });

    expect(screen.getByText('Metric One')).toBeInTheDocument();
    expect(screen.getByText('First metric')).toBeInTheDocument();
    const bindingsRegion = screen.getByRole('region', { name: 'metric-bindings' });
    expect(within(bindingsRegion).getByText(TestSuitesI18nKey.Configuration)).toBeInTheDocument();
    expect(within(bindingsRegion).getByText('threshold: 0.5')).toBeInTheDocument();
  });

  test('creates metric after add modal confirmation', async () => {
    const user = userEvent.setup();

    render(<Metrics selectedTestSuite={selectedTestSuite} />);

    await waitFor(() => {
      expect(mockGetTestSuiteMetrics).toHaveBeenCalled();
    });

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Add }));
    await user.click(screen.getByRole('button', { name: 'Confirm modal' }));

    await waitFor(() => {
      expect(mockCreateTestSuiteMetric).toHaveBeenCalledWith('suite-1', { id: 'new-metric', name: 'New Metric' });
    });
  });

  test('deletes metric and refreshes list', async () => {
    const user = userEvent.setup();
    mockGetTestSuiteMetrics.mockResolvedValue({ content: [metric] });

    render(<Metrics selectedTestSuite={selectedTestSuite} />);

    await waitFor(() => {
      expect(screen.getByText('Metric One')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Delete }));

    await waitFor(() => {
      expect(mockDeleteTestSuiteMetric).toHaveBeenCalledWith('suite-1', 'metric-1');
    });

    expect(mockGetTestSuiteMetrics).toHaveBeenCalledWith('suite-1', 0, 1000);
  });

  test('opens edit modal and updates metric on confirmation', async () => {
    const user = userEvent.setup();
    mockGetTestSuiteMetrics.mockResolvedValue({ content: [metric] });

    render(<Metrics selectedTestSuite={selectedTestSuite} />);

    await waitFor(() => {
      expect(screen.getByText('Metric One')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Edit }));

    expect(screen.getByRole('dialog', { name: 'Edit metric' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Confirm modal' }));

    await waitFor(() => {
      expect(mockUpdateTestSuiteMetric).toHaveBeenCalledWith(
        'suite-1',
        expect.objectContaining({ id: 'metric-1', name: 'Edited Metric' }),
      );
    });
  });
});
