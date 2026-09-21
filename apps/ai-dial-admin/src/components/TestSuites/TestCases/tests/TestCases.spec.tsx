import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, vi, beforeEach, Mock } from 'vitest';

import TestCases from '../TestCases';
import { TestSuite } from '@/src/models/evaluation/test-suite';

vi.mock('../TestCasesList', () => ({
  default: ({ selectedTestSuite, onChange }: any) => (
    <section aria-label="test cases list">
      <span>{selectedTestSuite.id}</span>
      <button onClick={() => onChange({ ...selectedTestSuite, name: 'Changed by TCL' })}>TCL Change</button>
    </section>
  ),
}));

const createTestSuite = (overrides?: Partial<TestSuite>): TestSuite => ({
  id: 'suite-1',
  name: 'Test Suite 1',
  inputBindings: [],
  ...overrides,
});

describe('TestCases', () => {
  let mockOnChange: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnChange = vi.fn();
  });

  const defaultDatasetProps = { dataset: null, suiteEtag: '' };

  test('renders TestCasesList', () => {
    render(<TestCases selectedTestSuite={createTestSuite()} onChange={mockOnChange} {...defaultDatasetProps} />);

    expect(screen.getByRole('region', { name: 'test cases list' })).toBeInTheDocument();
  });

  test('does not render a Dynamic Configuration section', () => {
    render(<TestCases selectedTestSuite={createTestSuite()} onChange={mockOnChange} {...defaultDatasetProps} />);

    expect(screen.queryByLabelText(/template variables/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/additional request variables/)).not.toBeInTheDocument();
  });

  test('passes selectedTestSuite to TestCasesList', () => {
    render(
      <TestCases
        selectedTestSuite={createTestSuite({ id: 'my-suite' })}
        onChange={mockOnChange}
        {...defaultDatasetProps}
      />,
    );

    const tclSection = screen.getByRole('region', { name: 'test cases list' });
    expect(tclSection).toHaveTextContent('my-suite');
  });

  test('passes onChange to TestCasesList and it triggers correctly', () => {
    render(<TestCases selectedTestSuite={createTestSuite()} onChange={mockOnChange} {...defaultDatasetProps} />);

    fireEvent.click(screen.getByRole('button', { name: 'TCL Change' }));

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({ name: 'Changed by TCL' }));
  });

  test('renders with correct container classes', () => {
    const { container } = render(
      <TestCases selectedTestSuite={createTestSuite()} onChange={mockOnChange} {...defaultDatasetProps} />,
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('h-full', 'flex', 'flex-col', 'gap-y-4', 'min-h-0');
  });
});
