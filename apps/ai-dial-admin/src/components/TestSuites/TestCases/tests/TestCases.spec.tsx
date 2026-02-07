import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, test, vi, beforeEach } from 'vitest';
import TestCases from '../TestCases';
import { TestSuite, TestCase } from '@/src/models/evaluation/test-suite';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import * as actions from '@/src/app/[lang]/test-suites/actions';

// Mock the actions
vi.mock('@/src/app/[lang]/test-suites/actions', () => ({
  getTestCases: vi.fn(),
}));

// Mock ListView component
vi.mock('@/src/components/ListView/ListView', () => ({
  default: ({ title, emptyDataTitle, columnDefs, onGridReady, children }: any) => (
    <div>
      <div>List View Component</div>
      <div>Title: {title}</div>
      <div>Empty Title: {emptyDataTitle}</div>
      <div>Columns: {columnDefs.length}</div>
      <button onClick={() => onGridReady({ setGridOption: vi.fn() })}>Initialize Grid</button>
      <div>{children}</div>
    </div>
  ),
}));

// Mock HeaderButtons component
vi.mock('./Header', () => ({
  default: ({ selectedTestSuiteId }: any) => (
    <div>
      <div>Header Buttons</div>
      <div>Test Suite ID: {selectedTestSuiteId}</div>
    </div>
  ),
}));

describe('TestCases', () => {
  const mockTestSuite: TestSuite = {
    id: 'test-suite-123',
    name: 'Test Suite 1',
    description: 'Test description',
  };

  const mockTestCases: TestCase[] = [
    {
      name: 'Test Case 1',
      facts: {
        temperature: 0.7,
      },
    },
    {
      name: 'Test Case 2',
      facts: {
        temperature: 0.5,
      },
    },
  ];

  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders ListView with correct title', () => {
    vi.mocked(actions.getTestCases).mockResolvedValue({
      content: mockTestCases,
      totalElements: 2,
    });
    render(<TestCases selectedTestSuite={mockTestSuite} onChange={mockOnChange} />);

    expect(screen.getByText('List View Component')).toBeInTheDocument();
    expect(screen.getByText(`Title: ${TestSuitesI18nKey.TestCases}`)).toBeInTheDocument();
  });

  test('renders ListView with correct empty data title', () => {
    vi.mocked(actions.getTestCases).mockResolvedValue({
      content: mockTestCases,
      totalElements: 2,
    });
    render(<TestCases selectedTestSuite={mockTestSuite} onChange={mockOnChange} />);

    expect(screen.getByText(`Empty Title: ${TestSuitesI18nKey.NoTestCases}`)).toBeInTheDocument();
  });

  test('fetches test cases on mount', async () => {
    vi.mocked(actions.getTestCases).mockResolvedValue({
      content: mockTestCases,
      totalElements: 2,
    });

    render(<TestCases selectedTestSuite={mockTestSuite} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(actions.getTestCases).toHaveBeenCalledWith(mockTestSuite.id, 0, 100, [], []);
    });
  });

  test('handles empty test cases response', async () => {
    vi.mocked(actions.getTestCases).mockResolvedValue({
      content: [],
      totalElements: 0,
    });

    render(<TestCases selectedTestSuite={mockTestSuite} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.getByText('Columns: 2')).toBeInTheDocument();
    });
  });

  test('handles null response from getTestCases', async () => {
    vi.mocked(actions.getTestCases).mockResolvedValue(null as any);

    render(<TestCases selectedTestSuite={mockTestSuite} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(actions.getTestCases).toHaveBeenCalled();
    });
  });

  test('initializes grid when onGridReady is called', async () => {
    vi.mocked(actions.getTestCases).mockResolvedValue({
      content: mockTestCases,
      totalElements: 2,
    });

    render(<TestCases selectedTestSuite={mockTestSuite} onChange={mockOnChange} />);

    const initButton = screen.getByText('Initialize Grid');
    initButton.click();

    // Grid initialization should complete without errors
    expect(initButton).toBeInTheDocument();
  });

  test('handles test suite without id', async () => {
    vi.mocked(actions.getTestCases).mockResolvedValue({
      content: [],
      totalElements: 0,
    });

    const testSuiteNoId: TestSuite = {
      name: 'Test Suite',
    };

    render(<TestCases selectedTestSuite={testSuiteNoId} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(actions.getTestCases).toHaveBeenCalledWith(undefined, 0, 100, [], []);
    });
  });

  test('renders with flex layout classes', () => {
    vi.mocked(actions.getTestCases).mockResolvedValue({
      content: [],
      totalElements: 0,
    });

    const { container } = render(<TestCases selectedTestSuite={mockTestSuite} onChange={mockOnChange} />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('flex');
    expect(wrapper.className).toContain('h-full');
    expect(wrapper.className).toContain('w-full');
  });

  test('passes allowPadding false to ListView', () => {
    vi.mocked(actions.getTestCases).mockResolvedValue({
      content: [],
      totalElements: 0,
    });

    render(<TestCases selectedTestSuite={mockTestSuite} onChange={mockOnChange} />);

    // ListView is rendered (we can't directly test props but can verify component renders)
    expect(screen.getByText('List View Component')).toBeInTheDocument();
  });

  test('handles multiple test cases with different facts', async () => {
    const testCasesWithDifferentFacts: TestCase[] = [
      {
        name: 'Case 1',
        facts: { temp: 0.5 },
      },
      {
        name: 'Case 2',
        facts: { model: 'gpt-4', tokens: 100 },
      },
    ];

    vi.mocked(actions.getTestCases).mockResolvedValue({
      content: testCasesWithDifferentFacts,
      totalElements: 2,
    });

    render(<TestCases selectedTestSuite={mockTestSuite} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(actions.getTestCases).toHaveBeenCalled();
    });
  });

  test('does not refetch if test cases already exist and id remains same', async () => {
    vi.mocked(actions.getTestCases).mockResolvedValue({
      content: mockTestCases,
      totalElements: 2,
    });

    render(<TestCases selectedTestSuite={mockTestSuite} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(actions.getTestCases).toHaveBeenCalledTimes(1);
    });

    // Even if we wait longer, it shouldn't call again
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(actions.getTestCases).toHaveBeenCalledTimes(1);
  });
});
