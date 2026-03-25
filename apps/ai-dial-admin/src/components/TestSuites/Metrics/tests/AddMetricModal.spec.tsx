import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { Metric } from '@/src/models/evaluation/metric';
import AddMetricModal from '../AddMetric/AddMetricModal';

const mockGetMetricLatestVersion = vi.fn();

vi.mock('@/src/app/[lang]/test-suites/actions', () => ({
  getMetricLatestVersion: (...args: unknown[]) => mockGetMetricLatestVersion(...args),
}));

vi.mock('@epam/ai-dial-ui-kit', () => ({
  DialPopup: ({ children, open, header, footer }: any) =>
    open ? (
      <div role="dialog" aria-labelledby="add-metric-title">
        <h2 id="add-metric-title">{header}</h2>
        {children}
        {footer}
      </div>
    ) : null,
  DialLoader: () => <div role="progressbar" aria-label="loading" />,
  DialNoDataContent: ({ title }: any) => (
    <div role="status" aria-label={title}>
      {title}
    </div>
  ),
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
  DialTag: ({ tag }: any) => <span>{tag}</span>,
  PopupSize: {},
}));

vi.mock('@/src/components/Common/Search/Search', () => ({
  default: ({ onChange }: any) => (
    <input type="search" role="searchbox" aria-label="search" onChange={(e) => onChange(e.target.value)} />
  ),
}));

describe('AddMetricModal', () => {
  const metrics: Metric[] = [
    { id: 'm1', name: 'Metric One', description: 'First metric' },
    { id: 'm2', name: 'Metric Two', description: 'Second metric' },
  ];

  const onClose = vi.fn();
  const onConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetMetricLatestVersion.mockResolvedValue({
      id: 'v1',
      description: 'Version desc',
      configSchema: { type: 'object', properties: {} },
      inputSchema: { type: 'object', properties: {} },
      outputSchema: { type: 'object', properties: {} },
    });
  });

  test('renders nothing when closed', () => {
    render(<AddMetricModal isModalOpen={false} metrics={metrics} onClose={onClose} onConfirm={onConfirm} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('renders dialog with heading when open', () => {
    render(<AddMetricModal isModalOpen={true} metrics={metrics} onClose={onClose} onConfirm={onConfirm} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: TestSuitesI18nKey.AddMetric })).toBeInTheDocument();
  });

  test('renders Cancel and Confirm buttons', () => {
    render(<AddMetricModal isModalOpen={true} metrics={metrics} onClose={onClose} onConfirm={onConfirm} />);

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Cancel })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Confirm })).toBeInTheDocument();
  });

  test('calls onClose when Cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<AddMetricModal isModalOpen={true} metrics={metrics} onClose={onClose} onConfirm={onConfirm} />);

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Cancel }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('Confirm button is disabled when no metric selected', () => {
    render(<AddMetricModal isModalOpen={true} metrics={metrics} onClose={onClose} onConfirm={onConfirm} />);

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Confirm })).toBeDisabled();
  });

  test('shows no data content when metrics list is empty', () => {
    render(<AddMetricModal isModalOpen={true} metrics={[]} onClose={onClose} onConfirm={onConfirm} />);

    expect(screen.getByRole('status', { name: TestSuitesI18nKey.SelectMetricPreview })).toBeInTheDocument();
  });

  test('renders searchbox', () => {
    render(<AddMetricModal isModalOpen={true} metrics={metrics} onClose={onClose} onConfirm={onConfirm} />);

    expect(screen.getByRole('searchbox', { name: 'search' })).toBeInTheDocument();
  });
});
