import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import ImportWarningsList from '@/src/components/TestSuites/TestCases/Import/ImportWarningsList';
import { CaseWarning } from '@/src/components/TestSuites/TestCases/Import/models';

describe('ImportWarningsList', () => {
  test('renders nothing when there are no warnings', () => {
    const { container } = render(<ImportWarningsList warnings={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  test('surfaces a non-contiguous multi-turn conflict warning as-is', () => {
    const warnings: CaseWarning[] = [
      {
        columnName: 'testCaseName',
        message: "Test case 'Refund flow' appears non-contiguously; multi-turn rows of a case must be contiguous",
        rowNumber: 7,
      },
    ];

    render(<ImportWarningsList warnings={warnings} />);

    expect(
      screen.getByText(
        "testCaseName: Test case 'Refund flow' appears non-contiguously; multi-turn rows of a case must be contiguous",
      ),
    ).toBeInTheDocument();
  });

  test('surfaces a duplicate turnIndex conflict warning as-is', () => {
    const warnings: CaseWarning[] = [
      {
        columnName: 'turnIndex',
        message: "Duplicate turnIndex 2 found for test case 'Refund flow'",
        rowNumber: 9,
      },
    ];

    render(<ImportWarningsList warnings={warnings} />);

    expect(screen.getByText("turnIndex: Duplicate turnIndex 2 found for test case 'Refund flow'")).toBeInTheDocument();
  });
});
