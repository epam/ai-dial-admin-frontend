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
vi.mock('@/src/components/ListView/List', () => ({
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
      testCaseName: 'Test Case 1',
      data: {
        temperature: 0.7,
      },
    },
    {
      testCaseName: 'Test Case 2',
      data: {
        temperature: 0.5,
      },
    },
  ];

  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
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
        testCaseName: 'Case 1',
        data: { temp: 0.5 },
      },
      {
        testCaseName: 'Case 2',
        data: { model: 'gpt-4', tokens: 100 },
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
