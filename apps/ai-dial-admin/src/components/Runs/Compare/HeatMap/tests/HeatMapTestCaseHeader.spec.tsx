import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { HEAT_MAP_VALUE_TEXT_MIN_WIDTH } from '@/src/components/Runs/Compare/HeatMap/constants';
import HeatMapTestCaseHeader from '@/src/components/Runs/Compare/HeatMap/HeatMapTestCaseHeader';

const createColumnMock = (width: number) => ({ getActualWidth: () => width });

describe('HeatMapTestCaseHeader', () => {
  test('renders horizontal header label when column is wide enough', () => {
    const { container } = render(
      <HeatMapTestCaseHeader
        displayName="Row 001"
        label="Row 001"
        column={createColumnMock(HEAT_MAP_VALUE_TEXT_MIN_WIDTH) as never}
        api={{} as never}
      />,
    );

    expect(screen.getByText('Row 001')).toBeInTheDocument();
    expect(container.firstChild).not.toHaveStyle({ paddingBottom: '4px' });
    expect(screen.getByText('Row 001')).not.toHaveStyle({ writingMode: 'vertical-rl' });
  });

  test('renders vertical header label when column is too narrow', () => {
    const { container } = render(
      <HeatMapTestCaseHeader
        displayName="Row 001"
        label="Row 001"
        column={createColumnMock(HEAT_MAP_VALUE_TEXT_MIN_WIDTH - 1) as never}
        api={{} as never}
      />,
    );

    expect(screen.getByText('Row 001')).toBeInTheDocument();
    expect(container.firstChild).toHaveStyle({ paddingBottom: '4px' });
    expect(screen.getByText('Row 001')).toHaveStyle({ writingMode: 'vertical-rl' });
  });
});
