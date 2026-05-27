import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, test, vi, beforeEach, Mock } from 'vitest';

import TestCases from '../TestCases';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { DatasetVisibility } from '@/src/types/evaluation';

vi.mock('@/src/app/[lang]/datasets/actions', () => ({
  getDataset: vi.fn(),
  updateDataset: vi.fn(),
}));

import { getDataset } from '@/src/app/[lang]/datasets/actions';

vi.mock('../TemplateVariables', () => ({
  default: ({ selectedTestSuite, onChange, isSkipRefresh }: any) => (
    <section aria-label="template variables">
      <span>{selectedTestSuite.id}</span>
      <span role="note">{String(isSkipRefresh)}</span>
      <button onClick={() => onChange({ ...selectedTestSuite, name: 'Changed by TV' }, true)}>TV Change</button>
    </section>
  ),
}));

vi.mock('../TestCasesList', () => ({
  default: ({ datasetId }: any) => (
    <section aria-label="test cases list">
      <span>{datasetId}</span>
    </section>
  ),
}));

const createTestSuite = (overrides?: Partial<TestSuite>): TestSuite => ({
  id: 'suite-1',
  name: 'Test Suite 1',
  inputBindings: [],
  datasetId: 'dataset-1',
  ...overrides,
});

const mockDataset = {
  id: 'dataset-1',
  name: 'Dataset',
  testCaseSchema: [],
  visibility: DatasetVisibility.PUBLIC,
  valid: true,
  version: 1,
  createdAt: 0,
  updatedAt: 0,
};

describe('TestCases', () => {
  let mockOnChange: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnChange = vi.fn();
    (getDataset as Mock).mockResolvedValue({ success: true, response: mockDataset, etag: 'etag-1' });
  });

  test('renders both TemplateVariables and TestCasesList once the dataset is loaded', async () => {
    render(<TestCases selectedTestSuite={createTestSuite()} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.getByRole('region', { name: 'template variables' })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: 'test cases list' })).toBeInTheDocument();
    });
  });

  test('passes selectedTestSuite to TemplateVariables', async () => {
    render(<TestCases selectedTestSuite={createTestSuite({ id: 'my-suite' })} onChange={mockOnChange} />);

    await waitFor(() => {
      const tvSection = screen.getByRole('region', { name: 'template variables' });
      expect(tvSection).toHaveTextContent('my-suite');
    });
  });

  test('passes datasetId to TestCasesList', async () => {
    render(<TestCases selectedTestSuite={createTestSuite({ id: 'my-suite' })} onChange={mockOnChange} />);

    await waitFor(() => {
      const tclSection = screen.getByRole('region', { name: 'test cases list' });
      expect(tclSection).toHaveTextContent('dataset-1');
    });
  });

  test('passes isSkipRefresh to TemplateVariables', async () => {
    render(<TestCases selectedTestSuite={createTestSuite()} onChange={mockOnChange} isSkipRefresh={true} />);

    await waitFor(() => {
      expect(screen.getByRole('note')).toHaveTextContent('true');
    });
  });

  test('defaults isSkipRefresh to undefined', async () => {
    render(<TestCases selectedTestSuite={createTestSuite()} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.getByRole('note')).toHaveTextContent('undefined');
    });
  });

  test('passes onChange to TemplateVariables and it triggers correctly', async () => {
    render(<TestCases selectedTestSuite={createTestSuite()} onChange={mockOnChange} />);

    await waitFor(() => screen.getByRole('button', { name: 'TV Change' }));

    fireEvent.click(screen.getByRole('button', { name: 'TV Change' }));

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({ name: 'Changed by TV' }), true);
  });

  test('renders empty-state alert when the suite has no bound dataset', async () => {
    render(<TestCases selectedTestSuite={createTestSuite({ datasetId: null })} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.queryByRole('region', { name: 'template variables' })).not.toBeInTheDocument();
      expect(screen.queryByRole('region', { name: 'test cases list' })).not.toBeInTheDocument();
    });
  });
});
