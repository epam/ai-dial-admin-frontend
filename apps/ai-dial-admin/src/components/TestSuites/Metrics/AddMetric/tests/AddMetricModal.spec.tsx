import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { Metric } from '@/src/models/evaluation/metric';
import AddMetricModal from '../AddMetricModal';

const mockGetMetricDeclarations = vi.fn();
const mockGetMetricLatestVersion = vi.fn();
const mockGetTestSuiteMetricDetailsWithSchema = vi.fn();
const mockGenerateMetricDefaultBindings = vi.fn();

vi.mock('@/src/app/[lang]/test-suites/actions', () => ({
  getMetricDeclarations: (...args: unknown[]) => mockGetMetricDeclarations(...args),
  getMetricLatestVersion: (...args: unknown[]) => mockGetMetricLatestVersion(...args),
  getTestSuiteMetricDetailsWithSchema: (...args: unknown[]) => mockGetTestSuiteMetricDetailsWithSchema(...args),
}));

vi.mock('../../utils/metric-bindings', () => ({
  generateMetricDefaultInputBindings: () => [],
  generateMetricDefaultBindings: (...args: unknown[]) => mockGenerateMetricDefaultBindings(...args),
}));

vi.mock('../utils', () => ({
  validateMetricBindings: () => true,
  isReservedSystemFunctionCondition: (condition?: string) => condition?.trim() === 'name()',
}));

vi.mock('../MetricSelection', () => ({
  default: ({ metrics, onSelectMetric }: any) => (
    <div role="region" aria-label="metric-selection">
      <span>{`metrics:${metrics?.length ?? 0}`}</span>
      <button type="button" onClick={() => onSelectMetric('metric-1')}>
        Select metric
      </button>
    </div>
  ),
}));

vi.mock('../Configuration', () => ({
  default: ({ metricName }: any) => (
    <div role="region" aria-label="metric-configuration">
      {metricName}
    </div>
  ),
}));

vi.mock('@/src/components/Common/StepperModalButtons/StepperModalButtons', () => ({
  default: ({ onClose, onFinishClick }: any) => (
    <div>
      <button type="button" onClick={onClose}>
        Cancel
      </button>
      <button type="button" onClick={onFinishClick}>
        Finish
      </button>
    </div>
  ),
}));

vi.mock('@epam/ai-dial-ui-kit', () => ({
  PopupSize: { Lg: 'Lg' },
  StepStatus: { VALID: 'VALID' },
  DialPopup: ({ header, open, children, footer }: any) =>
    open ? (
      <div role="dialog" aria-label={header}>
        <h2>{header}</h2>
        {children}
        {footer}
      </div>
    ) : null,
  DialSteps: ({ currentStep }: any) => <nav aria-label="steps">{currentStep}</nav>,
  DialLoader: () => <div role="progressbar" aria-label="loading" />,
  DialNeutralButton: ({ label, onClick }: any) => (
    <button type="button" onClick={onClick}>
      {label}
    </button>
  ),
  DialPrimaryButton: ({ label, onClick, disabled }: any) => (
    <button type="button" onClick={onClick} disabled={disabled}>
      {label}
    </button>
  ),
}));

describe('AddMetricModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockGetMetricDeclarations.mockResolvedValue({
      content: [{ id: 'metric-1', name: 'Metric One' }],
    });

    mockGetMetricLatestVersion.mockResolvedValue({
      id: 'ver-1',
      name: 'Metric One',
      metricDeclarationId: 'decl-1',
      configSchema: { type: 'object', properties: {} },
      inputSchema: { type: 'object', properties: {} },
    });

    mockGetTestSuiteMetricDetailsWithSchema.mockResolvedValue({
      id: 'suite-metric-1',
      configBindings: [{ property: 'threshold', source: { $type: 'Constant', value: '1' } }],
      inputBindings: [{ property: 'prompt', source: { $type: 'Column', columnName: 'prompt' } }],
    });

    mockGenerateMetricDefaultBindings.mockReturnValue({
      id: 'generated',
      name: 'Generated Metric',
    });
  });

  test('renders add mode with steps and metric selection', async () => {
    render(<AddMetricModal isModalOpen onClose={vi.fn()} onConfirm={vi.fn()} />);

    await waitFor(() => {
      expect(mockGetMetricDeclarations).toHaveBeenCalledWith(0, 1000);
    });

    expect(screen.getByRole('dialog', { name: TestSuitesI18nKey.AddMetric })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'steps' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'metric-selection' })).toBeInTheDocument();
  });

  test('loads metric latest version after selection in add mode', async () => {
    const user = userEvent.setup();
    render(<AddMetricModal isModalOpen onClose={vi.fn()} onConfirm={vi.fn()} />);

    await waitFor(() => {
      expect(mockGetMetricDeclarations).toHaveBeenCalledWith(0, 1000);
    });

    await user.click(screen.getByRole('button', { name: 'Select metric' }));

    await waitFor(() => {
      expect(mockGetMetricLatestVersion).toHaveBeenCalledWith('metric-1');
    });
  });

  test('renders edit mode without steps and loads metric details', async () => {
    const editingMetric: Metric = {
      id: 'suite-metric-1',
      name: 'Edited metric',
      metricDeclarationId: 'decl-1',
    };

    render(
      <AddMetricModal
        isModalOpen
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        editingMetric={editingMetric}
        selectedTestSuite={{ id: 'suite-1' }}
      />,
    );

    await waitFor(() => {
      expect(mockGetTestSuiteMetricDetailsWithSchema).toHaveBeenCalledWith('suite-1', 'suite-metric-1');
      expect(mockGetMetricLatestVersion).toHaveBeenCalledWith('decl-1');
    });

    expect(screen.getByRole('dialog', { name: TestSuitesI18nKey.EditMetric })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'steps' })).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'metric-configuration' })).toBeInTheDocument();
  });

  test('includes the editing metric condition in the confirmed metric', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const editingMetric: Metric = {
      id: 'suite-metric-1',
      name: 'Edited metric',
      metricDeclarationId: 'decl-1',
      condition: '$exists(response.answer)',
    };

    render(
      <AddMetricModal
        isModalOpen
        onClose={vi.fn()}
        onConfirm={onConfirm}
        editingMetric={editingMetric}
        selectedTestSuite={{ id: 'suite-1' }}
      />,
    );

    await waitFor(() => {
      expect(mockGetMetricLatestVersion).toHaveBeenCalledWith('decl-1');
    });

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Confirm }));

    expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ condition: '$exists(response.answer)' }));
  });

  test('calls onClose when cancel is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<AddMetricModal isModalOpen onClose={onClose} onConfirm={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
