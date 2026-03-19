import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { ButtonsI18nKey, EntitiesI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import Metrics from '../Metrics';

const mockGetMetricDeclarations = vi.fn();
const mockGetTestSuiteMetrics = vi.fn();
const mockGetTestSuiteMetricDetailsWithSchema = vi.fn();
const mockCreateTestSuiteMetric = vi.fn();
const mockDeleteTestSuiteMetric = vi.fn();
const mockUpdateTestSuiteMetric = vi.fn();

vi.mock('@/src/app/[lang]/test-suites/actions', () => ({
  getMetricDeclarations: (...args: unknown[]) => mockGetMetricDeclarations(...args),
  getTestSuiteMetrics: (...args: unknown[]) => mockGetTestSuiteMetrics(...args),
  getTestSuiteMetricDetailsWithSchema: (...args: unknown[]) => mockGetTestSuiteMetricDetailsWithSchema(...args),
  createTestSuiteMetric: (...args: unknown[]) => mockCreateTestSuiteMetric(...args),
  deleteTestSuiteMetric: (...args: unknown[]) => mockDeleteTestSuiteMetric(...args),
  updateTestSuiteMetric: (...args: unknown[]) => mockUpdateTestSuiteMetric(...args),
}));

vi.mock('../AddMetricModal', () => ({
  default: ({ isModalOpen, onClose, onConfirm }: any) =>
    isModalOpen ? (
      <div role="dialog" aria-label="Add metric">
        <button type="button" onClick={onClose}>
          Cancel
        </button>
        <button type="button" onClick={() => onConfirm({ id: 'new-metric' })}>
          Confirm
        </button>
      </div>
    ) : null,
}));

vi.mock('../MetricContent', () => ({
  default: ({ metric, onDelete }: any) => (
    <div role="region" aria-label="metric-content">
      <span>{metric?.name}</span>
      <button type="button" onClick={onDelete}>
        Delete
      </button>
    </div>
  ),
}));

vi.mock('@epam/ai-dial-ui-kit', () => ({
  DialCollapsibleSidebar: ({ children, title }: any) => (
    <aside role="complementary" aria-label={title}>
      <div role="region" aria-label="metrics-list">
        {children}
      </div>
    </aside>
  ),
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
  ButtonAppearance: {},
}));

vi.mock('@/src/components/Common/Search/Search', () => ({
  default: ({ onChange }: any) => (
    <input type="search" role="searchbox" aria-label="search" onChange={(e) => onChange(e.target.value)} />
  ),
}));

describe('Metrics', () => {
  const selectedTestSuite: TestSuite = { id: 'suite-1', description: 'Suite' };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetMetricDeclarations.mockResolvedValue({ content: [{ id: 'decl-1', name: 'Declaration' }] });
    mockGetTestSuiteMetrics.mockResolvedValue({ content: [] });
  });

  test('renders metrics region and sidebar', async () => {
    render(<Metrics selectedTestSuite={selectedTestSuite} />);

    await waitFor(() => {
      expect(mockGetMetricDeclarations).toHaveBeenCalledWith(0, 1000);
      expect(mockGetTestSuiteMetrics).toHaveBeenCalledWith('suite-1', 0, 1000);
    });

    expect(screen.getByRole('complementary', { name: TabsI18nKey.Metrics })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'metrics-list' })).toBeInTheDocument();
    expect(screen.getAllByRole('status', { name: EntitiesI18nKey.NoMetrics }).length).toBeGreaterThanOrEqual(1);
  });

  test('renders Add button with correct label', async () => {
    render(<Metrics selectedTestSuite={selectedTestSuite} />);

    await waitFor(() => {
      expect(mockGetTestSuiteMetrics).toHaveBeenCalled();
    });

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Add })).toBeInTheDocument();
  });

  test('shows no data content when metrics list is empty', async () => {
    render(<Metrics selectedTestSuite={selectedTestSuite} />);

    await waitFor(() => {
      expect(mockGetTestSuiteMetrics).toHaveBeenCalled();
    });

    const listRegion = screen.getByRole('region', { name: 'metrics-list' });
    expect(within(listRegion).getByRole('status', { name: EntitiesI18nKey.NoMetrics })).toBeInTheDocument();
  });

  test('shows no data content in detail when no metric selected', async () => {
    render(<Metrics selectedTestSuite={selectedTestSuite} />);

    await waitFor(() => {
      expect(mockGetTestSuiteMetrics).toHaveBeenCalled();
    });

    const statusElements = screen.getAllByRole('status');
    expect(statusElements.some((el) => el.textContent === EntitiesI18nKey.NoMetrics)).toBe(true);
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
});
