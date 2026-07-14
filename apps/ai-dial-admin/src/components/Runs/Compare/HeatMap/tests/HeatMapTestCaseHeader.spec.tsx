import { IHeaderParams } from 'ag-grid-community';
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { HEAT_MAP_VALUE_TEXT_MIN_WIDTH } from '@/src/components/Runs/Compare/HeatMap/constants';
import HeatMapTestCaseHeader from '@/src/components/Runs/Compare/HeatMap/HeatMapTestCaseHeader';

const createColumnMock = (width: number) => ({ getActualWidth: () => width });

type HeatMapTestCaseHeaderProps = IHeaderParams & { label?: string };

const createHeaderParams = (
  width: number,
  overrides: Partial<Pick<HeatMapTestCaseHeaderProps, 'label' | 'displayName'>> = {},
): HeatMapTestCaseHeaderProps =>
  ({
    displayName: 'Row 001',
    label: 'Row 001',
    column: createColumnMock(width),
    api: {},
    ...overrides,
  }) as unknown as HeatMapTestCaseHeaderProps;

describe('HeatMapTestCaseHeader', () => {
  test('renders horizontal header label when column is wide enough', () => {
    const { container } = render(<HeatMapTestCaseHeader {...createHeaderParams(HEAT_MAP_VALUE_TEXT_MIN_WIDTH)} />);

    expect(screen.getByText('Row 001')).toBeInTheDocument();
    expect(container.firstChild).not.toHaveStyle({ paddingBottom: '4px' });
    expect(screen.getByText('Row 001')).not.toHaveStyle({ writingMode: 'vertical-rl' });
  });

  test('renders vertical header label when column is too narrow', () => {
    const { container } = render(<HeatMapTestCaseHeader {...createHeaderParams(HEAT_MAP_VALUE_TEXT_MIN_WIDTH - 1)} />);

    expect(screen.getByText('Row 001')).toBeInTheDocument();
    expect(container.firstChild).toHaveStyle({ paddingTop: '4px', paddingBottom: '4px' });
    expect(screen.getByText('Row 001')).toHaveStyle({ writingMode: 'vertical-rl' });
  });
});
