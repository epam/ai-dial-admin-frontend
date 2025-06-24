import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import RangePicker from './RangePicker';

describe('Common components - RangePicker', () => {
  test('Should render successfully', () => {
    const { baseElement } = render(
      <RangePicker timeRange={{ endDate: new Date(), startDate: new Date() }} onChange={() => void 0} />,
    );

    expect(baseElement).toBeTruthy();
  });

  test('Should render successfully with empty time range', () => {
    const { baseElement } = render(<RangePicker timeRange={null} onChange={() => void 0} />);

    expect(baseElement).toBeTruthy();
  });
});
