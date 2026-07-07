import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import HeatMapTestCaseHeader from '@/src/components/Runs/Compare/HeatMap/HeatMapTestCaseHeader';

describe('HeatMapTestCaseHeader', () => {
  test('renders vertical header label from headerComponentParams', () => {
    const { container } = render(
      <HeatMapTestCaseHeader displayName="Row 001" label="Row 001" column={{} as never} api={{} as never} />,
    );

    expect(screen.getByText('Row 001')).toBeInTheDocument();
    expect(container.firstChild).toHaveStyle({ paddingBottom: '4px' });
  });
});
